/**
 * Public catalog / search API shapes (categories, providers, services, search).
 * Owner: Khadija. All responses are wrapped as `{ data }` or `{ data, meta }`.
 */
import type { ServiceType } from "./domain";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  /** Active services offered by approved providers in this category. */
  serviceCount: number;
  providerCount: number;
}

export interface RatingSummary {
  /** 0 when there are no reviews yet. */
  average: number;
  count: number;
}

export interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  serviceType: ServiceType;
  price: number;
  currency: string;
  durationMinutes: number;
  category: { id: string; name: string; slug: string };
}

/** A service together with a summary of the provider that offers it (search results). */
export interface ServiceSearchResult extends ServiceDto {
  provider: {
    id: string;
    slug: string;
    businessName: string;
    city: string | null;
    profileImageUrl: string | null;
    isVerified: boolean;
    rating: RatingSummary;
  };
  /** Only present when lat/lng were sent with the search. */
  distanceKm?: number;
}

export interface ProviderSummary {
  id: string;
  slug: string;
  businessName: string;
  headline: string | null;
  city: string | null;
  profileImageUrl: string | null;
  isVerified: boolean;
  yearsExperience: number | null;
  rating: RatingSummary;
  categories: string[];
  /** Number of services matching the current filters. */
  serviceCount: number;
  /** Lowest price among the services matching the current filters. */
  startingPrice: number;
  currency: string;
  distanceKm?: number;
}

export interface ProviderReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  /** First name + last initial, e.g. "Maryam C." */
  customerName: string;
  serviceName: string | null;
  createdAt: string;
}

export interface WorkingHoursDto {
  /** 0 = Sunday ... 6 = Saturday */
  dayOfWeek: number;
  /** "HH:MM" 24-hour */
  start: string;
  end: string;
}

export interface ProviderProfile {
  id: string;
  slug: string;
  businessName: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  yearsExperience: number | null;
  isVerified: boolean;
  memberSince: string;
  rating: RatingSummary & {
    /** Review counts for 1..5 stars, index 0 = 1 star. */
    distribution: [number, number, number, number, number];
  };
  services: ServiceDto[];
  workingHours: WorkingHoursDto[];
  recentReviews: ProviderReviewDto[];
}

export type SearchSort =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "newest"
  | "name"
  | "distance";

/** Query parameters accepted by /api/search/services and /api/search/providers. */
export interface SearchFilters {
  q?: string;
  /** Category slug(s), comma separated when sent as a string. */
  category?: string;
  /** City or area text. */
  location?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  serviceType?: string;
  /** YYYY-MM-DD: only providers with free capacity that day. */
  date?: string;
  /** true: only providers that have working hours set up. */
  available?: boolean;
  sort?: SearchSort;
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  categories: { slug: string; name: string; serviceCount: number }[];
  cities: { name: string; providerCount: number }[];
  serviceTypes: ServiceType[];
  priceRange: { min: number; max: number; currency: string };
}
