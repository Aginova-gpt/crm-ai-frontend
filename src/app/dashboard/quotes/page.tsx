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
const GRID_QUOTES = `
  minmax(100px, 1fr)   /* Quote # */
  minmax(180px, 1fr)   /* Customer */
  minmax(220px, 1fr)   /* Products */
  minmax(120px, 1fr)   /* Status */
  minmax(140px, 1fr)   /* Total */
  minmax(110px, 1fr)   /* Created */
  minmax(110px, 1fr)   /* Expiry Date */
  minmax(140px, 1fr)   /* Actions */
`;

// ===== Column definitions =====
const quoteCols = [
    { key: "quoteId", label: "Quote #", sortable: true },
    { key: "customer", label: "Customer" },
    { key: "products", label: "Products" },
    { key: "status", label: "Status" },
    { key: "total", label: "Total" },
    { key: "created", label: "Created", sortable: true },
    { key: "expiryDate", label: "Expiry Date" },
    { key: "actions", label: "Actions" },
];

// ===== Types & helpers =====
type QuoteRecord = {
    quoteId: string;
    customer?: string;
    products?: string;
    status?: string;
    total?: string;
    created?: string;
    expiryDate?: string;
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

function getCreatedDate(quote: QuoteRecord): Date | null {
    const raw = quote.raw;
    if (!raw) return null;
    
    const dateValue = raw?.created_at ?? raw?.created_date ?? raw?.date_created ?? raw?.created;
    if (!dateValue) return null;
    
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? null : date;
}

function extractQuotes(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;

    const candidates = [
        payload.quotes,
        payload.data?.quotes,
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

function normalizeQuote(raw: any): QuoteRecord {
    const companyId =
        raw?.company_id ??
        raw?.companyId ??
        raw?.company?.id ??
        raw?.company?.company_id ??
        raw?.company;
    const companyName = raw?.company_name ?? raw?.companyName ?? raw?.company?.name ?? raw?.company?.company_name;

    // Format total amount
    const formatTotal = (value: any): string => {
        if (value === null || value === undefined) return "";
        const num = typeof value === "number" ? value : parseFloat(String(value));
        if (Number.isNaN(num)) return String(value ?? "");
        return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format products list
    const formatProducts = (value: any): string => {
        if (Array.isArray(value)) {
            return value.map((p: any) => p?.name ?? p?.product_name ?? p).filter(Boolean).join(", ");
        }
        if (typeof value === "string") return value;
        if (value?.products_list) return value.products_list;
        if (value?.products) return String(value.products);
        return "";
    };

    return {
        quoteId: String(raw?.quote_id ?? raw?.quote_number ?? raw?.quoteId ?? raw?.id ?? ""),
        customer: raw?.account_name ?? raw?.customer_name ?? raw?.customer ?? raw?.account?.name ?? "",
        products: formatProducts(raw?.products ?? raw?.items ?? raw?.line_items ?? raw?.products_list),
        status: raw?.status ?? raw?.quote_status ?? "",
        total: formatTotal(raw?.total ?? raw?.total_amount ?? raw?.amount),
        created: formatDate(raw?.created_at ?? raw?.created_date ?? raw?.date_created ?? raw?.created),
        expiryDate: formatDate(raw?.expiry_date ?? raw?.expires_at ?? raw?.valid_until ?? raw?.expiry),
        actions: raw?.actions ?? "",
        companyId: companyId ? String(companyId) : undefined,
        companyName: companyName ? String(companyName) : undefined,
        raw,
    };
}

// ===== Hook to fetch quotes =====
function useQuotes(selectedCompanyId?: string | null) {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["quotes", selectedCompanyId ?? "all"],
        queryFn: async () => {
            const companyParam = selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : undefined;
            if (!companyParam) return { quotes: [] };

            const path = `get-quotes?company_id=${encodeURIComponent(companyParam)}`;
            const res = await fetch(apiURL(path, "get-quotes.json"), {
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

    const { data, isLoading, error } = useQuotes(activeCompanyId);
    const [tab, setTab] = useState(0); // 0 = Quotes, 1 = Reports

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("quoteId");
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

    const allQuotes = useMemo(() => {
        const rows = extractQuotes(data);
        return rows.map(normalizeQuote).filter((quote) => quote.quoteId);
    }, [data]);
    const quotes = useMemo(() => {
        if (!activeCompanyId) return allQuotes;
        return allQuotes.filter((quote) => !quote.companyId || quote.companyId === activeCompanyId);
    }, [activeCompanyId, allQuotes]);
    const [lastUpdate, setLastUpdate] = useState<string>("");
    
    useEffect(() => {
        // Only set the time on the client side to avoid hydration mismatch
        setLastUpdate(new Date().toLocaleTimeString());
    }, [data]);
    
    const handleAddQuote = () => router.push("/dashboard/quotes/new");

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

    const visibleRows = filterAndSort(quotes);
    const pagedRows = visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Calculate status card metrics
    const currentMonthQuotes = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return quotes.filter((quote) => {
            const createdDate = getCreatedDate(quote);
            if (!createdDate) return false;
            return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
        }).length;
    }, [quotes]);

    const lastMonthQuotes = useMemo(() => {
        const now = new Date();
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        
        return quotes.filter((quote) => {
            const createdDate = getCreatedDate(quote);
            if (!createdDate) return false;
            return createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear;
        }).length;
    }, [quotes]);

    const yearToDateQuotes = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        return quotes.filter((quote) => {
            const createdDate = getCreatedDate(quote);
            if (!createdDate) return false;
            return createdDate.getFullYear() === currentYear;
        }).length;
    }, [quotes]);

    const acceptedQuotes = useMemo(() => {
        return quotes.filter((quote) => quote.status?.toLowerCase() === "accepted").length;
    }, [quotes]);

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
                        <Tab label="Quotes" />
                        <Tab label="Reports" />
                    </Tabs>

                    {tab === 0 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {/* Count + Last update */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
                                    {isLoading ? "Loading…" : `${quotes.length} Quotes`}
                                </Typography>
                                {lastUpdate && (
                                    <Typography sx={{ fontSize: "12px", color: "text.secondary" }} suppressHydrationWarning>
                                        Last update: {lastUpdate}
                                    </Typography>
                                )}
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
                                    placeholder="Search quotes"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <MdSearch size={18} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Tooltip title="Add Quote">
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 0.25 }}>
                                        <IconButton color="primary" onClick={handleAddQuote} sx={{ p: 0.5 }}>
                                            <Image src={addAsset} alt="Add quote" width={36} height={36} />
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

                {/* Right: status cards (only for Quotes tab) */}
                {tab === 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <StatusCard title="Current Month" value={currentMonthQuotes} total={quotes.length} />
                        <StatusCard title="Last Month" value={lastMonthQuotes} total={quotes.length} />
                        <StatusCard title="Year to Date" value={yearToDateQuotes} total={quotes.length} />
                        <StatusCard title="Accepted" value={acceptedQuotes} total={quotes.length} />
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
                            gridTemplateColumns: GRID_QUOTES,
                            columnGap: 1.5,
                            px: 2,
                            py: 1,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        {quoteCols.map(({ key, label, sortable }) => {
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
                            key={row.quoteId}
                            sx={{
                                display: "grid",
                                gridTemplateColumns: GRID_QUOTES,
                                alignItems: "center",
                                columnGap: 1.5,
                                px: 2,
                                py: 1.25,
                                "&:hover": { bgcolor: "#FAFAFD" },
                            }}
                        >
                            {quoteCols.map((col) => (
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
