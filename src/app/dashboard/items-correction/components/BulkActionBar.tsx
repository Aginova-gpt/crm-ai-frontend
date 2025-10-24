"use client";

import * as React from "react";
import { Box, Button, Typography } from "@mui/material";
import { ItemCorrectionRow } from "../types";

interface BulkActionBarProps {
  selectedCount: number;
  onBulkSave: (items: ItemCorrectionRow[]) => Promise<void> | void;
  isSaving: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onBulkSave,
  isSaving,
}: BulkActionBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 1.5,
        bgcolor: "#f7faff",
        borderTop: "1px solid #e0e0e0",
        borderRadius: "0 0 4px 4px",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {selectedCount > 0
          ? `${selectedCount} items selected for bulk correction`
          : "No items selected"}
      </Typography>

      <Button
        variant="contained"
        color="primary"
        size="small"
        disabled={selectedCount === 0 || isSaving}
        onClick={() => onBulkSave([])} // TODO: wire actual selected items
      >
        {isSaving ? "Saving..." : "Save All"}
      </Button>
    </Box>
  );
}
