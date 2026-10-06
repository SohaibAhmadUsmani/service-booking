import { Schema, model, Document, Model, Types } from "mongoose";

export interface IProviderProfileDocument extends Document {
  userId: Types.ObjectId | string;
  businessName?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  categories: string[];
  hourlyRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderProfileSchema = new Schema<IProviderProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
    rating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id ? (ret._id as object).toString() : undefined;
        ret.userId = ret.userId ? (ret.userId as object).toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ProviderProfileModel: Model<IProviderProfileDocument> =
  model<IProviderProfileDocument>("ProviderProfile", ProviderProfileSchema);
