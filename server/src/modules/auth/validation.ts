import { z } from "zod";
import { UserRole, PASSWORD_REGEX, PHONE_E164_REGEX } from "@service-booking/shared";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const NAME_REGEX = /^[\p{L}\p{M}0-9\s.'-]{1,60}$/u;

function nfkc(value: string) {
  return value.normalize("NFKC");
}

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email must not exceed 254 characters")
  .email("Please provide a valid work email address")
  .transform(nfkc);

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(60)
    .regex(NAME_REGEX, `${label} contains invalid characters`)
    .transform(nfkc);

export const registerSchema = z
  .object({
    email: emailField,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must not exceed 72 characters")
      .regex(
        PASSWORD_REGEX,
        "Password must contain an uppercase letter, a lowercase letter, a number, and a special symbol"
      ),
    firstName: nameField("First name"),
    lastName: nameField("Last name"),
    role: z.enum([UserRole.Customer, UserRole.Provider]).default(UserRole.Customer),
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
    email: emailField,
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

export const forgotPasswordSchema = z
  .object({
    email: emailField,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Password reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must not exceed 72 characters")
      .regex(
        PASSWORD_REGEX,
        "Password must contain an uppercase letter, a lowercase letter, a number, and a special symbol"
      ),
  })
  .strict();

export const sessionParamSchema = z
  .object({
    id: z.string().regex(OBJECT_ID_REGEX, "Session ID must be a valid identifier"),
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    token: z.string().min(1, "Verification token is required"),
  })
  .strict();

export const resendVerificationSchema = z
  .object({
    email: emailField,
  })
  .strict();
