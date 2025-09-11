"use client";

import * as React from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CustomerFormLeft from "@/components/CustomerForm/CustomerFormLeft";

export default function CustomerDetailPage() {
  const router = useRouter();
  const [assignedTo, setAssignedTo] = React.useState("");

  // Normally from backend
  const customerName = "Customer Name";
  const createdAt = "2025-09-11 10:30 AM";
  const modifiedAt = "2025-09-11 11:15 AM";

  const handleSave = () => {
    console.log("Saving customer:", { assignedTo });
    router.push("/dashboard/customers");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "#FAFAFD",
        p: 2,
        borderRadius: 1,
      }}
    >
      {/* === Top Section === */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          bgcolor: "#FFF",
          p: 2,
          borderRadius: 1,
        }}
      >
        {/* Left: constrained to left column width */}
        <Box sx={{ flex: "0 0 50%", display: "flex", flexDirection: "column", gap: 0.5 }}>
          {/* Row 1: Customer name + AssignedTo */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={700} fontSize={16}>
              {customerName}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 300, marginRight: "30px" }}>
              <InputLabel id="assigned-to-label">Assigned To</InputLabel>
              <Select
                labelId="assigned-to-label"
                value={assignedTo}
                label="Assigned To"
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <MenuItem value="User 1">User 1</MenuItem>
                <MenuItem value="User 2">User 2</MenuItem>
                <MenuItem value="User 3">User 3</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Row 2: Created + Modified */}
          <Box sx={{ display: "flex", gap: 3 }}>
            <Typography variant="body2" color="text.secondary" fontSize={12}>
              Created: {createdAt}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize={12}>
              Modified: {modifiedAt}
            </Typography>
          </Box>
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => router.push("/dashboard/customers")}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* === Main Layout: Left Form + Right Tables === */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        {/* Left side form */}
        <CustomerFormLeft />

        {/* Right side placeholders */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Orders
            </Typography>
          </Box>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Quotes
            </Typography>
          </Box>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Invoices
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
