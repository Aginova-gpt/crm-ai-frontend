import {
  Box,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Typography,
  TableSortLabel,
  IconButton,
  AlertColor,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { styles } from "./AlarmProfiles.styles";
import { useDebounce } from "use-debounce";
import { PRIMARY_LIGHT, GREEN, GREY, ACTION } from "@/styles/colors";
import SnackView from "@/components/SnackView";
import {
  CheckCircle,
  DoDisturbOn,
  ContentCopy,
  PlaylistAddOutlined,
} from "@mui/icons-material";
import { useBackend } from "@/contexts/BackendContext";
import {
  alarmIconSmall,
  ProfileFilterType,
  sensorIcon,
  SensorInternalCode,
  ProfileSortKey,
  SortDirection,
} from "@/utils/sensorHelpers";
import { useRouter } from "next/navigation";
import AutocompleteField from "../AutocompleteField/AutocompleteField";
import AlarmProfilesFilters from "../AlarmProfilesFilters/AlarmProfilesFilters";
import { useApi } from "@/utils/api";
import {
  autoClose,
  delayRepeating,
  sendAcknowledgement,
  recoveryTime,
} from "@/styles/icons";
import { Receiver, ReceiverType } from "@/utils/helpers";
import ReceiverBubble from "../ReceiverBubble/ReceiverBubble";

type AlarmType = "threshold" | "battery" | "connectivity" | "not_reading";

const alarmFilterTypeForAlarmType = (alarmType: AlarmType) => {
  switch (alarmType) {
    case "threshold":
      return "filter_type_threshold";
    case "battery":
      return "filter_type_lowbattery";
    case "connectivity":
      return "filter_type_connectivity";
    case "not_reading":
      return "filter_type_notreadingdata";
  }
};

interface Escalation {
  delay_before_sending: number;
  id: number;
  is_active: boolean;
  level: 1 | 2 | 3 | 4;
  targets: EscalationReceiver[];
}

export type ScheduleType = "all_the_time" | "custom";
export interface EscalationReceiver {
  call_enabled: boolean;
  phone?: string;
  email?: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  sms?: string;
  email_to_text_enabled?: boolean;
  email_to_text?: string;
  type: ReceiverType;
  username?: string;
  sensor_id?: string;
  members?: EscalationReceiver[];
  name?: string;
  schedule?: ScheduleType;
  schedule_days?: {
    [key: string]: {
      enabled: boolean;
      intervals: Array<{
        enabled: boolean;
        start: string;
        end: string;
      }>;
    };
  };
}

type dataKey =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25";

export interface AlarmProfileType {
  id: number;
  enabled: boolean;
  name: string;
  num_sensors: number;
  alarm_types: AlarmType[];
  automatically_close: boolean;
  send_acknowledgment: boolean;
  recovery_time: number;
  delay_before_repeating: number;
  selected_product_number?: SensorInternalCode;
  receivers?: Receiver[];
  escalations: (Escalation | null)[];
  group?: string;
  coalition?: string;
  sensors: {
    sensor_id: string;
    sensor_name: string;
    sensor_type: SensorInternalCode;
  }[];
  thresholds: {
    connectivity: number | null;
    notreadingdata: number | null;
    lowbattery: number | null;
    data: {
      [key in dataKey]: {
        lower: number | null;
        upper: number | null;
      };
    };
  };
}

interface AlarmProfilesProps {
  sx?: SxProps<Theme>;
}

const receiverTypeOrder = { list: 0, user: 1, individual: 2, relay: 3 };
const convertEscalationsToReceivers = (
  escalations: (Escalation | null)[]
): Receiver[] => {
  const receivers: Receiver[] = [];
  const seenLabels = new Set<string>();

  escalations.forEach((escalation) => {
    if (!escalation) {
      return;
    }

    escalation.targets.forEach((target) => {
      let receiver: Receiver;

      switch (target.type) {
        case "list":
          receiver = {
            label: target.name || "Unknown List",
            receiver_type: "list",
            count: target.members?.length || 0,
          };
          break;
        case "user":
        case "individual":
          receiver = {
            label: target.email || target.username || "Unknown User",
            receiver_type: target.type === "user" ? "user" : "individual",
            count: 1,
          };
          break;
        case "relay":
          receiver = {
            label: target.sensor_id || "Unknown Sensor",
            receiver_type: "relay",
            count: 1,
          };
          break;
        default:
          return; // Skip unknown types
      }

      // Only add if we haven't seen this label before
      if (!seenLabels.has(receiver.label)) {
        seenLabels.add(receiver.label);
        receivers.push(receiver);
      }
    });
  });

  return receivers;
};

const escalationsDescription = (escalations: (Escalation | null)[]) => {
  if (escalations.length === 0) {
    return "No receivers";
  }

  const receivers = convertEscalationsToReceivers(
    escalations.filter((escalation) => escalation !== null)
  );

  const content = receivers.sort((a, b) => {
    const typeOrderA = receiverTypeOrder[a.receiver_type] ?? 99;
    const typeOrderB = receiverTypeOrder[b.receiver_type] ?? 99;
    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }
    return a.label.localeCompare(b.label);
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      {content.map((receiver) => (
        <ReceiverBubble
          key={receiver.label}
          receiver={receiver}
          maxWidth="120px"
        />
      ))}
    </Box>
  );
};

export default function AlarmProfiles({ sx }: AlarmProfilesProps) {
  const router = useRouter();
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<ProfileSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedFilters, setSelectedFilters] = useState<ProfileFilterType[]>(
    []
  );

  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [
      "alarm_profiles",
      page,
      searchText,
      selectedFilters,
      sortKey,
      sortDirection,
    ],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL(
          `alarm_profiles/list?limit=${rowsPerPage}&offset=${
            (page - 1) * rowsPerPage
          }&search=${searchText}&${selectedFilters
            .map((filter) => `${filter}=true`)
            .join("&")}&sort_key=${sortKey}&sort_order=${sortDirection}`,
          `alarm_profiles?page=${page}&search=${searchText}&${selectedFilters
            .map((filter) => `${filter}=true`)
            .join("&")}`
        )
      );
      return response.json();
    },
  });

  const [debouncedSearch] = useDebounce(searchText, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleSort = (key: ProfileSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleCopyClick = (profile: AlarmProfileType, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(profile));
  };

  const icon = (title: string, image: React.ReactNode, action: () => void) => {
    return (
      <Box sx={styles.iconBox} onClick={action}>
        <Box sx={styles.iconImageContainer}>{image}</Box>
        <Typography sx={styles.iconText}>{title}</Typography>
      </Box>
    );
  };

  const icons = () => {
    return (
      <Box
        sx={styles.iconsContainer}
        onClick={() => {
          router.push("/alarms/add");
        }}
      >
        {icon(
          "Add Profile",
          <PlaylistAddOutlined sx={{ fontSize: "40px" }} color="primary" />,
          () => {}
        )}
      </Box>
    );
  };

  const headerIcon = (image: any, alt: string, size: number = 20) => {
    return (
      <Box sx={{ width: size, height: size }}>
        <img
          src={image.src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    );
  };

  const tableHeader = () => {
    return (
      <TableHead>
        <TableRow>
          <TableCell sx={styles.tableCell}>
            <TableSortLabel
              active={sortKey === "enabled"}
              direction={sortKey === "enabled" ? sortDirection : "asc"}
              onClick={() => handleSort("enabled")}
            >
              Active
            </TableSortLabel>
          </TableCell>
          <TableCell sx={styles.tableCell}>
            <TableSortLabel
              active={sortKey === "name"}
              direction={sortKey === "name" ? sortDirection : "asc"}
              onClick={() => handleSort("name")}
            >
              Name
            </TableSortLabel>
          </TableCell>
          <TableCell sx={styles.tableCell}>Sensors</TableCell>
          <TableCell sx={styles.tableCell}>Receivers</TableCell>
          <TableCell sx={styles.tableCell}>Alarm Types</TableCell>
          <TableCell sx={styles.tableCell}>
            {headerIcon(autoClose, "Auto Close")}
          </TableCell>
          <TableCell sx={styles.tableCell}>
            {headerIcon(sendAcknowledgement, "Send Acknowledgement")}
          </TableCell>
          <TableCell sx={styles.tableCell}>
            {headerIcon(recoveryTime, "Recovery Time", 27)}
          </TableCell>
          <TableCell sx={styles.tableCell}>
            {headerIcon(delayRepeating, "Delay Repeating", 27)}
          </TableCell>
          <TableCell sx={styles.tableCell}>Actions</TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const alarmProfileRow = (profile: AlarmProfileType) => {
    return (
      <TableRow
        key={profile.id}
        onClick={() => {
          if (profile.num_sensors > 0) {
            router.push(`/alarm_profiles/${profile.id}`);
          } else {
            setSnackMessage({
              type: "error",
              message: "Invalid profile, no sensors attached!",
            });
          }
        }}
        sx={{
          ...styles.tableRow,
          cursor: "pointer",
          "&:hover": {
            backgroundColor: PRIMARY_LIGHT,
          },
        }}
      >
        <TableCell sx={styles.tableCell}>
          {profile.enabled ? (
            <CheckCircle sx={{ color: GREEN, fontSize: "20px" }} />
          ) : (
            <DoDisturbOn sx={{ color: GREY, fontSize: "20px" }} />
          )}
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Box>
            <Typography sx={styles.profileNameText}>{profile.name}</Typography>
            {/* <Typography sx={styles.profileCoalitionText}>
              {profile.coalition + ", " + profile.group}
            </Typography> */}
          </Box>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
          >
            <Box sx={styles.sensorIconBox}>
              {profile.selected_product_number && (
                <img
                  src={sensorIcon(profile.selected_product_number).src}
                  style={{ width: "70%", height: "70%", objectFit: "contain" }}
                />
              )}
            </Box>
            <Typography sx={styles.profileNameText}>
              {profile.num_sensors}
            </Typography>
          </Box>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          {escalationsDescription(profile.escalations)}
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Box sx={{ display: "flex", flexDirection: "row" }}>
            {profile.alarm_types.map((alarmType, index) => (
              <Box
                sx={{ width: "24px", height: "24px", marginRight: "10px" }}
                key={alarmType}
              >
                <img
                  src={alarmIconSmall(alarmFilterTypeForAlarmType(alarmType))}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter:
                      "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(199deg) brightness(118%) contrast(119%)",
                  }}
                />
              </Box>
            ))}
          </Box>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Typography sx={styles.profileNameText}>
            {profile.automatically_close ? "Yes" : "No"}
          </Typography>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Typography sx={styles.profileNameText}>
            {profile.send_acknowledgment ? "Yes" : "No"}
          </Typography>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Typography sx={styles.profileNameText}>
            {profile.recovery_time > 0 ? `${profile.recovery_time}min` : "No"}
          </Typography>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Typography sx={styles.profileNameText}>
            {profile.delay_before_repeating > 0
              ? `${profile.delay_before_repeating}min`
              : "No"}
          </Typography>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <IconButton onClick={(e) => handleCopyClick(profile, e)}>
            <ContentCopy sx={{ color: ACTION }} />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

  const toolbar = () => {
    return (
      <Box sx={styles.toolbar}>
        <Box sx={styles.toolbarInner}>
          <Box sx={styles.toolbarContent}>
            {/* Search bar */}
            <Box sx={styles.searchContainer}>
              <AutocompleteField
                placeholder="Search alarm profiles"
                storageKey="alarmProfileSearchHistory"
                searchText={searchText}
                setSearchText={setSearchText}
              />
            </Box>
            {icons()}
          </Box>
        </Box>
        <AlarmProfilesFilters
          sx={styles.filtersContainer}
          onFiltersChange={setSelectedFilters}
          searchText={searchText}
        />
      </Box>
    );
  };

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      {toolbar()}

      {/* Table */}
      <TableContainer>
        <Table>
          {tableHeader()}
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((profile: AlarmProfileType) =>
                alarmProfileRow(profile)
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page - 1}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10]}
      />
      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </Box>
  );
}
