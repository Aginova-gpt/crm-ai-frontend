"use client";

import { useQuery } from "@tanstack/react-query";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";

export function useProductDetails(itemId: number | null) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();

  return useQuery({
    queryKey: ["productDetails", itemId],
    enabled: !!itemId,
    queryFn: async () => {
      if (!itemId) {
        throw new Error("Missing itemId");
      }

      // Build backend URL via BackendContext (supports mock mode too)
      const base = apiURL("get-product-details", "get-product-details");

      // In the browser we have window.location.origin, in SSR we need a fallback
      const origin =
        typeof window === "undefined" ? "http://localhost" : window.location.origin;

      const url = new URL(base, origin);
      url.searchParams.set("item_id", String(itemId));

      const res = await fetchWithAuth(url.toString(), {
        requiresAuth: true,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      return res.json();
    },
  });
}
