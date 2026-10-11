import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middleware/errorHandler";
import { reviewsService } from "./service";

export async function createReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const result = await reviewsService.create(req.user.userId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listReviewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewsService.list(req.query as Record<string, never>);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewsService.get(String(req.params.id));
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function updateReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const result = await reviewsService.update(String(req.params.id), req.user.userId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Authentication required.", 401);
    const result = await reviewsService.remove(String(req.params.id), req.user.userId, req.user.role);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getProviderSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await reviewsService.providerSummary(String(req.params.providerId));
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}
