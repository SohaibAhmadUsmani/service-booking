import { z } from "zod";

const shape = {
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(120),
  category: z.string().trim().min(1, "Category is required").max(60),
  price: z.number({ invalid_type_error: "Price must be a number" }).positive("Price must be greater than 0").max(10_000_000),
  durationMin: z
    .number({ invalid_type_error: "Duration must be a number" })
    .int("Duration must be whole minutes")
    .min(15, "Minimum duration is 15 minutes")
    .max(480, "Maximum duration is 8 hours"),
  description: z.string().trim().max(2000).optional(),
};

export const createServiceSchema = z.object(shape).strict();

export const updateServiceSchema = z
  .object({ ...shape, isActive: z.boolean() })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });