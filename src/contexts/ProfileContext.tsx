"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

type CoalitionSummary = {
  id: number | string;
  name?: string | null;
};

type ProfileData = {
  email: string | null;
  role: string | null;
  user_id?: number | string | null;
  company_id?: number | string | null;
  name?: string | null;
  coalition?: CoalitionSummary | null;
};

type ProfileContextType = {
  profileData: ProfileData | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  isCoalitionOwner: boolean; // 👈 added
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

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, email, isLoading: authLoading, isLoggedIn } = useAuth();

  const claims = useMemo(() => decodeJwtPayload(token), [token]);

  const profileData: ProfileData | undefined = useMemo(() => {
    if (!isLoggedIn || !claims) return undefined;

    const coalitionId =
      claims.coalition?.id ??
      claims.coalition_id ??
      claims.coalitionId ??
      null;

    const coalitionName =
      claims.coalition?.name ??
      claims.coalition_name ??
      claims.coalitionName ??
      null;

    return {
      email: email ?? claims.email ?? null,
      role: claims.role ?? null,
      user_id: claims.user_id ?? claims.sub ?? null,
      company_id: claims.company_id ?? null,
      name: claims.name ?? null,
      coalition:
        coalitionId != null
          ? {
              id: coalitionId,
              name: coalitionName ?? null,
            }
          : null,
    };
  }, [claims, email, isLoggedIn]);

  const role = profileData?.role ?? null;

  // 🔑 role-based flags
  const isAdmin = role === "admin";

  const isCoalitionOwner =
    role === "coalition_owner" ||
    Boolean(
      claims?.isCoalitionOwner ??
        claims?.is_coalition_owner ??
        claims?.coalition_owner
    );

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        isLoading: authLoading,
        isAdmin,
        isCoalitionOwner,
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
