import { z } from "zod";
import { UserRole, PASSWORD_REGEX, PHONE_E164_REGEX } from "@service-booking/shared";

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid work email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must not exceed 72 characters")
      .regex(
        PASSWORD_REGEX,
        "Password must contain an uppercase letter, a lowercase letter, a number, and a special symbol"
      ),
    firstName: z.string().trim().min(1, "First name is required").max(60),
    lastName: z.string().trim().min(1, "Last name is required").max(60),
    role: z
      .enum([UserRole.Customer, UserRole.Provider])
      .default(UserRole.Customer),
    phone: z
      .string()
      .trim()
      .regex(PHONE_E164_REGEX, "Phone number must be in E.164 format (e.g. +14155552671)")
      .optional()
      .or(z.literal("")),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .max(72, "Password must not exceed 72 characters"),
    rememberMe: z.boolean().optional().default(false),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  })
  .strict();

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  })
  .strict();
