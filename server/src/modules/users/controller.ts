import { Request, Response, NextFunction } from "express";
import { userService } from "./service";
import { AppError } from "../../middleware/errorHandler";

export async function getProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const profile = await userService.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const updated = await userService.updateProfile(req.user.userId, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
}
