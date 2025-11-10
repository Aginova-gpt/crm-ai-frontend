// CompanyContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";

type Company = { id: string; name: string };

type CompanyContextType = {
  companies: Company[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  selectedCompanyName: string | null;
  isLoading: boolean;
  error: string | null;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// --- helper: decode JWT payload ---
function decodeJwtPayload(token: string | null): any | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, token } = useAuth(); // ⬅️ need the token
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) First-run: restore selection OR default from JWT
  useEffect(() => {
    // If already set, do nothing
    if (selectedCompanyId) return;

    const saved = localStorage.getItem("selectedCompanyId");
    if (saved) {
      setSelectedCompanyId(saved);
      return;
    }

    // Default from JWT claim company_id
    const claims = decodeJwtPayload(token ?? localStorage.getItem("token"));
    const cid = claims?.company_id;
    const initial = cid ? String(cid) : "all";
    setSelectedCompanyId(initial);
    localStorage.setItem("selectedCompanyId", initial);
  }, [token, selectedCompanyId]);

  // 2) Fetch companies list when logged in
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isLoggedIn) return;
      setIsLoading(true);
      setError(null);
      try {
        const url = apiURL("companies", "companies");
        const response = await fetchWithAuth(url, { requiresAuth: true });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const data = await response.json();

        if (!Array.isArray(data?.companies)) {
          throw new Error("Invalid response structure from backend");
        }

        const list: Company[] = [
          { id: "all", name: "All" },
          ...data.companies.map((c: any) => ({ id: String(c.id), name: c.name })),
        ];
        setCompanies(list);

        // If the current selection doesn't exist in list, fall back to "all"
        const current = (selectedCompanyId ?? localStorage.getItem("selectedCompanyId")) || "all";
        const exists = list.some((c) => c.id === current);
        if (!exists) {
          setSelectedCompanyId("all");
          localStorage.setItem("selectedCompanyId", "all");
        }
      } catch (err: any) {
        console.error("❌ Failed to fetch companies:", err);
        setError(err?.message || "Failed to fetch companies");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3) Persist selection on change
  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem("selectedCompanyId", selectedCompanyId);
    }
  }, [selectedCompanyId]);

  // 4) Derive name
  const selectedCompanyName = useMemo(() => {
    if (!selectedCompanyId) return null;
    const found = companies.find((c) => c.id === selectedCompanyId);
    if (found) return found.name;
    if (selectedCompanyId === "all") return "All";
    return null;
  }, [companies, selectedCompanyId]);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompanyId,
        setSelectedCompanyId,
        selectedCompanyName,
        isLoading,
        error,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within a CompanyProvider");
  return ctx;
};
