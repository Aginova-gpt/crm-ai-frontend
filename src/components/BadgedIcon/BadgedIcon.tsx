// src/components/BadgedIcon/BadgedIcon.tsx
"use client";

import * as React from "react";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

export type BadgedIconProps = {
  count?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon: React.ReactNode;
  tooltip?: string;
  withDivider?: boolean;
  color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  max?: number;
  showZero?: boolean;
  iconColor?: string;
};

export const BadgedIcon = ({
  count = 0,
  onClick,
  icon,
  tooltip,
  withDivider = false,
  color = "error",
  max = 99,
  iconColor="inherit",
  showZero = false,
}: BadgedIconProps) => {
  const badge = (
    <Badge badgeContent={count} color={color} max={max} showZero={showZero} overlap="circular">
      <IconButton onClick={onClick}
      sx={[{ color: iconColor }]}>{icon}</IconButton>
    </Badge>
  );

  const content = tooltip ? <Tooltip title={tooltip}>{badge}</Tooltip> : badge;

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {withDivider && <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.3 }} />}
      {content}
    </Box>
  );
};

export default BadgedIcon; 
