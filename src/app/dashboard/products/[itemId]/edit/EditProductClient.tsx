"use client";

import React from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import ProductForm, {
  ProductDetailsPayload,
} from "../../components/ProductForm";
import { useProductDetails } from "../../hooks/useProductDetails";

type EditProductClientProps = {
  params: Promise<{ itemId: string }>;
};

export default function EditProductClient({ params }: EditProductClientProps) {
  const router = useRouter();

  // ⬇️ Next.js 15: params is a Promise – unwrap with React.use()
  const { itemId } = (React as any).use(params) as { itemId: string };
  const numericItemId = Number(itemId);
  const effectiveItemId = Number.isFinite(numericItemId)
    ? numericItemId
    : null;

  const {
    data,
    isLoading,
    error,
  } = useProductDetails(effectiveItemId);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: 2,
        bgcolor: "#FAFAFD",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          bgcolor: "#FFF",
          p: 3,
          borderRadius: 1,
          width: { xs: "100%", lg: "70%" },
          mx: "auto",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 500 }}>
            Edit Product #{itemId}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => router.push("/dashboard/products")}
        >
          Back to Products
        </Button>
      </Box>

      {/* Body */}
      <Box
        sx={{
          width: { xs: "100%", lg: "70%" },
          mx: "auto",
        }}
      >
        {isLoading && (
          <Box
            sx={{
              bgcolor: "#FFF",
              borderRadius: 2,
              p: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CircularProgress size={18} />
            <Typography>Loading product details…</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ bgcolor: "#FFF", borderRadius: 2, p: 3 }}>
            <Alert severity="error">
              {(error as Error).message || "Failed to load product details."}
            </Alert>
          </Box>
        )}

        {!isLoading && !error && data && (
          <ProductForm
            mode="edit"
            initialData={data as ProductDetailsPayload}
          />
        )}
      </Box>
    </Box>
  );
}
