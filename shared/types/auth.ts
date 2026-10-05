import { UserRole } from "./domain";

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
  role?: UserRole.Customer | UserRole.Provider;
  phone?: string;
}

/**
 * Request payload for user login.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Standard response returned on successful registration or login.
 */
export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken?: string;
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
