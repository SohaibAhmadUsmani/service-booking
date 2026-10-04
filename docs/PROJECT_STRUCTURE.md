# Project structure

```
service-booking/
├── apps/
│   └── web/                    # Single web app (public, customer, provider, admin routes)
├── server/
│   └── src/
│       ├── config/             # Env and app config
│       ├── middleware/         # Auth, errors, validation (Muzammil maintains core)
│       ├── modules/            # One folder per domain (see README in each)
│       ├── app.ts              # Express app wiring
│       └── index.ts            # Server entry
├── database/
│   ├── migrations/             # SQL migrations (Khadija)
│   └── seeds/                  # Optional seed scripts
├── shared/
│   └── types/                  # Shared enums and API types
└── docs/
```

## Web app route ownership

| Path prefix | Owner |
|-------------|--------|
| `apps/web/src/app/(public)/` | Ayyan |
| `apps/web/src/app/(auth)/` | Muzammil |
| `apps/web/src/app/(customer)/` | Khadija (browse/search/profile), Shanza (bookings) |
| `apps/web/src/app/provider/` | Maira |
| `apps/web/src/app/admin/` | Aiman |

## Server module ownership

| Folder under `server/src/modules/` | Owner |
|--------------------------------------|--------|
| `auth/`, `users/` | Muzammil |
| `categories/`, `search/`, `providers/` (public catalog) | Khadija |
| `availability/`, `bookings/` | Shanza |
| `services/` (provider service management) | Maira |
| `reviews/`, `payments/`, `notifications/` | Namra |
| `admin/` | Aiman |

Each module should expose routes via `routes.ts`, handlers in `controller.ts`, business logic in `service.ts`, and data access in `repository.ts` when needed.
