import { AdminRepository } from "./repository";

export class AdminService {
  constructor(private repo: AdminRepository = new AdminRepository()) {}

  // Overview
  async getOverview() {
    return this.repo.getOverviewStats();
  }

  // Users
  async getUsers(search?: string, role?: string, status?: string) {
    return this.repo.getUsers(search, role, status);
  }

  async createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    phone?: string;
    role?: string;
  }) {
    if (!data.email || !data.email.includes("@")) {
      throw new Error("Valid email address is required");
    }
    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new Error("First name is required");
    }
    return this.repo.createUser(data);
  }

  async updateUserStatus(id: string, isActive: boolean) {
    return this.repo.updateUser(id, { isActive });
  }

  async updateUserRole(id: string, role: string) 
    const valid = ["customer", "provider", "admin"];
    if (!valid.includes(role.toLowerCase())) {
      throw new Error(`Invalid role: ${role}. Valid roles: ${valid.join(", ")}`);
    }
    return this.repo.updateUser(id, { role: role.toLowerCase() });
  }

  async updateUser(id: string, updates: { isActive?: boolean; role?: string; phone?: string; firstName?: string; lastName?: string }) {
    return this.repo.updateUser(id, updates);
  }

  async resetUserPassword(id: string, newPassword?: string) {
    return this.repo.resetUserPassword(id, newPassword);
  }

  async deleteUser(id: string) {
    return this.repo.deleteUser(id);
  }

  // Providers
  async getProviders(search?: string, status?: string) {
    return this.repo.getProviders(search, status);
  }

  async verifyProvider(id: string, isVerified: boolean) {
    return this.repo.updateProvider(id, { isVerified });
  }

  async updateProviderStatus(id: string, status: string) {
    const valid = ["approved", "pending", "rejected", "suspended"];
    if (!valid.includes(status.toLowerCase())) {
      throw new Error(`Invalid status: ${status}. Valid statuses: ${valid.join(", ")}`);
    }
    return this.repo.updateProvider(id, { status: status.toLowerCase() });
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
    return this.repo.updateProvider(id, updates);
  }

  // Services
  async getServices(search?: string, categoryId?: string, status?: string) {
    return this.repo.getServices(search, categoryId, status);
  }

  async createService(data: {
    name: string;
    categoryId?: string;
    price: number;
    duration?: number;
    description?: string;
    serviceType?: string;
  }) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Service name is required");
    }
    if (data.price === undefined || isNaN(Number(data.price)) || Number(data.price) < 0) {
      throw new Error("Valid price in PKR is required");
    }
    return this.repo.createService(data);
  }

  async updateService(
    id: string,
    updates: {
      isActive?: boolean;
      price?: number;
      name?: string;
      duration?: number;
      categoryId?: string;
      description?: string;
      serviceType?: string;
    }
  ) {
    return this.repo.updateService(id, updates);
  }

  async deleteService(id: string) {
    return this.repo.deleteService(id);
  }

  // Categories
  async getCategories() {
    return this.repo.getCategories();
  }

  async createCategory(data: { name: string; description?: string; icon?: string; isActive?: boolean }) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Category name is required");
    }
    return this.repo.createCategory(data);
  }

  async updateCategory(
    id: string,
    updates: { isActive?: boolean; name?: string; description?: string; icon?: string }
  ) {
    return this.repo.updateCategory(id, updates);
  }

  async deleteCategory(id: string) {
    return this.repo.deleteCategory(id);
  }

  // Bookings
  async getBookings(status?: string, search?: string) {
    return this.repo.getBookings(status, search);
  }

  async updateBookingStatus(id: string, status: string) {
    const normalized = status.toLowerCase() === "no-show" ? "no_show" : status.toLowerCase();
    const valid = ["pending", "confirmed", "completed", "cancelled", "no_show"];
    if (!valid.includes(normalized)) {
      throw new Error(`Invalid booking status: ${status}`);
    }
    return this.repo.updateBookingStatus(id, normalized);
  }

  async updateBooking(id: string, updates: { date?: string; startTime?: string; endTime?: string; price?: number; notes?: string }) {
    return this.repo.updateBooking(id, updates);
  }

  // Payments
  async getPayments(status?: string, search?: string) {
    return this.repo.getPayments(status, search);
  }

  async updatePaymentStatus(id: string, status: string, failureReason?: string) {
    const valid = ["pending", "paid", "failed", "refunded"];
    if (!valid.includes(status.toLowerCase())) {
      throw new Error(`Invalid payment status: ${status}`);
    }
    return this.repo.updatePaymentStatus(id, status.toLowerCase(), failureReason);
  }

  async refundPayment(id: string) {
    return this.repo.refundPayment(id);
  }

  // Reviews
  async getReviews(rating?: number, isHidden?: boolean) {
    return this.repo.getReviews(rating, isHidden);
  }

  async moderateReview(id: string, isHidden: boolean) {
    return this.repo.moderateReview(id, isHidden);
  }

  async deleteReview(id: string) {
    return this.repo.deleteReview(id);
  }

  // Complaints
  async getComplaints(status?: string) {
    return this.repo.getComplaints(status);
  }

  async resolveComplaint(id: string, status: string, notes?: string, adminName: string = "Admin") {
    const valid = ["open", "in_review", "under_investigation", "resolved", "dismissed"];
    const normalized = status.toLowerCase() === "under_investigation" ? "in_review" : status.toLowerCase();
    if (!valid.includes(normalized)) {
      throw new Error(`Invalid complaint status: ${status}`);
    }
    return this.repo.resolveComplaint(id, normalized, notes, adminName);
  }

  // Notifications & Broadcasts
  async broadcastNotification(data: {
    targetRole?: "all" | "customer" | "provider";
    title: string;
    message: string;
    type?: string;
  }) {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error("Notification title is required");
    }
    if (!data.message || data.message.trim().length === 0) {
      throw new Error("Notification message body is required");
    }
    return this.repo.broadcastNotification(data);
  }

  async sendDirectNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
  }) {
    if (!data.userId) throw new Error("Target user ID is required");
    if (!data.title) throw new Error("Notification title is required");
    if (!data.message) throw new Error("Notification message body is required");
    return this.repo.sendDirectNotification(data);
  }

  async getBroadcastHistory() {
    return this.repo.getBroadcastHistory();
  }

  // Audit Logs
  async getActivityLogs(limit?: number) {
    return this.repo.getActivityLogs(limit);
  }

  // Reports
  async getReports() {
    const overview = await this.repo.getOverviewStats();
    const categories = await this.repo.getCategories();
    const bookings = await this.repo.getBookings();
    const providers = await this.repo.getProviders();

    // Real category distribution
    const catDistribution = categories.map((c) => {
      const matchCount = bookings.filter((b: any) => String(b.categoryId) === String(c._id)).length;
      return {
        id: c._id,
        name: c.name,
        icon: c.icon || "🛠️",
        count: matchCount,
        share: bookings.length > 0 ? Math.round((matchCount / bookings.length) * 100) : 0,
      };
    });

    // Top Providers
    const topProviders = providers
      .slice(0, 5)
      .map((p) => ({
        id: p._id,
        businessName: p.businessName || "Provider",
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        isVerified: p.isVerified,
        hourlyRate: p.hourlyRate || 0,
      }));

    const fulfillmentRate =
      overview.totalBookings > 0
        ? Math.round((overview.completedBookings / overview.totalBookings) * 100)
        : 0;

    const cancellationRate =
      overview.totalBookings > 0
        ? Math.round((overview.cancelledBookings / overview.totalBookings) * 100)
        : 0;

    return {
      overview,
      categoryDistribution: catDistribution,
      topProviders,
      fulfillmentRate,
      cancellationRate,
      netVolume: overview.totalRevenue - overview.platformCommissionEarned,
    };
  }

  // Settings
  async getSettings() {
    return this.repo.getPlatformSettings();
  }

  async updateSettings(settings: Record<string, any>) {
    return this.repo.updatePlatformSettings(settings);
  }
}
