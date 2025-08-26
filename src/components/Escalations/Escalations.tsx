import { Box, Tabs, Tab } from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useState } from "react";
import { styles } from "./Escalations.styles";
import { SECONDARY, GREY, BORDER } from "@/styles/colors";
import EscalationSettings from "./EscalationSettings/EscalationSettings";
import { EscalationSettingsObject } from "@/contexts/AlarmProfileContext";

interface EscalationsProps {
  sx?: SxProps<Theme>;
  settings: EscalationSettingsObject[];
  setSettings: (settings: EscalationSettingsObject[]) => void;
}

export default function Escalations({
  sx,
  settings,
  setSettings,
}: EscalationsProps) {
  const [tab, setTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Tabs
        value={tab}
        onChange={handleTabChange}
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
        <Tab label="Escalation 1" />
        <Tab label="Escalation 2" />
        <Tab label="Escalation 3" />
        <Tab label="Escalation 4" />
      </Tabs>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        {tab === 0 ? (
          <EscalationSettings
            escalation={settings[0]}
            setEscalation={(newEscalation) =>
              setSettings([newEscalation, ...settings.slice(1)])
            }
          />
        ) : null}
        {tab === 1 ? (
          <EscalationSettings
            escalation={settings[1]}
            setEscalation={(newEscalation) =>
              setSettings([
                ...settings.slice(0, 1),
                newEscalation,
                ...settings.slice(2),
              ])
            }
          />
        ) : null}
        {tab === 2 ? (
          <EscalationSettings
            escalation={settings[2]}
            setEscalation={(newEscalation) =>
              setSettings([
                ...settings.slice(0, 2),
                newEscalation,
                ...settings.slice(3),
              ])
            }
          />
        ) : null}
        {tab === 3 ? (
          <EscalationSettings
            escalation={settings[3]}
            setEscalation={(newEscalation) =>
              setSettings([...settings.slice(0, 3), newEscalation])
            }
          />
        ) : null}
      </Box>
    </Box>
  );
}
