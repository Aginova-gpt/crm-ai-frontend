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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { MdSearch, MdInventory2, MdEdit, MdDelete } from "react-icons/md";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import { useCompany } from "@/contexts/CompanyContext";
import Image from "next/image";
import { addAsset } from "@/styles/icons";
import { useRouter } from "next/navigation";

const GRID_COLS = "repeat(11, minmax(110px, 1fr))";
const HEADER_MIN_WIDTH = 11 * 110;

type Customer = {
  id: string;
  name: string;
  company_id?: string;
  company?: string;
  industry?: string;
  city?: string;
  website?: string;
  phone?: string;
  assignedTo?: string;
  openOrders?: string;
  openQuotes?: string;
};

type SortKey =
  | "name"
  | "company"
  | "industry"
  | "city"
  | "website"
  | "phone"
  | "assignedTo";
type SortDir = "asc" | "desc";

const headerCols = [
  { key: "#", label: "#" },
  { key: "name", label: "Name", sortable: true },
  { key: "company", label: "Company", sortable: true },
  { key: "industry", label: "Industry", sortable: true },
  { key: "city", label: "City", sortable: true },
  { key: "website", label: "Website", sortable: true },
  { key: "phone", label: "Phone", sortable: true },
  { key: "assignedTo", label: "Assigned To", sortable: true },
  { key: "actions", label: "Open Orders" },
  { key: "actions", label: "Open Quotes" },
  { key: "actions", label: "Quick Actions" },
];

function useCustomers() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();
  const { selectedCompanyId } = useCompany();

  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const url = apiURL("accounts", "accounts.json")

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
}

export default function CustomersPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // 🧭 Status filter state
  const [statusFilter, setStatusFilter] = useState<"all" | "openQuotes" | "openOrders">("all");

  // 🌍 Global Company Filter
  const {
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    isLoading: companyLoading,
  } = useCompany();

  // 🧠 Fetch Customers for all companies
  const { data, isLoading, error } = useCustomers();

  // 🧩 Flatten JSON structure
  const allCustomers: Customer[] = useMemo(() => {
    if (!data?.data) return [];

    return data.data
      .flatMap((company: any) =>
        company.data.map((acc: any) => ({
          id: String(acc.id),
          name: acc.name,
          company_id: company.company_id,          // ✅ keep for filtering
          company: company.company_name,
          industry: acc.industry ?? "",
          city: acc.city ?? "",
          website: acc.website ?? "",
          phone: acc.phone ?? "",
          assignedTo: acc.assignedTo ?? "",
          openOrders: acc.orders ?? "-",
          openQuotes: acc.quotes ?? "-",
        }))
      )
      .sort((a: Customer, b: Customer) => {                           // ✅ stable sort
        if (a.company_id === b.company_id) return a.name.localeCompare(b.name);
        return Number(a.company_id) - Number(b.company_id);
      });
  }, [data]);

  // 🏢 Filter by company (or show all)
  const filteredByCompany = useMemo(() => {
    if (!selectedCompanyId || selectedCompanyId === "all") return allCustomers;
    const selected = String(selectedCompanyId);
    return allCustomers.filter((c) => String(c.company_id) === selected);
  }, [allCustomers, selectedCompanyId]);

  // 🔍 Apply search + status filters on top of company filter
  const filtered = useMemo(() => {
    let list = filteredByCompany;

    // ✅ Apply open orders / quotes filters
    if (statusFilter === "openOrders") {
      list = list.filter((c) => {
        const match = c.openOrders?.match(/\((\d+)\)/);
        return match && parseInt(match[1]) > 0;
      });
    } else if (statusFilter === "openQuotes") {
      list = list.filter((c) => {
        const match = c.openQuotes?.match(/\((\d+)\)/);
        return match && parseInt(match[1]) > 0;
      });
    }
    

    // ✅ Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchTerms = query.split(/\s+/);
      list = list.filter((c) => {
        const text = `${c.name} ${c.city} ${c.industry} ${c.phone} ${c.assignedTo}`.toLowerCase();
        return searchTerms.every((term) => text.includes(term));
      });
    }

    return list;
  }, [filteredByCompany, searchQuery, statusFilter]);

  // 🧮 Compute number of customers contributing to open orders and quotes
  const contributingCounts = useMemo(() => {
    if (!filteredByCompany.length) return { openOrders: 0, openQuotes: 0 };

    const customersWithOrders = filteredByCompany.filter((c) => {
      const match = c.openOrders?.match(/\((\d+)\)/);
      return match && parseInt(match[1]) > 0;
    }).length;
    
    const customersWithQuotes = filteredByCompany.filter((c) => {
      const match = c.openQuotes?.match(/\((\d+)\)/);
      return match && parseInt(match[1]) > 0;
    }).length;

    return {
      openOrders: customersWithOrders,
      openQuotes: customersWithQuotes,
    };
  }, [filteredByCompany]);





  // ===== Sorting =====

  const toggleSort = (key: SortKey) => {
    if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortBy(key);
  };

  const sorted = useMemo(() => {
    return [...filtered].sort((a: Customer, b: Customer) => {
      const av = String((a as any)[sortBy] ?? "").toLowerCase();
      const bv = String((b as any)[sortBy] ?? "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortBy, sortDir]);

  // ===== Pagination =====

  const pagedCustomers = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );
  const total = sorted.length;

  // 🧾 Dynamic summary (global or per company)
  const currentSummary = useMemo(() => {
    if (!data?.data) return null;
    if (!selectedCompanyId || selectedCompanyId === "all") return data.summary;
    return data.data.find(
      (c: any) => String(c.company_id) === String(selectedCompanyId)
    );
  }, [data, selectedCompanyId]);

  // ===== Placeholder Actions =====
  const handleEditCustomer = (c: Customer) => {
    router.push(`/dashboard/customers/customerDetail/${c.id}`);
  };
  const handleDeleteCustomer = (c: Customer) => {
    console.log("Delete clicked for:", c.name);
  };
  const handleAddCustomer = () => {
    router.push(`/dashboard/customers/customerDetail/new`);  
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* === HEADER === */}
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
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Customers" />
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
              {isLoading ? "Loading…" : `${total} Customers`}
            </Typography>

            {/* 🔽 Company Filter Dropdown */}
            <FormControl
              size="small"
              sx={{ minWidth: 200 }}
              disabled={companyLoading || companies.length === 0}
            >
              <InputLabel>Company</InputLabel>
              <Select
                value={selectedCompanyId ?? ""}
                label="Company"
                onChange={(e) => setSelectedCompanyId(e.target.value || "all")}
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 🔍 Search */}
            <TextField
              sx={{ width: 280 }}
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

            {/* ➕ Add Customer */}
            <Tooltip title="Add Customer">
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
                  onClick={handleAddCustomer}
                  sx={{ p: 0.5 }}
                >
                  <Image
                    src={addAsset}
                    alt="Add asset"
                    width={36}
                    height={36}
                  />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1 }}>
                  Add
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* === STATUS CARDS === */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto" }}>
          <Box onClick={() => setStatusFilter(
            statusFilter === "openOrders" ? "all" : "openOrders"
          )}
            sx={{
              cursor: "pointer",
              border: statusFilter === "openOrders" ? "2px solid #1976d2" : "2px solid transparent",
              borderRadius: 1,
              transition: "border 0.2s",
            }}
          >
            <StatusCard
              title={"Open Orders"}
              value={currentSummary?.total_orders ?? 0}
              total={currentSummary?.total_open_orders ?? 0}
              icon={<MdInventory2 size={28} />}
              selected={statusFilter === "openOrders"}
            />
          </Box>

          <Box onClick={() => setStatusFilter(
            statusFilter === "openQuotes" ? "all" : "openQuotes"
          )}
            sx={{
              cursor: "pointer",
              border: statusFilter === "openQuotes" ? "2px solid #1976d2" : "2px solid transparent",
              borderRadius: 1,
              transition: "border 0.2s",
            }}
          >
            <StatusCard
              title={"Open Quotes"}
              value={currentSummary?.total_quotes ?? 0}
              total={currentSummary?.total_open_quotes ?? 0}
              icon={<MdInventory2 size={28} />}
              selected={statusFilter === "openQuotes"}
            />
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error">{(error as Error).message}</Alert>}

      {/* === TABLE === */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          bgcolor: "#FFFFFF",
          borderRadius: 1,
        }}
      >
        {/* Table Header */}
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
            const active = sortable && (key as SortKey) === sortBy;
            return (
              <Box key={label} sx={{ display: "flex", alignItems: "center" }}>
                {sortable ? (
                  <TableSortLabel
                    active={active}
                    direction={active ? sortDir : "asc"}
                    onClick={() => toggleSort(key as SortKey)}
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

        {/* Rows */}
        {isLoading ? (
          <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={18} />
            <Typography color="text.secondary">Loading customers…</Typography>
          </Box>
        ) : pagedCustomers.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            No customers found.
          </Box>
        ) : (
          pagedCustomers.map((c, idx) => (
            <React.Fragment key={`${c.company_id ?? "all"}-${c.id}-${idx}`}>
              <Box
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
                <Typography sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                  {page * rowsPerPage + idx + 1}
                </Typography>
                <Typography sx={{ fontWeight: 500, color: "text.secondary" }}>
                  {c.name}
                </Typography>
                <Typography noWrap sx={{ color: "text.secondary" }}>
                  {c.company || "—"}
                </Typography>
                <Typography noWrap sx={{ color: "text.secondary" }}>
                  {c.industry || "—"}
                </Typography>
                <Typography noWrap sx={{ color: "text.secondary" }}>
                  {c.city || "—"}
                </Typography>
                {c.website ? (
                  <Link
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    noWrap
                    sx={{ color: "text.secondary" }}
                  >
                    {c.website}
                  </Link>
                ) : (
                  <Typography noWrap sx={{ color: "text.secondary" }}>
                    —
                  </Typography>
                )}
                {c.phone ? (
                  <Link
                    href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                    underline="hover"
                    noWrap
                    sx={{ color: "text.secondary" }}
                  >
                    {c.phone}
                  </Link>
                ) : (
                  <Typography noWrap sx={{ color: "text.secondary" }}>
                    —
                  </Typography>
                )}
                <Typography noWrap sx={{ color: "text.secondary" }}>
                  {c.assignedTo || "—"}
                </Typography>
                <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {c.openOrders ?? "-"}
                </Typography>
                <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {c.openQuotes ?? "-"}
                </Typography>

                {/* ✅ Quick Actions */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditCustomer(c)}
                    >
                      <MdEdit size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteCustomer(c)}
                    >
                      <MdDelete size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {idx < pagedCustomers.length - 1 && (
                <Divider sx={{ gridColumn: "1 / -1" }} />
              )}
            </React.Fragment>
          ))
        )}

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
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) =>
              setRowsPerPage(parseInt(e.target.value, 10))
            }
            rowsPerPageOptions={[10, 25, 50, 100]}
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