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
const REFRESH_CONCURRENCY_GRACE_MS = 30000; // 30-second concurrency grace window

// Constant-time dummy hash used to neutralize timing side-channels on failed email lookups
const DUMMY_HASH =
  "$2a$12$e8Y5t1R1m6fG5B9N7Z1pYe4W1Q6S8V0U2T4X6Y8Z0A2C4E6G8I0K.";

function formatUserProfile(user: IUserDocument): UserProfile {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || undefined,
    avatarUrl: user.avatarUrl || undefined,
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
      phone: req.phone || undefined,
      isActive: true,
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

    const isMatch = await bcrypt.compare(req.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const tokenLifespanDays = req.rememberMe ? 30 : REFRESH_TOKEN_DAYS;
    return this.generateTokens(user, deviceInfo, ipAddress, tokenLifespanDays);
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
      { new: true }
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
        issuer: "vendorhub-ai",
        audience: "vendorhub-client",
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

    return {
      user: formatUserProfile(user),
      token,
      refreshToken: rawRefreshToken,
    };
  }
}

export const authService = new AuthService();
