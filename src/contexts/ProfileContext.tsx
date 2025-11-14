"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

type ProfileData = {
  email: string | null;
  role: string | null;
  user_id?: number | string | null;
  company_id?: number | string | null;
  name?: string | null;
};

type ProfileContextType = {
  profileData: ProfileData | undefined;
  isLoading: boolean;
  isAdmin: boolean;
};

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

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, email, isLoading: authLoading, isLoggedIn } = useAuth();

  const claims = useMemo(() => decodeJwtPayload(token), [token]);

  const profileData: ProfileData | undefined = useMemo(() => {
    if (!isLoggedIn || !claims) return undefined;
    return {
      email: email ?? claims.email ?? null,
      role: claims.role ?? null,              // "admin" / "user" from your backend
      user_id: claims.user_id ?? claims.sub ?? null,
      company_id: claims.company_id ?? null,
      name: claims.name ?? null,
    };
  }, [claims, email, isLoggedIn]);

  // 🔑 ADMIN FLAG from JWT
  const isAdmin = profileData?.role === "admin";

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        isLoading: authLoading,
        isAdmin,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
