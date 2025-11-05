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
  selectedCompanyName: string | null; // ⬅️ derived, read-only
  isLoading: boolean;
  error: string | null;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted selection once
  useEffect(() => {
    const saved = localStorage.getItem("selectedCompanyId");
    if (saved) setSelectedCompanyId(saved);
  }, []);

  // Fetch companies when logged in
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

        // Ensure IDs are strings and prepend "All"
        const list: Company[] = [
          { id: "all", name: "All" },
          ...data.companies.map((c: any) => ({
            id: String(c.id),
            name: c.name,
          })),
        ];

        setCompanies(list);

        // If there's no selection yet (first load & nothing in localStorage), default to "all"
        if (!selectedCompanyId) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Persist selection when it changes
  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem("selectedCompanyId", selectedCompanyId);
    }
  }, [selectedCompanyId]);

  // Derive the selected company's name from the list + id
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
        selectedCompanyName, // exposed
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
