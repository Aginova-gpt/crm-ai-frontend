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
  Badge,
  IconButton,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useState, useEffect } from "react";
import {
  ArrowCircleUp,
  ArrowCircleDown,
  CheckCircle,
  NotificationsActive,
  NotificationsOff,
  Notifications,
  AreaChart,
  Chat,
  Close,
  Build,
} from "@mui/icons-material";
import { formatReadingDate } from "@/utils/helpers";
import SensorsFilters from "../SensorsFilters/SensorsFilters";
import { csv, certificates, signing } from "@/styles/icons";
import { styles } from "./LiveSensors.styles";
import {
  ACTION,
  BLUE,
  GREEN,
  GREY_TEXT,
  RED,
  PRIMARY_LIGHT,
  ORANGE,
  SECONDARY,
} from "@/styles/colors";
import { useRouter } from "next/navigation";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import AutocompleteField from "../AutocompleteField/AutocompleteField";
import SigningBar from "../SigningBar/SigningBar";
import SensorGraph from "../SensorGraph/SensorGraph";
import {
  SensorData,
  sensorIcon,
  wifiIcon,
  batteryIcon,
  SensorsSortKey,
  SortDirection,
  getMaintenanceStatus,
} from "@/utils/sensorHelpers";
import { readableUnit } from "@/utils/helpers";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

interface LiveSensorsProps {
  sx?: SxProps<Theme>;
  onChatClick: (sensor: SensorData) => void;
}

type ListMode = "sensors" | "signing" | "maintenance";

export default function LiveSensors({ sx, onChatClick }: LiveSensorsProps) {
  const router = useRouter();
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SensorsSortKey>("last_seen");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [listMode, setListMode] = useState<ListMode>("sensors");
  const [assignedSensors, setAssignedSensors] = useState<SensorData[]>([]);
  const [selectedSensorForGraph, setSelectedSensorForGraph] =
    useState<SensorData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [
      "sensors",
      page,
      searchText,
      sortKey,
      sortDirection,
      selectedFilters,
    ],
    queryFn: async () => {
      const url = apiURL(
        `sensors/list?limit=${rowsPerPage}&offset=${
          (page - 1) * rowsPerPage
        }&search=${searchText}&sort_key=${sortKey}&sort_order=${sortDirection}&${selectedFilters
          .map((filter) => `${filter}=true`)
          .join("&")}`,
        `sensors/list?limit=${rowsPerPage}&offset=${
          (page - 1) * rowsPerPage
        }&search=${searchText}&sort_key=${sortKey}&sort_order=${sortDirection}&limit=${rowsPerPage}&offset=${
          (page - 1) * rowsPerPage
        }&${selectedFilters.map((filter) => `${filter}=true`).join("&")}`
      );

      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.msg || "Failed to fetch sensors");
      }

      return response.json();
    },
  });

  const [debouncedSearch] = useDebounce(searchText, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleSort = (key: SensorsSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleSensorClick = (sensorId: string) => {
    router.push(`/sensors/${sensorId}`);
  };

  const handleChatClick = (sensor: SensorData, event: React.MouseEvent) => {
    event.stopPropagation();
    onChatClick(sensor);
  };

  const handleGraphClick = (sensor: SensorData) => {
    setSelectedSensorForGraph(sensor);
  };

  const icon = (
    title: string,
    image: any,
    action: () => void,
    isSelected: boolean,
    badge?: number
  ) => {
    return (
      <Box
        sx={
          {
            ...styles.iconBox,
            ...(isSelected ? styles.selectedIconBox : {}),
          } as SxProps<Theme>
        }
        onClick={action}
      >
        <Box sx={styles.iconImageContainer}>
          {typeof image === "string" ? (
            <img
              src={image}
              alt="alarms"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            image
          )}
          {badge !== undefined && badge > 0 && (
            <Box sx={styles.badgeContainer}>
              <Badge badgeContent={badge} color="error" />
            </Box>
          )}
        </Box>
        <Typography sx={styles.iconText}>{title}</Typography>
      </Box>
    );
  };

  const icons = () => {
    return (
      <Box sx={styles.iconsContainer}>
        {icon(
          "Signing",
          signing.src,
          () => {
            if (listMode === "signing") {
              setListMode("sensors");
              setAssignedSensors([]);
            } else {
              setListMode("signing");
            }
          },
          listMode === "signing",
          listMode === "signing" ? assignedSensors.length : undefined
        )}
        {icon("CSV", csv.src, () => {}, false)}
        {/* {icon(
          "Maintenance",
          <BuildOutlinedIcon sx={{ color: SECONDARY, fontSize: "36px" }} />,
          () => {
            if (listMode === "maintenance") {
              setListMode("sensors");
            } else {
              setListMode("maintenance");
            }
          },
          listMode === "maintenance"
        )} */}
      </Box>
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
                placeholder="Search sensors"
                storageKey="sensorSearchHistory"
                searchText={searchText}
                setSearchText={setSearchText}
              />
            </Box>
            {/* Icons */}
            {icons()}
          </Box>
        </Box>
        <SensorsFilters
          sx={styles.filtersContainer}
          onFiltersChange={setSelectedFilters}
          searchText={searchText}
        />
      </Box>
    );
  };

  const handleAssignSensor = (sensor: SensorData) => {
    if (assignedSensors.includes(sensor)) {
      setAssignedSensors(assignedSensors.filter((s) => s !== sensor));
    } else {
      const newAssignedSensors = [...assignedSensors, sensor].sort((a, b) =>
        a.sensor_name.localeCompare(b.sensor_name)
      );
      setAssignedSensors(newAssignedSensors);
    }
  };

  const sensorNameCell = (sensor: SensorData) => {
    const maintenanceStatus = getMaintenanceStatus(sensor.in_maintenance);

    return (
      <Box sx={styles.sensorNameCell}>
        {listMode === "signing" && (
          <Checkbox
            checked={assignedSensors.includes(sensor)}
            sx={{
              marginLeft: "-10px",
            }}
          />
        )}
        <Box
          sx={styles.sensorIndicator(
            (sensor.open_alarms || 0) > 0,
            maintenanceStatus?.isActive || false,
            sensor.filter_inactive_sensors === true
          )}
        >
          <img
            src={sensorIcon(sensor.probe?.internal_code || "X_NO_PROBE").src}
            style={{ width: "80%", height: "80%", objectFit: "contain" }}
          />
        </Box>
        <Box>
          <Typography sx={styles.sensorNameText}>
            {sensor.sensor_name}
          </Typography>
          <Typography sx={styles.sensorCoalitionText}>
            {(sensor.group || "-") + ", " + (sensor.asset || "-")}
          </Typography>
          {maintenanceStatus?.isActive && (
            <Chip
              icon={<Build />}
              label={`Maintenance: ${
                maintenanceStatus.hoursRemaining > 1000
                  ? "Permanent"
                  : `${maintenanceStatus.hoursRemaining}h left`
              }`}
              size="small"
              sx={{
                backgroundColor: "black",
                color: "white",
                fontSize: "10px",
                height: "20px",
                marginTop: "2px",
                "& .MuiChip-icon": {
                  color: "white",
                  fontSize: "12px",
                },
              }}
            />
          )}
        </Box>
      </Box>
    );
  };

  const sensorProbeCell = (
    value: number | null,
    lowerThreshold: number | null,
    upperThreshold: number | null,
    unit: string | null
  ) => {
    if (value === null) {
      return (
        <Box sx={styles.sensorProbeCell}>
          <Typography sx={styles.sensorProbeText}>N/A</Typography>
        </Box>
      );
    }

    let readingState = "normal";
    if (lowerThreshold !== null && value < lowerThreshold) {
      readingState = "below";
    }
    if (upperThreshold !== null && value > upperThreshold) {
      readingState = "above";
    }

    return (
      <Box sx={styles.sensorProbeCell}>
        {readingState === "normal" ? (
          <CheckCircle sx={{ color: GREEN }} />
        ) : readingState === "above" ? (
          <ArrowCircleUp sx={{ color: RED }} />
        ) : (
          <ArrowCircleDown sx={{ color: BLUE }} />
        )}
        <Box sx={styles.sensorProbeTextContainer}>
          <Typography sx={styles.sensorProbeText}>
            {value?.toFixed(2)} {readableUnit(unit || "")}
          </Typography>
          <Typography sx={{ ...styles.sensorProbeText, color: GREY_TEXT }}>
            {lowerThreshold?.toFixed(2) || "--"}
            {lowerThreshold ? readableUnit(unit || "") : ""}/
            {upperThreshold?.toFixed(2) || "--"}
            {upperThreshold ? readableUnit(unit || "") : ""}
          </Typography>
        </Box>
      </Box>
    );
  };

  const sensorAlarmsCell = (
    openAlarms: number,
    inMaintenance: boolean,
    alarmProfileId: number | null
  ) => {
    return inMaintenance ? (
      <Box sx={styles.sensorAlarmsCell}>
        <NotificationsOff sx={{ color: BLUE }} />
        <Typography sx={styles.sensorProbeText}>Alarming paused</Typography>
      </Box>
    ) : openAlarms > 0 ? (
      <Box sx={styles.sensorAlarmsCell}>
        <NotificationsActive sx={{ color: RED }} />
        <Typography sx={styles.sensorProbeText}>{openAlarms} alarms</Typography>
      </Box>
    ) : (
      <Box sx={styles.sensorAlarmsCell}>
        <Notifications sx={{ color: alarmProfileId ? GREEN : GREY_TEXT }} />
        <Typography sx={styles.sensorProbeText}>
          {alarmProfileId ? "No Alarms" : "No Alarm Profile"}
        </Typography>
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
                    active={sortKey === "sensor_name"}
                    direction={
                      sortKey === "sensor_name" ? sortDirection : "asc"
                    }
                    onClick={() => handleSort("sensor_name")}
                  >
                    Sensor Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={styles.tableCell}>
                  <TableSortLabel
                    active={sortKey === "sensor_id"}
                    direction={sortKey === "sensor_id" ? sortDirection : "asc"}
                    onClick={() => handleSort("sensor_id")}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={styles.tableCell}>Probe 1</TableCell>
                <TableCell sx={styles.tableCell}>Probe 2</TableCell>
                <TableCell sx={styles.tableCell}>24h Average</TableCell>
                <TableCell sx={styles.tableCell}>24h Min/Max</TableCell>
                <TableCell sx={styles.tableCell}>
                  <TableSortLabel
                    active={sortKey === "last_seen"}
                    direction={sortKey === "last_seen" ? sortDirection : "asc"}
                    onClick={() => handleSort("last_seen")}
                  >
                    Last Seen
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={styles.tableCell}>Alarms</TableCell>
                <TableCell sx={styles.tableCell}>Health</TableCell>
                <TableCell sx={styles.tableCell}>Quick Actions</TableCell>
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
                data?.data?.map((sensor: SensorData) => (
                  <TableRow
                    key={sensor.sensor_id}
                    onClick={() => handleSensorClick(sensor.sensor_id)}
                    sx={{
                      ...styles.tableRow,
                      cursor: "pointer",
                      backgroundColor: (() => {
                        const maintenanceStatus = getMaintenanceStatus(
                          sensor.in_maintenance
                        );
                        return maintenanceStatus?.isActive
                          ? `${ORANGE}20`
                          : "inherit";
                      })(),
                      "&:hover": {
                        backgroundColor: (() => {
                          const maintenanceStatus = getMaintenanceStatus(
                            sensor.in_maintenance
                          );
                          return maintenanceStatus?.isActive
                            ? `${ORANGE}50`
                            : PRIMARY_LIGHT;
                        })(),
                      },
                    }}
                  >
                    <TableCell
                      onClick={(e) => {
                        if (listMode === "signing") {
                          e.stopPropagation();
                          handleAssignSensor(sensor);
                        }
                      }}
                      sx={styles.tableCell}
                    >
                      {sensorNameCell(sensor)}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      {sensor.sensor_id}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      {sensorProbeCell(
                        sensor.data.t1.value,
                        sensor.data.t1.lower_threshold,
                        sensor.data.t1.upper_threshold,
                        sensor.data.t1.unit
                      )}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      {sensorProbeCell(
                        sensor.data.t2.value,
                        sensor.data.t2.lower_threshold,
                        sensor.data.t2.upper_threshold,
                        sensor.data.t2.unit
                      )}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      <Typography sx={styles.sensorProbeAverageText}>
                        <Box component="span" sx={{ color: GREY_TEXT }}>
                          P1:
                        </Box>{" "}
                        {sensor.data.t1.average?.toFixed(2) || "--"}
                      </Typography>
                      <Typography sx={styles.sensorProbeAverageText}>
                        <Box component="span" sx={{ color: GREY_TEXT }}>
                          P2:
                        </Box>{" "}
                        {sensor.data.t2.average?.toFixed(2) || "--"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      <Typography sx={styles.sensorProbeAverageText}>
                        <Box component="span" sx={{ color: GREY_TEXT }}>
                          P1:
                        </Box>{" "}
                        {sensor.data.t1.min?.toFixed(2) || "--"}/
                        {sensor.data.t1.max?.toFixed(2) || "--"}
                      </Typography>
                      <Typography sx={styles.sensorProbeAverageText}>
                        <Box component="span" sx={{ color: GREY_TEXT }}>
                          P2:
                        </Box>{" "}
                        {sensor.data.t2.min?.toFixed(2) || "--"}/
                        {sensor.data.t2.max?.toFixed(2) || "--"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      <Typography sx={styles.sensorProbeText}>
                        {formatReadingDate(sensor.last_seen)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      {sensorAlarmsCell(
                        sensor.open_alarms || 0,
                        sensor.in_maintenance !== null,
                        sensor.alarm_profile?.id || null
                      )}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      {wifiIcon(sensor.signal_rssi)}
                      {batteryIcon(
                        sensor.battery_voltage,
                        sensor.battery_charging_status === "1" ||
                          sensor.battery_charging_status === "2"
                      )}
                    </TableCell>
                    <TableCell sx={styles.tableCell}>
                      <IconButton onClick={(e) => handleChatClick(sensor, e)}>
                        <Chat sx={{ color: ACTION }} />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGraphClick(sensor);
                        }}
                      >
                        <AreaChart sx={{ color: ACTION }} />
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

      {listMode === "signing" && (
        <SigningBar
          selectedSensors={assignedSensors}
          setSelectedSensors={setAssignedSensors}
        />
      )}

      {listMode === "signing" && <Box sx={{ height: "120px" }} />}

      {/* Graph Modal */}
      <Dialog
        open={selectedSensorForGraph !== null}
        onClose={() => setSelectedSensorForGraph(null)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e0e0e0",
            padding: "16px 24px",
          }}
        >
          <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
            {selectedSensorForGraph?.sensor_name}
          </Typography>
          <IconButton
            onClick={() => setSelectedSensorForGraph(null)}
            sx={{ color: "grey.500" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: "24px", backgroundColor: "#fafafa" }}>
          {selectedSensorForGraph && (
            <SensorGraph
              sensor={{
                id: selectedSensorForGraph.sensor_id,
                upload_period: 86400,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
