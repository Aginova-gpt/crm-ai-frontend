"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import { ItemCorrectionRow } from "../types";

export function useItemCorrections(companyId: string, filters: any) {
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();

  return useQuery<ItemCorrectionRow[]>({
    queryKey: ["items-correction", companyId, filters],
    queryFn: async () => {
      const query = new URLSearchParams({
        company_id: companyId ?? "",
        search: filters.search ?? "",
        type: filters.type ?? "",
        status: filters.status ?? "",
        category: filters.category ?? "",
      });
      const res = await fetchWithAuth(
        apiURL(`items-correction?${query}`, "items-correction")
      );
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const json = await res.json();
      return json.items as ItemCorrectionRow[];
    },
    enabled: !!companyId,
  });
}
