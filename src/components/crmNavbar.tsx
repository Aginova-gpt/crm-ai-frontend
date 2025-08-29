"use client";

import * as React from "react";
import { AppBar, Toolbar, Typography, Tabs, Tab } from "@mui/material";
import { Button } from "@mui/material";
import { NAVBAR_GRADIENT } from "@/styles/colors";
import Image from "next/image";
import { Box } from "@mui/material";
import ProfileCard from "./ProfileCard/ProfileCard";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Divider } from "@mui/material";
import BadgedIcon from "./BadgedIcon/BadgedIcon";
import { MdNotifications, MdMail, MdShoppingCart, MdAssignment } from "react-icons/md";
import { Items } from "openai/resources/conversations/items.mjs";
import { Fade } from "@mui/material";

type BadgeConfig = {
    icon: React.ReactNode;
    count: number;
    toolTip?: string;
    onClick?: () => void;
}

const tabBadges: Record<number, BadgeConfig[] | undefined> = {
    0: [
      { icon: (
        <Box
          component="img"
          src="/customerIcon.svg"
          alt="Customers"
          sx={{ width: 24, height: 24, display: "block", objectFit: "contain" }}
        />
      ), count: 0, toolTip: "Customer messages" },
      { icon: (
        <Box
          component="img"
          src="/bell.svg"
          alt="Customers"
          sx={{ width: 22, height: 22, display: "block", objectFit: "contain" }}
        />
      ), count: 0, toolTip: "New customer alerts" },
    ],
    1: undefined,
    2: undefined,
    3: [
      { icon: <MdShoppingCart size={22} />, count: 5, toolTip: "Open orders" },
      { icon: <MdAssignment size={22} />, count: 2, toolTip: "Pending approvals" },
    ],
    4: [{ icon: <MdAssignment size={22} />, count: 2, toolTip: "Pending invoices" }],
    5: undefined,
    6: [{ icon: <MdNotifications size={22} />, count: 7, toolTip: "Manufacturing alerts" }],
    7: undefined,
  };

export default function CrmNavbar() {
    const [tab, setTab] = React.useState(0);
    const router = useRouter();
    const auth = useAuth();
    const email = auth?.email??
    (auth as any)?.email ??
    "user@example.com";
    const role = "Admin";
    const handleLogout = () => {
        try {
            auth?.logout();
        } catch{}
        document.cookie = "auth=; Max-Age=0; path=/"
        router.push("/login");
    }
    return (
        <AppBar position="static" elevation={1}
        sx={{
            background: NAVBAR_GRADIENT,
            color: "#FFFFFF",
        }}>
            <Toolbar>
                <Image 
                src="/logo.svg" 
                alt="Aginova CRM" 
                width={32} 
                height={32} 
                style={{marginRight: "20px"}}/>
                <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                textColor="inherit"
                slotProps={{
                    indicator: {
                        sx: {
                            backgroundColor: "#FFFFFF",
                        },
                    },
                }}
                sx={{
                    "& .MuiTab-root": { 
                        textTransform: "none",
                        fontFamily: "Roboto, sans-serif",
                        fontWeight: "300",
                        fontSize: "14px", 
                        lineHeight: "100%",
                        letterSpacing: "0px",
                        textAlign: "center",
                        color: "#FFFFFFB2" },
                        "& .Mui-selected": {
                            fontFamily: "Roboto",
                            color: "#FFFFFF", // selected tab
                          },
                }}
                >
                    <Tab label="CUSTOMERS" />
                    <Tab label="PRODUCTS" />
                    <Tab label="ASSETS" />
                    <Tab label="ORDERS" />
                    <Tab label="Invoices" />
                    <Tab label="BILLS" />
                    <Tab label="MANUFACTURING" />
                    <Tab label="REPORTS" />
                </Tabs>
                <Box sx={{ flexGrow: 1 }} />
                <TabBadges items={tabBadges[tab]} />
                {/* Divider before ProfileCard */}
                <Divider orientation="vertical" 
                flexItem 
                sx={{mx: 2, borderColor: "#FFFFFFB2"}} />
                <ProfileCard
                    email={email}
                    role={role}
                    onClick={() => console.log("Profile clicked")}
                />
                {/* Divider before ProfileCard */}
                <Divider orientation="vertical" 
                flexItem 
                sx={{mx: 2, borderColor: "#FFFFFFB2"}} />

                <Button color="inherit" sx={{ml: 2}} onClick={handleLogout}>Logout</Button>
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
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 1, borderColor: "rgba(255,255,255,0.3)" }}
            />
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
