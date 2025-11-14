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
  userCompanyId: string | null;
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
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  // 1) First-run: restore selection OR default from JWT
  useEffect(() => {
    const claims = decodeJwtPayload(token ?? localStorage.getItem("token"));
    const cid = claims?.company_id;
    const cidstr = cid ? String(cid) : null;

    setUserCompanyId(cidstr);
    
    if (selectedCompanyId) return;

    const saved = localStorage.getItem("selectedCompanyId");
    if (saved) {
      setSelectedCompanyId(saved);
      return;
    }
    if(cidstr) {
      setSelectedCompanyId(cidstr);
      localStorage.setItem("selectedCompanyId", cidstr);
    }
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
        const list: Company[] = data.companies.map((c: any) => ({ id: String(c.id), name: c.name }));

        setCompanies(list);

        // If the current selection doesn't exist in list, fall back to "all"
        let current = selectedCompanyId ?? localStorage.getItem("selectedCompanyId");
        if(!current) {
          current = userCompanyId;
        }

        const exists = current && list.some((c) => c.id === current);
        if (!exists) {
          current = list.length > 0 ? list[0].id : null;
        }
        if(current) {
          setSelectedCompanyId(current);
          localStorage.setItem("selectedCompanyId", current);
        }
      } catch (err: any) {
        console.error("❌ Failed to fetch companies:", err);
        setError(err?.message || "Failed to fetch companies");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [isLoggedIn, userCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    return found ? found.name : null;
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
        userCompanyId,
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
