import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserProfile, UserRole, ProviderDetailsDto } from "@service-booking/shared";
import { UserModel, IUserDocument } from "./models/user.model";
import { ProviderProfileModel } from "./models/providerProfile.model";
import { RefreshTokenModel } from "../auth/models/refreshToken.model";
import { AppError } from "../../middleware/errorHandler";

function formatUserProfile(
  user: IUserDocument,
  providerDetails?: ProviderDetailsDto | null
): UserProfile {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || undefined,
    avatarUrl: user.avatarUrl || undefined,
    providerDetails: providerDetails !== undefined ? providerDetails : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export class UserService {
  /**
   * Retrieve the authenticated user's profile.
   * If the user is a Provider, includes provider profile metadata.
   */
  async getProfile(userId: string): Promise<UserProfile> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user identifier.", 400);
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or account is deactivated.", 404);
    }

    let providerDetails: ProviderDetailsDto | null = null;
    if (user.role === UserRole.Provider) {
      const providerProfile = await ProviderProfileModel.findOne({
        userId: user._id,
      }).lean();

      if (providerProfile) {
        providerDetails = {
          businessName: providerProfile.businessName,
          bio: providerProfile.bio,
          rating: providerProfile.rating,
          reviewCount: providerProfile.reviewCount,
          isVerified: providerProfile.isVerified,
        };
      }
    }

    return formatUserProfile(user, providerDetails);
  }

  /**
   * Update personal profile information atomically.
   */
  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
    }
  ): Promise<UserProfile> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user identifier.", 400);
    }

    const updateFields: Record<string, unknown> = {};
    if (data.firstName !== undefined) updateFields.firstName = data.firstName;
    if (data.lastName !== undefined) updateFields.lastName = data.lastName;
    if (data.phone !== undefined) updateFields.phone = data.phone || undefined;
    if (data.avatarUrl !== undefined) updateFields.avatarUrl = data.avatarUrl || undefined;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser || !updatedUser.isActive) {
      throw new AppError("User not found.", 404);
    }

    return formatUserProfile(updatedUser);
  }

  /**
   * Change account password, invalidate previous sessions, and increment tokenVersion.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user identifier.", 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError("New password must be different from current password.", 400);
    }

    const user = await UserModel.findById(userId).select("+passwordHash");
    if (!user || !user.isActive) {
      throw new AppError("User not found.", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Current password is incorrect.", 400);
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const salt = await bcrypt.genSalt(isNaN(saltRounds) ? 12 : saltRounds);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Revoke all existing refresh token families for this user
    await RefreshTokenModel.updateMany(
      { userId: user._id },
      { $set: { isRevoked: true } }
    );
  }
}

export const userService = new UserService();
