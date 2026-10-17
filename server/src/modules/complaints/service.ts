import { complaintsRepository } from "./repository";
import { Booking } from "../bookings/model";
import { notificationsService } from "../notifications/service";
import { AppError } from "../../middleware/errorHandler";
import {
  ComplaintCategory,
  ComplaintStatus,
  CreateComplaintInput,
  NotificationType,
  ResolveComplaintInput,
} from "@service-booking/shared";

export class ComplaintsService {
  async create(customerId: string, input: CreateComplaintInput) {
    const booking = await Booking.findById(input.bookingId);
    if (!booking) {
      throw new AppError("Booking not found.", 404);
    }

    if (booking.customerId.toString() !== customerId) {
      throw new AppError("You can only file a complaint for your own booking.", 403);
    }

    const complaint = await complaintsRepository.create(
      customerId,
      booking.providerId.toString(),
      input
    );

    // Notify provider of new dispute/complaint
    await notificationsService.notify({
      userId: booking.providerId.toString(),
      type: NotificationType.ProviderUpdate,
      title: "Complaint Filed",
      message: `A dispute has been submitted for booking ${booking.bookingId}. Our support team is reviewing it.`,
      data: {
        complaintId: complaint.complaintId,
        bookingId: booking.bookingId,
      },
    });

    return complaint;
  }

  async getById(id: string, userId: string, role?: string) {
    const complaint = await complaintsRepository.findById(id);
    if (!complaint) {
      throw new AppError("Complaint not found.", 404);
    }

    if (
      role !== "admin" &&
      complaint.customerId.toString() !== userId &&
      complaint.providerId.toString() !== userId
    ) {
      throw new AppError("You do not have permission to view this complaint.", 403);
    }

    return complaint;
  }

  async list(filter: {
    userId: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    if (filter.role === "admin") {
      return complaintsRepository.list({
        status: filter.status,
        limit: filter.limit,
        offset: filter.offset,
      });
    }

    if (filter.role === "provider") {
      return complaintsRepository.list({
        providerId: filter.userId,
        status: filter.status,
        limit: filter.limit,
        offset: filter.offset,
      });
    }

    // Default to customer complaints
    return complaintsRepository.list({
      customerId: filter.userId,
      status: filter.status,
      limit: filter.limit,
      offset: filter.offset,
    });
  }

  async resolve(id: string, resolvedBy: string, input: ResolveComplaintInput) {
    const updated = await complaintsRepository.resolve(id, resolvedBy, input);
    if (!updated) {
      throw new AppError("Complaint not found.", 404);
    }

    // Notify customer of resolution
    await notificationsService.notify({
      userId: updated.customerId.toString(),
      type: NotificationType.ProviderUpdate,
      title: `Complaint ${updated.status === ComplaintStatus.Resolved ? "Resolved" : "Updated"}`,
      message: `Your complaint (${updated.complaintId}) has been updated: ${input.resolutionNotes || "Status: " + updated.status}`,
      data: {
        complaintId: updated.complaintId,
        status: updated.status,
      },
    });

    return updated;
  }
}

export const complaintsService = new ComplaintsService();
