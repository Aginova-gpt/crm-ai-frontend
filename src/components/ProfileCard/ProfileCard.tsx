  // src/components/ProfileCard/ProfileCard.tsx
  "use client";

  import * as React from "react";
  import { Box, Typography } from "@mui/material";
  import { FaUserCircle } from "react-icons/fa";

  export default function ProfileCard({
    email,
    role,
    onClick,
  }: {
    email: string;
    role: string;
    onClick?: () => void;
  }) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: onClick ? "pointer" : "default",
          px: 2,
          py: 0.5,
          borderRadius: 1,
          "&:hover": {
            bgcolor: onClick ? "rgba(255,255,255,0.1)" : "transparent",
          },
        }}
        onClick={onClick}
      >
        {/* Font Awesome icon */}
        <FaUserCircle size={32} style={{ marginRight: "8px", color: "white" }} />

        {/* User details */}
        <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <Typography
            variant="body2"
            sx={{ color: "white", fontWeight: 500 }}
          >
            {email}
          </Typography>
          <Typography variant="caption" sx={{ color: "white" }}>
            {role}
          </Typography>
        </Box>
      </Box>
    );
  }
