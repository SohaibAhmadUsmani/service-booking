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

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-identity-key-2026-production";
const ACCESS_TOKEN_EXPIRY = "1d"; // 24 hours
const REFRESH_TOKEN_DAYS = 7;

function formatUserProfile(user: IUserDocument): UserProfile {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || undefined,
    avatarUrl: user.avatarUrl || undefined,
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

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(req.password, salt);

    const user = await UserModel.create({
      email: req.email.toLowerCase(),
      passwordHash,
      role: req.role || UserRole.Customer,
      firstName: req.firstName,
      lastName: req.lastName,
      phone: req.phone || undefined,
      isActive: true,
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
   * Login with email and password.
   */
  async login(
    req: LoginRequest,
    deviceInfo = "Web Client",
    ipAddress?: string
  ): Promise<AuthResponse> {
    const user = await UserModel.findOne({
      email: req.email.toLowerCase(),
    }).select("+passwordHash");

    if (!user || !user.isActive) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isMatch = await bcrypt.compare(req.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    user.lastLogin = new Date();
    await user.save();

    return this.generateTokens(user, deviceInfo, ipAddress);
  }

  /**
   * Refresh session tokens using rotating refresh token strategy.
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

    // Token reuse detection: if a revoked token is used, compromise is suspected!
    // Revoke the entire family immediately.
    if (session.isRevoked) {
      await RefreshTokenModel.updateMany(
        { familyId: session.familyId },
        { $set: { isRevoked: true } }
      );
      throw new AppError(
        "Session compromised. Revoked all active tokens for this session.",
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

    // Issue new access token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Issue rotated refresh token
    const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
    const newTokenHash = crypto
      .createHash("sha256")
      .update(newRawRefreshToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    // Revoke old token and point to replacement
    session.isRevoked = true;
    session.replacedByTokenHash = newTokenHash;
    await session.save();

    // Create new token entry in same family
    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: newTokenHash,
      familyId: session.familyId,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

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
   * Helper to sign JWT and store new refresh session.
   */
  private async generateTokens(
    user: IUserDocument,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");
    const familyId = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

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
