import { Types } from "mongoose";
import { ProviderRatingSummary } from "@service-booking/shared";
import { Review } from "./model";
import { ProviderProfileModel } from "../users/models/providerProfile.model";

export interface NewReview {
  bookingId: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment?: string;
}

export interface ReviewListFilters {
  bookingId?: string;
  customerId?: string;
  providerId?: string;
  page?: number;
  limit?: number;
}

async function summarize(providerId: string): Promise<ProviderRatingSummary> {
  const [agg] = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { providerId: new Types.ObjectId(providerId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return {
    providerId,
    averageRating: agg ? Math.round(agg.avg * 100) / 100 : 0,
    reviewCount: agg ? agg.count : 0,
  };
}

function toDto<T extends { _id?: unknown; __v?: unknown; id?: unknown }>(doc: T | null): any {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc as Record<string, unknown>;
  return { ...rest, id: _id ? String(_id) : undefined };
}

export const reviewsRepository = {
  async create(data: NewReview): Promise<any> {
    const doc = await Review.create({
      ...data,
      bookingId: new Types.ObjectId(data.bookingId),
      customerId: new Types.ObjectId(data.customerId),
      providerId: new Types.ObjectId(data.providerId),
      serviceId: new Types.ObjectId(data.serviceId),
    });
    return doc.toJSON();
  },

  findById(id: string) {
    return Review.findById(id)
      .lean()
      .then(toDto);
  },

  findByBookingId(bookingId: string) {
    return Review.findOne({ bookingId: new Types.ObjectId(bookingId) })
      .lean()
      .then(toDto);
  },

  async list(filters: ReviewListFilters) {
    const query: Record<string, unknown> = {};
    if (filters.bookingId) query.bookingId = new Types.ObjectId(filters.bookingId);
    if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
    if (filters.providerId) query.providerId = new Types.ObjectId(filters.providerId);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const [items, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .then((docs) => docs.map(toDto)),
      Review.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  update(id: string, set: Record<string, unknown>) {
    return Review.findByIdAndUpdate(id, { $set: set }, { returnDocument: "after", runValidators: true })
      .lean()
      .then(toDto);
  },

  delete(id: string) {
    return Review.findByIdAndDelete(id)
      .lean()
      .then(toDto);
  },

  summarize,

  async syncProviderRating(providerId: string): Promise<ProviderRatingSummary> {
    const summary = await summarize(providerId);
    await ProviderProfileModel.updateOne(
      { userId: new Types.ObjectId(providerId) },
      { $set: { rating: summary.averageRating, reviewCount: summary.reviewCount } }
    );
    return summary;
  },
};
