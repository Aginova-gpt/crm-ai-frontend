"use client";
import { Suspense, useState } from "react";
import BackgroundBox from "@/components/BackgroundBox";
import Navbar from "@/components/Navbar";
import { Box, CircularProgress, Paper } from "@mui/material";
import { BACKGROUND, GREY, SECONDARY } from "@/styles/colors";
import Alarms from "@/components/Alarms/Alarms";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AlarmProfiles from "@/components/AlarmProfiles/AlarmProfiles";
import { useRouter, useSearchParams } from "next/navigation";

function AlarmsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = parseInt(searchParams.get("section") || "0");
  const [value, setValue] = useState(initialTab);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);

    const params = new URLSearchParams(searchParams.toString());
    params.set("section", newValue.toString());
    router.replace(`/alarms?${params.toString()}`);
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
            <Tab label="Alarms" />
            <Tab label="Profiles" />
          </Tabs>
          {value === 0 ? <Alarms /> : null}
          {value === 1 ? <AlarmProfiles /> : null}
        </Paper>
      </Box>
    </BackgroundBox>
  );
}

export default function AlarmsPage() {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      }
    >
      <AlarmsContent />
    </Suspense>
  );
}
