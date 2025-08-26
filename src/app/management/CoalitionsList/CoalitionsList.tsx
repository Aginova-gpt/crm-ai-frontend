import {
  Box,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  Typography,
  IconButton,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useState, useEffect, useMemo } from "react";
import { styles } from "./CoalitionsList.styles";
import { PRIMARY_LIGHT, YELLOW } from "@/styles/colors";
import { useRouter } from "next/navigation";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import AutocompleteField from "@/components/AutocompleteField/AutocompleteField";
import { SortDirection } from "@/utils/sensorHelpers";
import { useProfile } from "@/contexts/ProfileContext";

type CoalitionSortKey =
  | "name"
  | "users_count"
  | "groups_count"
  | "alarm_profiles_count";

type CoalitionData = {
  id: number;
  name: string;
  users_count: number;
  groups_count: number;
  alarm_profiles_count: number;
};

interface CoalitionsListProps {
  sx?: SxProps<Theme>;
}

export default function CoalitionsList({ sx }: CoalitionsListProps) {
  const router = useRouter();
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<CoalitionSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { isAdmin, profileData } = useProfile();

  const [debouncedSearch] = useDebounce(searchText, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["coalitions"],
    queryFn: async () => {
      let url = "";
      if (isAdmin === false && profileData?.coalition?.id) {
        url = apiURL(
          `management/coalitions?coalition_id=${profileData?.coalition?.id}`,
          `coalitions/list?coalition_id=${profileData?.coalition?.id}`
        );
      } else if (isAdmin === true) {
        url = apiURL("management/coalitions", "coalitions/list");
      } else {
        url = apiURL("", "");
      }

      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.msg || "Failed to fetch coalitions");
      }

      return response.json();
    },
  });

  const handleCoalitionClick = (coalitionId: number) => {
    router.push(`/management/coalitions/${coalitionId}`);
  };

  const handleSort = (key: CoalitionSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const highlightSearchText = (text: string, searchText: string) => {
    if (!searchText.trim()) return text;

    const regex = new RegExp(
      `(${searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span
            key={index}
            style={{
              backgroundColor: YELLOW,
              padding: "1px 2px",
              borderRadius: "2px",
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Local filtering and sorting
  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];

    let filteredData = data;

    // Apply search filter
    if (debouncedSearch.trim()) {
      filteredData = data.filter((coalition: CoalitionData) =>
        coalition.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Apply sorting
    filteredData.sort((a: CoalitionData, b: CoalitionData) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "number" && typeof bValue === "number") {
        if (sortDirection === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      if (sortDirection === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return filteredData;
  }, [data, debouncedSearch, sortKey, sortDirection]);

  const toolbar = () => {
    return (
      <Box sx={styles.toolbar}>
        <Box sx={styles.toolbarInner}>
          <Box sx={styles.toolbarContent}>
            {/* Search bar */}
            <Box sx={styles.searchContainer}>
              <AutocompleteField
                placeholder="Search coalitions"
                storageKey="coalitionSearchHistory"
                searchText={searchText}
                setSearchText={setSearchText}
              />
            </Box>
          </Box>
        </Box>
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
                    active={sortKey === "name"}
                    direction={sortKey === "name" ? sortDirection : "asc"}
                    onClick={() => handleSort("name")}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={styles.tableCell}>
                  <TableSortLabel
                    active={sortKey === "users_count"}
                    direction={
                      sortKey === "users_count" ? sortDirection : "asc"
                    }
                    onClick={() => handleSort("users_count")}
                  >
                    Users
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={styles.tableCell}>
                  <TableSortLabel
                    active={sortKey === "groups_count"}
                    direction={
                      sortKey === "groups_count" ? sortDirection : "asc"
                    }
                    onClick={() => handleSort("groups_count")}
                  >
                    Groups
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={styles.tableCell}>
                  <TableSortLabel
                    active={sortKey === "alarm_profiles_count"}
                    direction={
                      sortKey === "alarm_profiles_count" ? sortDirection : "asc"
                    }
                    onClick={() => handleSort("alarm_profiles_count")}
                  >
                    Alarm Profiles
                  </TableSortLabel>
                </TableCell>
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
                filteredAndSortedData.map(
                  (coalition: CoalitionData, index: number) => (
                    <TableRow
                      key={index}
                      onClick={() => handleCoalitionClick(coalition.id)}
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
                          {highlightSearchText(coalition.name, debouncedSearch)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        {coalition.users_count}
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        {coalition.groups_count}
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        {coalition.alarm_profiles_count}
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
