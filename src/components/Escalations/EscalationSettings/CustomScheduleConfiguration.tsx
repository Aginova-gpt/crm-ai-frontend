import {
  Box,
  Button,
  Checkbox,
  Dialog,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { EscalationReceiver } from "@/components/AlarmProfiles/AlarmProfiles";

interface CustomScheduleConfigurationProps {
  open: boolean;
  onClose: () => void;
  target: EscalationReceiver;
  targetIndex: number;
  onScheduleUpdate: (targetIndex: number, scheduleDays: any) => void;
}

export default function CustomScheduleConfiguration({
  open,
  onClose,
  target,
  targetIndex,
  onScheduleUpdate,
}: CustomScheduleConfigurationProps) {
  const handleDayToggle = (dayKey: string, enabled: boolean) => {
    const newScheduleDays = { ...(target.schedule_days || {}) };
    if (!newScheduleDays[dayKey]) {
      newScheduleDays[dayKey] = { enabled: false, intervals: [] };
    }
    newScheduleDays[dayKey].enabled = enabled;
    onScheduleUpdate(targetIndex, newScheduleDays);
  };

  const handleIntervalToggle = (
    dayKey: string,
    intervalIndex: number,
    enabled: boolean
  ) => {
    const newScheduleDays = { ...(target.schedule_days || {}) };
    if (!newScheduleDays[dayKey]) {
      newScheduleDays[dayKey] = { enabled: false, intervals: [] };
    }
    if (!newScheduleDays[dayKey].intervals) {
      newScheduleDays[dayKey].intervals = [];
    }
    if (!newScheduleDays[dayKey].intervals[intervalIndex]) {
      newScheduleDays[dayKey].intervals[intervalIndex] = {
        enabled: false,
        start: "00:00",
        end: "00:00",
      };
    }
    newScheduleDays[dayKey].intervals[intervalIndex].enabled = enabled;
    onScheduleUpdate(targetIndex, newScheduleDays);
  };

  const handleTimeChange = (
    dayKey: string,
    intervalIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    const newScheduleDays = { ...(target.schedule_days || {}) };
    if (newScheduleDays[dayKey]?.intervals?.[intervalIndex]) {
      newScheduleDays[dayKey].intervals[intervalIndex][field] = value;
      onScheduleUpdate(targetIndex, newScheduleDays);
    }
  };

  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  });

  const days = [
    { name: "Monday", key: "monday" },
    { name: "Tuesday", key: "tuesday" },
    { name: "Wednesday", key: "wednesday" },
    { name: "Thursday", key: "thursday" },
    { name: "Friday", key: "friday" },
    { name: "Saturday", key: "saturday" },
    { name: "Sunday", key: "sunday" },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Schedule Configuration
        </Typography>

        <Box>
          {days.map((day) => (
            <Box
              key={day.key}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                marginBottom: "10px",
                paddingRight: "10px",
                paddingTop: "5px",
                paddingBottom: "5px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={target.schedule_days?.[day.key]?.enabled || false}
                  onChange={(e) => handleDayToggle(day.key, e.target.checked)}
                />
                <Typography sx={{ fontWeight: "medium" }}>
                  {day.name}
                </Typography>
              </Box>

              {target.schedule_days?.[day.key]?.enabled && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {[1, 2].map((intervalIndex) => (
                    <Box
                      key={intervalIndex}
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <Checkbox
                        checked={
                          target.schedule_days?.[day.key]?.intervals?.[
                            intervalIndex - 1
                          ]?.enabled || false
                        }
                        onChange={(e) =>
                          handleIntervalToggle(
                            day.key,
                            intervalIndex - 1,
                            e.target.checked
                          )
                        }
                      />
                      <TextField
                        select
                        size="small"
                        value={
                          target.schedule_days?.[day.key]?.intervals?.[
                            intervalIndex - 1
                          ]?.start || "00:00"
                        }
                        onChange={(e) =>
                          handleTimeChange(
                            day.key,
                            intervalIndex - 1,
                            "start",
                            e.target.value
                          )
                        }
                        sx={{
                            minWidth: 100,
                          "& .MuiInputBase-root": {
                            height: "32px",
                            fontSize: "14px",
                          },
                        }}
                      >
                        {timeOptions.map((time) => (
                          <MenuItem key={time} value={time}>
                            {time}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Typography
                        sx={{ marginLeft: "5px", marginRight: "5px" }}
                      >
                        -
                      </Typography>
                      <TextField
                        select
                        size="small"
                        value={
                          target.schedule_days?.[day.key]?.intervals?.[
                            intervalIndex - 1
                          ]?.end || "00:00"
                        }
                        onChange={(e) =>
                          handleTimeChange(
                            day.key,
                            intervalIndex - 1,
                            "end",
                            e.target.value
                          )
                        }
                        sx={{
                          minWidth: 100,
                          "& .MuiInputBase-root": {
                            height: "32px",
                            fontSize: "14px",
                          },
                        }}
                      >
                        {timeOptions.map((time) => (
                          <MenuItem key={time} value={time}>
                            {time}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}
        >
          <Button onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Dialog>
  );
}
