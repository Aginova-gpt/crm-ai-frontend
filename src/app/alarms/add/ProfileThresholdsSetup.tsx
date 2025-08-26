import {
  Box,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Checkbox,
  InputAdornment,
} from "@mui/material";
import {
  ThresholdSettingsObject,
  useAlarmProfileContext,
} from "@/contexts/AlarmProfileContext";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import {
  Measurement,
  SensorDetailsData,
} from "@/components/SensorDetails/SensorDetails";
import { readableUnit } from "@/utils/helpers";
import { styles } from "./styles";
import { useEffect, useState } from "react";

const ThresholdBox = ({
  measurement,
  measurementKey,
  settings,
  setSettings,
}: {
  measurement: Measurement;
  measurementKey: string;
  settings: ThresholdSettingsObject;
  setSettings: (settings: ThresholdSettingsObject) => void;
}) => {
  const [lowerThreshold, setLowerThreshold] = useState(
    settings[measurementKey as keyof ThresholdSettingsObject].lower_threshold
  );
  const [upperThreshold, setUpperThreshold] = useState(
    settings[measurementKey as keyof ThresholdSettingsObject].upper_threshold
  );

  return (
    <Box sx={styles.thresholdBox}>
      <Typography style={{ fontSize: "16px", fontWeight: "bold" }}>
        {measurement.name || measurementKey}
      </Typography>
      <Box sx={styles.thresholdBoxContent}>
        {/* Lower Limit Row */}
        <Box sx={styles.thresholdRow}>
          <Checkbox
            checked={lowerThreshold !== null}
            onChange={(e) => {
              const selected = e.target.checked;
              let newLowerThreshold = null;
              if (selected === true) {
                setLowerThreshold(0);
                newLowerThreshold = 0;
              } else {
                setLowerThreshold(null);
                newLowerThreshold = null;
              }

              setSettings({
                ...settings,
                [measurementKey]: {
                  ...settings[measurementKey as keyof ThresholdSettingsObject],
                  lower_threshold: newLowerThreshold,
                },
              });
            }}
          />
          <Typography style={styles.thresholdLabel}>Lower Limit</Typography>
          <TextField
            value={lowerThreshold || ""}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              setLowerThreshold(newValue);
              setSettings({
                ...settings,
                [measurementKey as keyof ThresholdSettingsObject]: {
                  ...settings[measurementKey as keyof ThresholdSettingsObject],
                  lower_threshold: newValue,
                },
              });
            }}
            type="number"
            size="small"
            placeholder="0.00"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {readableUnit(measurement.unit) || ""}
                </InputAdornment>
              ),
            }}
            sx={styles.thresholdInput}
          />
        </Box>

        {/* Upper Limit Row */}
        <Box sx={styles.thresholdRow}>
          <Checkbox
            checked={upperThreshold !== null}
            onChange={(e) => {
              const selected = e.target.checked;
              let newUpperThreshold = null;
              if (selected === true) {
                setUpperThreshold(0);
                newUpperThreshold = 0;
              } else {
                setUpperThreshold(null);
                newUpperThreshold = null;
              }
              setSettings({
                ...settings,
                [measurementKey as keyof ThresholdSettingsObject]: {
                  ...settings[measurementKey as keyof ThresholdSettingsObject],
                  upper_threshold: newUpperThreshold,
                },
              });
            }}
          />
          <Typography style={styles.thresholdLabel}>Upper Limit</Typography>
          <TextField
            value={upperThreshold || ""}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              setUpperThreshold(newValue);
              setSettings({
                ...settings,
                [measurementKey as keyof ThresholdSettingsObject]: {
                  ...settings[measurementKey as keyof ThresholdSettingsObject],
                  upper_threshold: newValue,
                },
              });
            }}
            type="number"
            size="small"
            placeholder="0.00"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {readableUnit(measurement.unit) || ""}
                </InputAdornment>
              ),
            }}
            sx={styles.thresholdInput}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default function ProfileThresholdsSetup({
  settings,
  setSettings,
}: {
  settings: ThresholdSettingsObject;
  setSettings: (settings: ThresholdSettingsObject) => void;
}) {
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const { assignedSensors, setGroup, setCoalition } = useAlarmProfileContext();

  const { data: sensor, isLoading } = useQuery({
    queryKey: ["sensor", assignedSensors[0].sensor_id],
    // queryKey: ["sensor", 1],
    queryFn: async () => {
      const sensorId = assignedSensors[0].sensor_id;
      // const sensorId = 1;
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

  useEffect(() => {
    if (sensor?.group_id && sensor?.coalition_id) {
      setGroup({ id: sensor.group_id.toString(), name: sensor.group });
      setCoalition({
        id: sensor.coalition_id.toString(),
        name: sensor.coalition,
        groups: [],
      });
    }
  }, [sensor]);

  // Extract visible measurements from sensor data with their keys
  const getVisibleMeasurements = (
    sensorData: SensorDetailsData
  ): Array<{ key: string; measurement: Measurement }> => {
    const measurements: Array<{ key: string; measurement: Measurement }> = [];

    // Check data_t1 through data_t25 for visible measurements
    for (let i = 1; i <= 25; i++) {
      const measurementKey = `data_t${i}` as keyof SensorDetailsData;
      const measurement = sensorData[measurementKey] as Measurement;

      if (measurement && measurement.visible) {
        measurements.push({
          key: measurementKey,
          measurement: measurement,
        });
      }
    }

    return measurements.slice(0, 6);
  };

  return (
    <Box sx={styles.mainContainer}>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          {sensor && (
            <>
              <Box sx={styles.measurementsContainer}>
                {getVisibleMeasurements(sensor).map(({ key, measurement }) => (
                  <ThresholdBox
                    key={key}
                    measurement={measurement}
                    measurementKey={key}
                    settings={settings}
                    setSettings={setSettings}
                  />
                ))}
              </Box>

              {getVisibleMeasurements(sensor).length === 0 && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ marginTop: "24px" }}
                >
                  No visible measurements found for this sensor.
                </Typography>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
