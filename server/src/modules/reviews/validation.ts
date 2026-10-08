import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "must be a valid ObjectId");

export const createReviewSchema = z
  .object({
    bookingId: objectId,
    rating: z.number().int("rating must be a whole number").min(1, "rating must be between 1 and 5").max(5, "rating must be between 1 and 5"),
    comment: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();

export const updateReviewSchema = z
  .object({
    rating: z.number().int("rating must be a whole number").min(1, "rating must be between 1 and 5").max(5, "rating must be between 1 and 5").optional(),
    comment: z.string().trim().min(1).max(2000).optional(),
  })
  .strict()
  .refine((data) => data.rating !== undefined || data.comment !== undefined, {
    message: "Provide at least one field to update",
  });

export const listReviewsQuerySchema = z
  .object({
    bookingId: objectId.optional(),
    customerId: objectId.optional(),
    providerId: objectId.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const reviewIdParamsSchema = z
  .object({
    id: objectId,
  })
  .strict();

export const providerIdParamsSchema = z
  .object({
    providerId: objectId,
  })
  .strict();
