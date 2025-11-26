"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  token: string | null;
  isLoggedIn: boolean;
  refreshToken: string | null;
  email: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to read the `auth` cookie
  const checkAuthStatus = () => {
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=").map((c) => c.trim());
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    return cookies.auth === "true";
  };

  useEffect(() => {
    setIsLoggedIn(checkAuthStatus());
    const savedToken = localStorage.getItem("token");
    const savedRefreshToken = localStorage.getItem("refreshToken");
    const savedEmail = localStorage.getItem("email");
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    if (savedEmail) {
      setEmail(savedEmail);
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, refreshToken: string, email: string) => {
    setToken(token);
    setRefreshToken(refreshToken);
    setIsLoggedIn(true);
    setEmail(email);
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("email", email);
    document.cookie = "auth=true; path=/";
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setIsLoggedIn(false);
    setEmail(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("email");
    document.cookie = "auth=false; path=/";
  };

  return (
    <AuthContext.Provider
      value={{ token, isLoggedIn, login, logout, refreshToken, email, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
