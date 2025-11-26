// src/app/dashboard/customers/hooks/useCompanyCustomers.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useProfile } from "@/contexts/ProfileContext";

export type CompanyCustomer = {
  id: string;
  name: string;
  company_id: string;
  industry?: string;
  city?: string;
  website?: string;
  phone?: string;
  assignedTo?: string;
  openOrders?: string;
  openQuotes?: string;
  email?: string;
};

export type CompanyCustomersSummary = {
  total_customers: number;
  total_open_quotes: number;
  total_open_orders: number;
  total_quotes: number;
  total_orders: number;
};

export type CompanyCustomersResult = {
  customers: CompanyCustomer[];
  summary: CompanyCustomersSummary | null;
};

export function useCompanyCustomers() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();
  const { selectedCompanyId, userCompanyId } = useCompany();
  const { isAdmin } = useProfile();

  const effectiveCompanyId =
    isAdmin && selectedCompanyId ? selectedCompanyId : userCompanyId;

  return useQuery<CompanyCustomersResult>({
    queryKey: ["customers", effectiveCompanyId],
    enabled: isLoggedIn && !!token && !!effectiveCompanyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      if (!effectiveCompanyId) {
        throw new Error("Missing company id for customers query");
      }

      const url = apiURL(
        `accounts?company_id=${encodeURIComponent(String(effectiveCompanyId))}`,
        `accounts-${effectiveCompanyId}.json`
      );

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized – please log in again");
        }
        throw new Error(`Request failed: ${res.status}`);
      }

      const json = await res.json();

      const customers: CompanyCustomer[] =
        json?.data?.flatMap((company: any) =>
          (company?.data ?? []).map((acc: any) => ({
            id: String(acc.id),
            name: acc.name,
            company_id: String(company.company_id),
            industry: acc.industry ?? "",
            city: acc.city ?? "",
            website: acc.website ?? "",
            phone: acc.phone ?? "",
            assignedTo: acc.assignedTo ?? "",
            openOrders: acc.orders ?? "-",
            openQuotes: acc.quotes ?? "-",
          }))
        ) ?? [];

      const summary: CompanyCustomersSummary | null = json?.summary ?? null;

      return { customers, summary };
    },
  });
}
