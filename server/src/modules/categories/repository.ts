import type { CategoryDto } from "@service-booking/shared";
import { query } from "../../config/pg";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  service_count: string;
  provider_count: string;
}

function toDto(row: CategoryRow): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    imageUrl: row.image_url,
    serviceCount: Number(row.service_count),
    providerCount: Number(row.provider_count),
  };
}

// Counts only include active services of approved providers with active accounts.
const SELECT_CATEGORIES = `
  SELECT c.id, c.name, c.slug, c.description, c.icon, c.image_url,
         COUNT(s.id) AS service_count,
         COUNT(DISTINCT s.provider_id) AS provider_count
  FROM categories c
  LEFT JOIN services s ON s.category_id = c.id AND s.is_active
    AND EXISTS (
      SELECT 1 FROM providers p JOIN users u ON u.id = p.user_id
      WHERE p.id = s.provider_id AND p.status = 'approved' AND u.is_active
    )
  WHERE c.is_active`;

export async function listCategories(): Promise<CategoryDto[]> {
  const { rows } = await query<CategoryRow>(
    `${SELECT_CATEGORIES}
     GROUP BY c.id
     ORDER BY c.sort_order, c.name`,
  );
  return rows.map(toDto);
}

export async function findCategoryBySlug(slug: string): Promise<CategoryDto | null> {
  const { rows } = await query<CategoryRow>(
    `${SELECT_CATEGORIES} AND c.slug = $1
     GROUP BY c.id`,
    [slug.toLowerCase()],
  );
  return rows[0] ? toDto(rows[0]) : null;
}
