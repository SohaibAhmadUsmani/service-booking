import type { Request } from "express";
import { badRequest } from "../../lib/httpError";

/** Values of the ServiceType enum in shared/types (kept as plain strings so the server needs no runtime import from shared). */
export const SERVICE_TYPES = ["home_visit", "in_store", "online"] as const;

export const SORT_KEYS = [
  "relevance",
  "price_asc",
  "price_desc",
  "rating",
  "newest",
  "name",
  "distance",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 50;
const DEFAULT_RADIUS_KM = 25;

export interface SearchParams {
  q?: string;
  categories: string[];
  location?: string;
  geo?: { lat: number; lng: number; radiusKm: number };
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  serviceTypes: string[];
  date?: string;
  available: boolean;
  sort: SortKey;
  page: number;
  limit: number;
}

type QueryValue = Request["query"][string];

/** Returns the trimmed string, or undefined when the parameter is missing/empty. */
function readString(query: Request["query"], key: string, maxLength = 100): string | undefined {
  const raw: QueryValue = query[key];
  if (raw === undefined) return undefined;
  if (typeof raw !== "string") throw badRequest(`${key} must be a single text value`);
  const value = raw.trim();
  if (value === "") return undefined;
  if (value.length > maxLength) throw badRequest(`${key} must be at most ${maxLength} characters`);
  return value;
}

function readNumber(
  query: Request["query"],
  key: string,
  min: number,
  max: number,
): number | undefined {
  const raw = readString(query, key, 30);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw badRequest(`${key} must be a number`);
  if (value < min || value > max) throw badRequest(`${key} must be between ${min} and ${max}`);
  return value;
}

function readInteger(
  query: Request["query"],
  key: string,
  min: number,
  max: number,
  fallback: number,
): number {
  const value = readNumber(query, key, min, max);
  if (value === undefined) return fallback;
  if (!Number.isInteger(value)) throw badRequest(`${key} must be a whole number`);
  return value;
}

/** Accepts ?key=a,b or ?key=a&key=b. */
function readList(query: Request["query"], key: string, maxItems = 10): string[] {
  const raw: QueryValue = query[key];
  if (raw === undefined) return [];
  const parts = Array.isArray(raw) ? raw : [raw];
  const items: string[] = [];
  for (const part of parts) {
    if (typeof part !== "string") throw badRequest(`${key} must be text`);
    for (const piece of part.split(",")) {
      const trimmed = piece.trim();
      if (trimmed && !items.includes(trimmed)) items.push(trimmed);
    }
  }
  if (items.length > maxItems) throw badRequest(`${key} accepts at most ${maxItems} values`);
  return items;
}

function readBoolean(query: Request["query"], key: string): boolean | undefined {
  const raw = readString(query, key, 10);
  if (raw === undefined) return undefined;
  const value = raw.toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw badRequest(`${key} must be true or false`);
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Validates and normalises the query string of the search/provider-list endpoints. */
export function parseSearchParams(req: Request): SearchParams {
  const query = req.query;

  const q = readString(query, "q");
  const location = readString(query, "location");

  const categories = readList(query, "category");
  for (const slug of categories) {
    if (!/^[a-z0-9-]{1,80}$/i.test(slug)) throw badRequest(`Invalid category: ${slug}`);
  }

  const serviceTypes = readList(query, "serviceType");
  for (const type of serviceTypes) {
    if (!(SERVICE_TYPES as readonly string[]).includes(type)) {
      throw badRequest(`serviceType must be one of: ${SERVICE_TYPES.join(", ")}`);
    }
  }

  const minPrice = readNumber(query, "minPrice", 0, 100_000_000);
  const maxPrice = readNumber(query, "maxPrice", 0, 100_000_000);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw badRequest("minPrice cannot be greater than maxPrice");
  }

  const minRating = readNumber(query, "minRating", 0, 5);

  const date = readString(query, "date", 10);
  if (date !== undefined && !isRealDate(date)) {
    throw badRequest("date must be a valid date in YYYY-MM-DD format");
  }

  const lat = readNumber(query, "lat", -90, 90);
  const lng = readNumber(query, "lng", -180, 180);
  const radius = readNumber(query, "radiusKm", 0.1, 500);
  if ((lat === undefined) !== (lng === undefined)) {
    throw badRequest("lat and lng must be provided together");
  }
  if (radius !== undefined && lat === undefined) {
    throw badRequest("radiusKm requires lat and lng");
  }
  const geo =
    lat !== undefined && lng !== undefined
      ? { lat, lng, radiusKm: radius ?? DEFAULT_RADIUS_KM }
      : undefined;

  const sortRaw = readString(query, "sort", 20) ?? "relevance";
  if (!(SORT_KEYS as readonly string[]).includes(sortRaw)) {
    throw badRequest(`sort must be one of: ${SORT_KEYS.join(", ")}`);
  }
  const sort = sortRaw as SortKey;
  if (sort === "distance" && !geo) {
    throw badRequest("sort=distance requires lat and lng");
  }

  return {
    q,
    categories,
    location,
    geo,
    minPrice,
    maxPrice,
    minRating,
    serviceTypes,
    date,
    available: readBoolean(query, "available") ?? false,
    sort,
    page: readInteger(query, "page", 1, 10_000, 1),
    limit: readInteger(query, "limit", 1, MAX_LIMIT, DEFAULT_LIMIT),
  };
}
