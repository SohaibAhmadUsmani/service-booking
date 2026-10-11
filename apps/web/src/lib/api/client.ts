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
}

export interface RequestOptions {
  auth?: boolean;
  headers?: Record<string, string>;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
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
  });

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
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, "GET", undefined, options);
}

export async function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, "POST", body, options);
}

export async function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, "PATCH", body, options);
}

export async function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, "DELETE", undefined, options);
}
