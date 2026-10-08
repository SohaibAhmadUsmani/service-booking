import { Schema, model } from "mongoose";
import { PaymentMethod, PaymentStatus } from "@service-booking/shared";

const paymentSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true, maxlength: 3, default: "USD" },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.Pending },
    method: { type: String, enum: Object.values(PaymentMethod) },
    transactionReference: { type: String, trim: true, maxlength: 120 },
    failureReason: { type: String, trim: true, maxlength: 500 },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id ? (ret._id as object).toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

paymentSchema.index(
  { transactionReference: 1 },
  { unique: true, partialFilterExpression: { transactionReference: { $type: "string" } } }
);

paymentSchema.index({ bookingId: 1 }, { unique: true });
paymentSchema.index({ customerId: 1, createdAt: -1 });
paymentSchema.index({ providerId: 1, createdAt: -1 });

export const Payment = model("Payment", paymentSchema);
