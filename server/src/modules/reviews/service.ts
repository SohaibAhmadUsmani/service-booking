import { NotificationType, UserRole } from "@service-booking/shared";
import { AppError } from "../../middleware/errorHandler";
import { bookingsRepository } from "../bookings/repository";
import { notificationsService } from "../notifications/service";
import { reviewsRepository, ReviewListFilters } from "./repository";

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

async function findOrFail(id: string) {
  const review = await reviewsRepository.findById(id);
  if (!review) throw new AppError("Review not found.", 404);
  return review;
}

async function requireOwnerOrAdmin(id: string, userId: string, role?: string) {
  const review = await findOrFail(id);
  const isOwner = review.customerId.toString() === userId;
  const isAdmin = role === UserRole.Admin;
  if (!isOwner && !isAdmin) throw new AppError("Review not found.", 404);
  return review;
}

export const reviewsService = {
  async create(userId: string, input: CreateReviewInput) {
    const booking = await bookingsRepository.findById(input.bookingId);
    if (!booking) throw new AppError("Booking not found.", 404);

    if (booking.customerId.toString() !== userId) {
      throw new AppError("Only the booking customer can review this booking.", 403);
    }
    if (booking.status !== "completed") {
      throw new AppError("Reviews can only be left on completed bookings.", 409);
    }

    const existing = await reviewsRepository.findByBookingId(input.bookingId);
    if (existing) throw new AppError("This booking has already been reviewed.", 409);

    const review = await reviewsRepository.create({
      bookingId: booking._id.toString(),
      customerId: booking.customerId.toString(),
      providerId: booking.providerId.toString(),
      serviceId: booking.serviceId.toString(),
      rating: input.rating,
      comment: input.comment,
    });

    const rating = await reviewsRepository.syncProviderRating(booking.providerId.toString());

    await notificationsService.notify({
      userId: booking.providerId.toString(),
      type: NotificationType.NewReview,
      title: "New review",
      message: `You received a ${input.rating}-star review on booking ${booking.bookingId}.`,
      data: {
        reviewDbId: String(review.id),
        bookingDbId: String(booking._id),
        bookingId: booking.bookingId,
        rating: input.rating,
      },
    });

    return { review, rating };
  },

  async get(id: string) {
    return findOrFail(id);
  },

  async list(filters: ReviewListFilters) {
    return reviewsRepository.list(filters);
  },

  async update(id: string, userId: string, input: UpdateReviewInput) {
    await requireOwnerOrAdmin(id, userId);

    const set: Record<string, unknown> = {};
    if (input.rating !== undefined) set.rating = input.rating;
    if (input.comment !== undefined) set.comment = input.comment;

    const review = await reviewsRepository.update(id, set);
    if (!review) throw new AppError("Review not found.", 404);

    const rating = await reviewsRepository.syncProviderRating(review.providerId.toString());
    return { review, rating };
  },

  async remove(id: string, userId: string, role?: string) {
    const review = await requireOwnerOrAdmin(id, userId, role);
    await reviewsRepository.delete(id);
    const rating = await reviewsRepository.syncProviderRating(review.providerId.toString());
    return { deleted: true, rating };
  },

  async providerSummary(providerId: string) {
    return reviewsRepository.summarize(providerId);
  },
};
