import { Schema, model, Document, Model, Types } from "mongoose";

export interface IServiceDocument extends Document {
  providerId: Types.ObjectId | string;
  name: string;
  category: string;
  price: number;
  durationMin: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IServiceDocument>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 },
    durationMin: { type: Number, required: true, min: 15, max: 480 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    // Deactivate instead of deleting, so old bookings keep a valid serviceId
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id ? (ret._id as object).toString() : undefined;
        ret.providerId = ret.providerId ? (ret.providerId as object).toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ServiceSchema.index({ providerId: 1, isActive: 1 });

export const ServiceModel: Model<IServiceDocument> = model<IServiceDocument>("Service", ServiceSchema);