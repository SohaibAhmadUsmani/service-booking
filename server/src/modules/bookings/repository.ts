import { Types } from "mongoose";
import { ACTIVE_STATUSES, Booking, BookingStatus } from "./model";

export interface NewBooking {
  bookingId: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  details?: { name?: string; phone?: string; notes?: string };
}

export const bookingsRepository = {
  async create(data: NewBooking) {
    const doc = await Booking.create({
      ...data,
      customerId: new Types.ObjectId(data.customerId),
      providerId: new Types.ObjectId(data.providerId),
      serviceId: new Types.ObjectId(data.serviceId),
    });
    return doc.toObject();
  },

  findById(id: string) {
    return Booking.findById(id).lean();
  },

  /** Start times ("HH:mm") already taken by active bookings for a provider on a date. */
  async activeStartTimes(providerId: string, date: string, excludeId?: string) {
    const filter: Record<string, any> = {
      providerId: new Types.ObjectId(providerId),
      date,
      status: { $in: ACTIVE_STATUSES },
    };
    if (excludeId) filter._id = { $ne: new Types.ObjectId(excludeId) };
    const docs = await Booking.find(filter).select("startTime").lean();
    return docs.map((d) => d.startTime);
  },

  list(filters: { customerId?: string; providerId?: string; status?: BookingStatus }) {
    const query: Record<string, any> = {};
    if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
    if (filters.providerId) query.providerId = new Types.ObjectId(filters.providerId);
    if (filters.status) query.status = filters.status;
    return Booking.find(query).sort({ date: -1, startTime: -1 }).lean();
  },

  update(id: string, set: Record<string, any>) {
    return Booking.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true }).lean();
  },
};
