"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";

type Company = { id: string; name: string };

type CompanyContextType = {
  companies: Company[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
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

  useEffect(() => {
    const saved = localStorage.getItem("selectedCompanyId");
    if (saved) setSelectedCompanyId(saved);
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isLoggedIn) return;
      setIsLoading(true);
      setError(null);

      try {
        const url = apiURL("companies", "companies");
        console.log("📡 Fetching companies from:", url);

        const response = await fetchWithAuth(url);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        const data = await response.json();

        if (Array.isArray(data.companies)) {
          // ✅ Add "All" option at the top
          const companyList = [
            { id: "all", name: "All" },
            ...data.companies.map((c: any) => ({
              id: String(c.id),
              name: c.name,
            })),
          ];

          setCompanies(companyList);

          // ✅ If no selection yet, default to "All"
          if (!selectedCompanyId) {
            setSelectedCompanyId("all");
            localStorage.setItem("selectedCompanyId", "all");
          }
        } else {
          throw new Error("Invalid response structure from backend");
        }
      } catch (err: any) {
        console.error("❌ Failed to fetch companies:", err);
        setError(err.message || "Failed to fetch companies");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem("selectedCompanyId", selectedCompanyId);
    }
  }, [selectedCompanyId]);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompanyId,
        setSelectedCompanyId,
        isLoading,
        error,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
