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
} from "@mui/material";
import { MdSearch, MdAddBox, MdEdit, MdDelete } from "react-icons/md";
import StatusCard from "@/components/StatusCard/StatusCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";

// ===== Types =====
type Product = {
  id: string;
  productNumber: string;
  systemNo: string;
  internalName: string;
  sensors?: string;
  group?: string;
  category?: string;
  type?: string;
  ecns?: string;
  status?: string;
  platform?: string;
  hostingPrice?: string;
  listPrice?: string;
  oemPrice?: string;
  resellerPrice?: string;
  description?: string;
  comments?: string;
};

type SortKey =
  | "productNumber"
  | "systemNo"
  | "internalName"
  | "category"
  | "status"
  | "platform";
type SortDir = "asc" | "desc";

// ===== Table Headers =====
const headerCols = [
  { key: "productNumber", label: "Product Number", sortable: true },
  { key: "systemNo", label: "System No.", sortable: true },
  { key: "internalName", label: "Internal Name", sortable: true },
  { key: "sensors", label: "Sensors" },
  { key: "group", label: "Group" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },
  { key: "ecns", label: "ECNs" },
  { key: "status", label: "Status" },
  { key: "platform", label: "Platform" },
  { key: "hostingPrice", label: "Hosting Qty:Price" },
  { key: "listPrice", label: "List Qty:Price" },
  { key: "oemPrice", label: "OEM Qty:Price" },
  { key: "resellerPrice", label: "Reseller Qty:Price" },
  { key: "description", label: "Description" },
  { key: "comments", label: "Comments" },
  { key: "actions", label: "Quick Actions" },
];

// ===== Inline Hook =====
function useProducts() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch(apiURL("products", "products.json"), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ always include token
        },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token, // ✅ only fetch if logged in
  });
}

export default function ProductsPage() {
  const [tab, setTab] = useState(0);
  const { data, isLoading, error } = useProducts();

  // ===== Transform backend response =====
  const allProducts: Product[] = useMemo(() => {
    if (!data?.products) return [];
    return data.products.map((p: any) => ({
      id: String(p.product_id),
      productNumber: p.product_number,
      systemNo: p.system_no,
      internalName: p.internal_name,
      sensors: p.sensors ?? "",
      group: p.group ?? "",
      category: p.category ?? "",
      type: p.type ?? "",
      ecns: p.ecns ?? "",
      status: p.status ?? "",
      platform: p.platform ?? "",
      hostingPrice: p.hosting_price ?? "",
      listPrice: p.list_price ?? "",
      oemPrice: p.oem_price ?? "",
      resellerPrice: p.reseller_price ?? "",
      description: p.description ?? "",
      comments: p.comments ?? "",
    }));
  }, [data]);

  // ===== Search =====
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = useMemo(() => {
    if (!searchQuery) return allProducts;
    return allProducts.filter((p) =>
      `${p.productNumber} ${p.internalName} ${p.category} ${p.status} ${p.platform}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [allProducts, searchQuery]);

  // ===== Sorting =====
  const [sortBy, setSortBy] = useState<SortKey>("productNumber");
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
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const pagedProducts = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const total = sorted.length;

  // ===== Actions =====
  const handleAddProduct = () => console.log("Add product");
  const handleEditProduct = (id: string) => console.log("Edit product:", id);
  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Delete this product?")) console.log("Delete product:", id);
  };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* === TOP ROW === */}
            <Box sx={{ display: "flex", gap: 2, p: 1.5, bgcolor: "#fff", borderRadius: 1 }}>
                <Box sx={{ flex: 1 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        <Tab label="Products" />
                        <Tab label="End of life" />
                    </Tabs>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "14px"}}>
                            {isLoading ? "Loading…" : `${total} Products`}
                        </Typography>
                        <TextField
                            placeholder="Search for product name, sensor ID"
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
                            <IconButton color="primary" onClick={handleAddProduct}>
                                <MdAddBox size={32} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Status cards */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <StatusCard title="Sensor" value={50} total={100} />
                    <StatusCard title="Probe" value={200} total={400} />
                    <StatusCard title="Hardware Component" value={100} total={300} />
                    <StatusCard title="Software" value={50} total={100} />
                    <StatusCard title="Service" value={200} total={500} />
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
                        gridTemplateColumns: `repeat(${headerCols.length}, minmax(70px, 1fr))`,
                        columnGap: 1,
                        px: 1.5,
                        py: 0.75,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    {headerCols.map(({ key, label, sortable }) => (
                        <Box key={label} sx={{ display: "flex", alignItems: "center" }}>
                            {sortable ? (
                                <TableSortLabel
                                    active={sortBy === key}
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
                        <Typography color="text.secondary" sx={{ fontSize: "12px" }}>Loading products…</Typography>
                    </Box>
                )}

                {!isLoading && pagedProducts.length === 0 && (
                    <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No products found.</Box>
                )}

                {pagedProducts.map((p, idx) => (
                    <Box
                        key={p.id}
                        sx={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${headerCols.length}, minmax(70px, 1fr))`,
                            alignItems: "center",
                            columnGap: 1,
                            px: 1.5,
                            py: 0.75,
                            "&:hover": { bgcolor: "#FAFAFD" },
                            fontSize: "12px",
                        }}
                    >
                        <Typography sx={{ fontSize: "12px" }}>{p.productNumber}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.systemNo}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.internalName}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.sensors}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.group}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.category}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.type}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.ecns}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.status}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.platform}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.hostingPrice}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.listPrice}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.oemPrice}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.resellerPrice}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.description}</Typography>
                        <Typography sx={{ fontSize: "12px" }}>{p.comments}</Typography>

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
