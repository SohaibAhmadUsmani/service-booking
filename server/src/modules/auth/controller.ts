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
