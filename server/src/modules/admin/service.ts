import { AdminRepository } from "./repository";

export class AdminService {
  constructor(private repo: AdminRepository = new AdminRepository()) {}

  async getOverview() {
    return this.repo.getOverviewStats();
  }

  async getUsers(search?: string, role?: string, status?: string) {
    return this.repo.getUsers(search, role, status);
  }

  async updateUserStatus(id: string, isActive: boolean) {
    return this.repo.updateUser(id, { isActive });
  }

  async updateUserRole(id: string, role: string) {
    const validRoles = ["customer", "provider", "admin"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid user role: ${role}. Valid roles are: ${validRoles.join(", ")}`);
    }
    return this.repo.updateUser(id, { role });
  }

  async deleteUser(id: string) {
    return this.repo.deleteUser(id);
  }

  async getProviders() {
    return this.repo.getProviders();
  }

  async verifyProvider(id: string, isVerified: boolean) {
    return this.repo.updateProvider(id, { isVerified });
  }

  async updateProviderStatus(id: string, status: string) {
    return this.repo.updateProvider(id, { status });
  }

  async updateCategory(id: string, updates: { isActive?: boolean; name?: string; description?: string; icon?: string }) {
    return this.repo.updateCategory(id, updates);
  }

  async getServices() {
    return this.repo.getServices();
  }

  async createService(data: { name: string; categoryId?: string; price: number; duration?: number; description?: string }) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Service name is required");
    }
    return this.repo.createService(data);
  }

  async updateService(id: string, updates: { isActive?: boolean; price?: number; name?: string }) {
    return this.repo.updateService(id, updates);
  }

  async deleteService(id: string) {
    return this.repo.deleteService(id);
  }

  async getCategories() {
    return this.repo.getCategories();
  }

  async createCategory(data: { name: string; description?: string; isActive?: boolean }) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Category name is required");
    }
    return this.repo.createCategory(data);
  }

  async deleteCategory(id: string) {
    return this.repo.deleteCategory(id);
  }

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

  async getReviews() {
    return this.repo.getReviews();
  }

  async moderateReview(id: string, isHidden: boolean) {
    return this.repo.moderateReview(id, isHidden);
  }

  async deleteReview(id: string) {
    return this.repo.deleteReview(id);
  }

  async getComplaints() {
    return this.repo.getComplaints();
  }

  async resolveComplaint(id: string, status: string, notes?: string) {
    return this.repo.resolveComplaint(id, status, notes);
  }

  async getReports() {
    const overview = await this.repo.getOverviewStats();
    const categories = await this.repo.getCategories();
    const bookings = await this.repo.getBookings();
    const services = await this.repo.getServices();

    const serviceCatMap = new Map<string, string>();
    for (const s of services) {
      if (s.categoryId) serviceCatMap.set(String(s._id), String(s.categoryId));
    }

    // Calculate real category distribution based on actual bookings
    const catDistribution = categories.map((c) => {
      const matchCount = bookings.filter((b: any) => {
        const catId = b.categoryId ? String(b.categoryId) : (b.serviceId ? serviceCatMap.get(String(b.serviceId)) : undefined);
        return catId === String(c._id);
      }).length;
      return {
        name: c.name,
        count: matchCount,
        share: bookings.length > 0 ? Math.round((matchCount / bookings.length) * 100) : 0,
      };
    });

    const fulfillmentRate =
      overview.totalBookings > 0
        ? Math.round((overview.completedBookings / overview.totalBookings) * 100)
        : 0;

    return {
      overview,
      categoryDistribution: catDistribution,
      fulfillmentRate,
    };
  }

  async getSettings() {
    return this.repo.getPlatformSettings();
  }

  async updateSettings(settings: Record<string, any>) {
    return this.repo.updatePlatformSettings(settings);
  }
}
