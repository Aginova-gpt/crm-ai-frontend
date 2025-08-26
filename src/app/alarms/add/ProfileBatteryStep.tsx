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
  SxProps,
} from "@mui/material";
import Escalations from "@/components/Escalations/Escalations";
import { useAlarmProfileContext } from "@/contexts/AlarmProfileContext";
import { ChangeEvent, useEffect } from "react";

export default function ProfileBatteryStep({ sx }: { sx?: SxProps }) {
  const { batterySettings, setBatterySettings } = useAlarmProfileContext();

  const handleBatteryLevelChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setBatterySettings({
      ...batterySettings,
      minimum_battery_level: Number(inputValue),
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
      <Box sx={{ display: "flex", marginBottom: "20px", width: "100%" }}>
        <TextField
          id="minimum-battery-level"
          label="Minimum battery level (volts)"
          type="number"
          inputProps={{ step: "0.01" }}
          value={batterySettings.minimum_battery_level || ""}
          onChange={handleBatteryLevelChange}
          size="small"
          sx={{ width: "300px", mt: 0 }}
          aria-describedby="delay-helper-text"
        />
      </Box>
      <Escalations
        settings={[
          batterySettings.escalation_1,
          batterySettings.escalation_2,
          batterySettings.escalation_3,
          batterySettings.escalation_4,
        ]}
        setSettings={(newEscalations) => {
          setBatterySettings({
            ...batterySettings,
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
