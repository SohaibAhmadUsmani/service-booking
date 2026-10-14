import { NotificationType, UserRole } from "@service-booking/shared";
import { AppError } from "../../middleware/errorHandler";
import {
  NewNotification,
  NotificationListFilters,
  notificationsRepository,
} from "./repository";

function isOwner(notification: { userId: unknown }, userId: string): boolean {
  return String(notification.userId) === userId;
}

export const notificationsService = {
  async status() {
    return {
      module: "notifications",
      status: "implemented",
      documentCount: await notificationsRepository.count(),
    };
  },

  /**
   * Fire-and-forget integration hook used by booking, payment and review flows.
   * Never throws so a notification failure cannot break the calling flow.
   */
  async notify(input: NewNotification) {
    try {
      await notificationsRepository.create(input);
    } catch (err) {
      console.error(
        "[notifications] failed to persist notification:",
        err instanceof Error ? err.message : err
      );
    }
  },

  async create(input: NewNotification) {
    return notificationsRepository.create(input);
  },

  async list(requesterId: string, role: string | undefined, filters: NotificationListFilters) {
    let ownerId = requesterId;
    if (filters.userId && filters.userId !== requesterId) {
      if (role !== UserRole.Admin) {
        throw new AppError("You can only view your own notifications.", 403);
      }
      ownerId = filters.userId;
    }

    const result = await notificationsRepository.list(ownerId, filters);
    const unreadCount = await notificationsRepository.countUnread(ownerId);
    return { ...result, unreadCount };
  },

  async unreadCount(userId: string) {
    return { count: await notificationsRepository.countUnread(userId) };
  },

  async markRead(id: string, userId: string, role?: string) {
    const existing = await notificationsRepository.findById(id);
    if (!existing || (!isOwner(existing, userId) && role !== UserRole.Admin)) {
      throw new AppError("Notification not found.", 404);
    }
    if (existing.read) return existing;
    return (await notificationsRepository.markRead(id)) ?? existing;
  },

  async markAllRead(userId: string) {
    return { modified: await notificationsRepository.markAllRead(userId) };
  },

  async remove(id: string, userId: string, role?: string) {
    const existing = await notificationsRepository.findById(id);
    if (!existing || (!isOwner(existing, userId) && role !== UserRole.Admin)) {
      throw new AppError("Notification not found.", 404);
    }
    const deleted = await notificationsRepository.delete(id);
    if (!deleted) throw new AppError("Notification not found.", 404);
    return { deleted: true };
  },
};
