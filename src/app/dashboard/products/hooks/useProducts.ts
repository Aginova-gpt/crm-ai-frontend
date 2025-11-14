// src/hooks/useProducts.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";

export function useProducts(selectedCompanyId: string | null, endpoint: string) {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["products", selectedCompanyId, endpoint],
    queryFn: async () => {
      const qs = selectedCompanyId
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
        if (res.status === 401) {
          throw new Error("Unauthorized – please log in again");
        }
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token,
    staleTime: 5 * 60 * 1000,
  });
}
