"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, UserRole } from "@service-booking/shared";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (token: string, user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  function setSession(newToken: string, newUser: UserProfile) {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem("auth_token", newToken);
      localStorage.setItem("auth_user", JSON.stringify(newUser));
    } catch {
      // Ignore storage errors
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } catch {
      // Ignore storage errors
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
