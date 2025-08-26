import { Box, SxProps } from "@mui/material";
import Escalations from "@/components/Escalations/Escalations";
import { useAlarmProfileContext } from "@/contexts/AlarmProfileContext";
import ProfileThresholdsSetup from "./ProfileThresholdsSetup";

export default function ProfileThresholdStep({
  sx,
}: {
  sx?: SxProps;
}) {
  const { thresholdSettings, setThresholdSettings } = useAlarmProfileContext();

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...sx,
      }}
    >
      <ProfileThresholdsSetup
        settings={thresholdSettings.settings}
        setSettings={(newSettings) => {
          setThresholdSettings({
            ...thresholdSettings,
            settings: newSettings,
          });
        }}
      />
      <Escalations
        settings={[
          thresholdSettings.escalation_1,
          thresholdSettings.escalation_2,
          thresholdSettings.escalation_3,
          thresholdSettings.escalation_4,
        ]}
        setSettings={(newEscalations) => {
          setThresholdSettings({
            ...thresholdSettings,
            escalation_1: newEscalations[0],
            escalation_2: newEscalations[1],
            escalation_3: newEscalations[2],
            escalation_4: newEscalations[3],
          });
        }}
      />
    </Box>
  );
}
