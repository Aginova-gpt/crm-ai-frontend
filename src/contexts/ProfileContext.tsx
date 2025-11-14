"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

type CoalitionSummary = {
  id: number | string;
  name?: string | null;
};

type ProfileData = {
  email: string | null;
  role: string | null;               // "admin" / "coalition_owner" / etc.
  role_level?: number | null;        // 0 = Admin, 1 = Coalition Owner, 2 = Standard User (convention)
  user_id?: number | string | null;
  company_id?: number | string | null;
  name?: string | null;
  coalition?: CoalitionSummary | null;
};

type ProfileContextType = {
  profileData: ProfileData | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  isCoalitionOwner: boolean;
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

    // Coalition info (supports multiple possible claim shapes)
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

    const role: string | null = claims.role ?? null;

    // --- role_level: from claim if present, else derived from role string ---
    const rawRoleLevel = claims.role_level ?? claims.roleLevel ?? null;
    let role_level: number | null = null;

    if (typeof rawRoleLevel === "number") {
      role_level = rawRoleLevel;
    } else if (typeof rawRoleLevel === "string" && rawRoleLevel !== "") {
      const parsed = Number(rawRoleLevel);
      role_level = Number.isFinite(parsed) ? parsed : null;
    } else if (role) {
      // Fallback mapping if backend only sends role string
      if (role === "admin") role_level = 0;
      else if (role === "coalition_owner") role_level = 1;
      else role_level = 2;
    }

    return {
      email: email ?? claims.email ?? null,
      role,
      role_level,
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

  const isAdmin = role === "admin";

  const isCoalitionOwner =
    role === "coalition_owner" ||
    Boolean(
      claims?.isCoalitionOwner ??
        claims?.is_coalition_owner ??
        claims?.coalition_owner ??
        (typeof profileData?.role_level === "number" &&
          profileData.role_level === 1)
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
