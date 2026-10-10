"use client";

import { useCallback } from "react";
import { useAuth } from "../auth/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: string; body?: unknown };

// Status values used by the bookings API, and how to show them
export type ApiStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export const statusLabel: Record<ApiStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function useAuthedApi() {
  const { token, refreshSession } = useAuth();

  return useCallback(
    async function request<T>(path: string, opts: Options = {}): Promise<T> {
      async function send(accessToken: string | null) {
        return fetch(`${API_BASE}${path}`, {
          method: opts.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: opts.body ? JSON.stringify(opts.body) : undefined,
        });
      }

      let res = await send(token);

      // Access tokens last about 15 minutes: refresh once and retry
      if (res.status === 401 && (await refreshSession())) {
        let fresh: string | null = null;
        try {
          fresh = localStorage.getItem("auth_token");
        } catch {
          // ignore storage errors
        }
        res = await send(fresh);
      }

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new ApiError(res.status, json?.error ?? `Request failed (${res.status})`);
      }
      return json as T;
    },
    [token, refreshSession]
  );
}