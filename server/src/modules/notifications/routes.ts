import { UserRole } from "@service-booking/shared";
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate";
import {
  createNotificationHandler,
  deleteNotificationHandler,
  getUnreadCountHandler,
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "./controller";
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "./validation";

/** Owner: Namra */
export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  validateRequest({ query: listNotificationsQuerySchema }),
  listNotificationsHandler
);
notificationsRouter.get("/unread-count", requireAuth, getUnreadCountHandler);
notificationsRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.Admin),
  validateRequest({ body: createNotificationSchema }),
  createNotificationHandler
);
notificationsRouter.patch("/read-all", requireAuth, markAllNotificationsReadHandler);
notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  validateRequest({ params: notificationIdParamsSchema }),
  markNotificationReadHandler
);
notificationsRouter.delete(
  "/:id",
  requireAuth,
  validateRequest({ params: notificationIdParamsSchema }),
  deleteNotificationHandler
);
