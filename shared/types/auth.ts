import { UserRole } from "./domain";

/**
 * Standard security regexes enforced across client and server.
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,72}$/;

export const PHONE_E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Roles allowed to register publicly.
 */
export type RegistrableRole = UserRole.Customer | UserRole.Provider;

/**
 * Provider-specific metadata returned alongside user profile.
 */
export interface ProviderDetailsDto {
  businessName?: string;
  bio?: string;
  serviceCategory?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
}

/**
 * Public/Safe user representation returned in API responses.
 * Sensitive data such as password hashes are strictly excluded.
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  providerDetails?: ProviderDetailsDto | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload contained inside verified JWT tokens.
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

/**
 * Request payload for user registration.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: RegistrableRole;
  phone?: string;
}

/**
 * Request payload for user login.
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Standard response returned on successful registration or login.
 */
export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
}

/**
 * Request payload for refreshing access tokens.
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Request payload for revoking session on logout.
 */
export interface LogoutRequest {
  refreshToken: string;
}

/**
 * Request payload for updating the current user's profile.
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

/**
 * Request payload for updating password.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
