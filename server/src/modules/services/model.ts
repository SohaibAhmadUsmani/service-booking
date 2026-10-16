import { Schema, model, Document, Model, Types } from "mongoose";

/**
 * Shares the "services" collection with the admin module (Aiman).
 * Admin-created services have no providerId, so it is optional here.
 */
export interface IServiceDocument extends Document {
  providerId?: Types.ObjectId | string;
  categoryId?: Types.ObjectId | string;
  name: string;
  price: number;
  duration?: number; // minutes
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IServiceDocument>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    categoryId: { type: Schema.Types.ObjectId },
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, min: 15, max: 480 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    // Deactivate instead of deleting, so old bookings keep a valid serviceId
    isActive: { type: Boolean, default: true },
  },
  {
    collection: "services",
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id ? (ret._id as object).toString() : undefined;
        if (ret.providerId) ret.providerId = (ret.providerId as object).toString();
        if (ret.categoryId) ret.categoryId = (ret.categoryId as object).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ServiceSchema.index({ providerId: 1, isActive: 1 });

export const ServiceModel: Model<IServiceDocument> = model<IServiceDocument>("Service", ServiceSchema);