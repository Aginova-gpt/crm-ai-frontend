// app/dashboard/layout.tsx
"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import CrmNavbar from "@/components/crmNavbar";
import { CompanyProvider } from "@/contexts/CompanyContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* ✅ Navbar stays persistent */}
      <CrmNavbar />

      {/* ✅ Page content */}
      <Box sx={{ flex: 1, bgcolor: "#FFFFFF", p: { xs: 1.5, sm: 2, md: 3 } }}>
        {children}
      </Box>
    </Box>
    </CompanyProvider>
  );
}
