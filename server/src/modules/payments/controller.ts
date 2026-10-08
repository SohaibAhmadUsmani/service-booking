import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middleware/errorHandler";
import { paymentsService } from "./service";

export async function createPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const payment = await paymentsService.create(req.user.userId, req.user.role, req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const payment = await paymentsService.get(String(req.params.id), req.user.userId, req.user.role);
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentByBookingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const payment = await paymentsService.getByBooking(
      String(req.params.bookingId),
      req.user.userId,
      req.user.role
    );
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

export async function listMyPaymentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await paymentsService.listMine(req.user.userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listPaymentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const result = await paymentsService.list(
      req.query as Record<string, never>,
      req.user.userId,
      req.user.role
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function processPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const payment = await paymentsService.process(
      String(req.params.id),
      req.user.userId,
      req.user.role,
      req.body
    );
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

export async function refundPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const payment = await paymentsService.refund(
      String(req.params.id),
      req.user.userId,
      req.user.role
    );
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}
