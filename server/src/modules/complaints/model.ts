import { Schema, model, Document, Types } from "mongoose";
import { ComplaintCategory, ComplaintStatus } from "@service-booking/shared";

export interface IComplaintDocument extends Document {
  complaintId: string;
  bookingId: Types.ObjectId;
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  category: ComplaintCategory;
  description: string;
  evidenceUrls: string[];
  status: ComplaintStatus;
  resolutionNotes?: string;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaintDocument>(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(ComplaintCategory),
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
    },
    evidenceUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.Open,
      index: true,
    },
    resolutionNotes: {
      type: String,
      maxlength: 2000,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

complaintSchema.index({ customerId: 1, createdAt: -1 });
complaintSchema.index({ providerId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });

export const ComplaintModel = model<IComplaintDocument>("Complaint", complaintSchema);
