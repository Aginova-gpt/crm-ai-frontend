"use client";

import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Button,
} from "@mui/material";
import { useCompany } from "@/contexts/CompanyContext";

export type TypeFilter = "ALL" | "PRODUCT" | "PART" | "BOTH";
export type CorrectionFilter = "ALL" | "EDITED" | "NOT_EDITED";
export type EditedWindow = "24h" | "3d" | "7d" | "15d" | "30d" | "all";

interface Props {
  onCompanyChange: (id: string | null) => void;

  typeFilter: TypeFilter;
  setTypeFilter: (v: TypeFilter) => void;

  correctionFilter: CorrectionFilter;
  setCorrectionFilter: (v: CorrectionFilter) => void;

  editedWindow: EditedWindow;
  setEditedWindow: (v: EditedWindow) => void;

  dirtyCount: number;
  onSave: () => void;
  isSaving?: boolean;
}

export default function ItemCorrectionToolbar({
  onCompanyChange,
  typeFilter,
  setTypeFilter,
  correctionFilter,
  setCorrectionFilter,
  editedWindow,
  setEditedWindow,
  dirtyCount,
  onSave,
  isSaving,
}: Props) {
  const {
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    isLoading: companyLoading,
  } = useCompany();

  const handleCompanyChange = (event: any) => {
    const newId = event.target.value || "all";
    setSelectedCompanyId(newId);
    onCompanyChange(newId);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        mb: 1,
      }}
    >
      {/* Company */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Company</InputLabel>
        <Select
          value={selectedCompanyId ?? ""}
          label="Company"
          onChange={handleCompanyChange}
          disabled={companyLoading || isSaving}
        >
          {companyLoading ? (
            <MenuItem value="">
              <CircularProgress size={16} sx={{ mr: 1 }} /> Loading...
            </MenuItem>
          ) : (
            companies.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Type Filter */}
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Type</InputLabel>
        <Select
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter((e.target.value as any) ?? "ALL")}
          disabled={isSaving}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="PRODUCT">Product only</MenuItem>
          <MenuItem value="PART">Part only</MenuItem>
          <MenuItem value="BOTH">Both (has Product & Part)</MenuItem>
        </Select>
      </FormControl>

      {/* Edited filter */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Filter</InputLabel>
        <Select
          label="Filter"
          value={correctionFilter}
          onChange={(e) => setCorrectionFilter((e.target.value as any) ?? "ALL")}
          disabled={isSaving}
        >
          <MenuItem value="EDITED">Edited Only</MenuItem>
          <MenuItem value="ALL">All Items</MenuItem>
          <MenuItem value="NOT_EDITED">Not Edited</MenuItem>
        </Select>
      </FormControl>

      {/* Edited window (only when Edited Only) */}
      {correctionFilter === "EDITED" && (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Last Updated</InputLabel>
          <Select
            label="Last Updated"
            value={editedWindow}
            onChange={(e) => setEditedWindow((e.target.value as any) ?? "all")}
            disabled={isSaving}
          >
            <MenuItem value="24h">in 24 hours</MenuItem>
            <MenuItem value="3d">in 3 days</MenuItem>
            <MenuItem value="7d">in 7 days</MenuItem>
            <MenuItem value="15d">in 15 days</MenuItem>
            <MenuItem value="30d">in 30 days</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </Select>
        </FormControl>
      )}

      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {dirtyCount > 0 ? `${dirtyCount} change${dirtyCount > 1 ? "s" : ""} pending` : "No changes"}
      </Typography>

      <Box sx={{ ml: "auto" }}>
        <Button
          variant="contained"
          size="small"
          disabled={dirtyCount === 0 || !!isSaving}
          onClick={onSave}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </Box>
    </Box>
  );
}
