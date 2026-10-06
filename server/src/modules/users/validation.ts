import { z } from "zod";
import { PASSWORD_REGEX, PHONE_E164_REGEX } from "@service-booking/shared";

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name must not be empty").max(60).optional(),
    lastName: z.string().trim().min(1, "Last name must not be empty").max(60).optional(),
    phone: z
      .string()
      .trim()
      .regex(PHONE_E164_REGEX, "Phone number must be in E.164 format (e.g. +14155552671)")
      .optional()
      .or(z.literal("")),
    avatarUrl: z
      .string()
      .trim()
      .url("Avatar must be a valid URL")
      .regex(/^https?:\/\//i, "Avatar URL must use http or https protocol")
      .optional()
      .or(z.literal("")),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must not exceed 72 characters")
      .regex(
        PASSWORD_REGEX,
        "New password must contain an uppercase letter, a lowercase letter, a number, and a special symbol"
      ),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });
