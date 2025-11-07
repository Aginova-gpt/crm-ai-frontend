"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  TablePagination,
  TableSortLabel,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  MdDownload,
  MdLock,
  MdSearch,
  MdInventory2,
} from "react-icons/md";
import StatusCard from "../../../components/StatusCard/StatusCard";

type Invoice = {
  id: number;
  invoiceNumber: string;
  orderNumber: string;
  orderStatus: string;
  shippedAt: string;
  customerName: string;
  invoiceStatus: string;
  daysOpen: number;
  orderAmount: number;
  releasedInvoices: number;
  deposit: number | null;
  invoiceAmount: number;
  amountDue: number;
  company: string;
};

type SortKey =
  | "invoiceNumber"
  | "orderNumber"
  | "orderStatus"
  | "shippedAt"
  | "customerName"
  | "invoiceStatus"
  | "daysOpen"
  | "orderAmount"
  | "releasedInvoices"
  | "deposit"
  | "invoiceAmount"
  | "amountDue";

const GRID_COLS =
  "120px 120px 140px 140px 200px 160px 120px 140px 160px 120px 140px 140px 220px";
const HEADER_MIN_WIDTH = 1560;

const companyOptions = [
  { label: "All Companies", value: "all" },
  { label: "Aginova", value: "aginova" },
  { label: "Global Sensors", value: "global-sensors" },
  { label: "MedTech", value: "medtech" },
];

const daysOpenOptions = [
  { label: "All", value: "all" },
  { label: "0-30", value: "0-30" },
  { label: "31-60", value: "31-60" },
  { label: "61-90", value: "61-90" },
  { label: "91+", value: "91+" },
];

const invoices: Invoice[] = Array.from({ length: 42 }).map((_, index) => {
  const company = index % 3 === 0 ? "aginova" : index % 3 === 1 ? "global-sensors" : "medtech";
  const daysOpen = 15 + (index % 6) * 12;
  const orderAmount = 850 + index * 25;
  return {
    id: index,
    invoiceNumber: `1095958${index}`,
    orderNumber: `${1000 + index}`,
    orderStatus: index % 2 === 0 ? "Shipped" : "Processing",
    shippedAt: "20.08.2025",
    customerName: index % 2 === 0 ? "Sonitor" : "Nordic Sensors",
    invoiceStatus: index % 3 === 0 ? "Overdue" : index % 3 === 1 ? "Sent" : "Paid",
    daysOpen,
    orderAmount,
    releasedInvoices: index % 4,
    deposit: index % 5 === 0 ? null : 250,
    invoiceAmount: orderAmount + 120,
    amountDue: orderAmount + 120 - (index % 5 === 0 ? 0 : 250),
    company,
  };
});

const headerCols: Array<{ key: SortKey | "actions"; label: string; sortable?: boolean }> = [
  { key: "invoiceNumber", label: "Invoice #", sortable: true },
  { key: "orderNumber", label: "Order #", sortable: true },
  { key: "orderStatus", label: "Order Status", sortable: true },
  { key: "shippedAt", label: "Shipped", sortable: true },
  { key: "customerName", label: "Customer", sortable: true },
  { key: "invoiceStatus", label: "Invoice Status", sortable: true },
  { key: "daysOpen", label: "Days Open", sortable: true },
  { key: "orderAmount", label: "Order Amount", sortable: true },
  { key: "releasedInvoices", label: "Released Invoices", sortable: true },
  { key: "deposit", label: "Deposit", sortable: true },
  { key: "invoiceAmount", label: "Invoice Amount", sortable: true },
  { key: "amountDue", label: "Amount Due", sortable: true },
  { key: "actions", label: "Actions" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const InvoicesPage = () => {
  const [tab, setTab] = useState(0);
  const [view, setView] = useState("invoice");
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [daysOpenFilter, setDaysOpenFilter] = useState<string>("all");
  const [agingFilter, setAgingFilter] = useState<"all" | "over30" | "over90">("all");
  const [sortBy, setSortBy] = useState<SortKey>("invoiceNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, companyFilter, daysOpenFilter, agingFilter, view]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const getSortValue = (invoice: Invoice, key: SortKey) => {
    switch (key) {
      case "daysOpen":
      case "orderAmount":
      case "releasedInvoices":
      case "deposit":
      case "invoiceAmount":
      case "amountDue":
        return invoice[key] ?? 0;
      default:
        return String(invoice[key]).toLowerCase();
    }
  };

  const filtered = useMemo(() => {
    let list = invoices;

    if (view === "order") {
      list = list.filter((invoice) => invoice.orderStatus !== "Cancelled");
    }

    if (companyFilter !== "all") {
      list = list.filter((invoice) => invoice.company === companyFilter);
    }

    if (daysOpenFilter !== "all") {
      list = list.filter((invoice) => {
        const [min, max] = daysOpenFilter.split("-");
        if (!max) return invoice.daysOpen >= parseInt(min, 10);
        return (
          invoice.daysOpen >= parseInt(min, 10) && invoice.daysOpen <= parseInt(max, 10)
        );
      });
    }

    if (agingFilter === "over90") {
      list = list.filter((invoice) => invoice.daysOpen >= 90);
    } else if (agingFilter === "over30") {
      list = list.filter((invoice) => invoice.daysOpen >= 30 && invoice.daysOpen < 90);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const terms = query.split(/\s+/);
      list = list.filter((invoice) => {
        const text = [
          invoice.invoiceNumber,
          invoice.orderNumber,
          invoice.customerName,
          invoice.invoiceStatus,
          invoice.orderStatus,
        ]
          .join(" ")
          .toLowerCase();
        return terms.every((term) => text.includes(term));
      });
    }

    return list;
  }, [agingFilter, companyFilter, daysOpenFilter, searchQuery, view]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortBy);
      const bv = getSortValue(b, sortBy);

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortBy, sortDir]);

  const pagedInvoices = useMemo(() => {
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const baseForSummary = useMemo(() => {
    if (companyFilter === "all") return invoices;
    return invoices.filter((invoice) => invoice.company === companyFilter);
  }, [companyFilter]);

  const ninetyPlus = baseForSummary.filter((invoice) => invoice.daysOpen >= 90).length;
  const thirtyPlus = baseForSummary.filter((invoice) => invoice.daysOpen >= 30).length;

  const totalInvoices = filtered.length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          gap: 1,
          bgcolor: "#FFFFFF",
          borderRadius: 1,
          p: 0,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label="Invoices" />
          </Tabs>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mt: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
              {`${totalInvoices} Invoices`}
            </Typography>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Company</InputLabel>
              <Select
                value={companyFilter}
                label="Company"
                onChange={(event) => setCompanyFilter(event.target.value)}
              >
                {companyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              sx={{ width: 280 }}
              placeholder="Search for Invoice or Customer"
              size="small"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch size={18} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Days Open</InputLabel>
              <Select
                value={daysOpenFilter}
                label="Days Open"
                onChange={(event) => setDaysOpenFilter(event.target.value)}
              >
                {daysOpenOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, value) => value && setView(value)}
              size="small"
            >
              <ToggleButton value="invoice">Invoice</ToggleButton>
              <ToggleButton value="order">Order</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto" }}>
          <Box
            onClick={() =>
              setAgingFilter((prev) => (prev === "over90" ? "all" : "over90"))
            }
            sx={{
              cursor: "pointer",
              border:
                agingFilter === "over90"
                  ? "2px solid #1976d2"
                  : "2px solid transparent",
              borderRadius: 1,
              transition: "border 0.2s",
            }}
          >
            <StatusCard
              title="Open Invoices > 90 days"
              value={ninetyPlus}
              total={baseForSummary.length}
              icon={<MdInventory2 size={28} />}
              selected={agingFilter === "over90"}
            />
          </Box>

          <Box
            onClick={() =>
              setAgingFilter((prev) => (prev === "over30" ? "all" : "over30"))
            }
            sx={{
              cursor: "pointer",
              border:
                agingFilter === "over30"
                  ? "2px solid #1976d2"
                  : "2px solid transparent",
              borderRadius: 1,
              transition: "border 0.2s",
            }}
          >
            <StatusCard
              title="Open Invoices > 30 days"
              value={thirtyPlus}
              total={baseForSummary.length}
              icon={<MdInventory2 size={28} />}
              selected={agingFilter === "over30"}
            />
          </Box>
        </Box>
      </Box>

      {sorted.length === 0 && (
        <Alert severity="info" sx={{ bgcolor: "#EAF5FF", borderRadius: 1 }}>
          No invoices match your current filters.
        </Alert>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          bgcolor: "#FFFFFF",
          borderRadius: 1,
        }}
      >
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
        >
          {headerCols.map(({ key, label, sortable }) => {
            const active = sortable && key === sortBy;
            return (
              <Box key={label} sx={{ display: "flex", alignItems: "center" }}>
                {sortable ? (
                  <TableSortLabel
                    active={active}
                    direction={active ? sortDir : "asc"}
                    onClick={() => handleSort(key as SortKey)}
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

        {pagedInvoices.map((invoice, index) => (
          <React.Fragment key={invoice.id}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                alignItems: "center",
                columnGap: 2,
                px: 2,
                py: 1.25,
                minWidth: HEADER_MIN_WIDTH,
                "&:hover": { bgcolor: "#FAFAFD" },
              }}
            >
              <Typography sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                {invoice.invoiceNumber}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>{invoice.orderNumber}</Typography>
              <Chip
                size="small"
                label={invoice.orderStatus}
                color={invoice.orderStatus === "Shipped" ? "success" : "default"}
              />
              <Typography sx={{ color: "text.secondary" }}>{invoice.shippedAt}</Typography>
              <Typography sx={{ fontWeight: 500, color: "text.secondary" }}>
                {invoice.customerName}
              </Typography>
              <Chip
                size="small"
                label={invoice.invoiceStatus}
                color={invoice.invoiceStatus === "Overdue" ? "error" : "primary"}
                variant={invoice.invoiceStatus === "Paid" ? "outlined" : "filled"}
              />
              <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                {invoice.daysOpen}
              </Typography>
              <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(invoice.orderAmount)}
              </Typography>
              <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                {invoice.releasedInvoices}
              </Typography>
              <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                {invoice.deposit === null ? "--" : formatCurrency(invoice.deposit)}
              </Typography>
              <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(invoice.invoiceAmount)}
              </Typography>
              <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(invoice.amountDue)}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Freeze Account">
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<MdLock size={16} />}
                  >
                    Freeze
                  </Button>
                </Tooltip>
                <Tooltip title="Download Invoice">
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={<MdDownload size={16} />}
                  >
                    Download
                  </Button>
                </Tooltip>
              </Box>
            </Box>
            {index < pagedInvoices.length - 1 && <Divider sx={{ gridColumn: "1 / -1" }} />}
          </React.Fragment>
        ))}

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
            count={sorted.length}
            page={page}
            onPageChange={(_, value) => setPage(value)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => setRowsPerPage(parseInt(event.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
            showFirstButton
            showLastButton
          />
        </Box>
      </Box>
    </Box>
  );
};

export default InvoicesPage;


