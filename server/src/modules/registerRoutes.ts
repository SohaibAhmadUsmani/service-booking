import type { Express } from "express";
import { adminRouter } from "./admin/routes";
import { authRouter } from "./auth/routes";
import { availabilityRouter } from "./availability/routes";
import { bookingsRouter } from "./bookings/routes";
import { categoriesRouter } from "./categories/routes";
import { notificationsRouter } from "./notifications/routes";
import { paymentsRouter } from "./payments/routes";
import { providersRouter } from "./providers/routes";
import { reviewsRouter } from "./reviews/routes";
import { searchRouter } from "./search/routes";
import { servicesRouter } from "./services/routes";
import { usersRouter } from "./users/routes";

/** Mount all domain routers — each team owns its module folder. */
export function registerModuleRoutes(app: Express) {
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/providers", providersRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/availability", availabilityRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/admin", adminRouter);
}
