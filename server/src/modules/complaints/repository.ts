import { Types } from "mongoose";
import { ComplaintModel, IComplaintDocument } from "./model";
import { ComplaintStatus, CreateComplaintInput, ResolveComplaintInput } from "@service-booking/shared";

export class ComplaintsRepository {
  async create(
    customerId: string,
    providerId: string,
    input: CreateComplaintInput
  ): Promise<IComplaintDocument> {
    const complaintId = `CMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return ComplaintModel.create({
      complaintId,
      bookingId: new Types.ObjectId(input.bookingId),
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
      category: input.category,
      description: input.description,
      evidenceUrls: input.evidenceUrls || [],
      status: ComplaintStatus.Open,
    });
  }

  async findById(id: string): Promise<IComplaintDocument | null> {
    if (Types.ObjectId.isValid(id)) {
      const doc = await ComplaintModel.findById(id);
      if (doc) return doc;
    }
    return ComplaintModel.findOne({ complaintId: id });
  }

  async list(filter: {
    customerId?: string;
    providerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const query: Record<string, any> = {};
    if (filter.customerId && Types.ObjectId.isValid(filter.customerId)) {
      query.customerId = new Types.ObjectId(filter.customerId);
    }
    if (filter.providerId && Types.ObjectId.isValid(filter.providerId)) {
      query.providerId = new Types.ObjectId(filter.providerId);
    }
    if (filter.status) {
      query.status = filter.status;
    }

    const limit = Math.min(filter.limit || 50, 100);
    const skip = filter.offset || 0;

    const [items, total] = await Promise.all([
      ComplaintModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ComplaintModel.countDocuments(query),
    ]);

    return { items, total, limit, skip };
  }

  async resolve(
    id: string,
    resolvedBy: string,
    input: ResolveComplaintInput
  ): Promise<IComplaintDocument | null> {
    const update: Record<string, any> = {
      status: input.status,
      resolvedBy: new Types.ObjectId(resolvedBy),
    };
    if (input.resolutionNotes !== undefined) {
      update.resolutionNotes = input.resolutionNotes;
    }

    const query = Types.ObjectId.isValid(id) ? { _id: id } : { complaintId: id };
    return ComplaintModel.findOneAndUpdate(query, { $set: update }, { new: true });
  }
}

export const complaintsRepository = new ComplaintsRepository();
