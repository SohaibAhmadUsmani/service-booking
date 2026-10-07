"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { UserProfile } from "@service-booking/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: {
    (token: string, refreshToken: string, user: UserProfile): void;
    (token: string, user: UserProfile): void;
  };
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on initial mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("auth_token");
      const storedRefreshToken = localStorage.getItem("auth_refresh_token");
      const storedUser = localStorage.getItem("auth_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
      }
    } catch {
      // Ignore localStorage read errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update session state and persist tokens
  const setSession = useCallback(
    (
      newToken: string,
      refreshTokenOrUser: string | UserProfile,
      maybeUser?: UserProfile
    ) => {
      let newRefreshToken: string | null = null;
      let newUser: UserProfile;

      if (typeof refreshTokenOrUser === "string" && maybeUser) {
        newRefreshToken = refreshTokenOrUser;
        newUser = maybeUser;
      } else {
        newUser = refreshTokenOrUser as UserProfile;
      }

      setToken(newToken);
      setUser(newUser);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      try {
        localStorage.setItem("auth_token", newToken);
        localStorage.setItem("auth_user", JSON.stringify(newUser));
        if (newRefreshToken) {
          localStorage.setItem("auth_refresh_token", newRefreshToken);
        }
      } catch {
        // Ignore storage errors
      }
    },
    []
  );

  // Clean logout: revokes token family on the backend and purges local storage
  const logout = useCallback(async () => {
    const activeRefreshToken =
      refreshToken || localStorage.getItem("auth_refresh_token");

    // Clear local state immediately for responsive UX
    setToken(null);
    setRefreshToken(null);
    setUser(null);

    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refresh_token");
      localStorage.removeItem("auth_user");
    } catch {
      // Ignore storage errors
    }

    // Call server revocation endpoint if a refresh token was present
    if (activeRefreshToken) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: activeRefreshToken }),
          keepalive: true,
        });
      } catch {
        // Network errors on logout should not block UI logout completion
      }
    }
  }, [refreshToken]);

  // Silently refresh the access token using the rotating refresh token
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken =
      refreshToken || localStorage.getItem("auth_refresh_token");

    if (!currentRefreshToken) {
      await logout();
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      const data = await res.json();

      if (!res.ok || !data.data?.token || !data.data?.refreshToken) {
        await logout();
        return false;
      }

      const { token: nextToken, refreshToken: nextRefreshToken } = data.data;

      setToken(nextToken);
      setRefreshToken(nextRefreshToken);

      try {
        localStorage.setItem("auth_token", nextToken);
        localStorage.setItem("auth_refresh_token", nextRefreshToken);
      } catch {
        // Ignore storage errors
      }

      return true;
    } catch {
      await logout();
      return false;
    }
  }, [refreshToken, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!token && !!user,
        isLoading,
        setSession,
        refreshSession,
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
