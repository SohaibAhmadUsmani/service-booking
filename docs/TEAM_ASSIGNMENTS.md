# Service Booking Platform — Team Assignments

**Branch workflow:** Each member works on `feature/<your-name>-<short-topic>` and opens a PR into **`development`** (not `main`).

| Member   | Module | Scope |
|----------|--------|--------|
| **Khadija** | Data & discovery | Database schema and migrations for all core entities; categories; provider/service catalog APIs; customer search and filters (location, category, price, rating, availability, date, service type) with in-page result updates; provider listing and public provider profile (services and prices, no booking checkout). |
| **Muzammil** | Identity & access | Sign up / login; JWT session flow; role-based access (customer, provider, admin); user and profile APIs; shared auth UI; server middleware for authentication, authorization, validation, and consistent error responses; API documentation baseline for auth and users. |
| **Ayyan** | Main website | Public landing page: hero, search entry, popular services, featured providers, how it works, reviews showcase, categories, become a provider, FAQ, footer; responsive layout and shared public layout components. |
| **Shanza** | Booking & availability | Provider working days, hours, breaks, and slot generation; availability APIs; booking lifecycle (create, reschedule, cancel, statuses: pending, confirmed, completed, cancelled, no-show); customer flow: service → provider → date → time → details → confirm; booking history; calendar views tied to availability. |
| **Maira** | Provider dashboard | Provider home dashboard; services CRUD and pricing; availability and calendar management UI; bookings and customers; earnings summary; provider profile settings; integration with booking and catalog modules owned by others. |
| **Namra** | Reviews, payments & notifications | Post-completion reviews (1–5 stars, text, edit/delete own review); provider rating aggregation; mock payment flow (pending, paid, failed, refunded); notification delivery for confirmation, cancellation, upcoming appointment, reschedule, new review, provider updates; in-app notification list/read state. |
| **Aiman** | Admin panel | Admin dashboard with booking and user statistics; manage users, providers, services, categories, bookings, reviews; reports; complaints; platform settings; moderation workflows aligned with shared roles from identity module. |

## Integration order (recommended)

1. **Khadija** + **Muzammil** — schema, auth, and shared types (unblocks everyone).
2. **Ayyan** — public site (can use mock data early).
3. **Khadija** — search and provider profiles on top of real APIs.
4. **Shanza** — availability and bookings.
5. **Maira**, **Namra**, **Aiman** — parallel once bookings and users exist.

## Shared rules

- Put code in the module folders defined in `docs/PROJECT_STRUCTURE.md`.
- Reuse enums and DTO shapes from `shared/types`.
- Do not change another member’s module without coordinating; extend via agreed API contracts.
- Every PR targets **`development`** and includes a short test checklist.

## Cross-module touchpoints

| Topic | Primary owner | Consumers |
|-------|---------------|-----------|
| Users & roles | Muzammil | All |
| Catalog & search | Khadija | Ayyan, Maira, Aiman |
| Bookings & slots | Shanza | Maira, Namra, Aiman |
| Payments (mock) | Namra | Shanza, Maira |
| Reviews | Namra | Ayyan, Maira, Aiman |
| Notifications | Namra | Shanza, Maira |
