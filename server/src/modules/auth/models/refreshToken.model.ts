import { Schema, model, Document, Model, Types } from "mongoose";

export interface IRefreshTokenDocument extends Document {
  userId: Types.ObjectId | string;
  tokenHash: string;
  familyId: string;
  deviceInfo?: string;
  ipAddress?: string;
  isRevoked: boolean;
  expiresAt: Date;
  replacedByTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    deviceInfo: {
      type: String,
      default: "Unknown Device",
    },
    ipAddress: {
      type: String,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically purge expired sessions
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel: Model<IRefreshTokenDocument> =
  model<IRefreshTokenDocument>("RefreshToken", RefreshTokenSchema);
