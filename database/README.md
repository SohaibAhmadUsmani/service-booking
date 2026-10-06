# Database

PostgreSQL. Migrations live in `migrations/`, development seed data in `seeds/`.

## Setup

```bash
createdb service_booking                    # or create it in pgAdmin
cp server/.env.example server/.env          # then set DATABASE_URL (and JWT_SECRET)
npm install
npm run db:migrate                          # applies any new migration files
npm run db:seed                             # sample categories, providers, services, reviews
```

`db:migrate` records applied files in a `schema_migrations` table, so it is safe to re-run.
Every migration runs in a transaction. `db:seed` is also safe to re-run.

## Migrations

| File | Tables |
|------|--------|
| `0001_initial.sql` | `users`, `customers`, `providers`, `categories`, `services` |
| `0002_availability_and_bookings.sql` | `availability`, `availability_breaks`, `availability_exceptions`, `bookings` |
| `0003_payments_and_reviews.sql` | `payments`, `reviews` |
| `0004_notifications_and_complaints.sql` | `notifications`, `complaints` |

- Add new files with the next number (`0005_...sql`). **Never edit a migration that has been merged**; add a new one.
- Document breaking changes in PR descriptions.

## Conventions

- UUID primary keys; `created_at` / `updated_at` (trigger-maintained) on mutable tables.
- Enum-like columns are `TEXT` + `CHECK`; allowed values mirror `shared/types/domain.ts`.
- `bookings.booking_code` (`BK-000001`) is the human-friendly booking ID; `bookings.price` is a snapshot of the service price.
- A provider cannot have two `pending`/`confirmed` bookings starting at the same time (partial unique index).
- Provider ratings are **calculated** from `reviews` (hidden reviews excluded); there is no stored rating column to keep in sync.
- Providers are public only when `providers.status = 'approved'` and the user account `is_active`.
- `availability.day_of_week`: 0 = Sunday ... 6 = Saturday.
- Seed accounts use a placeholder password hash and cannot log in.
