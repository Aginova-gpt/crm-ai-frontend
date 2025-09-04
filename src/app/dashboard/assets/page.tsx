// app/dashboard/assets/page.tsx
"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider,
  TablePagination,
  TableSortLabel,
  CircularProgress,
  Alert,
} from "@mui/material";
import { MdSearch, MdEdit, MdDelete } from "react-icons/md";
import Image from "next/image";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import { addAsset, importAsset } from "@/styles/icons";

// ===== Optimized grid layouts =====
const GRID_ASSETS = `
  minmax(160px, 1fr)   /* Sensor ID */
  minmax(80px, 1fr)    /* Type */
  minmax(60px, 1fr)    /* Status */
  minmax(120px, 1fr)   /* Product */
  minmax(120px, 1fr)   /* Probe */
  minmax(100px, 1fr)   /* Order ID */
  minmax(120px, 1fr)   /* Customer */
  minmax(80px, 1fr)    /* Run # */
  minmax(110px, 1fr)   /* Date Mfg */
  minmax(110px, 1fr)   /* Shipped */
  minmax(140px, 1fr)   /* Subscription Expiry */
  minmax(100px, 1fr)   /* Quick Actions */
`;

const GRID_HOSTED = `
  minmax(160px, 1fr)   /* Sensor ID */
  minmax(90px, 1fr)    /* Type */
  minmax(60px, 1fr)    /* Status */
  minmax(140px, 1fr)   /* Product */
  minmax(100px, 1fr)   /* Last Order ID */
  minmax(120px, 1fr)   /* Customer */
  minmax(110px, 1fr)   /* Shipped */
  minmax(90px, 1fr)    /* Rate */
  minmax(130px, 1fr)   /* Subscription Start */
  minmax(140px, 1fr)   /* Subscription Expiry */
  minmax(90px, 1fr)   /* Online Status */
  minmax(100px, 1fr)    /* Renew */
`;
// ===== Column definitions =====
const assetCols = [
    { key: "sensorId", label: "Sensor ID", sortable: true },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "product", label: "Product# Description" },
    { key: "probe", label: "Probe# Description" },
    { key: "orderId", label: "Order ID" },
    { key: "customer", label: "Customer" },
    { key: "run", label: "Run #" },
    { key: "dateMfg", label: "Date Mfg.", sortable: true },
    { key: "shipped", label: "Shipped" },
    { key: "subscriptionExpiry", label: "Subscription Expiry", sortable: true },
    { key: "actions", label: "Quick Actions" },
  ];
  
  const hostedCols = [
    { key: "sensorId", label: "Sensor ID", sortable: true },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "product", label: "Product #, Description" },
    { key: "lastOrderId", label: "Last Order ID" },
    { key: "customer", label: "Customer" },
    { key: "shipped", label: "Shipped" },
    { key: "rate", label: "Rate" },
    { key: "subscriptionStart", label: "Subscription Start Date" },
    { key: "subscriptionExpiry", label: "Subscription Expiry Date" },
    { key: "onlineStatus", label: "Online Status" },
    { key: "renew", label: "Renew" },
  ];
  

const HEADER_MIN_WIDTH = 12 * 85; // ✅ Reduced base min width

// ===== Inline hooks (same style as Customers) =====
function useAssets() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch(apiURL("assets", "assets.json"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token,
  });
}

function useHosted() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["hosted"],
    queryFn: async () => {
      const res = await fetch(apiURL("hosted", "hosted.json"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token,
  });
}

// ===== Page Component =====
export default function AssetsPage() {
  const [tab, setTab] = useState(0);
  const { data: assetsData, isLoading: loadingAssets, error: errorAssets } = useAssets();
  const { data: hostedData, isLoading: loadingHosted, error: errorHosted } = useHosted();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("sensorId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const toggleSort = (key: string) => {
    if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const handleAdd = () => {};
  const handleImport = () => {};
  const handleEdit = (id: string) => console.log("Edit:", id);
  const handleDelete = (id: string) => {
    if (window.confirm("Delete this item?")) console.log("Delete:", id);
  };

  // ===== Transform backend response =====
  const assets = useMemo(() => assetsData?.assets ?? [], [assetsData]);
  const hosted = useMemo(() => hostedData?.hosted ?? [], [hostedData]);

  // ===== Filtering + Sorting =====
  const filterAndSort = (rows: any[]) => {
    const filtered = rows.filter((r) =>
      Object.values(r).join(" ").toLowerCase().includes(searchQuery.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const av = String(a[sortBy] ?? "").toLowerCase();
      const bv = String(b[sortBy] ?? "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  };

  const visibleRows = tab === 0 ? filterAndSort(assets) : filterAndSort(hosted);
  const pagedRows = visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1,  p: 0 }}>
      {/* Header row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#FFFFFF",
          borderRadius: 1,
          px: 1.5,
          py: 1,
        }}
      >
        {/* Left: tabs + search + actions */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
            <Tab label="Assets" />
            <Tab label="Hosted" />
          </Tabs>

          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tab === 0 ? "assets" : "hosted"}`}
              size="small"
              sx={{ width: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch size={18} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Add + Import buttons */}
            <Tooltip title="Add">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 0.25 }}>
                <IconButton color="primary" onClick={handleAdd} sx={{ p: 0.5 }}>
                  <Image src={addAsset} alt="Add asset" width={36} height={36} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1 }}>
                  Add
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip title="Import">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 0.25 }}>
                <IconButton color="primary" onClick={handleImport} sx={{ p: 0.5 }}>
                  <Image src={importAsset} alt="Import asset" width={36} height={36} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1 }}>
                  Import
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* Right: status cards */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StatusCard title="Sensor Stock" value={213} total={400} />
          <StatusCard title="RMA" value={19} total={100} />
          <StatusCard title="Probe Stock" value={73} total={100} />
          <StatusCard title="Subscription Assigned" value={4000} total={5000} />
        </Box>
      </Box>

      {/* Table */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "#FFFFFF", borderRadius: 1 }}>
        {/* Header */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "#EAF5FF",
            display: "grid",
            gridTemplateColumns: tab === 0 ? GRID_ASSETS : GRID_HOSTED,
            columnGap: 1.5,
            px: 2,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            minWidth: HEADER_MIN_WIDTH,
          }}
        >
          {(tab === 0 ? assetCols : hostedCols).map(({ key, label, sortable }) => {
            const active = sortable && key === sortBy;
            return (
              <Box key={`${label}-hdr`} sx={{ display: "flex", alignItems: "center" }}>
                {sortable ? (
                  <TableSortLabel active={active} direction={active ? sortDir : "asc"} onClick={() => toggleSort(key)}>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                      {label}
                    </Typography>
                  </TableSortLabel>
                ) : (
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    {label}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Rows */}
        {(tab === 0 ? loadingAssets : loadingHosted) && (
          <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={18} />
            <Typography color="text.secondary">Loading…</Typography>
          </Box>
        )}

        {(tab === 0 ? errorAssets : errorHosted) && (
          <Alert severity="error">{(tab === 0 ? errorAssets : errorHosted)?.message}</Alert>
        )}

        {pagedRows.map((row, idx) => (
          <Box
            key={row.id}
            sx={{
              display: "grid",
              gridTemplateColumns: tab === 0 ? GRID_ASSETS : GRID_HOSTED,
              alignItems: "center",
              columnGap: 1.5,
              px: 2,
              py: 1.25,
              "&:hover": { bgcolor: "#FAFAFD" },
            }}
          >
            {Object.entries(row).map(([k, v]) =>
              k === "id" ? null : (
                <Typography key={k} noWrap sx={{ color: "text.secondary" }}>
                  {v as any}
                </Typography>
              )
            )}

            {/* Quick Actions only for Assets */}
            {tab === 0 && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Edit">
                  <IconButton size="small" color="primary" onClick={() => handleEdit(row.id)}>
                    <MdEdit size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                    <MdDelete size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        ))}

        {/* Pagination */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            bgcolor: "#FFFFFF",
            px: 2,
            py: 1,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <TablePagination
            component="div"
            count={visibleRows.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
            showFirstButton
            showLastButton
          />
        </Box>
      </Box>
    </Box>
  );
}
