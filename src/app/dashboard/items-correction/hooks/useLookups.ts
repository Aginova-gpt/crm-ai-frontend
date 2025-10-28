"use client";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";

export type LookupsPayload = {
  categories: string[];
  subcategories_by_category: Record<string, string[]>;
  item_statuses: string[]; // future use
  item_types: Array<"PRODUCT" | "PART">; // future use
};

export function useLookups() {
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();

  return useQuery<LookupsPayload>({
    queryKey: ["item-corrections-lookups"],
    queryFn: async () => {
      const res = await fetchWithAuth(
        apiURL("item-corrections/lookups", "item-corrections/lookups")
      );
      if (!res.ok) throw new Error(`Lookups fetch failed: ${res.status}`);
      return (await res.json()) as LookupsPayload;
    },
    staleTime: 10 * 60 * 1000, // cache for a while
  });
}
