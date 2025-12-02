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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { MdSearch, MdEdit, MdShoppingCart } from "react-icons/md";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import { useCompany } from "@/contexts/CompanyContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { addAsset } from "@/styles/icons";
import { computeAxisValue } from "@mui/x-charts/internals";
import SnackView from "@/components/SnackView";
import { AlertColor } from "@mui/material";

const GRID_QUOTES = `
  minmax(90px, 1fr)    /* Quote # */
  minmax(180px, 1.8fr) /* Subject */
  minmax(180px, 1.4fr) /* Customer */
  minmax(220px, 2fr)   /* Products */
  minmax(110px, 1fr)   /* Status */
  minmax(130px, 1fr)   /* Created At */
  minmax(120px, 1fr)   /* Valid Till */
  minmax(130px, 1fr)   /* Created By */
  minmax(110px, 1fr)   /* Total */
  minmax(110px, 0.8fr) /* Actions */
`;

const quoteCols = [
  { key: "quoteNumber", label: "Quote #", sortable: true },
  { key: "subject", label: "Subject" },
  { key: "customer", label: "Customer" },
  { key: "products", label: "Products" },
  { key: "status", label: "Stage", sortable: true },
  { key: "createdAt", label: "Created At", sortable: true },
  { key: "validTill", label: "Valid Till" },
  { key: "createdBy", label: "Created By" },
  { key: "total", label: "Total" },
  { key: "actions", label: "Actions" },
];

type QuoteRecord = {
  quoteId: string;       
  quoteNumber: string;   
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

function extractQuotes(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.quotes)) return payload.quotes;
  return [];
}

const normalizeQuote = (raw: any): QuoteRecord => {
  const unifiedId = raw.quote_id;           
  const legacyId = raw.legacy_quote_id;     
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
    queryKey: ["quotes", selectedCompanyId ?? null],
    queryFn: async () => {
      const companyParam = selectedCompanyId;
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
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { apiURL } = useBackend();
  const {
    companies = [],
    selectedCompanyId,
    setSelectedCompanyId,
    isLoading: companyLoading,
  } = useCompany();

  useEffect(() => {
    if (selectedCompanyId === null && companies.length > 0 && companies[0]?.id) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId, setSelectedCompanyId]);

  const activeCompanyId = selectedCompanyId?? (companies[0]?.id ?? null);

  // Reset filter when company changes
  useEffect(() => {
    setStatusFilter(null);
    setPage(0);
  }, [activeCompanyId]);

  const { data, isLoading, error } = useQuotes(activeCompanyId);

  // Convert quote to order mutation
  const convertToOrderMutation = useMutation({
    mutationFn: async ({ quoteId, companyId }: { quoteId: string; companyId: string }) => {
      const convertApiUrl = "quote-to-order";
      const res = await fetch(apiURL(convertApiUrl, "quote-to-order"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quote_id: quoteId,
          company_id: companyId,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to convert quote: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Extract order ID from response - API returns salesorder.salesorder_id
      const orderId = 
        data?.salesorder?.salesorder_id ||
        data?.salesorder?.salesorderId ||
        data?.salesorder_id ||
        data?.order_id ||
        data?.orderId ||
        data?.id;
      
      if (!orderId) {
        console.error("Could not find order ID in response. Full response:", data);
        setSnackMessage({
          type: "error",
          message: "Order created but could not retrieve order ID. Please check the console for details.",
        });
        setConvertDialogOpen(false);
        setQuoteToConvert(null);
        return;
      }
      
      // Convert orderId to string to ensure proper encoding
      const orderIdString = String(orderId);
      
      // Show success message
      setSnackMessage({
        type: "success",
        message: `Order created from quote ${quoteToConvert?.quoteNumber || variables.quoteId}`,
      });
      
      // Close dialog
      setConvertDialogOpen(false);
      setQuoteToConvert(null);
      
      // Invalidate orders query to refresh the orders list
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      // Navigate to order edit page immediately
      router.push(`/dashboard/orders/${encodeURIComponent(orderIdString)}/edit`);
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to convert quote to order",
      });
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("quoteNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<"currentMonth" | "ytd" | "accepted" | "created" | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [quoteToConvert, setQuoteToConvert] = useState<QuoteRecord | null>(null);
  const [snackMessage, setSnackMessage] = useState<{ type: AlertColor; message: string } | null>(null);

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

  const [lastUpdate, setLastUpdate] = useState<string>("--:--:--");
  
  useEffect(() => {
    // Only set time on client side to avoid hydration mismatch
    setLastUpdate(new Date().toLocaleTimeString());
  }, [data]);

  const handleAddQuote = () => router.push("/dashboard/quotes/add-quote");
  const handleViewQuote = (quoteId: string) =>
    router.push(`/dashboard/quotes/${encodeURIComponent(quoteId)}/edit`);
  
  const handleConvertToOrder = (quote: QuoteRecord) => {
    setQuoteToConvert(quote);
    setConvertDialogOpen(true);
  };

  const handleConfirmConvert = () => {
    if (!quoteToConvert || !quoteToConvert.quoteId || !activeCompanyId) {
      setSnackMessage({
        type: "error",
        message: "Missing quote ID or company ID",
      });
      setConvertDialogOpen(false);
      return;
    }
    convertToOrderMutation.mutate({
      quoteId: quoteToConvert.quoteId,
      companyId: activeCompanyId,
    });
  };

  const handleCancelConvert = () => {
    setConvertDialogOpen(false);
    setQuoteToConvert(null);
  };

  const filterAndSort = (rows: QuoteRecord[]) => {
    let filtered = rows;

    // Apply status filter first
    if (statusFilter === "currentMonth") {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = filtered.filter((r) => {
        if (!r.raw?.created_at) return false;
        const date = new Date(r.raw.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (statusFilter === "ytd") {
      const now = new Date();
      const currentYear = now.getFullYear();
      filtered = filtered.filter((r) => {
        if (!r.raw?.created_at) return false;
        const date = new Date(r.raw.created_at);
        return date.getFullYear() === currentYear;
      });
    } else if (statusFilter === "accepted") {
      filtered = filtered.filter((r) => {
        const status = String(r.status ?? "").toLowerCase();
        return status.includes("accepted") || status.includes("accept");
      });
    } else if (statusFilter === "created") {
      filtered = filtered.filter((r) => {
        const status = String(r.status ?? "").toLowerCase();
        return status.includes("created") || status === "create";
      });
    }

    // Apply search query filter
    filtered = filtered.filter((r) =>
      Object.values(r)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    // Sort
    return [...filtered].sort((a, b) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      
      // For quoteNumber, try numeric sorting first
      if (sortBy === "quoteNumber") {
        const aNum = Number(av);
        const bNum = Number(bv);
        // If both are valid numbers, sort numerically
        if (!isNaN(aNum) && !isNaN(bNum) && av !== "" && bv !== "") {
          return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        }
      }
      
      // For dates (createdAt, validTill), parse and compare as dates
      if (sortBy === "createdAt" || sortBy === "validTill") {
        const aDate = av ? new Date(a.raw?.[sortBy === "createdAt" ? "created_at" : "valid_till"] || av) : null;
        const bDate = bv ? new Date(b.raw?.[sortBy === "createdAt" ? "created_at" : "valid_till"] || bv) : null;
        if (aDate && bDate && !isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return sortDir === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
        }
      }
      
      // For total, try numeric sorting
      if (sortBy === "total") {
        const aNum = parseFloat(String(av).replace(/[^0-9.-]/g, ""));
        const bNum = parseFloat(String(bv).replace(/[^0-9.-]/g, ""));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        }
      }
      
      // Default to string comparison
      const avStr = String(av).toLowerCase();
      const bvStr = String(bv).toLowerCase();
      return sortDir === "asc" ? avStr.localeCompare(bvStr) : bvStr.localeCompare(avStr);
    });
  };

  const visibleRows = filterAndSort(quotes);
  const pagedRows = visibleRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Stats from API (with safe fallbacks)
  const totalQuotes: number = data?.total_quotes != null ? Number(data.total_quotes) : quotes.length;
  const monthlyQuotes: number = data?.monthly_quotes != null ? Number(data.monthly_quotes) : 0;
  const ytdQuotes: number = data?.ytd_quotes != null ? Number(data.ytd_quotes) : 0;
  const acceptedQuotes: number = data?.accepted_quotes != null ? Number(data.accepted_quotes) : 0;
  
  // Calculate created quotes count
  const createdQuotes: number = useMemo(() => {
    return quotes.filter((q) => {
      const status = String(q.status ?? "").toLowerCase();
      return status.includes("created") || status === "create";
    }).length;
  }, [quotes]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 0 }}>
      {/* Header row */}
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          bgcolor: "#FFFFFF", borderRadius: 1, px: 1.5, py: 1, }}
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
                suppressHydrationWarning
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
                disabled={companyLoading || companies.length === 0}
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
                  {companies.map((company) => (
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
          <Box
            onClick={() => {
              setStatusFilter(statusFilter === "currentMonth" ? null : "currentMonth");
              setPage(0);
            }}
            sx={{
              cursor: "pointer",
              border:
                statusFilter === "currentMonth"
                  ? "2px solid #1976d2"
                  : "2px solid transparent",
              borderRadius: 1,
              transition: "border 0.2s",
            }}
          >
            <StatusCard
              title="Current Month"
              value={monthlyQuotes}
              selected={statusFilter === "currentMonth"}
            />
          </Box>
          <Box
            onClick={() => {
              setStatusFilter(statusFilter === "ytd" ? null : "ytd");
              setPage(0);
            }}
            sx={{
              cursor: "pointer",
              border:
                statusFilter === "ytd"
                  ? "2px solid #1976d2"
                  : "2px solid transparent",
              borderRadius: 1,
              transition: "border 0.2s",
            }}
          >
            <StatusCard
              title="Year till Date"
              value={ytdQuotes}
              selected={statusFilter === "ytd"}
            />
          </Box>
          <Box
            onClick={() => {
              setStatusFilter(statusFilter === "accepted" ? null : "accepted");
              setPage(0);
            }}
            sx={{
              cursor: "pointer",
              border:
                statusFilter === "accepted"
                  ? "2px solid #1976d2"
                  : "2px solid transparent",
              borderRadius: 1,
              transition: "border 0.2s",
            }}
          >
            <StatusCard
              title="Accepted"
              value={acceptedQuotes}
              total={totalQuotes > 0 ? totalQuotes : undefined}
              selected={statusFilter === "accepted"}
            />
          </Box>
          <Box
            onClick={() => {
              setStatusFilter(statusFilter === "created" ? null : "created");
              setPage(0);
            }}
            sx={{
              cursor: "pointer",
              border:
                statusFilter === "created"
                  ? "2px solid #1976d2"
                  : "2px solid transparent",
              borderRadius: 1,
              transition: "border 0.2s",
            }}
          >
            <StatusCard
              title="Created"
              value={createdQuotes}
              total={totalQuotes > 0 ? totalQuotes : undefined}
              selected={statusFilter === "created"}
            />
          </Box>
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
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        // Use unified quoteId for routing; fallback to quoteNumber just in case
                        onClick={() =>
                          handleViewQuote(row.quoteId || row.quoteNumber)
                        }
                      >
                        <MdEdit size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Convert to Order">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleConvertToOrder(row)}
                        disabled={convertToOrderMutation.isPending}
                      >
                        <MdShoppingCart size={18} />
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

      {/* Convert to Order Confirmation Dialog */}
      <Dialog open={convertDialogOpen} onClose={handleCancelConvert}>
        <DialogTitle>Convert Quote to Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to convert quote{" "}
            <strong>{quoteToConvert?.quoteNumber || ""}</strong> to an order? This action will create a new order based on this quote.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelConvert} disabled={convertToOrderMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmConvert}
            variant="contained"
            disabled={convertToOrderMutation.isPending}
            startIcon={
              convertToOrderMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {convertToOrderMutation.isPending ? "Converting..." : "Convert"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </Box>
  );
}
