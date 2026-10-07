import type {
  FilterOptions,
  Paginated,
  ProviderSummary,
  ServiceSearchResult,
  ServiceType,
} from "@service-booking/shared";
import { query } from "../../config/pg";
import { SERVICE_TYPES, type SearchParams } from "./filters";

/** Collects query parameters and hands out $1, $2, ... placeholders. */
class Params {
  readonly values: unknown[] = [];
  add(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** Average rating + review count for a provider, ignoring hidden reviews. */
const RATING_JOIN = `
  LEFT JOIN LATERAL (
    SELECT COALESCE(ROUND(AVG(rv.rating)::numeric, 2), 0) AS avg_rating,
           COUNT(*) AS review_count
    FROM reviews rv
    WHERE rv.provider_id = p.id AND NOT rv.is_hidden
  ) r ON true`;

/** Only approved providers whose user account is active are public. */
const PUBLIC_PROVIDER = `p.status = 'approved' AND u.is_active`;

interface Built {
  /** Conditions on services (alias s), categories (alias c) and provider name (alias p). */
  serviceConds: string[];
  /** Conditions on the provider (alias p) and its rating (alias r). */
  providerConds: string[];
  /** SQL for distance in km (alias p), when geo search is requested. */
  distance?: string;
  /** Placeholders for ordering by name relevance. */
  qPrefix?: string;
  qContains?: string;
}

/**
 * Turns validated filters into SQL conditions. Both search modes share this,
 * so "services matching the filters" means the same thing everywhere.
 */
function buildConditions(f: SearchParams, p: Params): Built {
  const serviceConds: string[] = [];
  const providerConds: string[] = [];
  const built: Built = { serviceConds, providerConds };

  if (f.q) {
    // One placeholder; the patterns are built in SQL so the count query and the
    // data query always reference exactly the same parameters.
    const text = p.add(escapeLike(f.q));
    const contains = `('%' || ${text}::text || '%')`;
    built.qContains = contains;
    built.qPrefix = `(${text}::text || '%')`;
    serviceConds.push(
      `(s.name ILIKE ${contains} OR s.description ILIKE ${contains}
        OR c.name ILIKE ${contains} OR p.business_name ILIKE ${contains})`,
    );
  }

  if (f.categories.length > 0) {
    serviceConds.push(`c.slug = ANY(${p.add(f.categories.map((s) => s.toLowerCase()))}::text[])`);
  }
  if (f.serviceTypes.length > 0) {
    serviceConds.push(`s.service_type = ANY(${p.add(f.serviceTypes)}::text[])`);
  }
  if (f.minPrice !== undefined) serviceConds.push(`s.price >= ${p.add(f.minPrice)}`);
  if (f.maxPrice !== undefined) serviceConds.push(`s.price <= ${p.add(f.maxPrice)}`);

  if (f.location) {
    const like = p.add(`%${escapeLike(f.location)}%`);
    providerConds.push(`(p.city ILIKE ${like} OR p.address_line ILIKE ${like})`);
  }

  if (f.geo) {
    const lat = p.add(f.geo.lat);
    const lng = p.add(f.geo.lng);
    const radius = p.add(f.geo.radiusKm);
    // Haversine distance in km; LEAST/GREATEST guard against rounding just outside [-1, 1].
    const distance = `(6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians(${lat}::float8)) * cos(radians(p.latitude::float8))
        * cos(radians(p.longitude::float8) - radians(${lng}::float8))
        + sin(radians(${lat}::float8)) * sin(radians(p.latitude::float8))))))`;
    built.distance = distance;
    providerConds.push(`p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND ${distance} <= ${radius}::float8`);
  }

  if (f.minRating !== undefined && f.minRating > 0) {
    providerConds.push(`r.avg_rating >= ${p.add(f.minRating)}`);
  }

  if (f.available) {
    providerConds.push(
      `EXISTS (SELECT 1 FROM availability av WHERE av.provider_id = p.id AND av.is_active)`,
    );
  }

  if (f.date) {
    const d = p.add(f.date);
    // Approximation of "has a free slot on that date":
    //   capacity = sum over that weekday's working-hour rows of
    //              floor((working minutes - break minutes) / slot length)
    //   booked   = pending/confirmed bookings on the date
    //   and the provider has not marked the whole day as closed.
    // The booking module can replace this with real slot generation later.
    providerConds.push(`(
      (
        SELECT COALESCE(SUM(
                 FLOOR(GREATEST(0,
                   EXTRACT(EPOCH FROM (av.end_time - av.start_time)) / 60
                   - COALESCE(b.break_minutes, 0)
                 ) / av.slot_duration_minutes)
               ), 0)
        FROM availability av
        LEFT JOIN LATERAL (
          SELECT SUM(EXTRACT(EPOCH FROM (br.end_time - br.start_time)) / 60) AS break_minutes
          FROM availability_breaks br
          WHERE br.provider_id = av.provider_id
            AND br.day_of_week = av.day_of_week
            AND br.start_time >= av.start_time
            AND br.end_time <= av.end_time
        ) b ON true
        WHERE av.provider_id = p.id
          AND av.is_active
          AND av.day_of_week = EXTRACT(DOW FROM ${d}::date)
      ) > (
        SELECT COUNT(*) FROM bookings bk
        WHERE bk.provider_id = p.id
          AND bk.booking_date = ${d}::date
          AND bk.status IN ('pending', 'confirmed')
      )
      AND NOT EXISTS (
        SELECT 1 FROM availability_exceptions ex
        WHERE ex.provider_id = p.id
          AND ex.exception_date = ${d}::date
          AND NOT ex.is_available
      )
    )`);
  }

  return built;
}

const toNumber = (value: unknown): number => Number(value);

function pagination(total: number, f: SearchParams) {
  return {
    page: f.page,
    limit: f.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.limit)),
  };
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  service_type: string;
  price: string;
  currency: string;
  duration_minutes: number;
  category_id: string;
  category_name: string;
  category_slug: string;
  provider_id: string;
  provider_slug: string;
  business_name: string;
  city: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  avg_rating: string;
  review_count: string;
  distance_km?: number | null;
}

function serviceOrderBy(f: SearchParams, b: Built): string {
  switch (f.sort) {
    case "price_asc":
      return "s.price ASC, r.avg_rating DESC, s.id";
    case "price_desc":
      return "s.price DESC, r.avg_rating DESC, s.id";
    case "rating":
      return "r.avg_rating DESC, r.review_count DESC, s.name ASC, s.id";
    case "newest":
      return "s.created_at DESC, s.id";
    case "name":
      return "s.name ASC, s.id";
    case "distance":
      return `${b.distance} ASC, s.id`;
    default:
      return b.qPrefix
        ? `CASE WHEN s.name ILIKE ${b.qPrefix} THEN 0 WHEN s.name ILIKE ${b.qContains} THEN 1 ELSE 2 END,
           r.avg_rating DESC, r.review_count DESC, s.name ASC, s.id`
        : "r.avg_rating DESC, r.review_count DESC, s.name ASC, s.id";
  }
}

export async function searchServices(f: SearchParams): Promise<Paginated<ServiceSearchResult>> {
  const p = new Params();
  const b = buildConditions(f, p);

  const from = `
    FROM services s
    JOIN providers p ON p.id = s.provider_id
    JOIN users u ON u.id = p.user_id
    JOIN categories c ON c.id = s.category_id AND c.is_active
    ${RATING_JOIN}`;
  const where = [`s.is_active`, PUBLIC_PROVIDER, ...b.serviceConds, ...b.providerConds].join(" AND ");

  const filterValues = [...p.values];
  const limit = p.add(f.limit);
  const offset = p.add((f.page - 1) * f.limit);

  const [countResult, dataResult] = await Promise.all([
    query<{ total: string }>(`SELECT COUNT(*) AS total ${from} WHERE ${where}`, filterValues),
    query<ServiceRow>(
      `SELECT s.id, s.name, s.description, s.service_type, s.price, s.currency, s.duration_minutes,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              p.id AS provider_id, p.slug AS provider_slug, p.business_name, p.city,
              p.profile_image_url, p.is_verified, r.avg_rating, r.review_count
              ${b.distance ? `, ${b.distance} AS distance_km` : ""}
       ${from}
       WHERE ${where}
       ORDER BY ${serviceOrderBy(f, b)}
       LIMIT ${limit} OFFSET ${offset}`,
      p.values,
    ),
  ]);

  const data: ServiceSearchResult[] = dataResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    serviceType: row.service_type as ServiceType,
    price: toNumber(row.price),
    currency: row.currency,
    durationMinutes: row.duration_minutes,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
    provider: {
      id: row.provider_id,
      slug: row.provider_slug,
      businessName: row.business_name,
      city: row.city,
      profileImageUrl: row.profile_image_url,
      isVerified: row.is_verified,
      rating: { average: toNumber(row.avg_rating), count: toNumber(row.review_count) },
    },
    ...(row.distance_km != null ? { distanceKm: Math.round(toNumber(row.distance_km) * 10) / 10 } : {}),
  }));

  return { data, meta: pagination(toNumber(countResult.rows[0].total), f) };
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

interface ProviderRow {
  id: string;
  slug: string;
  business_name: string;
  headline: string | null;
  city: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  years_experience: number | null;
  avg_rating: string;
  review_count: string;
  matching_services: string;
  min_price: string;
  currency: string;
  category_names: string[];
  distance_km?: number | null;
}

function providerOrderBy(f: SearchParams, b: Built): string {
  switch (f.sort) {
    case "price_asc":
      return "m.min_price ASC, r.avg_rating DESC, p.id";
    case "price_desc":
      return "m.min_price DESC, r.avg_rating DESC, p.id";
    case "rating":
      return "r.avg_rating DESC, r.review_count DESC, p.business_name ASC, p.id";
    case "newest":
      return "p.created_at DESC, p.id";
    case "name":
      return "p.business_name ASC, p.id";
    case "distance":
      return `${b.distance} ASC, p.id`;
    default:
      return b.qPrefix
        ? `CASE WHEN p.business_name ILIKE ${b.qPrefix} THEN 0
                WHEN p.business_name ILIKE ${b.qContains} THEN 1 ELSE 2 END,
           r.avg_rating DESC, r.review_count DESC, p.business_name ASC, p.id`
        : "r.avg_rating DESC, r.review_count DESC, p.business_name ASC, p.id";
  }
}

/**
 * Providers that have at least one active service matching the service-level
 * filters (and that satisfy the provider-level filters).
 */
export async function searchProviders(f: SearchParams): Promise<Paginated<ProviderSummary>> {
  const p = new Params();
  const b = buildConditions(f, p);

  const serviceWhere = [`s.provider_id = p.id`, `s.is_active`, ...b.serviceConds].join(" AND ");
  const from = `
    FROM providers p
    JOIN users u ON u.id = p.user_id
    ${RATING_JOIN}
    JOIN LATERAL (
      SELECT COUNT(*) AS matching_services,
             MIN(s.price) AS min_price,
             MIN(s.currency) AS currency,
             ARRAY_AGG(DISTINCT c.name ORDER BY c.name) AS category_names
      FROM services s
      JOIN categories c ON c.id = s.category_id AND c.is_active
      WHERE ${serviceWhere}
    ) m ON m.matching_services > 0`;
  const where = [PUBLIC_PROVIDER, ...b.providerConds].join(" AND ");

  const filterValues = [...p.values];
  const limit = p.add(f.limit);
  const offset = p.add((f.page - 1) * f.limit);

  const [countResult, dataResult] = await Promise.all([
    query<{ total: string }>(`SELECT COUNT(*) AS total ${from} WHERE ${where}`, filterValues),
    query<ProviderRow>(
      `SELECT p.id, p.slug, p.business_name, p.headline, p.city, p.profile_image_url,
              p.is_verified, p.years_experience, r.avg_rating, r.review_count,
              m.matching_services, m.min_price, m.currency, m.category_names
              ${b.distance ? `, ${b.distance} AS distance_km` : ""}
       ${from}
       WHERE ${where}
       ORDER BY ${providerOrderBy(f, b)}
       LIMIT ${limit} OFFSET ${offset}`,
      p.values,
    ),
  ]);

  const data: ProviderSummary[] = dataResult.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    businessName: row.business_name,
    headline: row.headline,
    city: row.city,
    profileImageUrl: row.profile_image_url,
    isVerified: row.is_verified,
    yearsExperience: row.years_experience,
    rating: { average: toNumber(row.avg_rating), count: toNumber(row.review_count) },
    categories: row.category_names,
    serviceCount: toNumber(row.matching_services),
    startingPrice: toNumber(row.min_price),
    currency: row.currency,
    ...(row.distance_km != null ? { distanceKm: Math.round(toNumber(row.distance_km) * 10) / 10 } : {}),
  }));

  return { data, meta: pagination(toNumber(countResult.rows[0].total), f) };
}

// ---------------------------------------------------------------------------
// Filter options (drives the filter panel in the UI)
// ---------------------------------------------------------------------------

export async function getFilterOptions(): Promise<FilterOptions> {
  const publicServices = `
    FROM services s
    JOIN providers p ON p.id = s.provider_id
    JOIN users u ON u.id = p.user_id
    JOIN categories c ON c.id = s.category_id AND c.is_active
    WHERE s.is_active AND ${PUBLIC_PROVIDER}`;

  const [categories, cities, price] = await Promise.all([
    query<{ slug: string; name: string; service_count: string }>(
      `SELECT c.slug, c.name, COUNT(s.id) AS service_count
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id AND s.is_active
         AND EXISTS (SELECT 1 FROM providers p JOIN users u ON u.id = p.user_id
                     WHERE p.id = s.provider_id AND ${PUBLIC_PROVIDER})
       WHERE c.is_active
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`,
    ),
    query<{ city: string; provider_count: string }>(
      `SELECT p.city, COUNT(DISTINCT p.id) AS provider_count
       FROM providers p JOIN users u ON u.id = p.user_id
       WHERE ${PUBLIC_PROVIDER} AND p.city IS NOT NULL
         AND EXISTS (SELECT 1 FROM services s WHERE s.provider_id = p.id AND s.is_active)
       GROUP BY p.city
       ORDER BY p.city`,
    ),
    query<{ min_price: string | null; max_price: string | null; currency: string | null }>(
      `SELECT MIN(s.price) AS min_price, MAX(s.price) AS max_price, MIN(s.currency) AS currency
       ${publicServices}`,
    ),
  ]);

  return {
    categories: categories.rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      serviceCount: toNumber(r.service_count),
    })),
    cities: cities.rows.map((r) => ({ name: r.city, providerCount: toNumber(r.provider_count) })),
    serviceTypes: [...SERVICE_TYPES] as ServiceType[],
    priceRange: {
      min: toNumber(price.rows[0].min_price ?? 0),
      max: toNumber(price.rows[0].max_price ?? 0),
      currency: price.rows[0].currency ?? "PKR",
    },
  };
}
