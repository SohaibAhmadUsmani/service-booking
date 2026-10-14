import mongoose from "mongoose";
import { NotificationType } from "@service-booking/shared";
import { Notification } from "./model";

export interface NotificationListFilters {
  userId?: string;
  type?: NotificationType;
  unread?: boolean;
  page?: number;
  limit?: number;
}

export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

function toDto(doc: Record<string, any> | null): any {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { ...rest, id: _id ? String(_id) : undefined };
}

export const notificationsRepository = {
  async count(): Promise<number | null> {
    if (mongoose.connection.readyState !== 1) return null;
    return Notification.countDocuments();
  },

  async create(input: NewNotification) {
    const doc = await Notification.create(input);
    return doc.toJSON();
  },

  findById(id: string) {
    return Notification.findById(id)
      .lean()
      .then(toDto);
  },

  async list(ownerId: string, filters: NotificationListFilters) {
    const query: Record<string, unknown> = { userId: ownerId };
    if (filters.type) query.type = filters.type;
    if (filters.unread === true) query.read = false;
    if (filters.unread === false) query.read = true;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const [items, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .then((docs) => docs.map(toDto)),
      Notification.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  countUnread(userId: string) {
    return Notification.countDocuments({ userId, read: false });
  },

  async markRead(id: string) {
    const doc = await Notification.findOneAndUpdate(
      { _id: id },
      { $set: { read: true, readAt: new Date() } },
      { returnDocument: "after" }
    ).lean();
    return toDto(doc);
  },

  async markAllRead(userId: string) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  },

  async delete(id: string) {
    const result = await Notification.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },
};
