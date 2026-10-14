import { Types } from "mongoose";
import { PaymentMethod, PaymentStatus } from "@service-booking/shared";
import { Payment } from "./model";

export interface NewPayment {
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  currency: string;
  method?: PaymentMethod;
  transactionReference: string;
}

export interface PaymentListFilters {
  bookingId?: string;
  customerId?: string;
  providerId?: string;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

function toDto<T extends { _id?: unknown; __v?: unknown }>(doc: T | null): any {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc as Record<string, unknown>;
  return { ...rest, id: _id ? String(_id) : undefined };
}

export const paymentsRepository = {
  async create(data: NewPayment) {
    const doc = await Payment.create({
      ...data,
      bookingId: new Types.ObjectId(data.bookingId),
      customerId: new Types.ObjectId(data.customerId),
      providerId: new Types.ObjectId(data.providerId),
    });
    return doc.toJSON();
  },

  findById(id: string) {
    return Payment.findById(id)
      .lean()
      .then(toDto);
  },

  findByBookingId(bookingId: string) {
    return Payment.findOne({ bookingId: new Types.ObjectId(bookingId) })
      .lean()
      .then(toDto);
  },

  async list(filters: PaymentListFilters, scope?: { customerId?: string; providerId?: string }) {
    const query: Record<string, unknown> = {};
    if (filters.bookingId) query.bookingId = new Types.ObjectId(filters.bookingId);
    if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
    if (filters.providerId) query.providerId = new Types.ObjectId(filters.providerId);
    if (filters.status) query.status = filters.status;
    if (scope) {
      query.$or = [
        { customerId: new Types.ObjectId(scope.customerId) },
        { providerId: new Types.ObjectId(scope.providerId) },
      ];
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const [items, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .then((docs) => docs.map(toDto)),
      Payment.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /** Atomically moves a payment between statuses; returns null when the expected status does not match. */
  async transition(
    id: string,
    fromStatuses: PaymentStatus[],
    set: Record<string, unknown>
  ) {
    const doc = await Payment.findOneAndUpdate(
      { _id: new Types.ObjectId(id), status: { $in: fromStatuses } },
      { $set: set },
      { returnDocument: "after", runValidators: true }
    ).lean();
    return toDto(doc);
  },
};
