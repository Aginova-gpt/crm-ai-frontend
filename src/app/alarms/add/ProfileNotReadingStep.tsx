import { Box, SxProps, TextField, Typography } from "@mui/material";
import Escalations from "@/components/Escalations/Escalations";
import { useAlarmProfileContext } from "@/contexts/AlarmProfileContext";
import { ChangeEvent, useEffect } from "react";

export default function ProfileNotReadingStep({ sx }: { sx?: SxProps }) {
  const { notReadingSettings, setNotReadingSettings } =
    useAlarmProfileContext();

  const handleNotReadingChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setNotReadingSettings({
      ...notReadingSettings,
      maximum_downtime: Number(inputValue),
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
          id="maximum-downtime"
          label="Maximum downtime (minutes)"
          type="text"
          value={notReadingSettings.maximum_downtime || ""}
          onChange={handleNotReadingChange}
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
          notReadingSettings.escalation_1,
          notReadingSettings.escalation_2,
          notReadingSettings.escalation_3,
          notReadingSettings.escalation_4,
        ]}
        setSettings={(newEscalations) => {
          setNotReadingSettings({
            ...notReadingSettings,
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
