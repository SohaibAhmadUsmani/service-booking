/** Owner: Khadija — typed wrappers for the public catalog / search endpoints. */
import type {
  CategoryDto,
  FilterOptions,
  Paginated,
  ProviderProfile,
  ProviderSummary,
  SearchFilters,
  ServiceDto,
  ServiceSearchResult,
} from "@service-booking/shared";
import { apiGet } from "./client";

type QueryValue = string | number | boolean | undefined | null;

/** Builds "?a=1&b=2", skipping empty values. */
export function toQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function fetchCategories(): Promise<CategoryDto[]> {
  const res = await apiGet<{ data: CategoryDto[] }>("/api/categories");
  return res.data;
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const res = await apiGet<{ data: FilterOptions }>("/api/search/filters");
  return res.data;
}

export function searchServices(filters: SearchFilters): Promise<Paginated<ServiceSearchResult>> {
  return apiGet(`/api/search/services${toQueryString({ ...filters })}`);
}

export function searchProviders(filters: SearchFilters): Promise<Paginated<ProviderSummary>> {
  return apiGet(`/api/search/providers${toQueryString({ ...filters })}`);
}

/** `idOrSlug` is the provider's UUID or its slug. */
export async function fetchProvider(idOrSlug: string): Promise<ProviderProfile> {
  const res = await apiGet<{ data: ProviderProfile }>(
    `/api/providers/${encodeURIComponent(idOrSlug)}`,
  );
  return res.data;
}

export async function fetchProviderServices(idOrSlug: string): Promise<ServiceDto[]> {
  const res = await apiGet<{ data: ServiceDto[] }>(
    `/api/providers/${encodeURIComponent(idOrSlug)}/services`,
  );
  return res.data;
}
