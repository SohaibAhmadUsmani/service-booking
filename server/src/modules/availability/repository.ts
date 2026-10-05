import { Types } from "mongoose";
import { Availability } from "./model";
import type { WorkingDay } from "./service";

export const availabilityRepository = {
  findByProvider(providerId: string) {
    return Availability.findOne({ providerId: new Types.ObjectId(providerId) }).lean();
  },

  upsert(providerId: string, data: { slotDurationMinutes: number; workingDays: WorkingDay[] }) {
    return Availability.findOneAndUpdate(
      { providerId: new Types.ObjectId(providerId) },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    ).lean();
  },
};
