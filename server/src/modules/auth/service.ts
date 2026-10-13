import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserProfile,
  UserRole,
} from "@service-booking/shared";
import { UserModel, IUserDocument } from "../users/models/user.model";
import { ProviderProfileModel } from "../users/models/providerProfile.model";
import { RefreshTokenModel } from "./models/refreshToken.model";
import { AppError } from "../../middleware/errorHandler";
import { getJwtSecret } from "../../middleware/auth";

const ACCESS_TOKEN_EXPIRY = "15m"; // Hardened 15-minute access token lifespan
const REFRESH_TOKEN_DAYS = 7;
const REFRESH_CONCURRENCY_GRACE_MS = 10000; // Hardened 10-second concurrency grace window

// Dynamically compute constant-time dummy hash matching configured salt rounds to prevent timing attacks
const DUMMY_SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
const DUMMY_HASH = bcrypt.hashSync("dummy_timing_neutralizer_payload", isNaN(DUMMY_SALT_ROUNDS) ? 12 : DUMMY_SALT_ROUNDS);

function formatUserProfile(user: IUserDocument): UserProfile {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || undefined,
    avatarUrl: user.avatarUrl || undefined,
    isEmailVerified: user.isEmailVerified ?? false,
    providerDetails: null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export class AuthService {
  /**
   * Register a new user (Customer or Service Provider).
   */
  async register(
    req: RegisterRequest,
    deviceInfo = "Web Client",
    ipAddress?: string
  ): Promise<AuthResponse> {
    const existing = await UserModel.findOne({
      email: req.email.toLowerCase(),
    });

    if (existing) {
      throw new AppError(
        "An account with this email address already exists.",
        409
      );
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const salt = await bcrypt.genSalt(isNaN(saltRounds) ? 12 : saltRounds);
    const passwordHash = await bcrypt.hash(req.password, salt);

    const user = await UserModel.create({
      email: req.email.toLowerCase(),
      passwordHash,
      role: req.role || UserRole.Customer,
      firstName: req.firstName,
      lastName: req.lastName,
      phone: req.phone?.trim() ? req.phone.trim() : undefined,
      isActive: true,
      isEmailVerified: false,
      tokenVersion: 0,
      lastLogin: new Date(),
    });

    // If the registered user is a Service Provider, initialize their provider profile
    if (user.role === UserRole.Provider) {
      await ProviderProfileModel.create({
        userId: user._id,
        businessName: `${user.firstName} ${user.lastName}'s Services`,
        rating: 0,
        reviewCount: 0,
        isVerified: false,
        categories: [],
      });
    }

    return this.generateTokens(user, deviceInfo, ipAddress);
  }

  /**
   * Login with email and password with timing-attack protection.
   */
  async login(
    req: LoginRequest,
    deviceInfo = "Web Client",
    ipAddress?: string
  ): Promise<AuthResponse> {
    const user = await UserModel.findOne({
      email: req.email.toLowerCase(),
    }).select("+passwordHash");

    // Timing-attack mitigation: run dummy bcrypt computation when user does not exist
    if (!user || !user.isActive) {
      await bcrypt.compare(req.password, DUMMY_HASH);
      throw new AppError("Invalid email or password.", 401);
    }

    // Account Lockout check: if account is locked, enforce lockout window
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new AppError(
        `Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        423
      );
    }

    // Reset stale failed login counters (BE-026): if last failure was over 24 hours ago, reset
    if (user.failedLoginAttempts > 0 && user.lastFailedLoginAt) {
      const hoursSinceLastFailure = (Date.now() - user.lastFailedLoginAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastFailure >= 24) {
        user.failedLoginAttempts = 0;
        user.lastFailedLoginAt = null;
      }
    }

    const isMatch = await bcrypt.compare(req.password, user.passwordHash);
    if (!isMatch) {
      // Increment failed attempts and trigger lockout if >= 10
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLoginAt = new Date();
      if (user.failedLoginAttempts >= 10) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30-minute lockout
        await user.save();
        throw new AppError(
          "Account temporarily locked for 30 minutes due to 10 consecutive failed login attempts.",
          423
        );
      }
      await user.save();
      throw new AppError("Invalid email or password.", 401);
    }

    // Login successful: reset lockout counters
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const tokenLifespanDays = req.rememberMe ? 30 : REFRESH_TOKEN_DAYS;
    return this.generateTokens(user, deviceInfo, ipAddress, tokenLifespanDays);
  }

  /**
   * Request password reset token.
   * Generates a secure token with 1-hour expiration and stores its SHA-256 hash.
   */
  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    
    // Always return success message to prevent user enumeration
    if (!user || !user.isActive) {
      return {
        message: "If an account with that email exists, password reset instructions have been dispatched.",
      };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15-minute OWASP security window
    await user.save();

    // In production this is sent via email; return token in dev/test environment for verification
    const isDevOrTest = process.env.NODE_ENV !== "production";
    return {
      message: "If an account with that email exists, password reset instructions have been dispatched.",
      ...(isDevOrTest ? { resetToken } : {}),
    };
  }

  /**
   * Reset account password with token.
   * Validates token, updates password, increments tokenVersion, and revokes all sessions.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+passwordHash +resetPasswordTokenHash +resetPasswordExpires");

    if (!user || !user.isActive) {
      throw new AppError("Password reset token is invalid or has expired.", 400);
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const salt = await bcrypt.genSalt(isNaN(saltRounds) ? 12 : saltRounds);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Invalidate all active refresh sessions across all devices
    await RefreshTokenModel.updateMany(
      { userId: user._id },
      { $set: { isRevoked: true } }
    );

    return { message: "Password has been successfully reset. Please sign in with your new password." };
  }

  /**
   * Verify account email using cryptographic token.
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationTokenHash +emailVerificationExpires");

    if (!user || !user.isActive) {
      throw new AppError("Verification token is invalid or has expired.", 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    return { message: "Email has been successfully verified. You can now access your account." };
  }

  /**
   * Re-send email verification token.
   */
  async resendVerification(email: string): Promise<{ message: string; verificationToken?: string }> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    // Always return uniform message to prevent account enumeration
    if (!user || !user.isActive) {
      return {
        message: "If an account with that email exists, verification instructions have been dispatched.",
      };
    }

    if (user.isEmailVerified) {
      return { message: "This email address is already verified." };
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");

    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    const isDevOrTest = process.env.NODE_ENV !== "production";
    return {
      message: "If an account with that email exists, verification instructions have been dispatched.",
      ...(isDevOrTest ? { verificationToken } : {}),
    };
  }

  /**
   * Refresh session tokens with 30-second concurrency grace period and reuse compromise cascade.
   */
  async refresh(
    rawRefreshToken: string,
    deviceInfo = "Web Client",
    ipAddress?: string
  ): Promise<{ token: string; refreshToken: string }> {
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const session = await RefreshTokenModel.findOne({ tokenHash });

    if (!session) {
      throw new AppError("Invalid refresh session.", 401);
    }

    const now = Date.now();

    // Check if token was previously rotated
    if (session.isRevoked) {
      // Concurrency Grace Window check (multi-tab / network race condition protection)
      const wasRecentlyRotated =
        session.rotatedAt &&
        now - session.rotatedAt.getTime() < REFRESH_CONCURRENCY_GRACE_MS;

      // Grace period active: return the newly issued replacement token to prevent false-positive logouts
      if (wasRecentlyRotated && session.replacementToken) {
        const user = await UserModel.findById(session.userId);
        if (user && user.isActive) {
          const token = this.signAccessToken(user);
          return {
            token,
            refreshToken: session.replacementToken,
          };
        }
      }

      // Outside grace window: Compromise Detected! Execute cascade invalidation
      await Promise.all([
        UserModel.findByIdAndUpdate(session.userId, {
          $inc: { tokenVersion: 1 },
        }),
        RefreshTokenModel.updateMany(
          { familyId: session.familyId },
          { $set: { isRevoked: true } }
        ),
      ]);

      throw new AppError(
        "Session security compromised. Revoked all active tokens for this session.",
        401
      );
    }

    if (new Date() > session.expiresAt) {
      session.isRevoked = true;
      await session.save();
      throw new AppError("Refresh token has expired. Please sign in again.", 401);
    }

    const user = await UserModel.findById(session.userId);
    if (!user || !user.isActive) {
      throw new AppError("User account is inactive or not found.", 401);
    }

    // Issue rotated refresh token
    const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
    const newTokenHash = crypto
      .createHash("sha256")
      .update(newRawRefreshToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    // Atomically retire current token and set grace period metadata
    const rotatedSession = await RefreshTokenModel.findOneAndUpdate(
      { _id: session._id, isRevoked: false },
      {
        $set: {
          isRevoked: true,
          rotatedAt: new Date(),
          replacedByTokenHash: newTokenHash,
          replacementToken: newRawRefreshToken,
        },
      },
      { returnDocument: "after" }
    );

    // If another concurrent request rotated this token simultaneously:
    if (!rotatedSession) {
      const concurrentSession = await RefreshTokenModel.findById(session._id);
      if (concurrentSession && concurrentSession.replacementToken) {
        const token = this.signAccessToken(user);
        return {
          token,
          refreshToken: concurrentSession.replacementToken,
        };
      }
      throw new AppError("Concurrent refresh resolution failed. Please try again.", 401);
    }

    // Persist new token in the same session family
    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: newTokenHash,
      familyId: session.familyId,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    // Issue hardened 15-minute access token
    const token = this.signAccessToken(user);

    return { token, refreshToken: newRawRefreshToken };
  }

  /**
   * Revoke session on logout.
   */
  async logout(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const session = await RefreshTokenModel.findOne({ tokenHash });
    if (session) {
      await RefreshTokenModel.updateMany(
        { familyId: session.familyId },
        { $set: { isRevoked: true } }
      );
    }
  }

  /**
   * List all active sessions for a user.
   */
  async getUserSessions(userId: string) {
    const sessions = await RefreshTokenModel.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select("_id deviceInfo ipAddress createdAt expiresAt")
      .sort({ createdAt: -1 })
      .lean();

    return sessions.map((s) => ({
      id: s._id.toString(),
      deviceInfo: s.deviceInfo || "Web Client",
      ipAddress: s.ipAddress || "Unknown IP",
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  /**
   * Revoke a specific active session.
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await RefreshTokenModel.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      throw new AppError("Session not found or already revoked.", 404);
    }

    // Revoke the entire family of this session
    await RefreshTokenModel.updateMany(
      { familyId: session.familyId },
      { $set: { isRevoked: true } }
    );
  }

  /**
   * Internal helper to sign access JWT with claims.
   */
  private signAccessToken(user: IUserDocument): string {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
      },
      getJwtSecret(),
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: process.env.JWT_ISSUER || "service-booking-api",
        audience: process.env.JWT_AUDIENCE || "service-booking-client",
      }
    );
  }

  /**
   * Helper to sign JWT and store new refresh session.
   */
  private async generateTokens(
    user: IUserDocument,
    deviceInfo?: string,
    ipAddress?: string,
    refreshDays = REFRESH_TOKEN_DAYS
  ): Promise<AuthResponse> {
    const token = this.signAccessToken(user);

    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");
    const familyId = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash,
      familyId,
      deviceInfo: deviceInfo || "Unknown Device",
      ipAddress: ipAddress || undefined,
      expiresAt,
    });

    // Enforce maximum 10 concurrent sessions per user; prune oldest excess sessions
    const activeSessions = await RefreshTokenModel.find({
      userId: user._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 }).select("_id").lean();

    if (activeSessions.length > 10) {
      const excessIds = activeSessions.slice(10).map(s => s._id);
      await RefreshTokenModel.updateMany(
        { _id: { $in: excessIds } },
        { $set: { isRevoked: true } }
      );
    }

    return {
      user: formatUserProfile(user),
      token,
      refreshToken: rawRefreshToken,
    };
  }
}

export const authService = new AuthService();
