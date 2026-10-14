const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  fieldErrors: Record<string, string>;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(details)) {
      for (const entry of details) {
        if (entry && typeof entry === "object" && "field" in entry && "message" in entry) {
          fieldErrors[String((entry as { field: unknown }).field)] = String(
            (entry as { message: unknown }).message
          );
        }
      }
    }
    this.fieldErrors = fieldErrors;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isValidationError(): boolean {
    return this.status === 400 && Object.keys(this.fieldErrors).length > 0;
  }
}

export interface RequestOptions {
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("auth_refresh_token");
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!res.ok) {
        window.localStorage.removeItem("auth_token");
        window.localStorage.removeItem("auth_refresh_token");
        window.localStorage.removeItem("auth_user");
        if (typeof BroadcastChannel !== "undefined") {
          const ch = new BroadcastChannel("auth_sync_channel");
          ch.postMessage({ type: "LOGOUT" });
          ch.close();
        }
        return null;
      }

      const json = await res.json();
      if (json.data?.token && json.data?.refreshToken) {
        window.localStorage.setItem("auth_token", json.data.token);
        window.localStorage.setItem("auth_refresh_token", json.data.refreshToken);
        return json.data.token as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> {
  try {
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (options.auth !== false) {
      const token = getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });

    // Handle 401 Unauthorized with silent token refresh attempt
    if (res.status === 401 && options.auth !== false && !isRetry && !path.includes("/api/auth/")) {
      const newToken = await attemptTokenRefresh();
      if (newToken) {
        return request<T>(path, method, body, options, true);
      }
    }

    if (!res.ok) {
      let payload: { error?: string; details?: unknown } | null = null;
      try {
        payload = (await res.json()) as { error?: string; details?: unknown };
      } catch {
        payload = null;
      }
      throw new ApiError(payload?.error ?? `API error: ${res.status}`, res.status, payload?.details);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.name === "AbortError")
    ) {
      throw new ApiError("Request was cancelled", 0);
    }
    throw err;
  }
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, "GET", undefined, options);
}

export async function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, "POST", body, options);
}

export async function apiPut<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, "PUT", body, options);
}

export async function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, "PATCH", body, options);
}

export async function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, "DELETE", undefined, options);
}
