import { z } from "zod";
import { UserRole } from "@service-booking/shared";

// Regex matching the screenshot's exact password criteria:
// 8+ chars, at least 1 uppercase letter, at least 1 number, at least 1 special symbol
const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const registerSchema = z.object({
  email: z.string().email("Please provide a valid work email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain an uppercase letter, a number, and a special symbol"
    ),
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  role: z
    .enum([UserRole.Customer, UserRole.Provider])
    .default(UserRole.Customer),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
