import mongoose from "mongoose";
import * as bcrypt from "bcryptjs";

export interface OverviewMetrics {
  totalUsers: number;
  customersCount: number;
  providersCount: number;
  adminsCount: number;
  activeUsersCount: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  platformCommissionEarned: number;
  commissionRate: number;
  totalCategories: number;
  totalServices: number;
  totalReviews: number;
  totalPayments: number;
  openComplaints: number;
  monthlyBookings: { month: string; count: number; volume: number }[];
  recentBookings: any[];
  pendingApprovals: any[];
}

export class AdminRepository {
  private get db() {
    return mongoose.connection.db;
  }

  // ==========================================
  // OVERVIEW & METRICS
  // ==========================================
  async getOverviewStats(): Promise<OverviewMetrics> {
    if (!this.db) throw new Error("Database connection not ready");

    const usersCol = this.db.collection("users");
    const bookingsCol = this.db.collection("bookings");
    const providersCol = this.db.collection("providerprofiles");
    const categoriesCol = this.db.collection("categories");
    const servicesCol = this.db.collection("services");
    const reviewsCol = this.db.collection("reviews");
    const complaintsCol = this.db.collection("complaints");
    const paymentsCol = this.db.collection("payments");
    const settingsCol = this.db.collection("platform_settings");

    const settingsDoc = await settingsCol.findOne({ key: "main_settings" });
    const commissionRate = Number(settingsDoc?.value?.commissionRate ?? 10);

    const [
      totalUsers,
      customersCount,
      providersCount,
      adminsCount,
      activeUsersCount,
      totalBookings,
      bookingStatuses,
      totalCategories,
      totalServices,
      totalReviews,
      openComplaints,
      totalPayments,
      recentBookings,
      pendingApprovals,
      allBookingsForTrends,
    ] = await Promise.all([
      usersCol.countDocuments(),
      usersCol.countDocuments({ role: "customer" }),
      usersCol.countDocuments({ role: "provider" }),
      usersCol.countDocuments({ role: "admin" }),
      usersCol.countDocuments({ isActive: true }),
      bookingsCol.countDocuments(),
      bookingsCol
        .aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              revenue: { $sum: { $ifNull: ["$price", 0] } },
            },
          },
        ])
        .toArray(),
      categoriesCol.countDocuments(),
      servicesCol.countDocuments(),
      reviewsCol.countDocuments(),
      complaintsCol.countDocuments({ status: { $nin: ["resolved", "dismissed"] } }),
      paymentsCol.countDocuments(),
      bookingsCol.find().sort({ createdAt: -1 }).limit(10).toArray(),
      providersCol.find({ isVerified: false }).limit(10).toArray(),
      bookingsCol.find({}, { projection: { date: 1, price: 1, createdAt: 1, status: 1 } }).toArray(),
    ]);

    let pendingBookings = 0;
    let confirmedBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;
    let totalRevenue = 0;

    for (const b of bookingStatuses) {
      const s = String(b._id).toLowerCase();
      if (s === "pending") pendingBookings = b.count;
      else if (s === "confirmed") {
        confirmedBookings = b.count;
        totalRevenue += b.revenue;
      } else if (s === "completed") {
        completedBookings = b.count;
        totalRevenue += b.revenue;
      } else if (s === "cancelled") {
        cancelledBookings = b.count;
      }
    }

    const platformCommissionEarned = Math.round((totalRevenue * commissionRate) / 100);

    // Build monthly aggregation
    const monthMap: Record<string, { count: number; volume: number }> = {};
    for (const b of allBookingsForTrends) {
      let mKey = "Unknown";
      if (b.date && typeof b.date === "string" && b.date.length >= 7) {
        mKey = b.date.substring(0, 7);
      } else if (b.createdAt) {
        mKey = new Date(b.createdAt).toISOString().substring(0, 7);
      }

      if (!monthMap[mKey]) {
        monthMap[mKey] = { count: 0, volume: 0 };
      }
      monthMap[mKey].count += 1;
      if (b.status === "confirmed" || b.status === "completed") {
        monthMap[mKey].volume += Number(b.price || 0);
      }
    }

    const monthlyBookings = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        count: data.count,
        volume: data.volume,
      }));

    return {
      totalUsers,
      customersCount,
      providersCount,
      adminsCount,
      activeUsersCount,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      platformCommissionEarned,
      commissionRate,
      totalCategories,
      totalServices,
      totalReviews,
      totalPayments,
      openComplaints,
      monthlyBookings,
      recentBookings,
      pendingApprovals,
    };
  }

  // ==========================================
  // USERS MANAGEMENT
  // ==========================================
  async getUsers(search?: string, role?: string, status?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const query: Record<string, any> = {};

    if (role && role !== "all") {
      query.role = role.toLowerCase();
    }
    if (status && status !== "all") {
      query.isActive = status === "active";
    }
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await this.db
      .collection("users")
      .find(query, { projection: { passwordHash: 0, password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return users.map((u) => ({
      ...u,
      _id: String(u._id),
      id: String(u._id),
    }));
  }

  async createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    phone?: string;
    role?: string;
  }) {
    if (!this.db) throw new Error("Database connection not ready");
    const usersCol = this.db.collection("users");

    const existing = await usersCol.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw new Error(`A user with email ${data.email} already exists`);
    }

    const rawPassword = data.password || "Password123!";
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const now = new Date();

    const newUser = {
      email: data.email.toLowerCase().trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      passwordHash,
      role: data.role ? data.role.toLowerCase() : "customer",
      phone: data.phone || "",
      isActive: true,
      tokenVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    const result = await usersCol.insertOne(newUser);
    await this.logActivity("Create User", `Created ${newUser.role} user: ${newUser.email}`);

    // If role is provider, initialize a provider profile if not existing
    if (newUser.role === "provider") {
      await this.db.collection("providerprofiles").updateOne(
        { userId: result.insertedId },
        {
          $set: {
            userId: result.insertedId,
            businessName: `${newUser.firstName} Services`,
            rating: 0,
            reviewCount: 0,
            isVerified: false,
            status: "approved",
            categories: [],
            hourlyRate: 1500,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }

    return { id: String(result.insertedId), ...newUser, passwordHash: undefined };
  }

  async updateUser(id: string, updates: { isActive?: boolean; role?: string; phone?: string; firstName?: string; lastName?: string }) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const result = await this.db.collection("users").updateOne({ _id: oid }, { $set: { ...updates, updatedAt: new Date() } });
    await this.logActivity("Update User", `Updated user ${id}: ${JSON.stringify(updates)}`);
    return result;
  }

  async resetUserPassword(id: string, newPassword?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const pass = newPassword || "Password123!";
    const passwordHash = await bcrypt.hash(pass, 10);
    const result = await this.db.collection("users").updateOne(
      { _id: oid },
      { $set: { passwordHash, tokenVersion: Math.floor(Date.now() / 1000), updatedAt: new Date() } }
    );
    await this.logActivity("Reset Password", `Password reset for user ${id}`);
    return { success: true, message: `Password reset successfully to: ${pass}` };
  }

  async deleteUser(id: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const user = await this.db.collection("users").findOne({ _id: oid });
    const result = await this.db.collection("users").deleteOne({ _id: oid });
    if (user) {
      await this.db.collection("providerprofiles").deleteOne({ userId: oid });
      await this.logActivity("Delete User", `Deleted user ${user.email} (${id})`);
    }
    return result;
  }

  // ==========================================
  // PROVIDERS MANAGEMENT
  // ==========================================
  async getProviders(search?: string, status?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const providers = await this.db.collection("providerprofiles").find().toArray();
    const users = await this.db.collection("users").find({ role: "provider" }).toArray();

    let list: any[] = providers.map((p: any) => {
      const u = users.find((user: any) => String(user._id) === String(p.userId));
      return {
        ...p,
        _id: String(p._id),
        id: String(p._id),
        userId: String(p.userId),
        email: u?.email ?? "N/A",
        firstName: u?.firstName ?? "",
        lastName: u?.lastName ?? "",
        phone: u?.phone ?? "",
        isActive: u?.isActive ?? true,
      };
    });

    if (status && status !== "all") {
      list = list.filter((p) => (p.status || "approved").toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.businessName && p.businessName.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.bio && p.bio.toLowerCase().includes(q)) ||
          (p.firstName && p.firstName.toLowerCase().includes(q)) ||
          (p.lastName && p.lastName.toLowerCase().includes(q))
      );
    }

    return list;
  }

  async updateProvider(
    id: string,
    updates: {
      isVerified?: boolean;
      status?: string;
      businessName?: string;
      bio?: string;
      hourlyRate?: number;
      categories?: string[];
    }
  ) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const result = await this.db.collection("providerprofiles").updateOne(
      { _id: oid },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    await this.logActivity("Update Provider", `Updated provider profile ${id}`);
    return result;
  }

  // ==========================================
  // SERVICES MANAGEMENT
  // ==========================================
  async getServices(search?: string, categoryId?: string, status?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const query: Record<string, any> = {};

    if (categoryId && categoryId !== "all") {
      query.categoryId = categoryId;
    }
    if (status && status !== "all") {
      query.isActive = status === "active";
    }
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const services = await this.db.collection("services").find(query).sort({ createdAt: -1 }).toArray();
    return services.map((s) => ({
      ...s,
      _id: String(s._id),
      id: String(s._id),
      price: Number(s.price || 0),
      duration: Number(s.duration || 60),
    }));
  }

  async createService(data: {
    name: string;
    categoryId?: string;
    price: number;
    duration?: number;
    description?: string;
    serviceType?: string;
    isActive?: boolean;
  }) {
    if (!this.db) throw new Error("Database connection not ready");
    const now = new Date();
    const newService = {
      name: data.name.trim(),
      categoryId: data.categoryId || "",
      price: Number(data.price),
      duration: Number(data.duration || 60),
      description: data.description || "",
      serviceType: data.serviceType || "home_visit",
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.db.collection("services").insertOne(newService);
    await this.logActivity("Create Service", `Added platform service: ${newService.name}`);
    return { _id: String(result.insertedId), id: String(result.insertedId), ...newService };
  }

  async updateService(
    id: string,
    updates: {
      name?: string;
      categoryId?: string;
      price?: number;
      duration?: number;
      description?: string;
      serviceType?: string;
      isActive?: boolean;
    }
  ) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const result = await this.db.collection("services").updateOne(
      { _id: oid },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    await this.logActivity("Update Service", `Updated service ${id}`);
    return result;
  }

  async deleteService(id: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const serv = await this.db.collection("services").findOne({ _id: oid });
    const result = await this.db.collection("services").deleteOne({ _id: oid });
    if (serv) {
      await this.logActivity("Delete Service", `Deleted service: ${serv.name} (${id})`);
    }
    return result;
  }

  // ==========================================
  // CATEGORIES MANAGEMENT
  // ==========================================
  async getCategories() {
    if (!this.db) throw new Error("Database connection not ready");
    const [categories, services] = await Promise.all([
      this.db.collection("categories").find().sort({ createdAt: -1 }).toArray(),
      this.db.collection("services").find().toArray(),
    ]);

    return categories.map((c: any): any => {
      const servCount = services.filter((s: any) => String(s.categoryId) === String(c._id)).length;
      return {
        ...c,
        name: c.name,
        icon: c.icon,
        _id: String(c._id),
        id: String(c._id),
        serviceCount: servCount,
      };
    });
  }

  async createCategory(data: { name: string; description?: string; icon?: string; isActive?: boolean }) {
    if (!this.db) throw new Error("Database connection not ready");
    const now = new Date();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const newCat = {
      name: data.name.trim(),
      slug,
      icon: data.icon || "🛠️",
      description: data.description || "",
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.db.collection("categories").insertOne(newCat);
    await this.logActivity("Create Category", `Added category: ${newCat.name}`);
    return { _id: String(result.insertedId), id: String(result.insertedId), ...newCat };
  }

  async updateCategory(
    id: string,
    updates: { isActive?: boolean; name?: string; description?: string; icon?: string }
  ) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const setObj: Record<string, any> = { ...updates, updatedAt: new Date() };
    if (updates.name) {
      setObj.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    const result = await this.db.collection("categories").updateOne({ _id: oid }, { $set: setObj });
    await this.logActivity("Update Category", `Updated category ${id}`);
    return result;
  }

  async deleteCategory(id: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const cat = await this.db.collection("categories").findOne({ _id: oid });
    const result = await this.db.collection("categories").deleteOne({ _id: oid });
    if (cat) {
      await this.logActivity("Delete Category", `Deleted category: ${cat.name} (${id})`);
    }
    return result;
  }

  // ==========================================
  // BOOKINGS MANAGEMENT
  // ==========================================
  async getBookings(status?: string, search?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const query: Record<string, any> = {};

    if (status && status !== "all") {
      const normalized = status.toLowerCase() === "no-show" ? "no_show" : status.toLowerCase();
      query.status = normalized;
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } },
        { "details.name": { $regex: search, $options: "i" } },
        { "details.phone": { $regex: search, $options: "i" } },
        { "details.notes": { $regex: search, $options: "i" } },
        { date: { $regex: search, $options: "i" } },
      ];
    }

    const [bookings, providers, services] = await Promise.all([
      this.db.collection("bookings").find(query).sort({ createdAt: -1 }).toArray(),
      this.db.collection("providerprofiles").find().toArray(),
      this.db.collection("services").find().toArray(),
    ]);

    return bookings.map((b: any) => {
      const provider = providers.find((p) => String(p.userId) === String(b.providerId) || String(p._id) === String(b.providerId));
      const service = services.find((s) => String(s._id) === String(b.serviceId));

      return {
        ...b,
        _id: String(b._id),
        id: String(b._id),
        providerName: provider?.businessName || "Provider",
        serviceName: service?.name || "Service",
        paymentStatus:
          b.paymentStatus ||
          (b.status === "completed" || b.status === "confirmed"
            ? "paid"
            : b.status === "cancelled"
            ? "refunded"
            : b.status === "no_show"
            ? "failed"
            : "pending"),
      };
    });
  }

  async updateBookingStatus(id: string, status: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const normalized = status.toLowerCase() === "no-show" ? "no_show" : status.toLowerCase();
    const oid = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
    const filter = oid ? { $or: [{ _id: oid }, { bookingId: id }] } : { bookingId: id };

    const paymentStatus =
      normalized === "completed" || normalized === "confirmed"
        ? "paid"
        : normalized === "cancelled"
        ? "refunded"
        : normalized === "no_show"
        ? "failed"
        : "pending";

    const result = await this.db.collection("bookings").updateOne(filter, {
      $set: { status: normalized, paymentStatus, updatedAt: new Date() },
    });

    // Also sync with payments collection if a payment record exists
    await this.db.collection("payments").updateOne(
      { $or: [{ bookingId: oid }, { bookingId: id }] },
      {
        $set: {
          status: paymentStatus,
          updatedAt: new Date(),
          ...(paymentStatus === "paid" ? { paidAt: new Date() } : {}),
          ...(paymentStatus === "refunded" ? { refundedAt: new Date() } : {}),
        },
      }
    );

    await this.logActivity("Update Booking Status", `Booking ${id} status set to ${normalized} (${paymentStatus})`);
    return result;
  }

  async updateBooking(id: string, updates: { date?: string; startTime?: string; endTime?: string; price?: number; notes?: string }) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
    const filter = oid ? { $or: [{ _id: oid }, { bookingId: id }] } : { bookingId: id };

    const setObj: Record<string, any> = { updatedAt: new Date() };
    if (updates.date) setObj.date = updates.date;
    if (updates.startTime) setObj.startTime = updates.startTime;
    if (updates.endTime) setObj.endTime = updates.endTime;
    if (updates.price !== undefined) setObj.price = Number(updates.price);
    if (updates.notes !== undefined) setObj["details.notes"] = updates.notes;

    const result = await this.db.collection("bookings").updateOne(filter, { $set: setObj });
    await this.logActivity("Reschedule Booking", `Booking ${id} rescheduled/updated`);
    return result;
  }

  // ==========================================
  // PAYMENTS & FINANCIALS
  // ==========================================
  async getPayments(status?: string, search?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const query: Record<string, any> = {};

    if (status && status !== "all") {
      query.status = status.toLowerCase();
    }

    if (search) {
      query.$or = [
        { transactionReference: { $regex: search, $options: "i" } },
        { currency: { $regex: search, $options: "i" } },
        { failureReason: { $regex: search, $options: "i" } },
      ];
    }

    const [payments, bookings, users] = await Promise.all([
      this.db.collection("payments").find(query).sort({ createdAt: -1 }).toArray(),
      this.db.collection("bookings").find().toArray(),
      this.db.collection("users").find().toArray(),
    ]);

    // If payments collection has records, return enriched payments
    if (payments.length > 0) {
      return payments.map((p) => {
        const b = bookings.find((bk) => String(bk._id) === String(p.bookingId) || bk.bookingId === String(p.bookingId));
        const cust = users.find((u) => String(u._id) === String(p.customerId));
        const prov = users.find((u) => String(u._id) === String(p.providerId));

        return {
          ...p,
          _id: String(p._id),
          id: String(p._id),
          bookingRef: b?.bookingId || String(p.bookingId),
          customerName: cust ? `${cust.firstName || ""} ${cust.lastName || ""}`.trim() || cust.email : "Customer",
          customerEmail: cust?.email || "",
          providerName: prov ? `${prov.firstName || ""} ${prov.lastName || ""}`.trim() || prov.email : "Provider",
          amount: Number(p.amount || 0),
          currency: p.currency || "PKR",
          status: p.status || "pending",
          method: p.method || "card",
          transactionReference: p.transactionReference || `TXN-${String(p._id).slice(-8).toUpperCase()}`,
        };
      });
    }

    // Fallback: Deriving payments dynamically from live bookings if payments collection is empty
    return bookings.map((b: any, idx: number) => {
      const cust = users.find((u) => String(u._id) === String(b.customerId));
      const prov = users.find((u) => String(u._id) === String(b.providerId));
      const status =
        b.paymentStatus ||
        (b.status === "completed" || b.status === "confirmed"
          ? "paid"
          : b.status === "cancelled"
          ? "refunded"
          : b.status === "no_show"
          ? "failed"
          : "pending");

      return {
        _id: `pay-${b._id || idx}`,
        id: `pay-${b._id || idx}`,
        bookingId: b._id,
        bookingRef: b.bookingId || `BK-${idx + 1000}`,
        customerId: b.customerId,
        customerName: b.details?.name || (cust ? `${cust.firstName} ${cust.lastName}` : "Customer"),
        customerEmail: cust?.email || "",
        providerId: b.providerId,
        providerName: prov ? `${prov.firstName} ${prov.lastName}` : "Service Provider",
        amount: Number(b.price || 0),
        currency: "PKR",
        status,
        method: idx % 2 === 0 ? "card" : "cash",
        transactionReference: `TXN-REF-${String(b.bookingId || idx).replace(/[^A-Z0-9]/gi, "").toUpperCase()}`,
        paidAt: status === "paid" ? b.updatedAt || b.createdAt : null,
        refundedAt: status === "refunded" ? b.updatedAt : null,
        createdAt: b.createdAt || new Date(),
      };
    });
  }

  async updatePaymentStatus(id: string, status: string, failureReason?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
    const now = new Date();

    const setObj: Record<string, any> = {
      status,
      updatedAt: now,
      ...(status === "paid" ? { paidAt: now } : {}),
      ...(status === "refunded" ? { refundedAt: now } : {}),
      ...(failureReason ? { failureReason } : {}),
    };

    if (oid) {
      await this.db.collection("payments").updateOne({ _id: oid }, { $set: setObj });
    }

    await this.logActivity("Payment Update", `Payment ${id} set to status: ${status}`);
    return { success: true, message: `Payment updated to ${status}` };
  }

  async refundPayment(id: string) {
    return this.updatePaymentStatus(id, "refunded", "Refunded by Administrator");
  }

  // ==========================================
  // REVIEWS & MODERATION
  // ==========================================
  async getReviews(rating?: number, isHidden?: boolean) {
    if (!this.db) throw new Error("Database connection not ready");
    const query: Record<string, any> = {};

    if (rating !== undefined && rating > 0) {
      query.rating = Number(rating);
    }
    if (isHidden !== undefined) {
      query.isHidden = Boolean(isHidden);
    }

    const [reviews, users, providers] = await Promise.all([
      this.db.collection("reviews").find(query).sort({ createdAt: -1 }).toArray(),
      this.db.collection("users").find().toArray(),
      this.db.collection("providerprofiles").find().toArray(),
    ]);

    return reviews.map((r) => {
      const u = users.find((user) => String(user._id) === String(r.customerId || r.userId));
      const p = providers.find((prov) => String(prov.userId) === String(r.providerId) || String(prov._id) === String(r.providerId));

      return {
        ...r,
        _id: String(r._id),
        id: String(r._id),
        userName: r.userName || (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "Customer"),
        userEmail: r.userEmail || u?.email,
        providerName: p?.businessName || "Provider",
        isHidden: Boolean(r.isHidden),
      };
    });
  }

  async moderateReview(id: string, isHidden: boolean) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const review = await this.db.collection("reviews").findOne({ _id: oid });

    const result = await this.db.collection("reviews").updateOne(
      { _id: oid },
      { $set: { isHidden, updatedAt: new Date() } }
    );

    if (review?.providerId) {
      await this.recalculateProviderRating(String(review.providerId));
    }

    await this.logActivity("Moderate Review", `Review ${id} visibility set to: ${isHidden ? "HIDDEN" : "PUBLISHED"}`);
    return result;
  }

  async deleteReview(id: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const review = await this.db.collection("reviews").findOne({ _id: oid });

    const result = await this.db.collection("reviews").deleteOne({ _id: oid });

    if (review?.providerId) {
      await this.recalculateProviderRating(String(review.providerId));
    }

    await this.logActivity("Delete Review", `Deleted review ${id}`);
    return result;
  }

  async recalculateProviderRating(providerId: string) {
    if (!this.db) return;
    const activeReviews = await this.db
      .collection("reviews")
      .find({
        $or: [{ providerId: new mongoose.Types.ObjectId(providerId) }, { providerId }],
        isHidden: { $ne: true },
      })
      .toArray();

    const reviewCount = activeReviews.length;
    const averageRating =
      reviewCount > 0
        ? Number((activeReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount).toFixed(1))
        : 0;

    await this.db.collection("providerprofiles").updateOne(
      { $or: [{ userId: new mongoose.Types.ObjectId(providerId) }, { _id: new mongoose.Types.ObjectId(providerId) }] },
      { $set: { rating: averageRating, reviewCount, updatedAt: new Date() } }
    );
  }

  // ==========================================
  // COMPLAINTS & DISPUTES
  // ==========================================
  async getComplaints(status?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const query: Record<string, any> = {};

    if (status && status !== "all") {
      query.status = status.toLowerCase();
    }

    const [complaints, users] = await Promise.all([
      this.db.collection("complaints").find(query).sort({ createdAt: -1 }).toArray(),
      this.db.collection("users").find().toArray(),
    ]);

    return complaints.map((c) => {
      const u = users.find((user) => String(user._id) === String(c.customerId || c.userId || c.complainantId));
      return {
        ...c,
        _id: String(c._id),
        id: String(c._id),
        userName: c.userName || (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "Customer"),
        userEmail: c.userEmail || u?.email,
      };
    });
  }

  async resolveComplaint(id: string, status: string, notes?: string, adminName: string = "Admin") {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    const now = new Date();

    const result = await this.db.collection("complaints").updateOne(
      { _id: oid },
      {
        $set: {
          status,
          resolutionNotes: notes || "Resolved by Admin",
          resolvedBy: adminName,
          resolvedAt: now,
          updatedAt: now,
        },
      }
    );

    await this.logActivity("Resolve Complaint", `Complaint ${id} set to ${status}: ${notes || ""}`);
    return result;
  }

  // ==========================================
  // NOTIFICATIONS & BROADCASTS
  // ==========================================
  async broadcastNotification(data: {
    targetRole?: "all" | "customer" | "provider";
    title: string;
    message: string;
    type?: string;
  }) {
    if (!this.db) throw new Error("Database connection not ready");
    const notifsCol = this.db.collection("notifications");
    const usersCol = this.db.collection("users");

    const query: Record<string, any> = { isActive: true };
    if (data.targetRole && data.targetRole !== "all") {
      query.role = data.targetRole;
    }

    const users = await usersCol.find(query).toArray();
    const now = new Date();

    const notifDocs = users.map((u) => ({
      userId: u._id,
      type: data.type || "provider_update",
      title: data.title,
      message: data.message,
      read: false,
      readAt: null,
      data: { isBroadcast: true, broadcastedAt: now.toISOString() },
      createdAt: now,
      updatedAt: now,
    }));

    if (notifDocs.length > 0) {
      await notifsCol.insertMany(notifDocs);
    }

    // Save broadcast record
    await this.db.collection("broadcast_history").insertOne({
      title: data.title,
      message: data.message,
      targetRole: data.targetRole || "all",
      recipientCount: notifDocs.length,
      createdAt: now,
    });

    await this.logActivity("Broadcast Notification", `Broadcast "${data.title}" sent to ${notifDocs.length} users`);
    return { recipientCount: notifDocs.length, success: true };
  }

  async sendDirectNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
  }) {
    if (!this.db) throw new Error("Database connection not ready");
    const notifsCol = this.db.collection("notifications");
    const uid = mongoose.Types.ObjectId.isValid(data.userId) ? new mongoose.Types.ObjectId(data.userId) : data.userId;
    const now = new Date();

    const result = await notifsCol.insertOne({
      userId: uid,
      type: data.type || "provider_update",
      title: data.title,
      message: data.message,
      read: false,
      readAt: null,
      data: {},
      createdAt: now,
      updatedAt: now,
    });

    await this.logActivity("Direct Notification", `Sent notification to user ${data.userId}: "${data.title}"`);
    return { id: String(result.insertedId), success: true };
  }

  async getBroadcastHistory() {
    if (!this.db) throw new Error("Database connection not ready");
    return this.db.collection("broadcast_history").find().sort({ createdAt: -1 }).limit(20).toArray();
  }

  // ==========================================
  // AUDIT & ACTIVITY LOGS
  // ==========================================
  async logActivity(action: string, details: string, adminEmail: string = "aiman@servicehub.pk") {
    if (!this.db) return;
    try {
      await this.db.collection("admin_activity_logs").insertOne({
        action,
        details,
        adminEmail,
        timestamp: new Date(),
      });
    } catch {
      // Ignore logging errors to prevent cascading failures
    }
  }

  async getActivityLogs(limit: number = 30) {
    if (!this.db) throw new Error("Database connection not ready");
    return this.db.collection("admin_activity_logs").find().sort({ timestamp: -1 }).limit(limit).toArray();
  }

  // ==========================================
  // PLATFORM SETTINGS
  // ==========================================
  async getPlatformSettings() {
    if (!this.db) throw new Error("Database connection not ready");
    const doc = await this.db.collection("platform_settings").findOne({ key: "main_settings" });
    if (!doc) {
      return {
        commissionRate: 10,
        currency: "PKR",
        autoConfirmBookings: false,
        maintenanceMode: false,
        supportEmail: "support@servicehub.pk",
        cancellationWindowHours: 24,
      };
    }
    return doc.value;
  }

  async updatePlatformSettings(settings: Record<string, any>) {
    if (!this.db) throw new Error("Database connection not ready");
    const result = await this.db.collection("platform_settings").updateOne(
      { key: "main_settings" },
      { $set: { value: settings, updatedAt: new Date() } },
      { upsert: true }
    );
    await this.logActivity("Update Platform Settings", `Settings updated: commission=${settings.commissionRate}%`);
    return result;
  }
}
