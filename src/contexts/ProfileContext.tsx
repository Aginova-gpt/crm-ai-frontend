"use client";

import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

type ProfileData = {
  email: string;
  role_level: number;
  coalition?: {
    id: number;
    name: string;
  };
};

type ProfileContextType = {
  profileData: ProfileData | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  isCoalitionOwner: boolean;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const { isLoggedIn } = useAuth();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL("users/current", "users/current")
      );
      return response.json() as Promise<ProfileData>;
    },
    enabled: isLoggedIn,
  });

  const isAdmin = profileData?.role_level === 0;
  const isCoalitionOwner = profileData?.role_level === 1;

  return (
    <ProfileContext.Provider value={{ profileData, isLoading, isAdmin, isCoalitionOwner }}>
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