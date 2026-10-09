import { z } from "zod";
import { NotificationType } from "@service-booking/shared";

const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "must be a valid ObjectId");

export const notificationIdParamsSchema = z.object({ id: objectId }).strict();

export const createNotificationSchema = z
  .object({
    userId: objectId,
    type: z.nativeEnum(NotificationType),
    title: z.string().trim().min(1, "title is required").max(120),
    message: z.string().trim().min(1, "message is required").max(500),
    data: z.record(z.unknown()).optional(),
  })
  .strict();

export const listNotificationsQuerySchema = z
  .object({
    userId: objectId.optional(),
    type: z.nativeEnum(NotificationType).optional(),
    unread: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();
