"use client";
import { useEffect, useState } from "react";
import BackgroundBox from "@/components/BackgroundBox";
import Navbar from "@/components/Navbar";
import { Box, Paper, Button, Typography, AlertColor } from "@mui/material";
import { BACKGROUND } from "@/styles/colors";
import AddAlarmProgress from "./AddAlarmProgress";
import ProfileNameStep from "./ProfileNameStep";
import SensorsSelector from "@/components/SensorsSelector/SensorsSelector";
import { styles } from "./styles";
import ProfileSettingsStep from "./ProfileSettingsStep";
import { useRouter } from "next/navigation";
import ProfileThresholdStep from "./ProfileThresholdStep";
import ProfileBatteryStep from "./ProfileBatteryStep";
import ProfileConnectivityStep from "./ProfileConnectivityStep";
import ProfileNotReadingStep from "./ProfileNotReadingStep";
import { useAlarmProfileContext } from "@/contexts/AlarmProfileContext";
import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import SnackView from "@/components/SnackView";

export default function AddAlarmPage() {
  const router = useRouter();
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);
  const {
    currentStep,
    setCurrentStep,
    profileName,
    group,
    assignedSensors,
    resetProgress,
    alarmProfileRequestBody,
    setEditingProfile,
  } = useAlarmProfileContext();

  useEffect(() => {
    setEditingProfile(null);
    resetProgress();
  }, []);

  const addAlarmProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(
        apiURL(`alarm_profiles/add`, `alarm_profiles/add`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...alarmProfileRequestBody(),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add alarm profile");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.message || "Alarm profile added successfully",
      });

      setTimeout(() => {
        router.push(`/alarm_profiles/${data.id}`);
      }, 1000);
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to add alarm profile",
      });
    },
  });

  const nextIsEnabled = () => {
    if (currentStep === 0) {
      return profileName.length > 3 && group !== null;
    }
    if (currentStep === 1) {
      return assignedSensors.length > 0;
    }
    return true;
  };

  const stepTitle = () => {
    if (currentStep === 0) {
      return "Set Profile Name";
    } else if (currentStep === 1) {
      return "Select Sensors";
    } else if (currentStep === 2) {
      return "Set Threshold Limits and Receivers";
    } else if (currentStep === 3) {
      return "Set Battery Limits and Receivers";
    } else if (currentStep === 4) {
      return "Set Connectivity Limits and Receivers";
    } else if (currentStep === 5) {
      return "Set Not Reading Limits and Receivers";
    } else if (currentStep === 6) {
      return "Set Profile Settings";
    } else if (currentStep === 7) {
      return "Confirm Settings";
    }
    return "";
  };

  return (
    <BackgroundBox sx={{ backgroundColor: BACKGROUND }}>
      <Navbar />
      <Box sx={styles.container}>
        <Box sx={styles.progressContainer}>
          <AddAlarmProgress currentStep={currentStep} />
        </Box>
        <Paper elevation={0} sx={styles.paper}>
          <Box sx={styles.buttonContainer}>
            <Box>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  if (currentStep === 0) {
                    router.push("/alarms?section=1");
                  } else {
                    setCurrentStep(currentStep - 1);
                  }
                }}
                sx={styles.button}
              >
                Back
              </Button>
            </Box>
            <Typography sx={styles.stepTitle}>{stepTitle()}</Typography>
            <Box sx={styles.nextButtonContainer}>
              <Box>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={!nextIsEnabled()}
                  loading={addAlarmProfileMutation.isPending}
                  onClick={() => {
                    if (currentStep === 6) {
                      if (addAlarmProfileMutation.isPending) {
                        return;
                      }
                      addAlarmProfileMutation.mutate();
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  sx={styles.button}
                >
                  {currentStep < 6 ? "Next" : "Save"}
                </Button>
              </Box>
            </Box>
          </Box>
          {currentStep === 0 && <ProfileNameStep />}
          {currentStep === 1 && (
            <SensorsSelector layout="full" sx={styles.sensorsSelector} />
          )}

          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            {currentStep === 2 && (
              <ProfileThresholdStep
                sx={{
                  width: "1040px",
                }}
              />
            )}
            {currentStep === 3 && (
              <ProfileBatteryStep
                sx={{
                  width: "1040px",
                  marginTop: "30px",
                }}
              />
            )}
            {currentStep === 4 && (
              <ProfileConnectivityStep
                sx={{
                  width: "1040px",
                  marginTop: "30px",
                }}
              />
            )}
            {currentStep === 5 && (
              <ProfileNotReadingStep
                sx={{
                  width: "1040px",
                  marginTop: "30px",
                }}
              />
            )}
          </Box>
          {currentStep === 6 && <ProfileSettingsStep />}
        </Paper>
      </Box>
      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </BackgroundBox>
  );
}
