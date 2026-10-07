import { Schema, model } from "mongoose";

export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Bookings in these statuses hold their time slot. */
export const ACTIVE_STATUSES: BookingStatus[] = ["pending", "confirmed"];

const bookingSchema = new Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, required: true },
    serviceId: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: "pending" },
    details: {
      name: { type: String },
      phone: { type: String },
      notes: { type: String },
    },
  },
  { timestamps: true }
);

bookingSchema.index({ providerId: 1, date: 1 });

export const Booking = model("Booking", bookingSchema);
