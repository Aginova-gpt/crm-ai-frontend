"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    CircularProgress,
    TablePagination,
    TableSortLabel,
    Alert,
    Tabs,
    Tab,
} from "@mui/material";
import { MdSearch } from "react-icons/md";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";

// ===== Grid layout =====
const GRID_ORDERS = `
  minmax(100px, 1fr)   /* Order # */
  minmax(80px, 1fr)    /* RMA */
  minmax(180px, 1fr)   /* Customer */
  minmax(220px, 1fr)   /* Products */
  minmax(140px, 1fr)   /* Run Status */
  minmax(100px, 1fr)   /* Quantity */
  minmax(100px, 1fr)   /* PO# */
  minmax(120px, 1fr)   /* Status */
  minmax(110px, 1fr)   /* Created */
  minmax(110px, 1fr)   /* Due In */
  minmax(120px, 1fr)   /* Subscription */
  minmax(120px, 1fr)   /* Invoice */
  minmax(100px, 1fr)   /* Certs */
  minmax(140px, 1fr)   /* Actions */
`;

// ===== Column definitions =====
const orderCols = [
    { key: "orderId", label: "Order #", sortable: true },
    { key: "rma", label: "RMA" },
    { key: "customer", label: "Customer" },
    { key: "products", label: "Products" },
    { key: "runStatus", label: "Run Status" },
    { key: "quantity", label: "Quantity" },
    { key: "po", label: "PO#" },
    { key: "status", label: "Status" },
    { key: "created", label: "Created", sortable: true },
    { key: "dueIn", label: "Due In" },
    { key: "subscription", label: "Subscription" },
    { key: "invoice", label: "Invoice" },
    { key: "certs", label: "Certs" },
    { key: "actions", label: "Actions" },
];

// ===== Hook to fetch orders =====
function useOrders() {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["orders"],
        queryFn: async () => {
            const res = await fetch(apiURL("orders", "orders.json"), {
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

export default function OrdersPage() {
    const { data, isLoading, error } = useOrders();
    const [tab, setTab] = useState(0); // 0 = Orders, 1 = Reports

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("orderId");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const toggleSort = (key: string) => {
        if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortBy(key);
            setSortDir("asc");
        }
    };

    const orders = useMemo(() => data?.orders ?? [], [data]);
    const lastUpdate = useMemo(() => new Date().toLocaleTimeString(), [data]);

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

    const visibleRows = filterAndSort(orders);
    const pagedRows = visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 0 }}>
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
                {/* Left: tabs + search */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
                        <Tab label="Orders" />
                        <Tab label="Reports" />
                    </Tabs>

                    {tab === 0 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {/* Count + Last update */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
                                    {isLoading ? "Loading…" : `${orders.length} Orders`}
                                </Typography>
                                <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
                                    Last update: {lastUpdate}
                                </Typography>
                            </Box>

                            {/* Search bar below */}
                            <TextField
                                sx={{ width: 280 }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search orders"
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MdSearch size={18} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    )}

                </Box>

                {/* Right: status cards (only for Orders tab) */}
                {tab === 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <StatusCard title="Process Order" value={1} total={1} />
                        <StatusCard title="Shipped This Month" value={5} total={20} />
                        <StatusCard title="Shipped Last Week" value={2} total={9} />
                        <StatusCard title="Ready To Invoice" value={3} total={3} />
                    </Box>
                )}
            </Box>

            {/* Table or Reports */}
            {tab === 0 ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "#FFFFFF", borderRadius: 1 }}>
                    {/* Header */}
                    <Box
                        sx={{
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                            bgcolor: "#EAF5FF",
                            display: "grid",
                            gridTemplateColumns: GRID_ORDERS,
                            columnGap: 1.5,
                            px: 2,
                            py: 1,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        {orderCols.map(({ key, label, sortable }) => {
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
                    {isLoading && (
                        <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                            <CircularProgress size={18} />
                            <Typography color="text.secondary">Loading…</Typography>
                        </Box>
                    )}

                    {error && <Alert severity="error">{error.message}</Alert>}

                    {pagedRows.map((row) => (
                        <Box
                            key={row.orderId}
                            sx={{
                                display: "grid",
                                gridTemplateColumns: GRID_ORDERS,
                                alignItems: "center",
                                columnGap: 1.5,
                                px: 2,
                                py: 1.25,
                                "&:hover": { bgcolor: "#FAFAFD" },
                            }}
                        >
                            {orderCols.map((col) => (
                                <Typography key={col.key} noWrap sx={{ color: "text.secondary" }}>
                                    {row[col.key] ?? ""}
                                </Typography>
                            ))}
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
                            rowsPerPageOptions={[20, 50, 100]}
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        bgcolor: "#FFFFFF",
                        borderRadius: 1,
                        p: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                    }}
                >
                    <Typography>Reports content will go here…</Typography>
                </Box>
            )}
        </Box>
    );
}
