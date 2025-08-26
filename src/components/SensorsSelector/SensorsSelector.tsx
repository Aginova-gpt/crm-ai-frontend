import {
  Box,
  CircularProgress,
  Typography,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  Table,
  TableBody,
  Divider,
  Checkbox,
  Button,
  AlertColor,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { styles } from "./SensorsSelector.styles";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import { sensorIcon, SensorInternalCode } from "@/utils/sensorHelpers";
import AutocompleteField from "@/components/AutocompleteField/AutocompleteField";
import { YELLOW } from "@/styles/colors";
import { useAlarmProfileContext } from "@/contexts/AlarmProfileContext";
import SnackView from "@/components/SnackView";
export interface SensorData {
  sensor_id: string;
  sensor_name: string;
  sensor_type: SensorInternalCode;
  coalition_name: string;
  group_name: string;
  location_name: string;
  alarm_profile: {
    id: number | null;
    name: string | null;
  };
}

interface SensorsSelectorProps {
  sx?: SxProps<Theme>;
  layout: "simple" | "full";
  action?: () => void;
  cancelAction?: () => void;
  actionIsEnabled?: boolean;
  allowEmptyList?: boolean;
  actionIsPending?: boolean;
}

// Helper function to highlight search text
const highlightText = (text: string, searchText: string) => {
  if (!searchText) return text;

  const regex = new RegExp(
    `(${searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === searchText.toLowerCase()) {
      return (
        <Box
          key={index}
          component="span"
          sx={{
            backgroundColor: YELLOW,
            fontWeight: "bold",
            padding: "1px 2px",
            borderRadius: "2px",
          }}
        >
          {part}
        </Box>
      );
    }
    return part;
  });
};

export default function SensorsSelector({
  sx,
  layout,
  action,
  cancelAction,
  actionIsEnabled,
  allowEmptyList,
  actionIsPending,
}: SensorsSelectorProps) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [searchText, setSearchText] = useState("");
  const {
    assignedSensors,
    setAssignedSensors,
    coalition,
    group,
    editingProfile,
  } = useAlarmProfileContext();
  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);

  const { data, isLoading } = useQuery<SensorData[]>({
    queryKey: ["sensors_selector"],
    queryFn: async () => {
      const url = apiURL(
        `sensors/simple_list?coalition_id=${coalition?.id}&group_id=${group?.id}`,
        `sensors/all_sensors?coalition_id=${coalition?.id}&group_id=${group?.id}`
      );
      const response = await fetchWithAuth(url);
      return response.json();
    },
    enabled: (!!coalition?.id || !!group?.id) && layout === "full",
  });

  const handleAssignSensor = (sensor: SensorData) => {
    if (assignedSensors.includes(sensor)) {
      if (allowEmptyList === false && assignedSensors.length === 1) {
        setSnackMessage({
          type: "error",
          message: "Assigned sensors list cannot be empty",
        });
        return;
      }
      setAssignedSensors(assignedSensors.filter((s) => s !== sensor));
    } else {
      const newAssignedSensors = [...assignedSensors, sensor].sort((a, b) =>
        a.sensor_name.localeCompare(b.sensor_name)
      );
      setAssignedSensors(newAssignedSensors);
    }
  };

  const tableHeader = (toAssign: boolean) => {
    return (
      <TableHead sx={{ position: "sticky", top: 0, zIndex: 1 }}>
        <TableRow>
          <TableCell sx={styles.tableCell}>Sensor ID</TableCell>
          <TableCell sx={styles.tableCell}>Sensor Name</TableCell>
          {layout === "full" && (
            <TableCell sx={styles.tableCell}>Sensor Type</TableCell>
          )}
          {toAssign && (
            <TableCell sx={styles.tableCell}>Alarm Profile</TableCell>
          )}
        </TableRow>
      </TableHead>
    );
  };

  const sensorRow = (sensor: SensorData, toAssign: boolean) => {
    const sensorHasAlarmProfile = sensor.alarm_profile.id !== null;
    const sensorHasNoProbe = sensor.sensor_type === "X_NO_PROBE";
    const sensorHasDifferentType =
      assignedSensors.length > 0 &&
      assignedSensors[0].sensor_type !== sensor.sensor_type;
    const isEditingSensor =
      editingProfile !== null && sensor.alarm_profile.id === editingProfile;
    let disableCheckbox = false;
    if (layout === "simple") {
      disableCheckbox = true;
    } else if (toAssign) {
      if (isEditingSensor) {
        disableCheckbox = false;
      } else if (
        sensorHasAlarmProfile ||
        sensorHasNoProbe ||
        sensorHasDifferentType
      ) {
        disableCheckbox = true;
      }
    }

    return (
      <TableRow
        key={sensor.sensor_id}
        sx={{
          backgroundColor: disableCheckbox ? "#f0f0f0" : "white",
        }}
      >
        <TableCell sx={{ ...styles.tableCell, minWidth: "120px" }}>
          <Checkbox
            disabled={disableCheckbox}
            checked={toAssign ? assignedSensors.includes(sensor) : true}
            onChange={(e) => {
              e.stopPropagation();
              handleAssignSensor(sensor);
            }}
            sx={{
              marginLeft: "-10px",
            }}
          />
          {highlightText(sensor.sensor_id, searchText)}
        </TableCell>
        <TableCell
          sx={{
            ...styles.tableCell,
            maxWidth: "200px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={sensor.sensor_name}
        >
          {highlightText(sensor.sensor_name, searchText)}
        </TableCell>
        {layout === "full" && (
          <TableCell sx={styles.tableCell}>{sensor.sensor_type}</TableCell>
        )}
        {toAssign && (
          <TableCell sx={styles.tableCell}>
            {sensor.alarm_profile.name || "None"}
          </TableCell>
        )}
      </TableRow>
    );
  };

  const toAssignTable = () => {
    const unassignedSensors =
      data?.filter(
        (sensor) =>
          assignedSensors.find((s) => s.sensor_id === sensor.sensor_id) ===
          undefined
      ) || [];
    const filteredSensors = unassignedSensors.filter((sensor) => {
      if (!searchText) return true;
      const searchLower = searchText.toLowerCase();
      return (
        sensor.sensor_name.toLowerCase().includes(searchLower) ||
        sensor.sensor_id.toLowerCase().includes(searchLower) ||
        sensor.coalition_name?.toLowerCase().includes(searchLower) ||
        sensor.group_name?.toLowerCase().includes(searchLower) ||
        sensor.location_name?.toLowerCase().includes(searchLower) ||
        sensor.sensor_type?.toLowerCase().includes(searchLower)
      );
    });
    const total = filteredSensors.length;
    return (
      <Box sx={{ ...styles.tableContainer, width: "45%" }}>
        <Typography sx={styles.tableTitle}>
          <Box component="span" sx={{ fontWeight: "bold" }}>
            {total}
          </Box>{" "}
          {total === 1 ? "Sensor" : "Sensors"} to Assign
        </Typography>
        <TableContainer sx={styles.toAssignTableContainer}>
          <Table>
            {tableHeader(true)}
            <TableBody>
              {isLoading ? (
                <TableRow key="loading-row">
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSensors.map((sensor: SensorData) =>
                  sensorRow(sensor, true)
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const actionButton = (style?: SxProps<Theme>) => {
    return (
      <Button
        disabled={layout === "full" && actionIsEnabled === false}
        loading={actionIsPending === true}
        variant="contained"
        color="secondary"
        sx={{
          ...style,
          height: "30px",
        }}
        onClick={action}
      >
        {layout === "full" ? "Save" : "Edit"}
      </Button>
    );
  };

  const cancelButton = (style?: SxProps<Theme>) => {
    return (
      <Button
        variant="contained"
        color="secondary"
        sx={{
          ...style,
          height: "30px",
        }}
        onClick={cancelAction}
      >
        Cancel
      </Button>
    );
  };

  const assignedTable = () => {
    const total = assignedSensors.length;
    return (
      <Box
        sx={{
          ...styles.tableContainer,
          width: layout === "full" ? "35%" : "100%",
        }}
      >
        <Box sx={styles.tableTitleContainer}>
          <Box
            sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
          >
            {assignedSensors.length > 0 && (
              <Box sx={styles.sensorIconBox}>
                <img
                  src={sensorIcon(assignedSensors[0].sensor_type).src}
                  style={{ width: "70%", height: "70%", objectFit: "contain" }}
                />
              </Box>
            )}
            <Typography sx={styles.tableTitle}>
              <Box component="span" sx={{ fontWeight: "bold" }}>
                {total}
              </Box>{" "}
              Assigned {total === 1 ? "Sensor" : "Sensors"}
            </Typography>
          </Box>
          {action && layout === "simple" && actionButton()}
        </Box>
        <TableContainer
          sx={{
            maxHeight: "550px",
            marginTop: "14px",
          }}
        >
          <Table>
            {tableHeader(false)}
            <TableBody>
              {isLoading ? (
                <TableRow key="loading-row">
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                assignedSensors.map((sensor: SensorData) =>
                  sensorRow(sensor, false)
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      {isLoading ? (
        <Box sx={styles.loadingContainer}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={styles.sensorsContainer}>
          <Box
            sx={{
              display: "flex",
              flex: 1,
              width: "100%",
              justifyContent: "center",
            }}
          >
            {layout === "full" && (
              <Box sx={styles.searchContainer}>
                <AutocompleteField
                  placeholder="Search sensors"
                  storageKey="sensorSearchHistory"
                  searchText={searchText}
                  setSearchText={setSearchText}
                />
              </Box>
            )}
            {cancelAction &&
              layout === "full" &&
              cancelButton({
                position: "absolute",
                left: 40,
                top: 250,
              })}
            {action &&
              layout === "full" &&
              actionButton({
                position: "absolute",
                right: 60,
                top: 250,
              })}
          </Box>
          <Box sx={styles.tablesContainer}>
            {layout === "full" && toAssignTable()}
            {layout === "full" && (
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  width: "1px",
                  backgroundColor: "gray",
                  margin: "20px 20px 0px 20px",
                }}
              />
            )}
            {assignedTable()}
          </Box>
        </Box>
      )}
      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </Box>
  );
}
