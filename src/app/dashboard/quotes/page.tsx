"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
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
    IconButton,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { MdSearch } from "react-icons/md";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { addAsset } from "@/styles/icons";
import { useCompany } from "@/contexts/CompanyContext";

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

// ===== Types & helpers =====
type OrderRecord = {
    orderId: string;
    rma?: string;
    customer?: string;
    products?: string;
    runStatus?: string;
    quantity?: string;
    po?: string;
    status?: string;
    created?: string;
    dueIn?: string;
    subscription?: string;
    invoice?: string;
    certs?: string;
    actions?: string;
    companyId?: string;
    companyName?: string;
    [key: string]: unknown;
};

function formatDate(value: string | null | undefined) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function extractOrders(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;

    const candidates = [
        payload.orders,
        payload.salesorders,
        payload.data?.orders,
        payload.data?.salesorders,
        payload.data,
        payload.results,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
    }

    if (typeof payload === "object") {
        const arrays = Object.values(payload).filter((value) => Array.isArray(value));
        if (arrays.length) {
            return arrays.reduce<any[]>((acc, arr: any) => acc.concat(arr), []);
        }
    }

    return [];
}

function normalizeOrder(raw: any): OrderRecord {
    const companyId =
        raw?.company_id ??
        raw?.companyId ??
        raw?.company?.id ??
        raw?.company?.company_id ??
        raw?.company;
    const companyName = raw?.company_name ?? raw?.companyName ?? raw?.company?.name ?? raw?.company?.company_name;

    return {
        orderId: String(raw?.order_id ?? raw?.legacy_order_id ?? raw?.orderId ?? ""),
        rma: raw?.rma ?? raw?.rma_number ?? "",
        customer: raw?.account_name ?? raw?.customer ?? raw?.customer_name ?? "",
        products: raw?.products_list ?? raw?.products ?? raw?.product ?? "",
        runStatus: raw?.run_status ?? raw?.runStatus ?? "",
        quantity: raw?.quantity ?? raw?.qty ?? "",
        po: raw?.po_number ?? raw?.po ?? "",
        status: raw?.status ?? "",
        created: formatDate(raw?.created_at ?? raw?.created_date ?? raw?.created),
        dueIn: formatDate(raw?.due_date ?? raw?.dueIn ?? raw?.due),
        subscription: raw?.subscription ?? "",
        invoice: raw?.invoice ?? "",
        certs: raw?.certs ?? "",
        actions: raw?.actions ?? "",
        companyId: companyId ? String(companyId) : undefined,
        companyName: companyName ? String(companyName) : undefined,
        raw,
    };
}

// ===== Hook to fetch orders =====
function useOrders(selectedCompanyId?: string | null) {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["orders", selectedCompanyId ?? "all"],
        queryFn: async () => {
            const companyParam = selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : undefined;
            if (!companyParam) return { orders: [] };

            const path = `salesorders?company_id=${encodeURIComponent(companyParam)}`;
            const res = await fetch(apiURL(path, "orders.json"), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                throw new Error(`Request failed: ${res.status}`);
            }
            return res.json();
        },
        enabled: isLoggedIn && !!token && !!selectedCompanyId && selectedCompanyId !== "all",
    });
}

export default function OrdersPage() {
    const router = useRouter();
    const {
        companies = [],
        selectedCompanyId,
        setSelectedCompanyId,
        isLoading: companyLoading,
    } = useCompany();
    const nonAllCompanies = useMemo(() => companies.filter((c) => c.id !== "all"), [companies]);

    useEffect(() => {
        if ((selectedCompanyId === null || selectedCompanyId === "all") && nonAllCompanies.length > 0) {
            setSelectedCompanyId(nonAllCompanies[0].id);
        }
    }, [nonAllCompanies, selectedCompanyId, setSelectedCompanyId]);

    const activeCompanyId =
        selectedCompanyId && selectedCompanyId !== "all"
            ? selectedCompanyId
            : nonAllCompanies[0]?.id ?? null;

    const { data, isLoading, error } = useOrders(activeCompanyId);
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

    const allOrders = useMemo(() => {
        const rows = extractOrders(data);
        return rows.map(normalizeOrder).filter((order) => order.orderId);
    }, [data]);
    const orders = useMemo(() => {
        if (!activeCompanyId) return allOrders;
        return allOrders.filter((order) => !order.companyId || order.companyId === activeCompanyId);
    }, [activeCompanyId, allOrders]);
    const lastUpdate = useMemo(() => new Date().toLocaleTimeString(), [data]);
    const handleAddOrder = () => router.push("/dashboard/orders/new");

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
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
                                <FormControl size="small" sx={{ minWidth: 200 }} disabled={companyLoading || nonAllCompanies.length === 0}>
                                    <InputLabel>Company</InputLabel>
                                    <Select
                                        label="Company"
                                        value={activeCompanyId ?? ""}
                                        onChange={(e) => {
                                            const value = String(e.target.value);
                                            setSelectedCompanyId(value || null);
                                        }}
                                    >
                                        {nonAllCompanies.map((company) => (
                                            <MenuItem key={company.id} value={company.id}>
                                                {company.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
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
                                <Tooltip title="Add Order">
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 0.25 }}>
                                        <IconButton color="primary" onClick={handleAddOrder} sx={{ p: 0.5 }}>
                                            <Image src={addAsset} alt="Add order" width={36} height={36} />
                                        </IconButton>
                                        <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1 }}>
                                            Add
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            </Box>
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
