import bcrypt from "bcryptjs";
import { UserProfile, UserRole } from "@service-booking/shared";
import { UserModel, IUserDocument } from "./models/user.model";
import { ProviderProfileModel } from "./models/providerProfile.model";
import { AppError } from "../../middleware/errorHandler";

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

export class UserService {
  /**
   * Retrieve the authenticated user's profile.
   * If the user is a Provider, includes provider profile metadata.
   */
  async getProfile(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or account is deactivated.", 404);
    }

    const profile = formatUserProfile(user);

    if (user.role === UserRole.Provider) {
      const providerProfile = await ProviderProfileModel.findOne({
        userId: user._id,
      });
      return {
        ...profile,
        providerDetails: providerProfile || null,
      };
    }

    return profile;
  }

  /**
   * Update personal profile information.
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
    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found.", 404);
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;

    await user.save();
    return formatUserProfile(user);
  }

  /**
   * Change account password after verifying the current password.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await UserModel.findById(userId).select("+passwordHash");
    if (!user || !user.isActive) {
      throw new AppError("User not found.", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Current password is incorrect.", 400);
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
  }
}

export const userService = new UserService();
