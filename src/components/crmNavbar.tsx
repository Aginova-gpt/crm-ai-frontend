// src/components/crmNavbar.tsx
"use client";

import * as React from "react";
import { AppBar, Toolbar, Typography, Tabs, Tab, Button, Box, Divider, Fade } from "@mui/material";
import { NAVBAR_GRADIENT } from "@/styles/colors";
import Image from "next/image";
import ProfileCard from "./ProfileCard/ProfileCard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";  // ✅ added usePathname
import BadgedIcon from "./BadgedIcon/BadgedIcon";
import { MdNotifications, MdMail, MdShoppingCart, MdAssignment } from "react-icons/md";


type BadgeConfig = {
  icon: React.ReactNode;
  count: number;
  toolTip?: string;
  onClick?: () => void;
};

const tabBadges: Record<number, BadgeConfig[] | undefined> = {
  0: [
    {
      icon: (
        <Box
          component="img"
          src="/customerIcon.svg"
          alt="Customers"
          sx={{ width: 24, height: 24, display: "block", objectFit: "contain" }}
        />
      ),
      count: 0,
      toolTip: "Customer messages",
    },
    {
      icon: (
        <Box
          component="img"
          src="/bell.svg"
          alt="Customers"
          sx={{ width: 22, height: 22, display: "block", objectFit: "contain" }}
        />
      ),
      count: 0,
      toolTip: "New customer alerts",
    },
  ],
  1: undefined,
  2: undefined,
  3: undefined,
  4: [
    { icon: <MdShoppingCart size={22} />, count: 5, toolTip: "Open orders" },
    { icon: <MdAssignment size={22} />, count: 2, toolTip: "Pending approvals" },
  ],
  5: [{ icon: <MdAssignment size={22} />, count: 2, toolTip: "Pending invoices" }],
  6: undefined,
  7: [{ icon: <MdNotifications size={22} />, count: 7, toolTip: "Manufacturing alerts" }],
  8: undefined,
  9: undefined,
};

export default function CrmNavbar() {
  const router = useRouter();
  const pathname = usePathname(); 
  const auth = useAuth();

  const email = auth?.email ?? "user@example.com";
  const role = "Admin";

  // Sync tab index with URL
  const currentTab = React.useMemo(() => {
    if (pathname.includes("/dashboard/customers")) return 0;
    if (pathname.includes("/dashboard/products")) return 1;
    if (pathname.includes("/dashboard/assets")) return 2;
    if (pathname.includes("/dashboard/quotes")) return 3;
    if (pathname.includes("/dashboard/orders")) return 4;
    if (pathname.includes("/dashboard/invoices")) return 5;
    if (pathname.includes("/dashboard/bills")) return 6;
    if (pathname.includes("/dashboard/manufacturing")) return 7;
    if (pathname.includes("/dashboard/reports")) return 8;
    if (pathname.includes("/dashboard/items-correction")) return 9;
    return 0; 
  }, [pathname]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        router.push("/dashboard/customers");
        break;
      case 1:
        router.push("/dashboard/products");
        break;
      case 2:
        router.push("/dashboard/assets");
        break;
      case 3:
        router.push("/dashboard/quotes");
        break;
      case 4:
        router.push("/dashboard/orders");
        break;
      case 5:
        router.push("/dashboard/invoices");
        break;
      case 6:
        router.push("/dashboard/bills");
        break;
      case 7:
        router.push("/dashboard/manufacturing");
        break;
      case 8:
        router.push("/dashboard/reports");
        break;
      case 9:
        router.push("/dashboard/items-correction");
        break;
    }
  };

  

  const handleLogout = () => {
    try {
      auth?.logout();
    } catch {}
    document.cookie = "auth=; Max-Age=0; path=/";
    router.push("/login");
  };

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        background: NAVBAR_GRADIENT,
        color: "#FFFFFF",
      }}
    >
      <Toolbar>
        <Image src="/logo.svg" alt="Aginova CRM" width={32} height={32} style={{ marginRight: "20px" }} />

        {/* Tabs with navigation */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          textColor="inherit"
          slotProps={{
            indicator: {
              sx: { backgroundColor: "#FFFFFF" },
            },
          }}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontFamily: "Roboto, sans-serif",
              fontWeight: "300",
              fontSize: "14px",
              color: "#FFFFFFB2",
            },
            "& .Mui-selected": {
              fontFamily: "Roboto",
              color: "#FFFFFF", // selected tab
            },
          }}
        >
          <Tab label="CUSTOMERS" />
          <Tab label="PRODUCTS" />
          <Tab label="ASSETS" />
          <Tab label="QUOTES" />
          <Tab label="ORDERS" />
          <Tab label="INVOICES" />
          <Tab label="BILLS" />
          <Tab label="MANUFACTURING" />
          <Tab label="REPORTS" />
          <Tab label="ITEMS CORRECTION" />
        </Tabs>

        <Box sx={{ flexGrow: 1 }} />
        <TabBadges items={tabBadges[currentTab]} />

        {/* Divider before ProfileCard */}
        <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: "#FFFFFFB2" }} />

        <ProfileCard email={email} role={role} onClick={() => console.log("Profile clicked")} />

        {/* Divider after ProfileCard */}
        <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: "#FFFFFFB2" }} />

        <Button color="inherit" sx={{ ml: 2 }} onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

function TabBadges({ items }: { items?: BadgeConfig[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Fade in timeout={200}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Group-level divider */}
        <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: "rgba(255,255,255,0.3)" }} />
        {/* Render badges */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {items.map((b, i) => (
            <BadgedIcon
              key={`${b.toolTip ?? "badge"}-${i}`}
              icon={b.icon}
              count={b.count}
              tooltip={b.toolTip}
              onClick={b.onClick}
              iconColor="#FFFFFF"
            />
          ))}
        </Box>
      </Box>
    </Fade>
  );
}
