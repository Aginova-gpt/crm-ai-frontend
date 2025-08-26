import { Box, CircularProgress, Typography, Tooltip } from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { styles } from "./AlarmsFilters.styles";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import {
  alarmIcon,
  AlarmFilterType,
  alarmFilterName,
} from "@/utils/sensorHelpers";
import { GRAY_GRADIENT } from "@/styles/colors";

const filters: AlarmFilterType[] = [
  "filter_type_threshold",
  "filter_type_lowbattery",
  "filter_type_connectivity",
  "filter_type_notreadingdata",
  "open_alarms",
  "closed_alarms",
];

export interface AlarmsFiltersTypeResponse {
  type_not_reading: number;
  type_lowbattery: number;
  type_connectivity: number;
  type_threshold: number;
  open_alarms: number;
  closed_alarms: number;
  total_alarms: number;
}

interface AlarmsFiltersProps {
  sx?: SxProps<Theme>;
  onFiltersChange: (selectedFilters: string[]) => void;
  selectedFilters: string[];
  searchText?: string;
}

export default function AlarmsFilters({
  sx,
  onFiltersChange,
  selectedFilters,
  searchText,
}: AlarmsFiltersProps) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();

  const { data, isLoading } = useQuery<AlarmsFiltersTypeResponse>({
    queryKey: ["alarms_filters", selectedFilters, searchText],
    queryFn: async () => {
      let type = "open";
      if (selectedFilters.includes("closed_alarms")) {
        type = "closed";
      }
      const url = apiURL(
        `alarms/filters?type=${type}&${
          searchText && searchText.length >= 1 ? `search=${searchText}` : ""
        }`,
        `alarms_count?type=${type}&${
          searchText && searchText.length >= 1 ? `search=${searchText}` : ""
        }`
      );

      const response = await fetchWithAuth(url);
      return response.json();
    },
  });

  const filterIcon = (id: AlarmFilterType) => {
    const style = {
      width: 48,
      height: 48,
      marginTop: "-5px",
      marginBottom: "-8px",
    };
    return <img src={alarmIcon(id)} alt={id} style={style} />;
  };

  const handleFilterClick = (filterId: string) => {
    const newSelection = selectedFilters.includes(filterId)
      ? selectedFilters.filter((id) => id !== filterId)
      : [...selectedFilters, filterId];
    onFiltersChange(newSelection);
  };

  const filterBox = (
    id: AlarmFilterType,
    type: string,
    count?: number,
    total?: number,
    background?: string
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
          onClick={() => {
            handleFilterClick(id);
          }}
          sx={styles.filterBox(
            selectedFilters.includes(id),
            count || 0,
            background
          )}
        >
          <Box sx={styles.iconContainer(selectedFilters.includes(id))}>
            {filterIcon(id)}
          </Box>
          <Typography sx={styles.filterTitle}>{alarmFilterName(id)}</Typography>
          <Typography
            sx={{
              ...styles.filterCount,
              display: "flex",
            }}
          >
            {count}/{total || 0}
            <Typography sx={styles.alarmType}>{type}</Typography>
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  const isClosed = selectedFilters.includes("closed_alarms");

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
            isClosed ? "CLOSED" : "OPEN",
            data?.type_threshold,
            isClosed ? data?.closed_alarms : data?.open_alarms,
            isClosed ? GRAY_GRADIENT : undefined
          )}
          {filterBox(
            filters[1],
            isClosed ? "CLOSED" : "OPEN",
            data?.type_lowbattery,
            isClosed ? data?.closed_alarms : data?.open_alarms,
            isClosed ? GRAY_GRADIENT : undefined
          )}
          {filterBox(
            filters[2],
            isClosed ? "CLOSED" : "OPEN",
            data?.type_connectivity,
            isClosed ? data?.closed_alarms : data?.open_alarms,
            isClosed ? GRAY_GRADIENT : undefined
          )}
          {filterBox(
            filters[3],
            isClosed ? "CLOSED" : "OPEN",
            data?.type_not_reading,
            isClosed ? data?.closed_alarms : data?.open_alarms,
            isClosed ? GRAY_GRADIENT : undefined
          )}
        </Box>
      )}
    </Box>
  );
}
