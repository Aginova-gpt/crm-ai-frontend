import { Box, CircularProgress, Typography, Tooltip } from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { styles } from "./AlarmProfilesFilters.styles";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import { BLUE_GRADIENT } from "@/styles/colors";
import {
  ProfileFilterType,
  profileFilterIcon,
  profileFilterName,
} from "@/utils/sensorHelpers";

const filters: ProfileFilterType[] = [
  "filter_threshold",
  "filter_battery",
  "filter_connectivity",
  "filter_not_reading",
];

interface AlarmProfilesFiltersType {
  type_lowbattery: number;
  type_connectivity: number;
  type_threshold: number;
  type_not_reading: number;
  total_profiles: number;
}

interface AlarmProfilesFiltersProps {
  sx?: SxProps<Theme>;
  onFiltersChange?: (selectedFilters: ProfileFilterType[]) => void;
  searchText?: string;
}

export default function AlarmProfilesFilters({
  sx,
  onFiltersChange,
  searchText,
}: AlarmProfilesFiltersProps) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [selectedFilters, setSelectedFilters] = useState<ProfileFilterType[]>(
    []
  );

  useEffect(() => {
    onFiltersChange?.(selectedFilters);
  }, [selectedFilters, onFiltersChange]);

  const { data, isLoading } = useQuery<AlarmProfilesFiltersType>({
    queryKey: ["alarm_profiles_filters", selectedFilters, searchText],
    queryFn: async () => {
      const url = apiURL(
        `alarm_profiles/filters?${
          searchText && searchText.length >= 1 ? `search=${searchText}` : ""
        }`,
        `alarm_profiles_count?${
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

  const filterIcon = (id: ProfileFilterType) => {
    const style = {
      width: 48,
      height: 48,
      marginTop: "-5px",
      marginBottom: "-8px",
    };
    return <img src={profileFilterIcon(id)} alt={id} style={style} />;
  };

  const handleFilterClick = (filterId: ProfileFilterType) => {
    setSelectedFilters((prev) => {
      const newSelection = prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId];

      return newSelection;
    });
  };

  const filterBox = (
    id: ProfileFilterType,
    count: number | undefined,
    total: number | undefined,
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
          onClick={() => handleFilterClick(id)}
          sx={styles.filterBox(
            selectedFilters.includes(id),
            count || 0,
            background
          )}
        >
          <Box sx={styles.iconContainer(selectedFilters.includes(id))}>
            {filterIcon(id)}
          </Box>
          <Typography sx={styles.filterTitle}>
            {profileFilterName(id)}
          </Typography>
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
            data?.type_lowbattery,
            data?.total_profiles,
            BLUE_GRADIENT
          )}
          {filterBox(
            filters[1],
            data?.type_connectivity,
            data?.total_profiles,
            BLUE_GRADIENT
          )}
          {filterBox(
            filters[2],
            data?.type_threshold,
            data?.total_profiles,
            BLUE_GRADIENT
          )}
          {filterBox(
            filters[3],
            data?.type_not_reading,
            data?.total_profiles,
            BLUE_GRADIENT
          )}
          {/* {filterBox(
            filters[4],
            data?.type_active,
            data?.total_profiles,
            LIGHT_GREEN_GRADIENT
          )}
          {filterBox(
            filters[5],
            data?.type_disabled,
            data?.total_profiles,
            GRAY_GRADIENT
          )} */}
        </Box>
      )}
    </Box>
  );
}
