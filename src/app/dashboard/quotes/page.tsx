"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  TablePagination,
  TableSortLabel,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import { MdSearch, MdOpenInNew } from "react-icons/md";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import { useCompany } from "@/contexts/CompanyContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { addAsset } from "@/styles/icons";

const GRID_QUOTES = `
  minmax(90px, 1fr)    /* Quote # */
  minmax(180px, 1.8fr) /* Subject */
  minmax(180px, 1.4fr) /* Customer */
  minmax(220px, 2fr)   /* Products */
  minmax(80px, 0.8fr)  /* Quantity */
  minmax(110px, 1fr)   /* Status */
  minmax(130px, 1fr)   /* Created At */
  minmax(130px, 1fr)   /* Created By */
  minmax(120px, 1fr)   /* Valid Till */
  minmax(110px, 1fr)   /* Order ID */
  minmax(110px, 1fr)   /* Total */
  minmax(110px, 0.8fr) /* Actions */
`;

const quoteCols = [
  { key: "quoteNumber", label: "Quote #", sortable: true },
  { key: "subject", label: "Quote Subject" },
  { key: "customer", label: "Customer" },
  { key: "products", label: "Products" },
  { key: "quantity", label: "Quantity" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created At", sortable: true },
  { key: "createdBy", label: "Created By" },
  { key: "validTill", label: "Valid Till" },
  { key: "orderId", label: "Order ID" },
  { key: "total", label: "Total" },
  { key: "actions", label: "Actions" },
];

type QuoteRecord = {
  quoteId: string;       // unified quote_id for routing
  quoteNumber: string;   // DISPLAY ID (legacy_quote_id if present, else quote_id)
  subject?: string;
  customer?: string;
  products?: string;
  quantity?: string;
  status?: string;
  createdAt?: string;
  createdBy?: string;
  validTill?: string;
  orderId?: string;
  total?: string;
  companyId?: string;
  raw?: any;
  [key: string]: unknown;
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

// New API shape: { success, company_id, total_quotes, monthly_quotes, ytd_quotes, accepted_quotes, quotes: [...] }
function extractQuotes(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.quotes)) return payload.quotes;
  return [];
}

// Use the exact field names from the new get-quotes API
const normalizeQuote = (raw: any): QuoteRecord => {
  const unifiedId = raw.quote_id;           // main DB ID
  const legacyId = raw.legacy_quote_id;     // from legacy_mappings
  const companyId = raw.company_id;

  const productNames: string[] | undefined = Array.isArray(raw.product_names)
    ? raw.product_names
    : undefined;

  return {
    // For routing we always use the unified ID
    quoteId: unifiedId != null ? String(unifiedId) : "",

    // For display we prefer the legacy ID when present
    quoteNumber: String(legacyId ?? unifiedId ?? ""),

    subject: raw.subject ?? "",
    customer: raw.account_name ?? "",
    products:
      productNames && productNames.length ? productNames.join(", ") : "",
    // Line-level quantity not exposed in this API
    quantity: "",
    status: raw.quote_stage_name ?? "",
    createdAt: formatDate(raw.created_at),
    createdBy: raw.created_by_name ?? "",
    validTill: formatDate(raw.valid_till),
    // Not included in API right now; keep as empty for future
    orderId: "",
    total:
      raw.total != null
        ? String(raw.total)
        : "",
    companyId: companyId != null ? String(companyId) : undefined,
    raw,
  };
};

// ===== Hook to fetch quotes (same style as useOrders) =====
function useQuotes(selectedCompanyId?: string | null) {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["quotes", selectedCompanyId ?? "all"],
    queryFn: async () => {
      const companyParam =
        selectedCompanyId && selectedCompanyId !== "all"
          ? selectedCompanyId
          : undefined;
      if (!companyParam) return { quotes: [] };

      const path = `get-quotes?company_id=${encodeURIComponent(companyParam)}`;
      const res = await fetch(apiURL(path, "quotes.json"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled:
      isLoggedIn && !!token && !!selectedCompanyId && selectedCompanyId !== "all",
  });
}

export default function QuotesPage() {
  const router = useRouter();
  const {
    companies = [],
    selectedCompanyId,
    setSelectedCompanyId,
    isLoading: companyLoading,
  } = useCompany();

  const nonAllCompanies = useMemo(
    () => companies.filter((c) => c.id !== "all"),
    [companies]
  );

  useEffect(() => {
    if (
      (selectedCompanyId === null || selectedCompanyId === "all") &&
      nonAllCompanies.length > 0
    ) {
      setSelectedCompanyId(nonAllCompanies[0].id);
    }
  }, [nonAllCompanies, selectedCompanyId, setSelectedCompanyId]);

  const activeCompanyId =
    selectedCompanyId && selectedCompanyId !== "all"
      ? selectedCompanyId
      : nonAllCompanies[0]?.id ?? null;

  const { data, isLoading, error } = useQuotes(activeCompanyId);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("quoteNumber");
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
    return rows.map(normalizeQuote).filter((quote) => quote.quoteId || quote.quoteNumber);
  }, [data]);

  const quotes = useMemo(() => {
    if (!activeCompanyId) return allQuotes;
    return allQuotes.filter(
      (quote) => !quote.companyId || quote.companyId === activeCompanyId
    );
  }, [activeCompanyId, allQuotes]);

  const lastUpdate = useMemo(
    () => new Date().toLocaleTimeString(),
    [data]
  );

  const handleAddQuote = () => router.push("/dashboard/quotes/new");
  const handleViewQuote = (quoteId: string) =>
    router.push(`/dashboard/quotes/${encodeURIComponent(quoteId)}`);

  const filterAndSort = (rows: QuoteRecord[]) => {
    const filtered = rows.filter((r) =>
      Object.values(r)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const av = String(a[sortBy] ?? "").toLowerCase();
      const bv = String(b[sortBy] ?? "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  };

  const visibleRows = filterAndSort(quotes);
  const pagedRows = visibleRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Stats from API (with safe fallbacks)
  const totalQuotes: number = data?.total_quotes ?? quotes.length;
  const monthlyQuotes: number = data?.monthly_quotes ?? 0;
  const ytdQuotes: number = data?.ytd_quotes ?? 0;
  const acceptedQuotes: number = data?.accepted_quotes ?? 0;

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
        {/* Left: Tabs + counts + search */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Tabs
            value={0}
            sx={{ minHeight: 36, "& .MuiTab-root": { textTransform: "none" } }}
          >
            <Tab label="Quotes" />
          </Tabs>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Count + Last update */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
                {isLoading ? "Loading…" : `${totalQuotes} Quotes`}
              </Typography>
              <Typography
                sx={{ fontSize: "12px", color: "text.secondary" }}
              >
                Last update: {lastUpdate}
              </Typography>
            </Box>

            {/* Filters / company / search / add */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                flexWrap: "wrap",
              }}
            >
              <FormControl
                size="small"
                sx={{ minWidth: 200 }}
                disabled={companyLoading || nonAllCompanies.length === 0}
              >
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 0.25,
                  }}
                >
                  <IconButton
                    color="primary"
                    onClick={handleAddQuote}
                    sx={{ p: 0.5 }}
                  >
                    <Image
                      src={addAsset}
                      alt="Add quote"
                      width={36}
                      height={36}
                    />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 11, lineHeight: 1 }}
                  >
                    Add
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Right: Status cards (from API stats) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StatusCard
            title="Current Month"
            value={monthlyQuotes}
            total={totalQuotes || 1}
          />
          <StatusCard
            title="Year till Date"
            value={ytdQuotes}
            total={totalQuotes || 1}
          />
          <StatusCard
            title="Accepted"
            value={acceptedQuotes}
            total={totalQuotes || 1}
          />
        </Box>
      </Box>

      {/* Table */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          bgcolor: "#FFFFFF",
          borderRadius: 1,
        }}
      >
        {/* Header row */}
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
              <Box
                key={`${label}-hdr`}
                sx={{ display: "flex", alignItems: "center" }}
              >
                {sortable ? (
                  <TableSortLabel
                    active={active}
                    direction={active ? sortDir : "asc"}
                    onClick={() => toggleSort(key)}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      {label}
                    </Typography>
                  </TableSortLabel>
                ) : (
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, textTransform: "uppercase" }}
                  >
                    {label}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Loading / error */}
        {isLoading && (
          <Box
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <CircularProgress size={18} />
            <Typography color="text.secondary">Loading…</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error">{(error as Error).message}</Alert>
        )}

        {/* Rows */}
        {pagedRows.map((row) => (
          <Box
            key={row.quoteId || row.quoteNumber}
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
            {quoteCols.map((col) => {
              if (col.key === "actions") {
                return (
                  <Box key="actions" sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="View Quote">
                      <IconButton
                        size="small"
                        color="primary"
                        // Use unified quoteId for routing; fallback to quoteNumber just in case
                        onClick={() =>
                          handleViewQuote(row.quoteId || row.quoteNumber)
                        }
                      >
                        <MdOpenInNew size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              }
              return (
                <Typography
                  key={col.key}
                  noWrap
                  sx={{ color: "text.secondary" }}
                >
                  {String(row[col.key] ?? "")}
                </Typography>
              );
            })}
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
            onRowsPerPageChange={(e) =>
              setRowsPerPage(parseInt(e.target.value, 10))
            }
            rowsPerPageOptions={[20, 50, 100]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} of ${count}`
            }
            showFirstButton
            showLastButton
          />
        </Box>
      </Box>
    </Box>
  );
}
