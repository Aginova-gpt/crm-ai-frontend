import { Box, CircularProgress, Typography, Tooltip } from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import WarningIcon from "@mui/icons-material/Warning";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AirplanemodeInactiveIcon from "@mui/icons-material/AirplanemodeInactive";
import { useState, useEffect } from "react";
import { styles } from "./UsersFilters.styles";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";

type Filter =
  | "deactivated"
  | "owners"
  | "inactive_90_days";
const filters: Filter[] = [
  "deactivated",
  "owners",
  "inactive_90_days",
];
interface UsersFiltersType {
  deactivated: number;
  owners: number;
  inactive_90_days: number;
  total_users: number;
}

interface UsersFiltersProps {
  sx?: SxProps<Theme>;
  onFiltersChange?: (selectedFilters: string[]) => void;
  searchText?: string;
}

export default function UsersFilters({
  sx,
  onFiltersChange,
  searchText,
}: UsersFiltersProps) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    onFiltersChange?.(selectedFilters);
  }, [selectedFilters, onFiltersChange]);

  const { data, isLoading } = useQuery<UsersFiltersType>({
    queryKey: ["users_filters", selectedFilters, searchText],
    queryFn: async () => {
      const url = apiURL(
        `users/filters?${
          searchText && searchText.length >= 1 ? `search=${searchText}` : ""
        }&${filters[0]}=${selectedFilters.includes(filters[0])}&${
          filters[1]
        }=${selectedFilters.includes(filters[1])}&${
          filters[2]
        }=${selectedFilters.includes(filters[2])}&${
          filters[3]
        }=${selectedFilters.includes(filters[3])}`,
        `users/filters?${
          searchText && searchText.length >= 1 ? `search=${searchText}` : ""
        }&${filters[0]}=${selectedFilters.includes(filters[0])}&${
          filters[1]
        }=${selectedFilters.includes(filters[1])}&${
          filters[2]
        }=${selectedFilters.includes(filters[2])}&${
          filters[3]
        }=${selectedFilters.includes(filters[3])}`
      );

      const response = await fetchWithAuth(url);
      return response.json();
    },
  });

  const filterName = (id: Filter) => {
    if (id === filters[0]) {
      return "Deactivated";
    }
    if (id === filters[1]) {
      return "Owners";
    }
    if (id === filters[2]) {
      return "90+ Days Inactive";
    }
  };

  const filterIcon = (id: Filter) => {
    const size = 35;
    if (id === filters[0]) {
      return <PersonRemoveIcon sx={{ fontSize: size }} />;
    }
    if (id === filters[1]) {
      return <WorkspacePremiumIcon sx={{ fontSize: size }} />;
    }
    if (id === filters[2]) {
      return <AirplanemodeInactiveIcon sx={{ fontSize: size }} />;
    }
    return <WarningIcon sx={{ fontSize: size }} />;
  };

  const handleFilterClick = (filterId: string) => {
    setSelectedFilters((prev) => {
      const newSelection = prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId];

      return newSelection;
    });
  };

  const filterBox = (
    id: Filter,
    count: number | undefined,
    total: number | undefined
  ) => {
    return (
      <Tooltip
        key={id}
        title={
          selectedFilters.includes(id) ? "Click to deselect" : "Click to select"
        }
        placement="top"
      >
        <Box
          onClick={() => handleFilterClick(id)}
          sx={styles.filterBox(selectedFilters.includes(id))}
        >
          <Box sx={styles.iconContainer(selectedFilters.includes(id))}>
            {filterIcon(id)}
          </Box>
          <Typography sx={styles.filterTitle}>{filterName(id)}</Typography>
          <Typography sx={styles.filterCount}>
            {count}/{total || 0}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      {isLoading ? (
        <Box sx={styles.loadingContainer}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={styles.filtersContainer}>
          {filterBox(filters[0], data?.deactivated, data?.total_users)}
          {filterBox(filters[1], data?.owners, data?.total_users)}
          {filterBox(
            filters[2],
            data?.inactive_90_days,
            data?.total_users
          )}
        </Box>
      )}
    </Box>
  );
}
