import { Request, Response, NextFunction } from "express";
import { authService } from "./service";
import { RegisterRequest, LoginRequest } from "@service-booking/shared";

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userAgent = req.headers["user-agent"] || "Web Client";
    const ip = req.ip || req.socket.remoteAddress;

    const result = await authService.register(
      req.body as RegisterRequest,
      userAgent,
      ip
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userAgent = req.headers["user-agent"] || "Web Client";
    const ip = req.ip || req.socket.remoteAddress;

    const result = await authService.login(
      req.body as LoginRequest,
      userAgent,
      ip
    );

    res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const userAgent = req.headers["user-agent"] || "Web Client";
    const ip = req.ip || req.socket.remoteAddress;

    const tokens = await authService.refresh(refreshToken, userAgent, ip);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    await authService.logout(refreshToken);

    res.status(200).json({
      success: true,
      message: "Signed out successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: result.message,
      ...(result.resetToken ? { resetToken: result.resetToken } : {}),
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    const result = await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const sessions = await authService.getUserSessions(userId);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeSessionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    await authService.revokeSession(userId, id);

    res.status(200).json({
      success: true,
      message: "Session revoked successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.body as { token: string };
    const result = await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    const result = await authService.resendVerification(email);

    res.status(200).json({
      success: true,
      message: result.message,
      ...(result.verificationToken ? { verificationToken: result.verificationToken } : {}),
    });
  } catch (error) {
    next(error);
  }
}
