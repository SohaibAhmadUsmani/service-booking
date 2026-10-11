import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../middleware/errorHandler";
import { NotificationType } from "@service-booking/shared";
import { NotificationListFilters } from "./repository";
import { notificationsService } from "./service";

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Authentication required.", 401);
  return req.user;
}

export async function listNotificationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const { userId, type, unread, page, limit } = req.query as NotificationListFilters;
    const result = await notificationsService.list(user.userId, user.role, {
      userId,
      type: type as NotificationType | undefined,
      unread,
      page,
      limit,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const result = await notificationsService.unreadCount(user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    requireUser(req);
    const notification = await notificationsService.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const notification = await notificationsService.markRead(
      String(req.params.id),
      user.userId,
      user.role
    );
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsReadHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = requireUser(req);
    const result = await notificationsService.markAllRead(user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const result = await notificationsService.remove(
      String(req.params.id),
      user.userId,
      user.role
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
