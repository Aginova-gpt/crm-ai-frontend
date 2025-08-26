"use client";
import BackgroundBox from "@/components/BackgroundBox";
import Navbar from "@/components/Navbar";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  IconButton,
  Switch,
  Select,
  MenuItem,
  FormControl,
  AlertColor,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import { BACKGROUND, GREY, SECONDARY } from "@/styles/colors";
import { styles } from "./styles";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowBack, Edit } from "@mui/icons-material";
import { AlarmProfileType } from "@/components/AlarmProfiles/AlarmProfiles";
import { useState, useEffect } from "react";
import SnackView from "@/components/SnackView";
import {
  ProfileSettingsObject,
  ThresholdSettingsObject,
  useAlarmProfileContext,
} from "@/contexts/AlarmProfileContext";
import SensorsSelector from "@/components/SensorsSelector/SensorsSelector";
import ProfileThresholdStep from "@/app/alarms/add/ProfileThresholdStep";
import ProfileBatteryStep from "@/app/alarms/add/ProfileBatteryStep";
import ProfileConnectivityStep from "@/app/alarms/add/ProfileConnectivityStep";
import ProfileNotReadingStep from "@/app/alarms/add/ProfileNotReadingStep";

const settingsConfig = [
  {
    key: "enabled" as keyof ProfileSettingsObject,
    title: "Enable Profile",
    type: "boolean" as const,
  },
  {
    key: "delay_before_repeating" as keyof ProfileSettingsObject,
    title: "Alarm Repeating",
    type: "select" as const,
    options: [
      { value: -1, label: "Never" },
      { value: 0, label: "Immediately" },
      { value: 10, label: "Every 10 minutes" },
      { value: 15, label: "Every 15 minutes" },
      { value: 20, label: "Every 20 minutes" },
      { value: 25, label: "Every 25 minutes" },
      { value: 30, label: "Every 30 minutes" },
    ],
  },
  {
    key: "recovery_time" as keyof ProfileSettingsObject,
    title: "Recovery Time",
    type: "select" as const,
    options: [
      { value: 0, label: "0 minutes" },
      { value: 1, label: "1 minute" },
      { value: 2, label: "2 minutes" },
      { value: 3, label: "3 minutes" },
      { value: 5, label: "5 minutes" },
      { value: 10, label: "10 minutes" },
      { value: 15, label: "15 minutes" },
      { value: 20, label: "20 minutes" },
      { value: 25, label: "25 minutes" },
      { value: 30, label: "30 minutes" },
      { value: 60, label: "60 minutes" },
    ],
  },
  {
    key: "send_acknowledgment" as keyof ProfileSettingsObject,
    title: "Send Acknowledgment",
    type: "boolean" as const,
  },
  {
    key: "automatically_close" as keyof ProfileSettingsObject,
    title: "Automatically Close",
    type: "boolean" as const,
  },
] as const;

export default function AlarmProfilePage() {
  const params = useParams();
  const alarmProfileId = params.id as string;
  const router = useRouter();
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const [selectedType, setSelectedType] = useState(0);
  const [isEditingSensors, setIsEditingSensors] = useState(false);
  const {
    resetProgress,
    settings,
    setSettings,
    thereAreGeneralChangesComparedTo,
    setProfileName,
    assignedSensors,
    setAssignedSensors,
    setThresholdSettings,
    setBatterySettings,
    setConnectivitySettings,
    setNotReadingSettings,
    alarmProfileSettingsBody,
    setEditingProfile,
  } = useAlarmProfileContext();
  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);
  const [alarmDataWasFilled, setAlarmDataWasFilled] = useState(false);

  const {
    data: alarmProfile,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["alarm-profile", alarmProfileId],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL(
          `alarm_profiles/details?profile_id=${alarmProfileId}`,
          `alarm_profiles/details/${alarmProfileId}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sensor data");
      }
      return response.json() as Promise<AlarmProfileType>;
    },
  });

  const editProfileSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(
        apiURL(
          `alarm_profiles/edit_general_settings?profile_id=${alarmProfileId}`,
          `alarm_profiles/edit_general_settings/${alarmProfileId}`
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...alarmProfileSettingsBody(),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to edit alarm profile");
      }
      return data;
    },
    onSuccess: (data) => {
      refetch();
      setSnackMessage({
        type: "success",
        message: data.message || "Alarm profile edited successfully",
      });
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to edit alarm profile",
      });
    },
  });

  const editProfileSensorsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(
        apiURL(
          `alarm_profiles/edit_sensors?profile_id=${alarmProfileId}`,
          `alarm_profiles/edit_sensors/${alarmProfileId}`
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sensor_ids: assignedSensors.map((s) => s.sensor_id),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to edit alarm profile sensors");
      }
      return data;
    },
    onSuccess: (data) => {
      refetch();
      setSnackMessage({
        type: "success",
        message: data.message || "Alarm profile sensors edited successfully",
      });
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to edit alarm profile sensors",
      });
    },
  });

  useEffect(() => {
    setEditingProfile(Number(alarmProfileId));
    resetProgress();
  }, []);

  useEffect(() => {
    if (alarmProfile) {
      // compute common escalations - this will change from 4 to 16
      const escalations = alarmProfile.escalations.filter(
        (escalation) => escalation !== null
      );
      const escalation_1 = escalations.find(
        (escalation) => escalation.level === 1
      ) || {
        is_active: false,
        level: 1,
        delay_before_sending: 0,
        targets: [],
      };
      const escalation_2 = escalations.find(
        (escalation) => escalation.level === 2
      ) || {
        is_active: false,
        level: 2,
        delay_before_sending: 0,
        targets: [],
      };
      const escalation_3 = escalations.find(
        (escalation) => escalation.level === 3
      ) || {
        is_active: false,
        level: 3,
        delay_before_sending: 0,
        targets: [],
      };
      const escalation_4 = escalations.find(
        (escalation) => escalation.level === 4
      ) || {
        is_active: false,
        level: 4,
        delay_before_sending: 0,
        targets: [],
      };

      // set general settings
      setProfileName(alarmProfile.name);
      setSettings({
        enabled:
          alarmProfile.enabled !== undefined ? alarmProfile.enabled : false,
        delay_before_repeating:
          alarmProfile.delay_before_repeating !== undefined
            ? alarmProfile.delay_before_repeating
            : -1,
        send_acknowledgment:
          alarmProfile.send_acknowledgment !== undefined
            ? alarmProfile.send_acknowledgment
            : false,
        recovery_time:
          alarmProfile.recovery_time !== undefined
            ? alarmProfile.recovery_time
            : 0,
        automatically_close:
          alarmProfile.automatically_close !== undefined
            ? alarmProfile.automatically_close
            : false,
      });

      // set assigned sensors
      setAssignedSensors(
        alarmProfile.sensors.map((sensor) => ({
          sensor_id: sensor.sensor_id,
          sensor_name: sensor.sensor_name,
          sensor_type: sensor.sensor_type,
          coalition_name: "",
          group_name: "",
          location_name: "",
          alarm_profile: {
            id: alarmProfile.id,
            name: alarmProfile.name,
          },
        }))
      );

      // set threshold settings
      const commonEscalations = {
        escalation_1: escalation_1,
        escalation_2: escalation_2,
        escalation_3: escalation_3,
        escalation_4: escalation_4,
      };
      setBatterySettings({
        minimum_battery_level: alarmProfile.thresholds.lowbattery,
        ...commonEscalations,
      });
      setConnectivitySettings({
        maximum_offline_time: alarmProfile.thresholds.connectivity,
        ...commonEscalations,
      });
      setNotReadingSettings({
        maximum_downtime: alarmProfile.thresholds.notreadingdata,
        ...commonEscalations,
      });
      let thresholdSettings: ThresholdSettingsObject = {
        data_t1: {
          upper_threshold: alarmProfile.thresholds?.data["1"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["1"]?.lower || null,
        },
        data_t2: {
          upper_threshold: alarmProfile.thresholds?.data["2"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["2"]?.lower || null,
        },
        data_t3: {
          upper_threshold: alarmProfile.thresholds?.data["3"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["3"]?.lower || null,
        },
        data_t4: {
          upper_threshold: alarmProfile.thresholds?.data["4"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["4"]?.lower || null,
        },
        data_t5: {
          upper_threshold: alarmProfile.thresholds?.data["5"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["5"]?.lower || null,
        },
        data_t6: {
          upper_threshold: alarmProfile.thresholds?.data["6"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["6"]?.lower || null,
        },
        data_t7: {
          upper_threshold: alarmProfile.thresholds?.data["7"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["7"]?.lower || null,
        },
        data_t8: {
          upper_threshold: alarmProfile.thresholds?.data["8"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["8"]?.lower || null,
        },
        data_t9: {
          upper_threshold: alarmProfile.thresholds?.data["9"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["9"]?.lower || null,
        },
        data_t10: {
          upper_threshold: alarmProfile.thresholds?.data["10"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["10"]?.lower || null,
        },
        data_t11: {
          upper_threshold: alarmProfile.thresholds?.data["11"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["11"]?.lower || null,
        },
        data_t12: {
          upper_threshold: alarmProfile.thresholds?.data["12"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["12"]?.lower || null,
        },
        data_t13: {
          upper_threshold: alarmProfile.thresholds?.data["13"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["13"]?.lower || null,
        },
        data_t14: {
          upper_threshold: alarmProfile.thresholds?.data["14"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["14"]?.lower || null,
        },
        data_t15: {
          upper_threshold: alarmProfile.thresholds?.data["15"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["15"]?.lower || null,
        },
        data_t16: {
          upper_threshold: alarmProfile.thresholds?.data["16"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["16"]?.lower || null,
        },
        data_t17: {
          upper_threshold: alarmProfile.thresholds?.data["17"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["17"]?.lower || null,
        },
        data_t18: {
          upper_threshold: alarmProfile.thresholds?.data["18"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["18"]?.lower || null,
        },
        data_t19: {
          upper_threshold: alarmProfile.thresholds?.data["19"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["19"]?.lower || null,
        },
        data_t20: {
          upper_threshold: alarmProfile.thresholds?.data["20"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["20"]?.lower || null,
        },
        data_t21: {
          upper_threshold: alarmProfile.thresholds?.data["21"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["21"]?.lower || null,
        },
        data_t22: {
          upper_threshold: alarmProfile.thresholds?.data["22"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["22"]?.lower || null,
        },
        data_t23: {
          upper_threshold: alarmProfile.thresholds?.data["23"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["23"]?.lower || null,
        },
        data_t24: {
          upper_threshold: alarmProfile.thresholds?.data["24"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["24"]?.lower || null,
        },
        data_t25: {
          upper_threshold: alarmProfile.thresholds?.data["25"]?.upper || null,
          lower_threshold: alarmProfile.thresholds?.data["25"]?.lower || null,
        },
      };
      setThresholdSettings({
        settings: thresholdSettings,
        ...commonEscalations,
      });
      setAlarmDataWasFilled(true);
    }
  }, [alarmProfile]);

  const handleSettingChange = (
    key: keyof ProfileSettingsObject,
    value: any
  ) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const alarmProfileNameCell = () => {
    if (!alarmProfile) return null;

    return (
      <Box sx={styles.sensorNameCell}>
        <Box
          sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {/* Profile Name */}
            <Box sx={styles.sensorNameContainer}>
              <Typography sx={styles.sensorNameLabel}>Profile Name:</Typography>
              <Typography sx={styles.sensorNameText}>
                {alarmProfile.name}
              </Typography>
              <IconButton
                onClick={() => {
                  console.log("Edit");
                }}
              >
                <Edit />
              </IconButton>
            </Box>
            {/* Profile Group */}
            <Box sx={{ ...styles.sensorNameContainer, marginTop: "-5px" }}>
              <Typography sx={styles.sensorCoalitionLabel}>Group:</Typography>
              <Typography sx={styles.sensorCoalitionText}>
                {alarmProfile.group || "None"}
              </Typography>
              <Typography
                sx={{ ...styles.sensorCoalitionLabel, marginLeft: "20px" }}
              >
                Coalition:
              </Typography>
              <Typography sx={styles.sensorCoalitionText}>
                {alarmProfile.coalition || "None"}
              </Typography>
            </Box>
            {/* Profile Enable */}
            {alarmProfileSettingsBox(settingsConfig[0], "100px")}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "50px",
              marginRight: "80px",
            }}
          >
            {alarmProfileSettingsBox(settingsConfig[1], "110px")}
            {alarmProfileSettingsBox(settingsConfig[2], "110px")}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {alarmProfileSettingsBox(settingsConfig[3], "150px")}
            {alarmProfileSettingsBox(settingsConfig[4], "150px")}
          </Box>
        </Box>
        <Box sx={styles.nextButtonContainer}>
          <Box>
            <Button
              variant="contained"
              color="secondary"
              disabled={
                !thereAreGeneralChangesComparedTo(alarmProfile) ||
                editProfileSettingsMutation.isPending
              }
              onClick={() => editProfileSettingsMutation.mutate()}
              sx={styles.button}
            >
              {editProfileSettingsMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Save"
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  const alarmProfileSettingsBox = (
    setting: (typeof settingsConfig)[number],
    width: string
  ) => {
    return (
      <Box
        key={setting.key}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: "200px",
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: "500", whiteSpace: "nowrap", width: width }}
        >
          {setting.title}:
        </Typography>
        {setting.type === "boolean" ? (
          <Switch
            checked={settings[setting.key] as boolean}
            onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
            color="success"
            size="small"
          />
        ) : setting.type === "select" ? (
          <FormControl size="small" sx={{ minWidth: "150px" }}>
            <Select
              value={settings[setting.key] as number}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              variant="outlined"
            >
              {(setting as any).options?.map((option: any) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Box>
    );
  };

  const alarmProfileDetails = () => {
    return (
      <Paper elevation={0} sx={styles.paper}>
        <Box sx={styles.header}>
          <Box sx={styles.goBackContainer}>
            <Button
              variant="text"
              color="primary"
              onClick={() => router.push("/alarms?section=1")}
            >
              <ArrowBack sx={{ color: "black" }} />
            </Button>
          </Box>
          {alarmProfileNameCell()}
        </Box>
      </Paper>
    );
  };

  const alarmProfileEscalations = () => {
    return (
      <Box sx={{ display: "flex", flexDirection: "row", flex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            ...styles.paperSensors,
            width: isEditingSensors ? "100%" : "25%",
            transition: "width 0.3s ease-in-out",
          }}
        >
          <SensorsSelector
            layout={isEditingSensors ? "full" : "simple"}
            sx={{ width: "100%" }}
            allowEmptyList={false}
            action={() => {
              if (isEditingSensors === true) {
                if (editProfileSensorsMutation.isPending) return;
                setIsEditingSensors(true);
                editProfileSensorsMutation.mutate();
              } else {
                setIsEditingSensors(true);
              }
            }}
            actionIsPending={editProfileSensorsMutation.isPending}
            actionIsEnabled={
              alarmProfile !== null &&
              (() => {
                if (!alarmProfile || !assignedSensors) return false;

                const currentSensorIds = new Set(
                  alarmProfile.sensors.map((s) => s.sensor_id)
                );
                const assignedSensorIds = new Set(
                  assignedSensors.map((s) => s.sensor_id)
                );

                // Check if the sets have different sizes
                if (currentSensorIds.size !== assignedSensorIds.size)
                  return true;

                // Check if any sensor_id is different
                for (const sensorId of currentSensorIds) {
                  if (!assignedSensorIds.has(sensorId)) return true;
                }

                return false;
              })()
            }
            cancelAction={() => {
              setIsEditingSensors(false);
              if (!alarmProfile) return;
              setAssignedSensors(
                alarmProfile.sensors.map((sensor) => ({
                  sensor_id: sensor.sensor_id,
                  sensor_name: sensor.sensor_name,
                  sensor_type: sensor.sensor_type,
                  coalition_name: "",
                  group_name: "",
                  location_name: "",
                  alarm_profile: {
                    id: alarmProfile.id,
                    name: alarmProfile.name,
                  },
                }))
              );
            }}
          />
        </Paper>
        <Paper elevation={0} sx={styles.paperThresholds}>
          <Tabs
            value={selectedType}
            onChange={(event, newValue) => {
              setSelectedType(newValue);
            }}
            sx={{
              "& .Mui-selected": {
                color: "black !important",
                fontSize: "16px !important",
                textTransform: "none !important",
              },
              "& .MuiTab-root": {
                color: GREY,
                fontSize: "16px !important",
                textTransform: "none !important",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: SECONDARY,
              },
            }}
          >
            <Tab label="Threshold" />
            <Tab label="Low Battery" />
            <Tab label="Connectivity" />
            <Tab label="Not Reading Data" />
          </Tabs>
          <Divider />
          {selectedType === 0 && (
            <ProfileThresholdStep
              sx={{
                alignItems: "flex-start",
                marginLeft: "20px",
              }}
            />
          )}
          {selectedType === 1 && (
            <ProfileBatteryStep
              sx={{
                alignItems: "flex-start",
                marginLeft: "20px",
                marginTop: "20px",
              }}
            />
          )}
          {selectedType === 2 && (
            <ProfileConnectivityStep
              sx={{
                alignItems: "flex-start",
                marginLeft: "20px",
                marginTop: "20px",
              }}
            />
          )}
          {selectedType === 3 && (
            <ProfileNotReadingStep
              sx={{
                alignItems: "flex-start",
                marginLeft: "20px",
                marginTop: "20px",
              }}
            />
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <BackgroundBox sx={{ backgroundColor: BACKGROUND, minHeight: "100vh" }}>
      <Navbar />
      <Box sx={styles.container}>
        {isLoading ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: "calc(100vh - 70px)",
            }}
          >
            {alarmDataWasFilled && alarmProfileDetails()}
            {alarmDataWasFilled && alarmProfileEscalations()}
          </Box>
        )}
      </Box>
      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </BackgroundBox>
  );
}
