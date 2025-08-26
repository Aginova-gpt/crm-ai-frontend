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
  TableSortLabel,
  Typography,
  IconButton,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useState, useEffect } from "react";
import PersonIcon from "@mui/icons-material/Person";
import { emptyString, formatReadingDate, readableUnit } from "@/utils/helpers";
import UsersFilters from "../UsersFilters/UsersFilters";
import { styles } from "./UsersList.styles";
import { BLUE, PRIMARY_LIGHT, DARK_GREY, RED } from "@/styles/colors";
import { useRouter } from "next/navigation";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import AutocompleteField from "@/components/AutocompleteField/AutocompleteField";
import { SortDirection } from "@/utils/sensorHelpers";
import { addUser } from "@/styles/icons";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import ReceiverBubble from "@/components/ReceiverBubble/ReceiverBubble";

type UsersSortKey = "email" | "role_level";

type TemperatureUnit = "celsius" | "fahrenheit";
type PressureUnit = "inch" | "pascal";
type Co2Unit = "percentage" | "ppm";

type UserData = {
  enabled: boolean;
  coalition: {
    id: number;
    name: string;
  };
  created: string;
  username: string;
  email: string;
  id: number;
  communication: {
    call: string | null;
    sms: string | null;
    email: string | null;
    email_to_text: string | null;
  };
  preferences: {
    temperature_unit: TemperatureUnit | null;
    pressure_unit: PressureUnit | null;
    co2_unit: Co2Unit | null;
    tz: string | null;
    signature_period: number | null;
  };
  name: string;
  initials: string;
  last_active: string | null;
  role_level: number;
  group_rights: {
    can_read: boolean;
    can_write: boolean;
    group_id: number;
    group_name: string;
  }[];
  alarm_profiles?: string[];
  receivers_list?: {
    receiver_list_name: string;
    count: number;
  }[];
};

interface UsersListProps {
  sx?: SxProps<Theme>;
}

export default function UsersList({ sx }: UsersListProps) {
  const router = useRouter();
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<UsersSortKey>("email");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "users",
      page,
      searchText,
      sortKey,
      sortDirection,
      selectedFilters,
    ],
    queryFn: async () => {
      const url = apiURL(
        `users/list?limit=${rowsPerPage}&offset=${
          (page - 1) * rowsPerPage
        }&search=${searchText}&sort_key=${sortKey}&sort_order=${sortDirection}&${selectedFilters
          .map((filter) => `${filter}=true`)
          .join("&")}`,
        `users/list?limit=${rowsPerPage}&offset=${
          (page - 1) * rowsPerPage
        }&search=${searchText}&sort_key=${sortKey}&sort_order=${sortDirection}&limit=${rowsPerPage}&offset=${
          (page - 1) * rowsPerPage
        }&${selectedFilters.map((filter) => `${filter}=true`).join("&")}`
      );

      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.msg || "Failed to fetch users");
      }

      return response.json();
    },
  });

  const [debouncedSearch] = useDebounce(searchText, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleSort = (key: UsersSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const icon = (title: string, image: string, action: () => void) => {
    return (
      <Box sx={styles.iconBox} onClick={action}>
        <Box sx={styles.iconImageContainer}>
          <img
            src={image}
            alt="alarms"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </Box>
        <Typography sx={styles.iconText}>{title}</Typography>
      </Box>
    );
  };

  const icons = () => {
    return (
      <Box sx={styles.iconsContainer}>
        {icon("Add new user", addUser.src, () => {})}
      </Box>
    );
  };

  const handleRemoveUser = (user: UserData, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(user);
  };

  const toolbar = () => {
    return (
      <Box sx={styles.toolbar}>
        <Box sx={styles.toolbarInner}>
          <Box sx={styles.toolbarContent}>
            {/* Search bar */}
            <Box sx={styles.searchContainer}>
              <AutocompleteField
                placeholder="Search users"
                storageKey="userSearchHistory"
                searchText={searchText}
                setSearchText={setSearchText}
              />
            </Box>
            {/* Icons */}
            {icons()}
          </Box>
        </Box>
        <UsersFilters
          sx={styles.filtersContainer}
          onFiltersChange={setSelectedFilters}
          searchText={searchText}
        />
      </Box>
    );
  };

  const userNameCell = (user: UserData) => {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Box sx={styles.avatarTypeContainer(user.enabled)}>
          <PersonIcon
            sx={{
              fontSize: "24px",
              color: user.enabled ? BLUE : DARK_GREY,
            }}
          />
        </Box>
        <Typography sx={styles.userNameText}>{user.email}</Typography>
      </Box>
    );
  };

  const communicationBlock = (
    upperLabel: string,
    upperValue: string | null,
    lowerLabel: string,
    lowerValue: string | null
  ) => {
    return (
      <Box
        sx={{
          marginRight: "10px",
          maxWidth: "180px",
        }}
      >
        <Typography
          sx={{
            ...styles.userNameText,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <span>{upperLabel}: </span>
          <span style={{ fontWeight: "bold" }}>{upperValue || "--"}</span>
        </Typography>
        <Typography
          sx={{
            ...styles.userNameText,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <span>{lowerLabel}: </span>
          <span style={{ fontWeight: "bold" }}>{lowerValue || "--"}</span>
        </Typography>
      </Box>
    );
  };

  const roleCell = (user: UserData) => {
    if (user.role_level === 0) {
      return <Typography sx={styles.userNameText}>Admin</Typography>;
    } else if (user.role_level === 1) {
      return <Typography sx={styles.userNameText}>Coalition Owner</Typography>;
    } else {
      if ((user.group_rights.length || 0) === 0) {
        return <Typography sx={styles.userNameText}>--</Typography>;
      }

      let content = user.group_rights.slice(0, 2);

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {content.map((receiver, index) => {
            return (
              <Box
                key={`${receiver.group_name}-${index}`}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <ReceiverBubble
                  key={receiver.group_name}
                  receiver={{
                    group_name: receiver.group_name,
                    can_write: receiver.can_write,
                  }}
                />
                {index === 1 && user.group_rights.length > 2 && (
                  <Typography
                    sx={{
                      ...styles.userNameText,
                      color: BLUE,
                      fontWeight: "bold",
                    }}
                  >
                    {`+${user.group_rights.length - 2}`}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      );
    }
  };

  const alarmProfilesCell = (user: UserData) => {
    if ((user.alarm_profiles?.length || 0) === 0) {
      return <Typography sx={styles.userNameText}>--</Typography>;
    }

    const firstProfile = user.alarm_profiles?.[0];
    const secondProfile = user.alarm_profiles?.[1];
    const remainingCount = (user.alarm_profiles?.length || 0) - 2;

    return (
      <Box>
        <Typography sx={styles.userNameText}>{firstProfile}</Typography>
        {secondProfile && (
          <Typography sx={styles.userNameText}>
            {secondProfile}
            {remainingCount > 0 && (
              <span style={{ color: BLUE, fontWeight: "bold" }}>
                {` +${remainingCount}`}
              </span>
            )}
          </Typography>
        )}
      </Box>
    );
  };

  const receiversDescription = (receivers: any[]) => {
    if (receivers.length === 0) {
      return "No receivers";
    }

    let content = receivers.slice(0, 2);

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {content.map((receiver, index) => {
          return (
            <Box
              key={`${receiver.receiver_list_name}-${index}`}
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <ReceiverBubble
                key={receiver.receiver_list_name}
                receiver={{
                  label: receiver.receiver_list_name,
                  count: receiver.count,
                  receiver_type: "list",
                }}
              />
              {index === 1 && receivers.length > 2 && (
                <Typography
                  sx={{
                    ...styles.userNameText,
                    color: BLUE,
                    fontWeight: "bold",
                  }}
                >
                  {`+${receivers.length - 2}`}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      {toolbar()}
      <Box sx={styles.tableContainer}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={styles.tableCell}>
                  <TableSortLabel
                    active={sortKey === "email"}
                    direction={sortKey === "email" ? sortDirection : "asc"}
                    onClick={() => handleSort("email")}
                  >
                    User Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={styles.tableCell}>Initials</TableCell>
                <TableCell sx={styles.tableCell}>Communication</TableCell>
                <TableCell sx={styles.tableCell}>Alarm Profiles</TableCell>
                <TableCell sx={styles.tableCell}>
                  <TableSortLabel
                    active={sortKey === "role_level"}
                    direction={sortKey === "role_level" ? sortDirection : "asc"}
                    onClick={() => handleSort("role_level")}
                  >
                    Permissions
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={styles.tableCell}>Preferences</TableCell>
                <TableCell sx={styles.tableCell}>Receivers Lists</TableCell>
                <TableCell sx={styles.tableCell}>Last Activity</TableCell>
                <TableCell sx={styles.tableCell}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((user: UserData, index: number) => (
                  <TableRow
                    key={index}
                    onClick={() => handleUserClick(user.email)}
                    sx={{
                      ...styles.tableRow,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: PRIMARY_LIGHT,
                      },
                    }}
                  >
                    <TableCell sx={styles.tableCell}>
                      <Typography sx={styles.userNameText}>
                        {userNameCell(user)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell}>{user.initials}</TableCell>
                    <TableCell sx={styles.tableCell}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          gap: "10px",
                        }}
                      >
                        {communicationBlock(
                          "Email",
                          user.communication.email || "--",
                          "E-text",
                          user.communication.email_to_text || "--"
                        )}
                        {communicationBlock(
                          "SMS",
                          user.communication.sms || "--",
                          "Call",
                          user.communication.call || "--"
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      {alarmProfilesCell(user)}
                    </TableCell>
                    <TableCell sx={{ ...styles.tableCell, maxWidth: "180px" }}>
                      {roleCell(user)}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      <Typography sx={styles.userNameText}>
                        <span>T:{emptyString}</span>
                        <span style={{ fontWeight: "bold" }}>
                          {readableUnit(
                            user.preferences.temperature_unit || "--"
                          )}
                        </span>
                        <span>, CO2:{emptyString}</span>
                        <span style={{ fontWeight: "bold" }}>
                          {readableUnit(user.preferences.co2_unit || "--")}
                        </span>
                        <span>, P:{emptyString}</span>
                        <span style={{ fontWeight: "bold" }}>
                          {readableUnit(user.preferences.pressure_unit || "--")}
                        </span>
                      </Typography>
                      <Typography sx={styles.userNameText}>
                        <span>TZ:{emptyString}</span>
                        <span style={{ fontWeight: "bold" }}>
                          {user.preferences.tz || "--"}
                        </span>
                      </Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      {receiversDescription(user.receivers_list || [])}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      {user.last_active
                        ? formatReadingDate(user.last_active)
                        : "--"}
                    </TableCell>

                    <TableCell sx={styles.tableCell}>
                      <IconButton onClick={(e) => handleRemoveUser(user, e)}>
                        <PersonRemoveIcon sx={{ color: RED }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page - 1}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10]}
      />
    </Box>
  );
}
