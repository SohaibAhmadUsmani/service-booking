import { Schema, model } from "mongoose";

const timeRangeSchema = new Schema(
  { start: { type: String, required: true }, end: { type: String, required: true } },
  { _id: false }
);

const workingDaySchema = new Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    start: { type: String, required: true },
    end: { type: String, required: true },
    breaks: { type: [timeRangeSchema], default: [] },
  },
  { _id: false }
);

const availabilitySchema = new Schema(
  {
    providerId: { type: Schema.Types.ObjectId, required: true, unique: true },
    slotDurationMinutes: { type: Number, default: 30 },
    workingDays: { type: [workingDaySchema], default: [] },
  },
  { timestamps: true }
);

export const Availability = model("Availability", availabilitySchema);
