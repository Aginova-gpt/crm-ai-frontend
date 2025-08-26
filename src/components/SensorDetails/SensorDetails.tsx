import {
  Box,
  CircularProgress,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  AlertColor,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { styles } from "./SensorDetails.styles";
import {
  ArrowBack,
  DeviceThermostat,
  Edit,
  ArrowCircleUp,
  ArrowCircleDown,
  ArrowForward,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import {
  CARD_BACKGROUND,
  GREEN,
  RED,
  DARK_ORANGE,
  BLUE,
  SELECTED_COLOR,
} from "@/styles/colors";
import { formatReadingDate, readableUnit } from "@/utils/helpers";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import SnackView from "../SnackView";
import {
  getMaintenanceStatus,
  sensorIcon,
  SensorInternalCode,
  signalColor,
  batteryColor,
} from "@/utils/sensorHelpers";

interface SensorDetailsProps {
  sx?: SxProps<Theme>;
  sensorId: string;
  canGoBack?: boolean;
  setFetchedSensor: (sensor: SensorDetailsData) => void;
}

export interface Measurement {
  name: string | null;
  value: number;
  unit: string;
  lower_threshold: number | null;
  upper_threshold: number | null;
  visible: boolean;
}
export interface SensorDetailsData {
  id: string;
  name: string;
  location: string;
  group: string;
  group_id: number | null;
  coalition_id: number | null;
  coalition: string;
  asset: string;
  mac_address: string;
  ap_mac_address: string;
  ssid: string;
  product: string;
  in_maintenance: string | null;
  filter_inactive_sensors: boolean;
  open_alarms: number;
  code_version: string;
  upload_period: number;
  sampling_period: number;
  last_seen: string;
  last_data: string;
  signal_rssi: number;
  battery_voltage: number;
  battery_charging_status: "0" | "1" | "2";
  alarm_profile: {
    id: string;
    name: string;
  };
  probe: {
    id: number;
    internal_code: string;
    name: string;
  };
  nist: string | null;
  data_t1: Measurement;
  data_t2: Measurement;
  data_t3: Measurement;
  data_t4: Measurement;
  data_t5: Measurement;
  data_t6: Measurement;
  data_t7: Measurement;
  data_t8: Measurement;
  data_t9: Measurement;
  data_t10: Measurement;
  data_t11: Measurement;
  data_t12: Measurement;
  data_t13: Measurement;
  data_t14: Measurement;
  data_t15: Measurement;
  data_t16: Measurement;
  data_t17: Measurement;
  data_t18: Measurement;
  data_t19: Measurement;
  data_t20: Measurement;
  data_t21: Measurement;
  data_t22: Measurement;
  data_t23: Measurement;
  data_t24: Measurement;
  data_t25: Measurement;
}

export default function SensorDetails({
  sx,
  sensorId,
  canGoBack,
  setFetchedSensor,
}: SensorDetailsProps) {
  const router = useRouter();
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);

  const { data: sensor, isLoading } = useQuery({
    queryKey: ["sensor", sensorId],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL(
          `sensors/details?sensor_id=${sensorId}`,
          `sensors/details/${sensorId}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sensor data");
      }
      return response.json() as Promise<SensorDetailsData>;
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(
        apiURL("sensors/maintenance", "sensors/details/set_maintenance"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sensor_id: sensorId,
            maintenance_interval: selectedMaintenanceInterval,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to set maintenance mode");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.msg || "Maintenance mode set successfully",
      });
      setTimeout(() => {
        setMaintenanceDialogOpen(false);
      }, 1000);
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to set maintenance mode",
      });
    },
  });

  useEffect(() => {
    if (sensor) {
      setFetchedSensor(sensor);
    }
  }, [sensor]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [selectedMaintenanceInterval, setSelectedMaintenanceInterval] =
    useState<number>(0);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowArrows(scrollWidth > clientWidth);
      }
    };

    // Check initially
    checkScroll();

    // Add resize listener
    window.addEventListener("resize", checkScroll);

    // Cleanup
    return () => window.removeEventListener("resize", checkScroll);
  }, [sensor]); // Re-check when sensor data changes

  if (isLoading) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sensor) {
    return (
      <Box sx={styles.errorContainer}>
        <Typography variant="h6" color="error">
          Sensor not found
        </Typography>
      </Box>
    );
  }

  const maintenanceDialog = () => {
    return (
      <Dialog
        open={maintenanceDialogOpen}
        onClose={() => setMaintenanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Maintenance Mode</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select maintenance interval for sensor: {sensor?.name}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedMaintenanceInterval}
              onChange={(e) =>
                setSelectedMaintenanceInterval(Number(e.target.value))
              }
            >
              <FormControlLabel
                value={0}
                control={<Radio />}
                label="No Maintenance (Turn off maintenance mode)"
              />
              <FormControlLabel value={60} control={<Radio />} label="1 Hour" />
              <FormControlLabel
                value={120}
                control={<Radio />}
                label="2 Hours"
              />
              <FormControlLabel
                value={180}
                control={<Radio />}
                label="3 Hours"
              />
              <FormControlLabel
                value={360}
                control={<Radio />}
                label="6 Hours"
              />
              <FormControlLabel
                value={720}
                control={<Radio />}
                label="12 Hours"
              />
              <FormControlLabel
                value={1440}
                control={<Radio />}
                label="24 Hours"
              />
              <FormControlLabel
                value={2880}
                control={<Radio />}
                label="48 Hours"
              />
              <FormControlLabel
                value={2000000}
                control={<Radio />}
                label="Permanent"
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMaintenanceDialogOpen(false)}
            sx={{ ...styles.button, color: "black" }}
          >
            CANCEL
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={maintenanceMutation.isPending}
            onClick={() => maintenanceMutation.mutate()}
            sx={styles.button}
          >
            {maintenanceMutation.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "SAVE"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const detailsCard = (
    label: string,
    value: string,
    color?: string,
    action?: () => void
  ) => {
    return (
      <Box
        sx={{
          ...styles.detailsContainer,
          backgroundColor: color || CARD_BACKGROUND,
          cursor: action ? "pointer" : "default",
        }}
        onClick={action ? action : () => {}}
      >
        <Typography sx={styles.detailsLabel}>{label}:</Typography>
        <Typography sx={styles.detailsValue}>{value}</Typography>
        {action && (
          <Edit
            sx={{
              marginLeft: "10px",
              fontSize: "16px",
              color: "text.secondary",
            }}
          />
        )}
      </Box>
    );
  };

  const lastSeenInterval = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffTime = Math.abs(now.getTime() - lastSeenDate.getTime());
    const diffSeconds = Math.floor(diffTime / 1000);
    return diffSeconds;
  };

  const sensorNameCell = (sensor: SensorDetailsData) => {
    const maintenanceStatus = getMaintenanceStatus(sensor.in_maintenance);
    return (
      <Box sx={styles.sensorNameCell}>
        <Box
          sx={styles.sensorIndicator(
            maintenanceStatus?.isActive || false,
            (sensor.open_alarms || 0) > 0,
            sensor.filter_inactive_sensors === true
          )}
        >
          <img
            src={
              sensorIcon(
                (sensor.probe?.internal_code as SensorInternalCode) ||
                  "X_NO_PROBE"
              ).src
            }
            style={{ width: "80%", height: "80%", objectFit: "contain" }}
          />
        </Box>
        <Box style={{ marginLeft: "10px" }}>
          <Box sx={styles.sensorNameContainer}>
            <Typography sx={styles.sensorNameLabel}>Name:</Typography>
            <Typography sx={styles.sensorNameText}>{sensor.name}</Typography>
            <IconButton
              onClick={() => {
                console.log("Edit");
              }}
            >
              <Edit />
            </IconButton>
          </Box>
          <Box sx={styles.sensorNameContainer}>
            <Typography sx={styles.sensorCoalitionLabel}>Asset:</Typography>
            <Typography sx={styles.sensorCoalitionText}>
              {sensor.asset}
            </Typography>
            <Typography
              sx={{ ...styles.sensorCoalitionLabel, marginLeft: "20px" }}
            >
              Location:
            </Typography>
            <Typography sx={styles.sensorCoalitionText}>
              {sensor.location}
            </Typography>
          </Box>
          <Box sx={styles.sensorNameContainer}>
            <Typography sx={styles.sensorCoalitionLabel}>Group:</Typography>
            <Typography sx={styles.sensorCoalitionText}>
              {sensor.group}
            </Typography>
            <Typography
              sx={{ ...styles.sensorCoalitionLabel, marginLeft: "20px" }}
            >
              Coalition:
            </Typography>
            <Typography sx={styles.sensorCoalitionText}>
              {sensor.coalition}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Box sx={styles.cardsContainer}>
            {detailsCard("ID", sensor.id)}
            {detailsCard("MAC", sensor.mac_address)}
            {detailsCard("AP MAC", sensor.ap_mac_address)}
            {detailsCard("SSID", sensor.ssid)}
            {detailsCard("Product Number", sensor.product)}
            {detailsCard("Code Version", sensor.code_version)}
            {detailsCard("Upload Period", sensor.upload_period + "s")}
            {detailsCard("Sampling", sensor.sampling_period + "s")}
            {detailsCard(
              "Alarm profile",
              sensor.alarm_profile.id ? sensor.alarm_profile.name : "None"
            )}
            {detailsCard("NIST", sensor.nist || "N/A")}
            {detailsCard(
              "In Maintenance",
              maintenanceStatus?.isActive ? "Yes" : "No",
              undefined,
              () => {
                setMaintenanceDialogOpen(true);
              }
            )}
          </Box>
          <Box sx={{ ...styles.cardsContainer, marginTop: "10px" }}>
            {detailsCard(
              "Last Seen",
              formatReadingDate(sensor.last_seen),
              lastSeenInterval(sensor.last_seen) < sensor.upload_period
                ? `${GREEN}80`
                : `${RED}80`
            )}
            {detailsCard("Last Data", formatReadingDate(sensor.last_data))}
            {detailsCard(
              "Link Quality",
              `${sensor.signal_rssi} dBm`,
              signalColor(sensor.signal_rssi)
            )}
            {detailsCard(
              "Battery",
              sensor.battery_voltage.toFixed(2) +
                "V" +
                (sensor.battery_charging_status !== "0" ? " (Charging)" : ""),
              `${DARK_ORANGE}80`
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const measurementCard = (
    measurement: Measurement,
    hasAlarmProfile: boolean
  ) => {
    return (
      <Box sx={styles.measurementCard}>
        <Typography sx={styles.measurementName}>{measurement.name}</Typography>
        <Box sx={styles.measurementValueContainer}>
          <Typography sx={styles.measurementValue}>
            {measurement.value.toFixed(2)}
          </Typography>
          <Typography sx={styles.measurementUnit}>
            {readableUnit(measurement.unit)}
          </Typography>
        </Box>

        <Box sx={styles.measurementThresholdsContainer}>
          {hasAlarmProfile && (
            <Box
              sx={{
                ...styles.measurementThresholdValueContainer,
                marginRight: "20px",
              }}
            >
              <ArrowCircleDown sx={{ color: BLUE, marginRight: "5px" }} />
              <Typography sx={styles.measurementLowerThreshold}>
                {measurement.lower_threshold?.toFixed(2)}
              </Typography>
            </Box>
          )}
          {hasAlarmProfile && (
            <Box sx={styles.measurementThresholdValueContainer}>
              <ArrowCircleUp sx={{ color: RED, marginRight: "5px" }} />
              <Typography sx={styles.measurementUpperThreshold}>
                {measurement.upper_threshold?.toFixed(2)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const arrowButton = (direction: "left" | "right") => {
    return (
      <IconButton
        sx={{
          bgcolor: "white",
          boxShadow: 1,
          "&:hover": { bgcolor: SELECTED_COLOR },
          borderRadius: "22px",
          width: "44px",
          height: "44px",
          marginRight: direction === "left" ? "10px" : "0px",
          marginLeft: direction === "right" ? "10px" : "0px",
        }}
        onClick={() => {
          const container = document.getElementById("measurements-scroll");
          if (container) {
            container.scrollLeft += direction === "left" ? -300 : 300;
          }
        }}
      >
        {direction === "left" ? <ArrowBack /> : <ArrowForward />}
      </IconButton>
    );
  };

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box sx={styles.header}>
        {canGoBack && (
          <Box sx={styles.goBackContainer}>
            <Button
              variant="text"
              color="primary"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowBack sx={{ color: "black" }} />
            </Button>
          </Box>
        )}
        {sensorNameCell(sensor)}
      </Box>
      {/* scroll container */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          marginTop: "20px",
          marginBottom: "15px",
          alignItems: "center",
        }}
      >
        {showArrows && arrowButton("left")}
        <Box
          ref={scrollContainerRef}
          id="measurements-scroll"
          sx={{
            display: "flex",
            overflowX: "auto",
            scrollBehavior: "smooth",
            gap: 2,
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            marginLeft: showArrows === false ? "55px" : "0px",
          }}
        >
          {Object.entries(sensor)
            .filter(([key]) => key.startsWith("data_t"))
            .filter(([_, measurement]) => measurement.visible)
            .sort(([aKey], [bKey]) => {
              const aNum = parseInt(aKey.replace("data_t", ""), 10) || 0;
              const bNum = parseInt(bKey.replace("data_t", ""), 10) || 0;
              return aNum - bNum;
            })
            .map(([_, measurement]) => (
              <Box key={measurement.name} sx={{ flexShrink: 0 }}>
                {measurementCard(
                  measurement,
                  sensor.alarm_profile.id !== null &&
                    sensor.alarm_profile.id !== undefined
                )}
              </Box>
            ))}
        </Box>
        {showArrows && arrowButton("right")}
      </Box>
      {maintenanceDialog()}
      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </Box>
  );
}
