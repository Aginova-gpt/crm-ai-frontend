import { Box, CircularProgress, Typography, Tooltip } from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import SensorsOffIcon from "@mui/icons-material/SensorsOff";
import BatteryCharging20Icon from "@mui/icons-material/BatteryCharging20";
import SignalCellularConnectedNoInternet1BarIcon from "@mui/icons-material/SignalCellularConnectedNoInternet1Bar";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WarningIcon from "@mui/icons-material/Warning";
import { useState, useEffect } from "react";
import { styles } from "./SensorsFilters.styles";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";

type Filter =
  | "filter_inactive_sensors"
  | "filter_low_battery"
  | "filter_weak_signal"
  | "filter_alarming_sensors";
const filters: Filter[] = [
  "filter_inactive_sensors",
  "filter_low_battery",
  "filter_weak_signal",
  "filter_alarming_sensors",
];
interface SensorsFiltersType {
  filter_inactive_sensors: number;
  filter_low_battery: number;
  filter_weak_signal: number;
  filter_alarming_sensors: number;
  total_sensors: number;
}

interface SensorsFiltersProps {
  sx?: SxProps<Theme>;
  onFiltersChange?: (selectedFilters: string[]) => void;
  searchText?: string;
}

export default function SensorsFilters({
  sx,
  onFiltersChange,
  searchText,
}: SensorsFiltersProps) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    onFiltersChange?.(selectedFilters);
  }, [selectedFilters, onFiltersChange]);

  const { data, isLoading } = useQuery<SensorsFiltersType>({
    queryKey: ["sensors_filters", selectedFilters, searchText],
    queryFn: async () => {
      const url = apiURL(
        `sensors/filters?${
          searchText && searchText.length >= 1
            ? `search=${searchText}`
            : ""
        }&${filters[0]}=${selectedFilters.includes(filters[0])}&${
          filters[1]
        }=${selectedFilters.includes(filters[1])}&${
          filters[2]
        }=${selectedFilters.includes(filters[2])}&${
          filters[3]
        }=${selectedFilters.includes(filters[3])}`,
        `filters/list?${
          searchText && searchText.length >= 1
            ? `search=${searchText}`
            : ""
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
      return "Inactive Sensors";
    }
    if (id === filters[1]) {
      return "Low Battery";
    }
    if (id === filters[2]) {
      return "Weak Signal";
    }
    if (id === filters[3]) {
      return "Active Alarms";
    }
  };

  const filterIcon = (id: Filter) => {
    const size = 35;
    if (id === filters[0]) {
      return <SensorsOffIcon sx={{ fontSize: size }} />;
    }
    if (id === filters[1]) {
      return <BatteryCharging20Icon sx={{ fontSize: size }} />;
    }
    if (id === filters[2]) {
      return (
        <SignalCellularConnectedNoInternet1BarIcon sx={{ fontSize: size }} />
      );
    }
    if (id === filters[3]) {
      return <NotificationsActiveIcon sx={{ fontSize: size }} />;
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
          sx={styles.filterBox(selectedFilters.includes(id), count || 0)}
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
          {filterBox(
            filters[0],
            data?.filter_inactive_sensors,
            data?.total_sensors
          )}
          {filterBox(filters[1], data?.filter_low_battery, data?.total_sensors)}
          {filterBox(filters[2], data?.filter_weak_signal, data?.total_sensors)}
          {filterBox(
            filters[3],
            data?.filter_alarming_sensors,
            data?.total_sensors
          )}
        </Box>
      )}
    </Box>
  );
}
