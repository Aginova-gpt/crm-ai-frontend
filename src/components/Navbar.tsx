"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import * as colors from "@/styles/colors";
import {
  NotificationsOutlined,
  Notifications,
  AccountCircle,
} from "@mui/icons-material";
import Badge from "@mui/material/Badge";
import { cedars, sentinel } from "@/styles/icons";
import CircularProgress from "@mui/material/CircularProgress";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "@/contexts/BackendContext";
import { GREEN, RED } from "@/styles/colors";
import { AlarmsFiltersTypeResponse } from "./AlarmsFilters/AlarmsFilters";
import { useApi } from "@/utils/api";
import { useProfile } from "@/contexts/ProfileContext";

interface NavbarProps {}

export default function Navbar({}: NavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [progress, setProgress] = useState(100);
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const { profileData, isLoading: isProfileLoading } = useProfile();

  const {
    data: alarmCounts,
    refetch: refetchAlarmCounts,
    isRefetching,
    isLoading,
  } = useQuery({
    queryKey: ["alarms_filters"],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL("alarms/filters?type=all", "alarms_count")
      );
      return response.json() as Promise<AlarmsFiltersTypeResponse>;
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isLoading && !isRefetching) {
        setProgress((oldProgress) => {
          const newProgress = oldProgress - 0.2;
          if (newProgress <= 0) {
            refetchAlarmCounts();
            return 100;
          }
          return newProgress;
        });
      }
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [isLoading, isRefetching]);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
    document.cookie = "auth=false; path=/";
  };

  const getSelectedMenu = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/management")) return "Management";
    if (pathname.startsWith("/reports")) return "Reports";
    if (pathname.startsWith("/admin")) return "Admin";
    if (pathname.startsWith("/alarms")) return "alarms";
    return "";
  };

  const menuLink = (title: string, path: string) => {
    const isSelected = title === getSelectedMenu();
    return (
      <Button
        component={Link}
        href={path}
        sx={{
          fontWeight: 900,
          opacity: isSelected ? 1 : 0.7,
          fontSize: "14px",
          color: isSelected ? "white" : "rgba(255, 255, 255, 0.7)",
          "&:hover": {
            color: "white",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {title}
      </Button>
    );
  };

  const divider = () => {
    return (
      <Box
        sx={{
          width: "1px",
          height: "62px",
          backgroundColor: "#E7E8F280",
          mx: "20px",
        }}
      />
    );
  };

  const allAlarmsCount = alarmCounts?.open_alarms || 0;

  const userRole = () => {
    if (!profileData) return "";
    if (profileData?.role_level === 0) return "Admin";
    if (profileData?.role_level === 1) return "Coalition Owner";
    return "Standard User";
  };

  const coalitionLogoSettings = useCallback(() => {
    if (
      profileData?.coalition?.name &&
      profileData?.coalition?.name.toLowerCase().includes("cedars")
    ) {
      return { logo: cedars.src, height: "60px" };
    }
    return { logo: sentinel.src, height: "40px" };
  }, [profileData]);

  return (
    <AppBar position="static" sx={{ background: colors.PURPLE_GRADIENT }}>
      <Toolbar>
        <img
          src={coalitionLogoSettings().logo}
          style={{
            height: coalitionLogoSettings().height,
          }}
        />

        {/* Center: Nav Links (hidden on small screens) */}
        <Box sx={{ display: { xs: "none", md: "flex", flexGrow: 1 } }}>
          <Box sx={{ mx: 3 }} />
          {menuLink("Dashboard", "/dashboard")}
          <Box sx={{ mx: 2 }} />
          {menuLink("Management", "/management?section=1")}
          <Box sx={{ mx: 2 }} />
          {menuLink("Reports", "/reports")}
          <Box sx={{ mx: 2 }} />
          {menuLink("Admin", "/admin")}
        </Box>

        {/* Right: User Info (hidden on small screens) */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* ALARMS */}
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            {isLoading || isRefetching ? (
              <CircularProgress
                size={40}
                thickness={3}
                sx={{
                  color: "white",
                  position: "absolute",
                  left: -10,
                  top: 0,
                  zIndex: 1,
                }}
              />
            ) : (
              <CircularProgress
                variant="determinate"
                value={progress}
                size={40}
                thickness={4}
                sx={{
                  color: "rgba(255, 255, 255, 0.3)",
                  position: "absolute",
                  left: -9,
                }}
              />
            )}
            <IconButton
              component={Link}
              href="/alarms?section=0"
              style={{
                color: "white",
                marginLeft: "-10px",
                position: "relative",
                zIndex: 2,
              }}
            >
              <Badge
                badgeContent={allAlarmsCount === 0 ? 1 : allAlarmsCount}
                variant={allAlarmsCount === 0 ? "dot" : "standard"}
                invisible={isLoading || isRefetching}
                sx={{
                  "& .MuiBadge-badge": {
                    backgroundColor: allAlarmsCount === 0 ? GREEN : RED,
                  },
                }}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
              >
                {getSelectedMenu() === "alarms" ? (
                  <Notifications />
                ) : (
                  <NotificationsOutlined />
                )}
              </Badge>
            </IconButton>
          </Box>
          {divider()}

          {/* USER INFO */}
          <Box
            component={Link}
            href="/profile"
            sx={{
              display: { md: "flex" },
              flexDirection: "row",
            }}
          >
            {isProfileLoading ? (
              <Box
                sx={{
                  display: { md: "flex" },
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CircularProgress size={20} sx={{ color: "white" }} />
                <Typography
                  variant="subtitle1"
                  sx={{ color: "white", fontSize: "16px" }}
                >
                  Loading...
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: { md: "flex" },
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: "white", fontSize: "16px" }}
                >
                  {profileData?.email || "--"}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "#ffffffb0", fontSize: "14px" }}
                >
                  {userRole()}
                </Typography>
              </Box>
            )}
            <IconButton
              onClick={() => {}}
              style={{ color: "white", marginLeft: "8px" }}
            >
              <AccountCircle sx={{ fontSize: "40px" }} />
            </IconButton>
          </Box>
          {divider()}

          {/* LOGOUT */}
          <Box
            onClick={handleLogout}
            sx={{
              display: { md: "flex" },
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <Button onClick={handleLogout}>
              <Typography
                variant="subtitle1"
                sx={{ color: "white", fontSize: "16px", textTransform: "none" }}
              >
                Log Out
              </Typography>
            </Button>
          </Box>
        </Box>

        {/* Mobile Menu Button */}
        <IconButton
          edge="end"
          aria-label="menu"
          sx={{ display: { md: "none" }, color: "white" }}
          onClick={toggleDrawer}
        >
          {drawerOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer}>
          <List>
            <ListItem component={Link} href="/">
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem component={Link} href="/management?section=1">
              <ListItemText primary="Management" />
            </ListItem>
            <ListItem component={Link} href="/alarms?section=0">
              <ListItemText primary="Alarms" />
            </ListItem>
            <ListItem component={Link} href="/reports">
              <ListItemText primary="Reports" />
            </ListItem>
            <ListItem component={Link} href="/admin">
              <ListItemText primary="Admin" />
            </ListItem>
            <ListItem component={Link} href="/profile">
              <Typography variant="body1">{profileData?.email || "-"}</Typography>
            </ListItem>
            <ListItem>
              <Button variant="contained" color="error" fullWidth>
                Logout
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
