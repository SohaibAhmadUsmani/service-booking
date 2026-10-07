import type {
  ProviderProfile,
  ProviderReviewDto,
  ServiceDto,
  ServiceType,
  WorkingHoursDto,
} from "@service-booking/shared";
import { query } from "../../config/pg";

const PUBLIC_PROVIDER = `p.status = 'approved' AND u.is_active`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9-]{1,100}$/i;

interface ProviderRow {
  id: string;
  slug: string;
  business_name: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  address_line: string | null;
  latitude: string | null;
  longitude: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  years_experience: number | null;
  is_verified: boolean;
  created_at: Date;
}

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
}

export function mapService(row: ServiceRow): ServiceDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    serviceType: row.service_type as ServiceType,
    price: Number(row.price),
    currency: row.currency,
    durationMinutes: row.duration_minutes,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
  };
}

/** Public providers only. Accepts either the UUID or the slug. */
async function findProviderRow(idOrSlug: string): Promise<ProviderRow | null> {
  const byId = UUID_RE.test(idOrSlug);
  if (!byId && !SLUG_RE.test(idOrSlug)) return null;

  const { rows } = await query<ProviderRow>(
    `SELECT p.id, p.slug, p.business_name, p.headline, p.bio, p.city, p.address_line,
            p.latitude, p.longitude, p.profile_image_url, p.cover_image_url,
            p.years_experience, p.is_verified, p.created_at
     FROM providers p JOIN users u ON u.id = p.user_id
     WHERE ${PUBLIC_PROVIDER} AND ${byId ? "p.id = $1" : "lower(p.slug) = lower($1)"}`,
    [idOrSlug],
  );
  return rows[0] ?? null;
}

export async function providerExists(idOrSlug: string): Promise<string | null> {
  const row = await findProviderRow(idOrSlug);
  return row ? row.id : null;
}

export async function listProviderServices(
  providerId: string,
  categorySlug?: string,
): Promise<ServiceDto[]> {
  const params: unknown[] = [providerId];
  let categoryFilter = "";
  if (categorySlug) {
    params.push(categorySlug.toLowerCase());
    categoryFilter = "AND c.slug = $2";
  }
  const { rows } = await query<ServiceRow>(
    `SELECT s.id, s.name, s.description, s.service_type, s.price, s.currency, s.duration_minutes,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug
     FROM services s JOIN categories c ON c.id = s.category_id AND c.is_active
     WHERE s.provider_id = $1 AND s.is_active ${categoryFilter}
     ORDER BY c.sort_order, c.name, s.price, s.name`,
    params,
  );
  return rows.map(mapService);
}

/** "Maryam Chaudhry" -> "Maryam C." (reviewer privacy). */
function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "Customer";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export async function getProviderProfile(idOrSlug: string): Promise<ProviderProfile | null> {
  const provider = await findProviderRow(idOrSlug);
  if (!provider) return null;

  const [services, ratingRows, hours, reviews] = await Promise.all([
    listProviderServices(provider.id),
    query<{ rating: number; count: string }>(
      `SELECT rating, COUNT(*) AS count FROM reviews
       WHERE provider_id = $1 AND NOT is_hidden GROUP BY rating`,
      [provider.id],
    ),
    query<{ day_of_week: number; start_time: string; end_time: string }>(
      `SELECT day_of_week, start_time, end_time FROM availability
       WHERE provider_id = $1 AND is_active
       ORDER BY day_of_week, start_time`,
      [provider.id],
    ),
    query<{
      id: string;
      rating: number;
      comment: string | null;
      full_name: string;
      service_name: string | null;
      created_at: Date;
    }>(
      `SELECT rv.id, rv.rating, rv.comment, u.full_name, s.name AS service_name, rv.created_at
       FROM reviews rv
       JOIN users u ON u.id = rv.customer_id
       LEFT JOIN services s ON s.id = rv.service_id
       WHERE rv.provider_id = $1 AND NOT rv.is_hidden
       ORDER BY rv.created_at DESC, rv.id
       LIMIT 10`,
      [provider.id],
    ),
  ]);

  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let total = 0;
  let sum = 0;
  for (const row of ratingRows.rows) {
    const count = Number(row.count);
    distribution[row.rating - 1] = count;
    total += count;
    sum += row.rating * count;
  }

  const workingHours: WorkingHoursDto[] = hours.rows.map((h) => ({
    dayOfWeek: h.day_of_week,
    start: h.start_time.slice(0, 5),
    end: h.end_time.slice(0, 5),
  }));

  const recentReviews: ProviderReviewDto[] = reviews.rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    customerName: displayName(r.full_name),
    serviceName: r.service_name,
    createdAt: r.created_at.toISOString(),
  }));

  return {
    id: provider.id,
    slug: provider.slug,
    businessName: provider.business_name,
    headline: provider.headline,
    bio: provider.bio,
    city: provider.city,
    addressLine: provider.address_line,
    latitude: provider.latitude === null ? null : Number(provider.latitude),
    longitude: provider.longitude === null ? null : Number(provider.longitude),
    profileImageUrl: provider.profile_image_url,
    coverImageUrl: provider.cover_image_url,
    yearsExperience: provider.years_experience,
    isVerified: provider.is_verified,
    memberSince: provider.created_at.toISOString(),
    rating: {
      average: total === 0 ? 0 : Math.round((sum / total) * 100) / 100,
      count: total,
      distribution,
    },
    services,
    workingHours,
    recentReviews,
  };
}
