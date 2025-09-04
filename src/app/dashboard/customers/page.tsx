// app/dashboard/customers/page.tsx
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
  Link,
  CircularProgress,
  Alert,
} from "@mui/material";
import { MdSearch, MdPersonAdd, MdInventory2, MdEdit, MdDelete } from "react-icons/md";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import {addAsset} from "@/styles/icons";
import Image from "next/image";


// ===== Grid layout =====
const GRID_COLS = "repeat(9, minmax(140px, 1fr))";
const HEADER_MIN_WIDTH = 9 * 140;

type Customer = {
  id: string;
  name: string;
  city?: string;
  website?: string;
  phone?: string;
  assignedTo?: string;
  openOrders?: number;
  openQuotes?: number;
};

type SortKey = "name" | "city" | "assignedTo";
type SortDir = "asc" | "desc";

const headerCols: Array<{
  key: SortKey | "company" | "website" | "phone" | "actions";
  label: string;
  sortable?: boolean;
}> = [
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

// ✅ Inline hook
function useCustomers() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch(apiURL("accounts", "accounts.json"), {
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

export default function CustomersPage() {
  const [tab, setTab] = useState(0);
  const { data, isLoading, error } = useCustomers();

  // ===== Transform backend response =====
  const allCustomers: Customer[] = useMemo(() => {
    if (!data?.accounts) return [];
    return data.accounts.map((a: any) => ({
      id: String(a.account_id),
      name: a.name,
      city: a.city ?? "",
      website: a.website ?? "",
      phone: a.phone ?? "",
      assignedTo: a.assigned_to != null ? `User ${a.assigned_to}` : "",
      openOrders: 0,
      openQuotes: 0,
    }));
  }, [data]);

  // ===== Search =====
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = useMemo(() => {
    if (!searchQuery) return allCustomers;
    return allCustomers.filter((c) =>
      `${c.name} ${c.city} ${c.website} ${c.phone} ${c.assignedTo}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [allCustomers, searchQuery]);

  // ===== Sorting =====
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const toggleSort = (key: SortKey) => {
    if (key === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = String((a as any)[sortBy] ?? "").toLowerCase();
      const bv = String((b as any)[sortBy] ?? "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortBy, sortDir]);

  // ===== Pagination =====
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const pagedCustomers = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const total = sorted.length;

  // ===== Actions =====
  const handleAddCustomer = () => {};
  const handleEditCustomer = (id: string) => console.log("Edit customer:", id);
  const handleDeleteCustomer = (id: string) => {
    if (window.confirm("Delete this customer?")) console.log("Delete customer:", id);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* === TOP ROW === */}
      <Box sx={{ display: "flex", alignItems: "stretch", gap: 1, bgcolor: "#FFFFFF", borderRadius: 1, p: 0 }}>
      <Box sx={{ flex: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Customers" />
            <Tab label="End of life" />
          </Tabs>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
              {isLoading ? "Loading…" : `${total} Customers`}
            </Typography>
            <TextField sx={{ width: 280 }}
              placeholder="Search for Customer name"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Add Customer">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 0.25 }}>
                <IconButton color="primary" onClick={handleAddCustomer} sx={{ p: 0.5 }}>
                  <Image src={addAsset} alt="Add asset" width={36} height={36} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1 }}>
                  Add
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto" }}>
          <StatusCard title="Open Orders" value={25} total={100} icon={<MdInventory2 size={28} />} />
          <StatusCard title="Open Quotes" value={75} total={100} icon={<MdInventory2 size={28} />} />
        </Box>
      </Box>

      {error && <Alert severity="error">{(error as Error).message}</Alert>}

      {/* === TABLE === */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "#FFFFFF", borderRadius: 1 }}>
        {/* ✅ Header */}
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
            minWidth: HEADER_MIN_WIDTH,
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

        {/* ✅ Rows */}
        {isLoading && (
          <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={18} />
            <Typography color="text.secondary">Loading customers…</Typography>
          </Box>
        )}

        {!isLoading && !error && pagedCustomers.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No customers found.</Box>
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
          >
            <Typography noWrap sx={{ fontWeight: 500 }}>
              {c.name}
            </Typography>
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

        {/* ✅ Pagination */}
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
  );
}
