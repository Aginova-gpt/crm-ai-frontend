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
  Button,
  Typography,
  Checkbox,
  TableSortLabel,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { styles } from "./Alarms.styles";
import { formatReadingDate, readableUnit } from "@/utils/helpers";
import { useDebounce } from "use-debounce";
import { PRIMARY_LIGHT, RED, GREEN, PRIMARY, GREY_TEXT } from "@/styles/colors";
import { CheckCircle, Error } from "@mui/icons-material";
import { useBackend } from "@/contexts/BackendContext";
import AlarmsFilters from "../AlarmsFilters/AlarmsFilters";
import {
  alarmIconSmall,
  alarmFilterName,
  t_name,
  AlarmsSortKey,
  AlertingType,
  SortDirection,
} from "@/utils/sensorHelpers";
import { useRouter } from "next/navigation";
import AutocompleteField from "../AutocompleteField/AutocompleteField";
import AcknowledgeBar from "../AcknowledgeBar/AcknowledgeBar";
import { useApi } from "@/utils/api";
import { useAlarmContext } from "@/contexts/AlarmContext";
import { useProfile } from "@/contexts/ProfileContext";
export interface AlarmObject {
  id: string;
  type: AlertingType;
  sensor_name: string;
  sensor_id: string;
  sensor_internal_code: string;
  coalition: string;
  group: string;
  location: string;
  asset: string;
  alarm_condition: string;
  alarm_time: string;
  alarm_profile_name: string;
  alarm_profile_id: string;
  measurement_name: string;
  measurement_id: t_name;
  status: "open" | "closed";
  measurement_current_reading: number;
  measurement_unit: string;
  is_safe: boolean;
  sent_to_sms_count: number;
  sent_to_email_count: number;
  sent_to_call_count: number;
  acknowledge_date: string | null;
  acknowledged_by: string | null;
  acknowledgement_note: string | null;
  acknowledgement_comment: string | null;
}

const readableAlarmFilterName = (type: string) => {
  switch (type) {
    case "filter_type_threshold":
      return "threshold";
    case "filter_type_lowbattery":
      return "low battery";
    case "filter_type_connectivity":
      return "connectivity";
    case "filter_type_notreadingdata":
      return "not reading data";
  }
  return type;
};

interface AlarmsProps {
  sx?: SxProps<Theme>;
}

export default function Alarms({ sx }: AlarmsProps) {
  const router = useRouter();
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const { setSharedAlarm } = useAlarmContext();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<AlarmsSortKey>("alert_time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedAlarms, setSelectedAlarms] = useState<AlarmObject[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { isAdmin } = useProfile();

  const {
    data,
    isLoading,
    refetch: refetchAlarms,
  } = useQuery({
    queryKey: [
      "alarms",
      page,
      searchText,
      selectedFilters,
      sortKey,
      sortDirection,
    ],
    queryFn: async () => {
      let type = "all";
      if (selectedFilters.includes("closed_alarms")) {
        type = "closed";
      } else if (selectedFilters.includes("open_alarms")) {
        type = "open";
      }
      let subtype = selectedFilters
        .filter((filter) => filter.includes("filter_type_"))
        .map((filter) => filter.replace("filter_type_", ""))
        .join(",");
      const response = await fetchWithAuth(
        apiURL(
          `alarms/list?type=${type}&limit=${rowsPerPage}&offset=${
            (page - 1) * rowsPerPage
          }${
            searchText.length > 0 ? `&search=${searchText}` : ""
          }&sort_key=${sortKey}&sort_order=${sortDirection}${
            subtype.length > 0 ? `&subtype=${subtype}` : ""
          }`,
          `alarms?page=${page}&search=${searchText}&${selectedFilters
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

  const handleSelectAlarm = (alarm: AlarmObject) => {
    setSelectedAlarms((prev) =>
      prev.includes(alarm)
        ? prev.filter((obj) => obj.id !== alarm.id)
        : [...prev, alarm]
    );
  };

  const handleSort = (key: AlarmsSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const tableHeader = () => {
    return (
      <TableHead>
        <TableRow>
          <TableCell sx={styles.tableCell}>
            <TableSortLabel
              active={sortKey === "status"}
              direction={sortKey === "status" ? sortDirection : "asc"}
              onClick={() => handleSort("status")}
            >
              Alert Type
            </TableSortLabel>
          </TableCell>
          <TableCell sx={styles.tableCell}>Sensor Name</TableCell>
          <TableCell sx={styles.tableCell}>Sensor ID</TableCell>
          <TableCell sx={styles.tableCell}>Alarm Condition</TableCell>
          <TableCell sx={{ ...styles.tableCell, ...styles.dateHeader }}>
            <TableSortLabel
              active={sortKey === "alert_time"}
              direction={sortKey === "alert_time" ? sortDirection : "asc"}
              onClick={() => handleSort("alert_time")}
            >
              Time
            </TableSortLabel>
          </TableCell>
          <TableCell sx={styles.tableCell}>Alarm Profile</TableCell>
          <TableCell sx={styles.tableCell}>Current</TableCell>
          <TableCell
            sx={{
              cursor: "help",
              "&:hover": {
                backgroundColor: PRIMARY_LIGHT,
              },
              ...styles.tableCell,
            }}
            title="Indicates if the current reading is within the defined thresholds"
          >
            Status
          </TableCell>
          <TableCell sx={{ ...styles.tableCell, ...styles.dateHeader }}>
            Sent to
          </TableCell>
          <TableCell
            sx={{ ...styles.tableCell, ...styles.dateHeader, align: "center" }}
          >
            Acknowledge
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const currentReading = (alarm: AlarmObject) => {
    if (alarm.measurement_current_reading === null) {
      return "-";
    }

    if (alarm.type === "threshold") {
      return `${Number(alarm.measurement_current_reading).toFixed(
        2
      )} ${readableUnit(alarm.measurement_unit)}`;
    } else if (alarm.type === "lowbattery") {
      return `${alarm.measurement_current_reading}V`;
    }
    return "-";
  };

  const alarmRow = (alarm: AlarmObject, index: number) => {
    return (
      <TableRow
        key={index}
        onClick={() => {
          // Set alarm data in context for immediate use
          setSharedAlarm(alarm);
          router.push(`/alarms/${alarm.id}`);
        }}
        sx={{
          ...styles.tableRow,
          cursor: "pointer",
          "&:hover": {
            backgroundColor: PRIMARY_LIGHT,
          },
        }}
      >
        <TableCell
          sx={styles.tableCell}
          onClick={(e) => {
            if (alarm.status === "open") {
              e.stopPropagation();
            }
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {alarm.status === "open" ? (
              <Checkbox
                checked={selectedAlarms.includes(alarm)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleSelectAlarm(alarm);
                }}
                sx={{
                  marginLeft: "-10px",
                }}
              />
            ) : (
              <Box sx={{ width: "32px" }} />
            )}

            <Box sx={styles.probeTypeContainer(alarm.status === "open")}>
              <img
                src={alarmIconSmall(alarm.type)}
                alt={alarm.type}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter:
                    alarm.status === "open"
                      ? "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(199deg) brightness(118%) contrast(119%)"
                      : "brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(90%)",
                }}
              />
            </Box>
            <Box sx={styles.alarmFilterNameContainer}>
              <Typography sx={styles.alarmFilterName}>
                {alarmFilterName(alarm.type)}
              </Typography>
              {alarm.type === "threshold" && (
                <Typography sx={styles.alarmProbeType}>
                  {alarm.measurement_name || alarm.measurement_id}
                </Typography>
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Typography sx={styles.infoCell}>{alarm.sensor_name}</Typography>
          <Typography sx={{ ...styles.infoCell, color: GREY_TEXT }}>
            {isAdmin ? alarm.coalition : alarm.group}
          </Typography>
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Typography
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/sensors/${alarm.sensor_id}`);
            }}
            sx={{
              fontSize: "14px",
              fontWeight: 400,
              textDecoration: "underline",
              cursor: "pointer",
              "&:hover": {
                color: PRIMARY,
              },
            }}
          >
            {alarm.sensor_id}
          </Typography>
        </TableCell>
        <TableCell
          sx={{
            ...styles.tableCell,
            maxWidth: "500px",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {alarm.alarm_condition}
        </TableCell>
        <TableCell sx={{ ...styles.tableCell, ...styles.infoCell }}>
          {formatReadingDate(alarm.alarm_time)}
        </TableCell>
        <TableCell sx={{ ...styles.tableCell, ...styles.infoCell }}>
          {alarm.alarm_profile_name}
        </TableCell>
        <TableCell sx={{ ...styles.tableCell, ...styles.infoCell }}>
          {currentReading(alarm)}
        </TableCell>
        <TableCell sx={{ ...styles.tableCell, align: "center" }}>
          {alarm.is_safe ? (
            <CheckCircle sx={{ color: GREEN, fontSize: "20px" }} />
          ) : (
            <Error sx={{ color: RED, fontSize: "20px" }} />
          )}
        </TableCell>
        <TableCell sx={styles.tableCell}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Typography sx={styles.infoCell}>{"SMS -\u00A0"}</Typography>
              <Typography sx={{ ...styles.infoCell, fontWeight: 700 }}>
                {alarm.sent_to_sms_count}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Typography sx={styles.infoCell}>{"Email -\u00A0"}</Typography>
              <Typography sx={{ ...styles.infoCell, fontWeight: 700 }}>
                {alarm.sent_to_email_count}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Typography sx={styles.infoCell}>{"Call -\u00A0"}</Typography>
              <Typography sx={{ ...styles.infoCell, fontWeight: 700 }}>
                {alarm.sent_to_call_count}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ ...styles.tableCell, align: "center" }}>
          {alarm.acknowledge_date ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                {formatReadingDate(alarm.acknowledge_date)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  maxWidth: "120px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {alarm.acknowledged_by}
              </Typography>
            </Box>
          ) : (
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (!selectedAlarms.includes(alarm)) {
                  setSelectedAlarms((prev) => [...prev, alarm]);
                }
              }}
            >
              Need Response
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const toolbar = () => {
    let tags = [
      {
        label:
          selectedFilters.length === 0
            ? "all alarms"
            : selectedFilters.includes("open_alarms")
            ? "open alarms"
            : "closed alarms",
        enabled: selectedFilters.length > 0,
        delete: () => {
          setSelectedFilters([]);
        },
      },
    ];

    selectedFilters
      .filter((filter) => filter.includes("filter_type_"))
      .forEach((filter) => {
        tags.push({
          label: readableAlarmFilterName(filter),
          enabled: true,
          delete: () => {
            setSelectedFilters(selectedFilters.filter((f) => f !== filter));
          },
        });
      });

    return (
      <Box sx={styles.toolbar}>
        <Box sx={styles.toolbarInner}>
          <Box sx={styles.toolbarContent}>
            {/* Search bar */}
            <Box sx={styles.searchContainer}>
              <AutocompleteField
                placeholder="Search alarms"
                storageOptions={["all alarms", "open alarms", "closed alarms"]}
                searchText={searchText}
                setSearchText={(text) => {
                  if (text === "all alarms") {
                    setSelectedFilters([]);
                    setSearchText("");
                  } else if (text === "open alarms") {
                    setSelectedFilters(["open_alarms"]);
                    setSearchText("");
                  } else if (text === "closed alarms") {
                    setSelectedFilters(["closed_alarms"]);
                    setSearchText("");
                  } else {
                    setSearchText(text);
                  }
                }}
                tags={tags}
              />
            </Box>
          </Box>
        </Box>
        <AlarmsFilters
          sx={styles.filtersContainer}
          selectedFilters={selectedFilters}
          onFiltersChange={(filters) => {
            if (selectedFilters.length === 0) {
              setSelectedFilters([...filters, "open_alarms"]);
            } else {
              setSelectedFilters(filters);
            }
          }}
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
              data?.data?.map((alarm: AlarmObject, index: number) =>
                alarmRow(alarm, index)
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

      <AcknowledgeBar
        selectedAlarms={selectedAlarms}
        setSelectedAlarms={setSelectedAlarms}
        refetchAlarms={refetchAlarms}
      />

      <Box sx={{ height: "80px" }} />
    </Box>
  );
}
