import mongoose from "mongoose";

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
  totalCategories: number;
  totalServices: number;
  totalReviews: number;
  openComplaints: number;
  monthlyBookings: { month: string; count: number; volume: number }[];
  recentBookings: any[];
  pendingApprovals: any[];
}

export class AdminRepository {
  private get db() {
    return mongoose.connection.db;
  }

  async getOverviewStats(): Promise<OverviewMetrics> {
    if (!this.db) {
      throw new Error("Database connection not ready");
    }

    const usersCol = this.db.collection("users");
    const bookingsCol = this.db.collection("bookings");
    const providersCol = this.db.collection("providerprofiles");
    const categoriesCol = this.db.collection("categories");
    const servicesCol = this.db.collection("services");
    const reviewsCol = this.db.collection("reviews");
    const complaintsCol = this.db.collection("complaints");

    // Strictly real-time counts and aggregations from live collections
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
      complaintsCol.countDocuments({ status: { $ne: "resolved" } }),
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

    // Build strictly real monthly aggregation from the actual booking dates
    const monthMap: Record<string, { count: number; volume: number }> = {};
    for (const b of allBookingsForTrends) {
      let mKey = "Unknown";
      if (b.date && typeof b.date === "string" && b.date.length >= 7) {
        mKey = b.date.substring(0, 7); // e.g. "2026-10"
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
      totalCategories,
      totalServices,
      totalReviews,
      openComplaints,
      monthlyBookings,
      recentBookings,
      pendingApprovals,
    };
  }

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
      ];
    }

    return this.db
      .collection("users")
      .find(query, { projection: { passwordHash: 0, password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateUser(id: string, updates: { isActive?: boolean; role?: string }) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("users").updateOne({ _id: oid }, { $set: updates });
  }

  async deleteUser(id: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("users").deleteOne({ _id: oid });
  }

  async getProviders() {
    if (!this.db) throw new Error("Database connection not ready");
    const providers = await this.db.collection("providerprofiles").find().toArray();
    const users = await this.db.collection("users").find({ role: "provider" }).toArray();

    return providers.map((p) => {
      const u = users.find((user) => String(user._id) === String(p.userId));
      return {
        ...p,
        email: u?.email ?? "N/A",
        firstName: u?.firstName ?? "",
        lastName: u?.lastName ?? "",
        isActive: u?.isActive ?? true,
      };
    });
  }

  async updateProvider(id: string, updates: { isVerified?: boolean; status?: string; businessName?: string }) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("providerprofiles").updateOne({ _id: oid }, { $set: { ...updates, updatedAt: new Date() } });
  }

  async getServices() {
    if (!this.db) throw new Error("Database connection not ready");
    return this.db.collection("services").find().sort({ createdAt: -1 }).toArray();
  }

  async createService(data: { name: string; categoryId?: string; price: number; duration?: number; description?: string }) {
    if (!this.db) throw new Error("Database connection not ready");
    const now = new Date();
    return this.db.collection("services").insertOne({
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateService(id: string, updates: { isActive?: boolean; price?: number; name?: string }) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("services").updateOne({ _id: oid }, { $set: { ...updates, updatedAt: new Date() } });
  }

  async deleteService(id: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("services").deleteOne({ _id: oid });
  }

  async getCategories() {
    if (!this.db) throw new Error("Database connection not ready");
    return this.db.collection("categories").find().sort({ createdAt: -1 }).toArray();
  }

  async createCategory(data: { name: string; description?: string; icon?: string; isActive?: boolean }) {
    if (!this.db) throw new Error("Database connection not ready");
    const now = new Date();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return this.db.collection("categories").insertOne({
      name: data.name,
      slug,
      icon: data.icon || "🛠️",
      description: data.description || "",
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateCategory(id: string, updates: { isActive?: boolean; name?: string; description?: string; icon?: string }) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("categories").updateOne({ _id: oid }, { $set: { ...updates, updatedAt: new Date() } });
  }

  async deleteCategory(id: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("categories").deleteOne({ _id: oid });
  }

  async getBookings(status?: string, search?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const query: Record<string, any> = {};
    if (status && status !== "all") {
      query.status = status.toLowerCase();
    }
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } },
        { "details.name": { $regex: search, $options: "i" } },
        { "details.phone": { $regex: search, $options: "i" } },
      ];
    }
    const bookings = await this.db.collection("bookings").find(query).sort({ createdAt: -1 }).toArray();
    return bookings.map((b: any) => ({
      ...b,
      paymentStatus:
        b.paymentStatus ||
        (b.status === "completed" || b.status === "confirmed"
          ? "paid"
          : b.status === "cancelled"
          ? "refunded"
          : b.status === "no_show"
          ? "failed"
          : "pending"),
    }));
  }

  async updateBookingStatus(id: string, status: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
    const filter = oid ? { $or: [{ _id: oid }, { bookingId: id }] } : { bookingId: id };
    const paymentStatus =
      status === "completed" || status === "confirmed"
        ? "paid"
        : status === "cancelled"
        ? "refunded"
        : status === "no_show"
        ? "failed"
        : "pending";
    return this.db.collection("bookings").updateOne(filter, {
      $set: { status, paymentStatus, updatedAt: new Date() },
    });
  }

  async getReviews() {
    if (!this.db) throw new Error("Database connection not ready");
    const reviews = await this.db.collection("reviews").find().sort({ createdAt: -1 }).toArray();
    const users = await this.db.collection("users").find().toArray();
    return reviews.map((r) => {
      const u = users.find((user) => String(user._id) === String(r.customerId || r.userId));
      return {
        ...r,
        userName: r.userName || (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "Customer"),
        userEmail: r.userEmail || u?.email,
      };
    });
  }

  async moderateReview(id: string, isHidden: boolean) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("reviews").updateOne({ _id: oid }, { $set: { isHidden, updatedAt: new Date() } });
  }

  async deleteReview(id: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db.collection("reviews").deleteOne({ _id: oid });
  }

  async getComplaints() {
    if (!this.db) throw new Error("Database connection not ready");
    const complaints = await this.db.collection("complaints").find().sort({ createdAt: -1 }).toArray();
    const users = await this.db.collection("users").find().toArray();
    return complaints.map((c) => {
      const u = users.find((user) => String(user._id) === String(c.customerId || c.userId));
      return {
        ...c,
        userName: c.userName || (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "Customer"),
        userEmail: c.userEmail || u?.email,
      };
    });
  }

  async resolveComplaint(id: string, status: string, notes?: string) {
    if (!this.db) throw new Error("Database connection not ready");
    const oid = new mongoose.Types.ObjectId(id);
    return this.db
      .collection("complaints")
      .updateOne({ _id: oid }, { $set: { status, resolutionNotes: notes || "", resolvedAt: new Date() } });
  }

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
    return this.db.collection("platform_settings").updateOne(
      { key: "main_settings" },
      { $set: { value: settings, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}
