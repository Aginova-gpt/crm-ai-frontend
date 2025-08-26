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
} from "@mui/material";
import {
  ProfileSettingsObject,
  useAlarmProfileContext,
} from "@/contexts/AlarmProfileContext";

export default function ProfileSettingsStep({}: {}) {
  const { settings, setSettings } = useAlarmProfileContext();

  const handleSettingChange = (
    key: keyof ProfileSettingsObject,
    value: any
  ) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const settingsConfig = [
    {
      key: "enabled" as keyof ProfileSettingsObject,
      title: "Enable Profile",
      description:
        "Enable or disable this alarm profile. Disabled profiles will not trigger alarms.",
      type: "boolean" as const,
    },
    {
      key: "delay_before_repeating" as keyof ProfileSettingsObject,
      title: "Alarm Repeating",
      description:
        "Alarm escalation tree will repeat after waiting amount of time specified. Selecting never disables repeating. Repeat alarming will stop after 4 times repeating.",
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
      key: "ack" as keyof ProfileSettingsObject,
      title: "Send Acknowledgment",
      description:
        "When enabled system will send a message to all alarm recipients when an alarm is Acknowledged (closed).",
      type: "boolean" as const,
    },
    {
      key: "recovery_time" as keyof ProfileSettingsObject,
      title: "Recovery Time",
      description:
        "Time in minutes before alarm can trigger again after an alarm is acknowledged.",
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
      key: "automatically_close" as keyof ProfileSettingsObject,
      title: "Automatically Close",
      description:
        "System will automatically close alarms if conditions are back within safe range.",
      type: "boolean" as const,
    },
  ] as const;

  return (
    <Box
      sx={{
        marginLeft: "60px",
        marginRight: "60px",
        marginTop: "40px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "600px" }}>
        {settingsConfig.map((setting, index) => (
          <Box key={setting.key}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "600" }}>
                  {setting.title}
                </Typography>

                {setting.type === "boolean" ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings[setting.key] as boolean}
                        onChange={(e) =>
                          handleSettingChange(setting.key, e.target.checked)
                        }
                        color="success"
                      />
                    }
                    label=""
                    sx={{ ml: 0 }}
                  />
                ) : setting.type === "select" ? (
                  <FormControl size="small" sx={{ width: "200px" }}>
                    <Select
                      value={settings[setting.key] as number}
                      onChange={(e) =>
                        handleSettingChange(setting.key, e.target.value)
                      }
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

              <Typography
                variant="body2"
                sx={{ mb: 2, color: "text.secondary" }}
              >
                {setting.description}
              </Typography>
            </Box>

            {index < settingsConfig.length - 1 && <Divider sx={{ mb: 3 }} />}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
