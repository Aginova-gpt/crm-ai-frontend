"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { MdSearch, MdPersonAdd, MdInventory2, MdEdit, MdDelete } from "react-icons/md";

import CrmNavbar from "@/components/crmNavbar";
import StatusCard from "@/components/StatusCard/StatusCard";

// ✅ Directly call Flask endpoint
const API_PATH =
  process.env.NODE_ENV === "development"
    ? "http://34.58.37.44/api/accounts"
    : "/api/accounts";

// ===== Grid: 9 equal columns; keep in sync for header + rows =====
const GRID_COLS = "repeat(9, minmax(140px, 1fr))";
const HEADER_MIN_WIDTH = 9 * 140;

type Customer = {
  id: string;
  name: string;
  company?: string;
  city?: string;
  website?: string;
  phone?: string;
  assignedTo?: string;
  openOrders?: number;
  openQuotes?: number;
};

type SortKey = "name" | "city" | "assignedTo";
type SortDir = "asc" | "desc";

const headerCols: Array<{ key: SortKey | "company" | "website" | "phone" | "actions"; label: string; sortable?: boolean }> = [
  { key: "name", label: "Name", sortable: true },
  { key: "company", label: "Company" },
  { key: "city", label: "City", sortable: true },
  { key: "website", label: "Website" },
  { key: "phone", label: "Phone" },
  { key: "assignedTo", label: "Assigned To", sortable: true },
  { key: "actions", label: "Open Orders" },
  { key: "actions", label: "Open Quotes" },
  { key: "actions", label: "Quick Actions" },
];

export default function DashboardPage() {
  const [tab, setTab] = useState(0);

  // ===== Data =====
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receivedTime, setReceivedTime] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setErrorMsg("Not logged in");
      setLoading(false);
      return;
    }

    fetch(API_PATH, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) throw new Error("Unauthorized – please log in again");
          throw new Error(`Request failed: ${r.status}`);
        }
        return r.json();
      })
      .then((json) => {
        // ✅ Transform Flask accounts → Customer objects
        const accounts = (json.accounts ?? []).map((a: any) => ({
          id: String(a.account_id),
          name: a.name,
          company: undefined,
          city: a.city ?? "",
          website: a.website ?? "",
          phone: a.phone ?? "",
          assignedTo: a.assigned_to != null ? `User ${a.assigned_to}` : "",
          openOrders: 0,
          openQuotes: 0,
        }));
        setAllCustomers(accounts);
        setReceivedTime(new Date().toISOString());
      })
      .catch((e) => setErrorMsg(e.message || "Failed to load accounts"))
      .finally(() => setLoading(false));
  }, []);

  const formattedReceivedTime = useMemo(() => {
    if (!receivedTime) return "—";
    return new Date(receivedTime).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }, [receivedTime]);

  // ===== Search (debounced) =====
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ===== Sorting =====
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const toggleSort = (key: SortKey) => {
    if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // ===== Pagination (client-side) =====
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return allCustomers;
    return allCustomers.filter((c) => {
      const hay = [
        c.name,
        c.company,
        c.city,
        c.website,
        c.phone,
        c.assignedTo,
        String(c.openOrders ?? ""),
        String(c.openQuotes ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(debouncedQuery);
    });
  }, [allCustomers, debouncedQuery]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = String((a as any)[sortBy] ?? "").toLowerCase();
      const bv = String((b as any)[sortBy] ?? "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  React.useEffect(() => setPage(0), [debouncedQuery, rowsPerPage, sortBy, sortDir]);

  const total = sorted.length;
  const pagedCustomers = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const handleAddCustomer = () => {};
  const handleEditCustomer = (id: string) => console.log("Edit customer:", id);
  const handleDeleteCustomer = (id: string) => {
    if (window.confirm("Delete this customer?")) console.log("Delete customer:", id);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <CrmNavbar />

      {/* Page content */}
      <Box sx={{ flex: 1, bgcolor: "#FFFFFF", p: { xs: 1.5, sm: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* === TOP ROW === */}
        <Box sx={{ display: "flex", alignItems: "stretch", gap: 2, bgcolor: "#FFFFFF", borderRadius: 1, p: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-start", gap: 1 }}>
            <Box sx={{ display: "inline-flex", flexDirection: "column", gap: 1, width: "fit-content", maxWidth: "100%" }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                orientation="horizontal"
                sx={{ minHeight: 32, "& .MuiTab-root": { minHeight: 32, py: 0, px: 1.25 }, "& .MuiTabs-indicator": { height: 2 } }}
              >
                <Tab label="Customers" />
              </Tabs>

              {tab === 0 && (
                <Box sx={{ display: "flex", alignItems: "center", columnGap: 1.5 }}>
                  <Typography component="span" sx={{ fontWeight: 900, fontSize: 16 }} aria-live="polite">
                    {loading ? "Loading…" : `${total} Customers`}
                  </Typography>
                  <Typography component="span" sx={{ opacity: 0.5 }}>•</Typography>
                  <Typography component="span" noWrap sx={{ fontSize: 14, color: "#00000099" }}>
                    Last updated : {formattedReceivedTime}
                  </Typography>
                </Box>
              )}

              {tab === 0 && (
                <TextField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers"
                  variant="outlined"
                  size="small"
                  aria-label="Search customers"
                  sx={{ width: "100%", borderRadius: 1.5 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><MdSearch size={18} /></InputAdornment> }}
                />
              )}
            </Box>

            {tab === 0 && (
              <Tooltip title="Add customer">
                <IconButton color="primary" onClick={handleAddCustomer} sx={{ alignSelf: "flex-end", p: 1 }}>
                  <MdPersonAdd size={32} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto", flexWrap: "wrap" }}>
            <StatusCard title="Open Orders" value={25} total={100} icon={<MdInventory2 size={28} />} />
            <StatusCard title="Open Quotes" value={75} total={100} icon={<MdInventory2 size={28} />} />
          </Box>
        </Box>

        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "#FFFFFF", borderRadius: 1 }}>
          <Box sx={{ minWidth: HEADER_MIN_WIDTH }}>
            {/* Header */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                bgcolor: "#EAF5FF",
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                columnGap: 2,
                px: 2,
                py: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
              role="row"
            >
              {headerCols.map(({ key, label, sortable }) => {
                const active = sortable && (key as SortKey) === sortBy;
                return (
                  <Box key={`${label}-hdr`} sx={{ display: "flex", alignItems: "center" }}>
                    {sortable ? (
                      <TableSortLabel active={active} direction={active ? sortDir : "asc"} onClick={() => toggleSort(key as SortKey)}>
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
            <Box role="rowgroup">
              {loading && allCustomers.length === 0 && (
                <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CircularProgress size={18} />
                  <Typography color="text.secondary">Loading customers…</Typography>
                </Box>
              )}

              {pagedCustomers.map((c, idx) => (
                <Box
                  key={c.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: GRID_COLS,
                    alignItems: "center",
                    columnGap: 2,
                    px: 2,
                    py: 1.25,
                    "&:hover": { bgcolor: "#FAFAFD" },
                  }}
                  role="row"
                >
                  <Typography noWrap sx={{ fontWeight: 500 }}>{c.name}</Typography>
                  <Typography noWrap sx={{ color: "text.secondary" }}>—</Typography>
                  <Typography noWrap sx={{ color: "text.secondary" }}>{c.city || "—"}</Typography>

                  {c.website ? (
                    <Link href={c.website} target="_blank" rel="noopener noreferrer" underline="hover" noWrap sx={{ color: "text.secondary" }}>
                      {c.website}
                    </Link>
                  ) : (
                    <Typography noWrap sx={{ color: "text.secondary" }}>—</Typography>
                  )}

                  {c.phone ? (
                    <Link href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} underline="hover" noWrap sx={{ color: "text.secondary" }}>
                      {c.phone}
                    </Link>
                  ) : (
                    <Typography noWrap sx={{ color: "text.secondary" }}>—</Typography>
                  )}

                  <Typography noWrap sx={{ color: "text.secondary" }}>{c.assignedTo || "—"}</Typography>
                  <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{c.openOrders ?? 0}</Typography>
                  <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{c.openQuotes ?? 0}</Typography>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleEditCustomer(c.id)}>
                        <MdEdit size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteCustomer(c.id)}>
                        <MdDelete size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {idx < pagedCustomers.length - 1 && <Divider sx={{ gridColumn: "1 / -1" }} />}
                </Box>
              ))}

              {!loading && pagedCustomers.length === 0 && (
                <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No customers found.</Box>
              )}
            </Box>

            <Box sx={{ position: "sticky", bottom: 0, bgcolor: "#FFFFFF", px: 2, py: 1, borderTop: "1px solid", borderColor: "divider" }}>
              <TablePagination
                component="div"
                count={total}
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
      </Box>
    </Box>
  );
}
