"use client";

import { createContext, useContext, ReactNode } from "react";

interface BackendContextType {
  apiURL: (path: string, mockPath: string, forceMockData?: boolean) => string;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export function BackendProvider({ children }: { children: ReactNode }) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const isMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  const apiURL = (
    path: string,
    mockPath: string,
    forceMockData: boolean = false
  ) => {
    const url =
      forceMockData || isMockData
        ? `/api/${mockPath}`
        : `${backendUrl}/${path}`;
    return url;
  };

  return (
    <BackendContext.Provider value={{ apiURL }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error("useBackend must be used within a BackendProvider");
  }
  return context;
}
