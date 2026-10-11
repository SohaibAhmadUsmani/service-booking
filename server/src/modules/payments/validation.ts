import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "@service-booking/shared";

const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "must be a valid ObjectId");

export const createPaymentSchema = z
  .object({
    bookingId: objectId,
    currency: z.string().trim().length(3, "currency must be a 3-letter code").optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
  })
  .strict();

export const processPaymentSchema = z
  .object({
    outcome: z.enum(["paid", "failed"]).optional(),
  })
  .strict();

export const listPaymentsQuerySchema = z
  .object({
    bookingId: objectId.optional(),
    customerId: objectId.optional(),
    providerId: objectId.optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const paymentIdParamsSchema = z
  .object({
    id: objectId,
  })
  .strict();

export const bookingIdParamsSchema = z
  .object({
    bookingId: objectId,
  })
  .strict();
