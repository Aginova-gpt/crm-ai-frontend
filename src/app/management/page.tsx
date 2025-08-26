"use client";
import { useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import BackgroundBox from "@/components/BackgroundBox";
import Navbar from "@/components/Navbar";
import { Box, Paper } from "@mui/material";
import { CircularProgress } from "@mui/material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { BACKGROUND, SECONDARY, GREY } from "@/styles/colors";
import UsersList from "./UsersList/UsersList";
import CoalitionsList from "./CoalitionsList/CoalitionsList";
import { useProfile } from "@/contexts/ProfileContext";

function ManagementContent() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, isCoalitionOwner } = useProfile();
  
  // Get initial tab from URL params or default to 1
  const initialTab = parseInt(searchParams.get('section') || '1');
  const [tab, setTab] = useState(initialTab);

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
    setTab(newValue);
    
    // Update URL with the new tab
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', newValue.toString());
    router.replace(`/management?${params.toString()}`);
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
            <Tab label="Sensors" />
            <Tab label="Users" />
            {(isAdmin || isCoalitionOwner) && <Tab label="Coalitions" />}
          </Tabs>
          {tab === 1 ? <UsersList /> : null}
          {tab === 2 ? <CoalitionsList /> : null}
        </Paper>
      </Box>
    </BackgroundBox>
  );
}

export default function ManagementPage() {
  return (
    <Suspense fallback={
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    }>
      <ManagementContent />
    </Suspense>
  );
}
