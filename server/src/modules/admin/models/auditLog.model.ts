import { Schema, model, Document, Model, Types } from "mongoose";

export interface IAuditLogDocument extends Document {
  adminId: Types.ObjectId | string;
  action: string;
  targetId?: string;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    targetId: { type: String, default: null },
    ipAddress: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel: Model<IAuditLogDocument> =
  model<IAuditLogDocument>("AuditLog", AuditLogSchema);
