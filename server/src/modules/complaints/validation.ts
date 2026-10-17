import { z } from "zod";
import { ComplaintCategory, ComplaintStatus } from "@service-booking/shared";

export const createComplaintSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  category: z.nativeEnum(ComplaintCategory, {
    errorMap: () => ({ message: "Invalid complaint category" }),
  }),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description cannot exceed 2000 characters"),
  evidenceUrls: z.array(z.string().url("Must be a valid URL")).optional(),
});

export const resolveComplaintSchema = z.object({
  status: z.nativeEnum(ComplaintStatus, {
    errorMap: () => ({ message: "Invalid complaint status" }),
  }),
  resolutionNotes: z.string().max(2000).optional(),
});
