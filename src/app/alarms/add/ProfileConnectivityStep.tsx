import { Box, SxProps, TextField, Typography } from "@mui/material";
import Escalations from "@/components/Escalations/Escalations";
import { useAlarmProfileContext } from "@/contexts/AlarmProfileContext";
import { ChangeEvent, useEffect } from "react";

export default function ProfileConnectivityStep({ sx }: { sx?: SxProps }) {
  const { connectivitySettings, setConnectivitySettings } =
    useAlarmProfileContext();

  const handleConnectivityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setConnectivitySettings({
      ...connectivitySettings,
      maximum_offline_time: Number(inputValue),
    });
  };

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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          marginBottom: "20px",
          gap: 2,
        }}
      >
        <TextField
          id="maximum-offline-time"
          label="Maximum offline time (minutes)"
          type="text"
          value={connectivitySettings.maximum_offline_time || ""}
          onChange={handleConnectivityChange}
          size="small"
          sx={{ width: "300px", mt: 0 }}
          aria-describedby="delay-helper-text"
        />
        <Typography
          id="delay-helper-text"
          sx={{ color: "text.secondary", fontSize: "12px" }}
        >
          Anything lower than 10 minutes will be ignored. Please enter values
          bigger or equal to 10 minutes.
        </Typography>
      </Box>
      <Escalations
        settings={[
          connectivitySettings.escalation_1,
          connectivitySettings.escalation_2,
          connectivitySettings.escalation_3,
          connectivitySettings.escalation_4,
        ]}
        setSettings={(newEscalations) => {
          setConnectivitySettings({
            ...connectivitySettings,
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
