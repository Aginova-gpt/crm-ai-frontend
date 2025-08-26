import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  FormControlLabel,
} from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { styles } from "./SensorGraph.styles";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import { dateForGraph, readableUnit } from "@/utils/helpers";
import { BLUE, RED } from "@/styles/colors";
import { t_name } from "@/utils/sensorHelpers";
import { AlarmObject } from "@/components/Alarms/Alarms";

interface SensorData {
  id: string;
  upload_period: number;
}

interface SensorGraphProps {
  sx?: SxProps<Theme>;
  sensor: SensorData;
  showControls?: boolean;
  selectedProbe?: t_name;
  alarm?: AlarmObject;
  heightFactor?: number;
}

interface GraphMeasurement {
  value: number | null;
  timestamp_raw: number;
}

interface ProbeGraphData {
  visible: boolean;
  unit: string;
  name: string;
  upper_threshold?: number | null;
  lower_threshold?: number | null;
  data: GraphMeasurement[];
}

const PROBE_COLORS: Record<t_name, string> = {
  t1: "#9467bd", // purple
  t2: "#ff7f0e", // orange
  t3: "#e377c2", // pink
  t4: "#8c564b", // brown
  t5: "#7f7f7f", // gray
  t6: "#bcbd22", // olive
  t7: "#17becf", // cyan
  t8: "#aec7e8", // light blue
  t9: "#ffbb78", // light orange
  t10: "#c5b0d5", // light purple
  t11: "#c49c94", // light brown
  t12: "#f7b6d2", // light pink
  t13: "#c7c7c7", // light gray
  t14: "#dbdb8d", // light olive
  t15: "#9edae5", // light cyan
  t16: "#393b79", // dark blue
  t17: "#8c6d31", // dark orange
  t18: "#843c39", // dark red
  t19: "#7b4173", // dark purple
  t20: "#8c6d31", // dark orange
  t21: "#7b4173", // dark purple
  t22: "#8c6d31", // dark orange
  t23: "#7b4173", // dark purple
  t24: "#8c6d31", // dark orange
  t25: "#7b4173", // dark purple
};

type SensorGraphData = {
  [key in t_name]: ProbeGraphData;
};

type DateRange = "10m" | "1h" | "1d" | "1w" | "1m";

type Annotation = {
  x: Date;
  label: string;
  color?: string;
};

export default function SensorGraph({
  sx,
  sensor,
  selectedProbe,
  showControls = true,
  heightFactor = 1,
  alarm,
}: SensorGraphProps) {
  const [selectedProbes, setSelectedProbes] = useState<t_name[]>(
    selectedProbe ? [selectedProbe] : []
  );
  const [dateRange, setDateRange] = useState<DateRange>("1h");
  const [showDatapoints, setShowDatapoints] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [xAxis, setXAxis] = useState<Date[]>([]);
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const {
    data: graphData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["graphData", sensor.id, dateRange],
    queryFn: async () => {
      let date_range: string = dateRange;
      if (alarm) {
        date_range = alarm.alarm_time;
      }

      const response = await fetchWithAuth(
        apiURL(
          `sensors/graph?sensor_id=${sensor.id}&date_range=${encodeURIComponent(
            date_range
          )}`,
          `sensors/graph/${sensor.id}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sensor data");
      }
      return response.json() as Promise<SensorGraphData>;
    },
  });

  // Function to remove duplicate entries based on timestamp_raw
  const removeDuplicates = (data: GraphMeasurement[]): GraphMeasurement[] => {
    const seen = new Set<number>();
    return data.filter((measurement) => {
      if (seen.has(measurement.timestamp_raw)) {
        return false;
      }
      seen.add(measurement.timestamp_raw);
      return true;
    });
  };

  // Function to detect gaps in data and insert null values
  const insertGapsInData = (
    data: GraphMeasurement[],
    uploadPeriodSeconds: number
  ) => {
    // Remove duplicates first
    const deduplicatedData = removeDuplicates(data);

    const result: (number | null)[] = [];
    const timestamps: number[] = [];

    for (let i = 0; i < deduplicatedData.length; i++) {
      if (i === 0) {
        result.push(deduplicatedData[i].value);
        timestamps.push(deduplicatedData[i].timestamp_raw);
        continue;
      }

      const timeDiff =
        (deduplicatedData[i].timestamp_raw -
          deduplicatedData[i - 1].timestamp_raw) /
        1000; // Convert to seconds

      if (timeDiff > uploadPeriodSeconds) {
        // Insert null to create a gap in the line
        result.push(null);
        timestamps.push(
          deduplicatedData[i - 1].timestamp_raw + uploadPeriodSeconds * 1000
        ); // Add gap timestamp
      }

      result.push(deduplicatedData[i].value);
      timestamps.push(deduplicatedData[i].timestamp_raw);
    }

    return { data: result, timestamps };
  };

  const visibleProbes = graphData
    ? (Object.entries(graphData) as [t_name, ProbeGraphData][])
        .filter(([_, data]) => data?.visible ?? false)
        .map(([key]) => key)
    : [];

  useEffect(() => {
    if (visibleProbes.length > 0 && selectedProbes.length === 0) {
      setSelectedProbes([visibleProbes[0]]);
    }
  }, [visibleProbes, selectedProbes.length]);

  useEffect(() => {
    // Get all unique timestamps including gaps
    if (graphData && selectedProbes.length > 0) {
      const allTimestampsWithGaps = selectedProbes
        .flatMap((probeKey) => {
          const originalData = graphData[probeKey].data;
          const { timestamps } = insertGapsInData(
            originalData,
            sensor.upload_period
          );
          return timestamps;
        })
        .filter((timestamp, index, self) => self.indexOf(timestamp) === index)
        .sort((a, b) => a - b);
      const values = allTimestampsWithGaps.map(
        (timestamp) => new Date(timestamp)
      );
      setXAxis(values);
    }
  }, [graphData, selectedProbes]);

  useEffect(() => {
    if (alarm && graphData && annotations.length === 0 && xAxis.length > 0) {
      if (xAxis.length > 0 && selectedProbes.length > 0) {
        const alarmDate = new Date(alarm.alarm_time);
        addAnnotation(alarmDate, "Alarm triggered");
      }
    }
  }, [graphData, xAxis]);

  const handleProbeChange = (event: SelectChangeEvent<t_name[]>) => {
    const value = event.target.value as t_name[];
    if (value.length === 0) {
      return;
    }
    setSelectedProbes(value);
  };

  const handleDateRangeChange = (event: SelectChangeEvent<DateRange>) => {
    setDateRange(event.target.value as DateRange);
  };

  const addAnnotation = (x: Date, label: string) => {
    const newAnnotation: Annotation = {
      x,
      label,
      color: "#EA3323",
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const bubbleForKey = (key: t_name) => {
    return (
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: PROBE_COLORS[key],
          ml: 1,
        }}
      />
    );
  };

  if (error) {
    return (
      <Box sx={styles.errorContainer}>
        <Typography variant="h6" color="error">
          {(error as any).msg || error.message}
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  const series = selectedProbes
    .map((probeKey) => {
      if (!graphData) {
        return [];
      }

      const originalData = graphData[probeKey].data;
      const { data: dataWithGaps, timestamps: gapTimestamps } =
        insertGapsInData(originalData, sensor.upload_period);
      const {
        upper_threshold = null,
        lower_threshold = null,
        unit,
      } = graphData[probeKey];

      // Create threshold series if thresholds exist
      const thresholdSeries = [];
      if (upper_threshold !== null && selectedProbes.length === 1) {
        thresholdSeries.push({
          data: Array(dataWithGaps.length).fill(upper_threshold),
          label: `${graphData[probeKey].name} Upper Threshold`,
          color: RED,
          curve: "linear" as const,
          yAxisKey: unit,
          showMark: false,
          dashArray: "5 5",
        });
      }
      if (lower_threshold !== null && selectedProbes.length === 1) {
        thresholdSeries.push({
          data: Array(dataWithGaps.length).fill(lower_threshold),
          label: `${graphData[probeKey].name} Lower Threshold`,
          color: BLUE,
          curve: "linear" as const,
          yAxisKey: unit,
          showMark: false,
          dashArray: "5 5",
        });
      }

      return [
        {
          data: dataWithGaps,
          label: graphData[probeKey].name,
          color: PROBE_COLORS[probeKey],
          showMark: showDatapoints,
          area: false,
          curve: "linear" as const,
          yAxisKey: unit,
        },
        ...thresholdSeries,
      ];
    })
    .flat();

  // Group series by unit
  const seriesByUnit = series.reduce((acc, series) => {
    const unit = series.yAxisKey;
    if (!acc[unit]) {
      acc[unit] = [];
    }
    acc[unit].push(series);
    return acc;
  }, {} as Record<string, typeof series>);

  // Calculate min and max values for each unit
  const yAxisConfigs = Object.entries(seriesByUnit).map(
    ([unit, unitSeries], index) => {
      const allValues = unitSeries
        .flatMap((s) => s.data)
        .filter((v) => v !== null) as number[];
      const dataMin = Math.min(...allValues);
      const dataMax = Math.max(...allValues);
      const range = dataMax - dataMin;
      const yMin = dataMin - range * 0.2;
      const yMax = dataMax + range * 0.2;

      return {
        id: unit,
        scaleType: "linear" as const,
        valueFormatter: (value: number) =>
          `${value.toFixed(1)}${readableUnit(unit)}`,
        min: yMin,
        max: yMax,
        position: index === 0 ? "left" : ("right" as "left" | "right"),
      };
    }
  );

  const alarmAnnotations = () => {
    return annotations.length > 0 ? (
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {annotations.map((annotation, index) => {
          // Calculate x position based on the annotation timestamp
          const annotationTime = annotation.x?.getTime() || 0;

          // Find the closest timestamp in xAxis
          let xIndex = -1;
          let minDiff = Infinity;

          for (let i = 0; i < xAxis.length; i++) {
            const diff = Math.abs(xAxis[i].getTime() - annotationTime);
            if (diff < minDiff) {
              minDiff = diff;
              xIndex = i;
            }
          }

          if (xIndex === -1) return null;

          let xPercent;

          // Find the two timestamps that bracket the annotation time
          let lowerIndex = -1;
          let upperIndex = -1;

          for (let i = 0; i < xAxis.length - 1; i++) {
            if (
              xAxis[i].getTime() <= annotationTime &&
              xAxis[i + 1].getTime() >= annotationTime
            ) {
              lowerIndex = i;
              upperIndex = i + 1;
              break;
            }
          }

          if (lowerIndex === -1) {
            // Annotation is outside the range, use the closest endpoint
            xPercent = annotationTime <= xAxis[0].getTime() ? 0 : 100;
          } else {
            // Linear interpolation between the two bracketing timestamps
            const lowerTime = xAxis[lowerIndex].getTime();
            const upperTime = xAxis[upperIndex].getTime();
            const ratio =
              (annotationTime - lowerTime) / (upperTime - lowerTime);

            // Calculate position based on actual data range, not full graph width
            const dataStartTime = xAxis[0].getTime();
            const dataEndTime = xAxis[xAxis.length - 1].getTime();

            // Use the chart's actual data positioning
            // The chart positions data points based on their index in the array
            const dataPosition = lowerIndex + ratio;

            // For X-Charts, we need to account for the chart's internal coordinate system
            // The SVG overlay might not align directly with the data positioning
            const chartPadding = 0.4;
            const adjustedPosition =
              (dataPosition / (xAxis.length - 1)) * (1 - 2 * chartPadding) +
              chartPadding;
            xPercent = adjustedPosition * 100;

            // Debug: Log the positioning details
            console.log(
              `Data range: ${new Date(
                dataStartTime
              ).toLocaleTimeString()} - ${new Date(
                dataEndTime
              ).toLocaleTimeString()}`
            );
            console.log(
              `Annotation time: ${new Date(
                annotationTime
              ).toLocaleTimeString()}`
            );
            console.log(
              `Data position: ${dataPosition}/${
                xAxis.length - 1
              } = ${xPercent}%`
            );
            console.log(
              `Lower index: ${lowerIndex}, Upper index: ${upperIndex}, Ratio: ${ratio}`
            );
          }

          return (
            <g key={index}>
              {/* Vertical line */}
              <line
                x1={`${xPercent}%`}
                y1="0%"
                x2={`${xPercent}%`}
                y2="100%"
                stroke={annotation.color || "#ff6b6b"}
                strokeWidth="2"
                opacity="1"
              />
              {/* Label background */}
              <rect
                x={`${xPercent}%`}
                y="10"
                width="130"
                height="24"
                fill={annotation.color || "#ff6b6b"}
                rx="4"
              />
              {/* Label text */}
              <text x={`${xPercent + 0.5}%`} y="27" fill="white" fontSize="16">
                {annotation.label}
              </text>
            </g>
          );
        })}
      </svg>
    ) : null;
  };

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      {showControls && (
        <Box sx={{ display: "flex", gap: 2, mt: 2, alignItems: "center" }}>
          <FormControl
            sx={{
              display: "inline-flex",
              marginLeft: "20px",
              "& .MuiInputLabel-root": {
                backgroundColor: "white",
                padding: "0 4px",
                marginLeft: "-4px",
                transform: "translate(14px, -9px) scale(0.75)",
                "&.Mui-focused": {
                  transform: "translate(14px, -9px) scale(0.75)",
                },
              },
            }}
          >
            <InputLabel id="probe-select-label" sx={{ fontSize: "14px" }}>
              Select Probes
            </InputLabel>
            <Select
              labelId="probe-select-label"
              multiple
              value={selectedProbes}
              onChange={handleProbeChange}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {selected.map((key, index) => (
                    <Box
                      key={key}
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      {graphData?.[key]?.name}
                      {bubbleForKey(key)}
                      {index < selected.length - 1 && ", "}
                    </Box>
                  ))}
                </Box>
              )}
              sx={{
                height: "40px",
                width: "fit-content",
              }}
            >
              {visibleProbes.map((probeKey) => (
                <MenuItem key={probeKey} value={probeKey}>
                  <Checkbox checked={selectedProbes.indexOf(probeKey) > -1} />
                  <ListItemText primary={graphData?.[probeKey]?.name} />
                  {bubbleForKey(probeKey)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            sx={{
              display: "inline-flex",
              "& .MuiInputLabel-root": {
                backgroundColor: "white",
                padding: "0 4px",
                marginLeft: "-4px",
                transform: "translate(14px, -9px) scale(0.75)",
                "&.Mui-focused": {
                  transform: "translate(14px, -9px) scale(0.75)",
                },
              },
            }}
          >
            <InputLabel id="date-range-label" sx={{ fontSize: "14px" }}>
              Date Range
            </InputLabel>
            <Select
              labelId="date-range-label"
              value={dateRange}
              onChange={handleDateRangeChange}
              sx={{
                height: "40px",
                width: "fit-content",
              }}
            >
              <MenuItem value="15m">15 minutes</MenuItem>
              <MenuItem value="1h">1 hour</MenuItem>
              <MenuItem value="6h">6 hours</MenuItem>
              <MenuItem value="12h">12 hours</MenuItem>
              <MenuItem value="1d">1 day</MenuItem>
              <MenuItem value="3d">3 days</MenuItem>
              <MenuItem value="1w">1 week</MenuItem>
              <MenuItem value="1m">1 month</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={showDatapoints}
                onChange={(e) => setShowDatapoints(e.target.checked)}
              />
            }
            label="Datapoints"
            sx={{ ml: 1 }}
          />
        </Box>
      )}

      <Box
        sx={{
          width: "100%",
          height: `${450 * heightFactor}px`,
          position: "relative",
        }}
      >
        <LineChart
          series={xAxis.length > 0 ? series : []}
          xAxis={[
            {
              data: xAxis,
              scaleType: "time",
              valueFormatter: (date) => dateForGraph(date),
            },
          ]}
          yAxis={yAxisConfigs}
          height={450 * heightFactor}
          margin={{ bottom: 0 }}
          grid={{ horizontal: true }}
          slotProps={{
            axisLabel: {
              lineHeight: 1.2,
            },
            legend: {
              sx: {
                display: "none",
              },
            },
          }}
        />

        {alarmAnnotations()}
      </Box>
    </Box>
  );
}
