"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { UserProfile, UserRole } from "@service-booking/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function parseJwtExp(jwtToken: string): number | null {
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isCustomer(user: UserProfile | null): boolean {
  return user?.role === UserRole.Customer;
}

export function isProvider(user: UserProfile | null): boolean {
  return user?.role === UserRole.Provider;
}

export function isAdmin(user: UserProfile | null): boolean {
  return user?.role === UserRole.Admin;
}

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

  // Restore session from localStorage on initial mount and listen for multi-tab sync
  useEffect(() => {
    function syncFromStorage() {
      try {
        const storedToken = localStorage.getItem("auth_token");
        const storedRefreshToken = localStorage.getItem("auth_refresh_token");
        const storedUser = localStorage.getItem("auth_user");

        if (storedToken && storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed && typeof parsed === "object" && parsed.id) {
              setToken(storedToken);
              setUser(parsed);
              if (storedRefreshToken) {
                setRefreshToken(storedRefreshToken);
              }
            } else {
              throw new Error("Invalid user shape");
            }
          } catch {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_refresh_token");
            localStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
            setRefreshToken(null);
          }
        } else {
          setToken(null);
          setUser(null);
          setRefreshToken(null);
        }
      } catch {
        // Ignore localStorage read errors
      } finally {
        setIsLoading(false);
      }
    }

    syncFromStorage();

    // Multi-tab session synchronization listener via storage event
    function handleStorageChange(e: StorageEvent) {
      if (e.key === "auth_token" || e.key === "auth_user" || e.key === "auth_refresh_token") {
        syncFromStorage();
      }
    }

    window.addEventListener("storage", handleStorageChange);

    // Multi-tab synchronization via BroadcastChannel when available
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("auth_sync_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "SESSION_UPDATE" || event.data?.type === "LOGOUT") {
          syncFromStorage();
        }
      };
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (channel) {
        channel.close();
      }
    };
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

        if (typeof BroadcastChannel !== "undefined") {
          const ch = new BroadcastChannel("auth_sync_channel");
          ch.postMessage({ type: "SESSION_UPDATE" });
          ch.close();
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

      if (typeof BroadcastChannel !== "undefined") {
        const ch = new BroadcastChannel("auth_sync_channel");
        ch.postMessage({ type: "LOGOUT" });
        ch.close();
      }
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

        if (typeof BroadcastChannel !== "undefined") {
          const ch = new BroadcastChannel("auth_sync_channel");
          ch.postMessage({ type: "SESSION_UPDATE" });
          ch.close();
        }
      } catch {
        // Ignore storage errors
      }

      return true;
    } catch {
      await logout();
      return false;
    }
  }, [refreshToken, logout]);

  // Proactive scheduled token refresh (refreshes 60 seconds before expiration)
  useEffect(() => {
    if (!token) return;

    const expMs = parseJwtExp(token);
    if (!expMs) return;

    const refreshDelay = Math.max(5000, expMs - Date.now() - 60000);
    const timer = setTimeout(() => {
      refreshSession();
    }, refreshDelay);

    return () => clearTimeout(timer);
  }, [token, refreshSession]);

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
