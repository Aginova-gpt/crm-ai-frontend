"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import BackgroundBox from "@/components/BackgroundBox";
import Navbar from "@/components/Navbar";
import { Box, Paper, Typography } from "@mui/material";
import { CircularProgress } from "@mui/material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { BACKGROUND, SECONDARY, GREY } from "@/styles/colors";
import LiveSensors from "@/components/LiveSensors/LiveSensors";
import ChatPanel from "@/components/ChatPanel";
import { SensorData } from "@/utils/sensorHelpers";

export default function DashboardPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleChatClick = (sensor: SensorData) => {
    setSelectedSensor(sensor);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <BackgroundBox sx={{ backgroundColor: BACKGROUND }}>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          width: "100%",
          height: "100%",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            width: "100%",
            margin: "15px",
            borderWidth: "1px",
            borderColor: "divider",
            borderStyle: "solid",
          }}
        >
          <Tabs
            value={value}
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
            <Tab label="Sensors" />
          </Tabs>
          {value === 0 ? <LiveSensors onChatClick={handleChatClick} /> : null}
        </Paper>
      </Box>
      <ChatPanel
        open={isChatOpen}
        onClose={handleCloseChat}
        sensor={selectedSensor || ({} as SensorData)}
      />
    </BackgroundBox>
  );
}
