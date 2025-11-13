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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { MdSearch, MdEdit, MdDelete } from "react-icons/md";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import { useCompany } from "@/contexts/CompanyContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { addAsset } from "@/styles/icons";

// ===== Types =====
// Columns removed: systemNo, sensors, group, ecns, platform,
// hostingPrice, listPrice, oemPrice, resellerPrice
// Renamed: internalName -> productName, type -> subcategory

type Product = {
  id: string;
  productNumber: string;
  productName: string; // formerly internalName
  category?: string;
  subcategory?: string; // formerly type
  status?: string;
  description?: string;
  comments?: string;
  company_id?: string; // used for client-side company filtering if backend doesn't filter
  company_name?: string; // optional for grouped responses
};

type SortKey = "productNumber" | "productName" | "category" | "subcategory" | "status";

type SortDir = "asc" | "desc";

type TabKey = "active" | "eol";



// ===== Table Columns & Layout =====
const headerCols = [
  { key: "#", label: "#" },
  { key: "productNumber", label: "Product Number", sortable: true },
  { key: "productName", label: "Product Name", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "subcategory", label: "Subcategory", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "description", label: "Description" },
  { key: "comments", label: "Comments" },
  { key: "actions", label: "Quick Actions" },
];

const COL_WIDTHS: Record<string, string> = {
  "#": "60px",
  productNumber: "180px",
  productName: "minmax(220px, 2fr)",
  category: "minmax(140px, 1fr)",
  subcategory: "minmax(160px, 1fr)",
  status: "120px",
  description: "minmax(240px, 2fr)",
  comments: "minmax(200px, 1.5fr)",
  actions: "100px",
};

const GRID_COLS = headerCols.map(c => COL_WIDTHS[c.key] || "minmax(120px, 1fr)").join(" ");

// ===== Data Hook =====
function useProducts(selectedCompanyId: string | null, endpoint: string) {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["products", selectedCompanyId, endpoint],
    queryFn: async () => {
      const qs = selectedCompanyId && selectedCompanyId !== "all"
        ? `?company_id=${encodeURIComponent(selectedCompanyId)}`
        : "";
      const base = apiURL(endpoint, "products"); // "" -> /api/products, "endoflife" -> /api/products/endoflife
      const url = qs ? `${base}${qs}` : base;
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export default function ProductsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("productNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  // 🔎 Category filter via StatusCard clicks
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // 🌍 Company context (defaults handled in provider)
  const { companies, selectedCompanyId, setSelectedCompanyId, isLoading: companyLoading } = useCompany();

  React.useEffect(() => {
    setCategoryFilter(null);
  }, [selectedCompanyId, tab]);

  // 🧠 Fetch products (backend can filter with company_id query param)
  const endpoint = tab === "eol" ? "products/endoflife" : "products";
  const { data, isLoading, error } = useProducts(selectedCompanyId, endpoint);

  // ===== Transform backend response =====
  const allProducts: Product[] = useMemo(() => {
    if (!data) return [];

    // Shape A (flat): { products: [...] }
    if (Array.isArray(data.products)) {
      return data.products.map((p: any) => ({
        id: String(p.product_id ?? p.id),
        productNumber: p.product_number ?? "",
        productName: p.internal_name ?? p.product_name ?? "",
        category: p.category ?? "",
        subcategory: p.type ?? p.subcategory ?? "",
        status: p.status ?? "",
        description: p.description ?? "",
        comments: p.comments ?? "",
        company_id: p.company_id ? String(p.company_id) : undefined,
        company_name: p.company_name,
      }));
    }

    // Shape B (grouped array): { data: [{ company_id, company_name, products: [...] }, ...] }
    if (Array.isArray(data.data)) {
      const rows: Product[] = [];
      for (const g of data.data) {
        const cname = g.company_name;
        const cid = g.company_id ? String(g.company_id) : undefined;
        for (const p of g.products || []) {
          rows.push({
            id: String(p.product_id ?? p.id),
            productNumber: p.product_number ?? "",
            productName: p.internal_name ?? p.product_name ?? "",
            category: p.category ?? "",
            subcategory: p.type ?? p.subcategory ?? "",
            status: p.status ?? "",
            description: p.description ?? "",
            comments: p.comments ?? "",
            company_id: cid,
            company_name: cname,
          });
        }
      }
      return rows;
    }

    // Shape C (object keyed by company): { "Aginova": [...], "Aegis": [...] }
    if (typeof data === "object" && data !== null) {
      const rows: Product[] = [];
      for (const [cname, list] of Object.entries<any>(data)) {
        if (!Array.isArray(list)) continue;
        for (const p of list) {
          rows.push({
            id: String(p.product_id ?? p.id),
            productNumber: p.product_number ?? "",
            productName: p.internal_name ?? p.product_name ?? "",
            category: p.category ?? "",
            subcategory: p.type ?? p.subcategory ?? "",
            status: p.status ?? "",
            description: p.description ?? "",
            comments: p.comments ?? "",
            company_name: cname,
          });
        }
      }
      return rows;
    }

    return [];
  }, [data]);

  // ===== Category counts for StatusCards =====
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allProducts) {
      const cat = (p.category || "").trim();
      if (cat && cat.toUpperCase() !== "UNCATEGORIZED") {
        map.set(cat, (map.get(cat) || 0) + 1);
      }
    }
    return Array.from(map.entries());
  }, [allProducts]);

  // ===== Search & Category Filter =====
  const filtered = useMemo(() => {
    // 1) Start from tab data
    let base = allProducts;

    // 2) Apply category filter if any
    if (categoryFilter) {
      base = base.filter(p => (p.category || "").trim() === categoryFilter);
    }

    // 3) Apply text search
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter((p) => {
      const code = p.productNumber?.toLowerCase() || "";
      const name = p.productName?.toLowerCase() || "";
      return code.includes(q) || name.includes(q);
    });
  }, [allProducts, categoryFilter, searchQuery]);

  // ===== Sorting =====
  const toggleSort = (key: SortKey) => {
    if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
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
  const pagedProducts = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const total = sorted.length;

  // ===== Actions =====
  const handleAddProduct = () => router.push("/dashboard/products/add-product");
  const handleEditProduct = (id: string) => console.log("Edit product:", id);
  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Delete this product?")) console.log("Delete product:", id);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* === TOP ROW === */}
      <Box sx={{ display: "flex", gap: 2, p: 1, bgcolor: "#fff", borderRadius: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Tabs value={tab === "active" ? 0 : 1} onChange={(_, v) => setTab(v === 0 ? "active" : "eol")}>
            <Tab label="Products" />
            <Tab label="End of life" />
          </Tabs>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
              {isLoading ? "Loading…" : `${total} ${tab === "eol" ? "End-of-life" : "Products"}`}
            </Typography>

            {/* 🔽 Company Filter Dropdown */}
            <FormControl size="small" sx={{ minWidth: 220 }} disabled={companyLoading}>
              <InputLabel>Company</InputLabel>
              <Select
                label="Company"
                value={selectedCompanyId ?? "all"}
                onChange={(e) => setSelectedCompanyId(String(e.target.value))}
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              sx={{ width: 280 }}
              placeholder={`Search ${tab === "eol" ? "end-of-life" : "products"}`}
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
            <Tooltip title="Add Product">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 0.25 }}>
                <IconButton color="primary" onClick={handleAddProduct} sx={{ p: 0.5 }}>
                  <Image src={addAsset} alt="Add asset" width={36} height={36} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1 }}>
                  Add
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* Status cards: derived from categories (click to filter) */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {categoryCounts.length > 0 ? (
            categoryCounts.map(([category, count]) => {
              const selected = categoryFilter === category;
              return (
                <Box
                  key={category}
                  onClick={() => setCategoryFilter(selected ? null : category)}
                  sx={{
                    cursor: "pointer",
                    border: selected ? "2px solid #1976d2" : "2px solid transparent",
                    borderRadius: 1,
                  }}
                >
                  <StatusCard
                    title={category}
                    value={count}
                    total={allProducts.length}  // ✅ do not change total product count
                    selected={selected}
                  />
                </Box>
              );
            })
          ) : (
            // Fallback: if every product is UNCATEGORIZED, still show a stable chip
            <Box
              onClick={() => setCategoryFilter(null)}
              sx={{ cursor: "pointer", border: "2px solid transparent", borderRadius: 1 }}
            >
              <StatusCard
                title="Products"
                value={allProducts.length}
                total={allProducts.length}
                selected={categoryFilter === null}
              />
            </Box>
          )}
        </Box>

      </Box>

      {error && <Alert severity="error">{(error as Error).message}</Alert>}

      {/* === TABLE === */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "#fff", borderRadius: 1 }}>
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
        >
          {headerCols.map(({ key, label, sortable }) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center" }}>
              {sortable ? (
                <TableSortLabel
                  active={sortBy === (key as SortKey)}
                  direction={sortDir}
                  onClick={() => toggleSort(key as SortKey)}
                  sx={{ "& .MuiTableSortLabel-label": { fontSize: "14px", fontWeight: 600 } }}
                >
                  {label}
                </TableSortLabel>
              ) : (
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "12px", textTransform: "uppercase" }}>
                  {label}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Rows */}
        {isLoading && (
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={18} />
            <Typography color="text.secondary">
              Loading {tab === "eol" ? "end-of-life" : "products"}…
            </Typography>
          </Box>
        )}

        {!isLoading && pagedProducts.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No items found.</Box>
        )}

        {pagedProducts.map((p, idx) => (
          <Box
            key={p.id}
            sx={{
              display: "grid",
              gridTemplateColumns: GRID_COLS,
              alignItems: "center",
              columnGap: 2,
              px: 2,
              py: 1.25,
              "&:hover": { bgcolor: "#FAFAFD" },
              fontSize: "12px",
            }}
          >
            <Typography sx={{ fontFamily: "monospace", color: "text.secondary" }}>
              {page * rowsPerPage + idx + 1}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>{p.productNumber}</Typography>
            <Typography sx={{ color: "text.secondary" }}>{p.productName}</Typography>
            <Typography sx={{ color: "text.secondary" }}>{p.category}</Typography>
            <Typography sx={{ color: "text.secondary" }}>{p.subcategory}</Typography>
            <Typography sx={{ color: "text.secondary" }}>{p.status}</Typography>
            <Typography sx={{ color: "text.secondary" }}>{p.description}</Typography>
            <Typography sx={{ color: "text.secondary" }}>{p.comments}</Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Edit">
                <IconButton size="small" color="primary" onClick={() => handleEditProduct(p.id)}>
                  <MdEdit size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => handleDeleteProduct(p.id)}>
                  <MdDelete size={18} />
                </IconButton>
              </Tooltip>
            </Box>

            {idx < pagedProducts.length - 1 && <Divider sx={{ gridColumn: "1 / -1" }} />}
          </Box>
        ))}

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Box>
    </Box>
  );
}
