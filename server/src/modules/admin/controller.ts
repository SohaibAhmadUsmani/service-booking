import { Request, Response } from "express";
import { AdminService } from "./service";

const adminService = new AdminService();

export class AdminController {
  // ==========================================
  // OVERVIEW & METRICS
  // ==========================================
  static async getOverview(_req: Request, res: Response) {
    try {
      const stats = await adminService.getOverview();
      res.json({ status: "ok", data: stats });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // USERS MANAGEMENT
  // ==========================================
  static async getUsers(req: Request, res: Response) {
    try {
      const { search, role, status } = req.query as Record<string, string>;
      const users = await adminService.getUsers(search, role, status);
      res.json({ status: "ok", data: users });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const user = await adminService.createUser(req.body);
      res.status(201).json({ status: "ok", data: user, message: "User account created successfully" });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive, role, phone, firstName, lastName } = req.body;
      const updates: Record<string, any> = {};

      if (isActive !== undefined) updates.isActive = Boolean(isActive);
      if (role !== undefined) updates.role = String(role);
      if (phone !== undefined) updates.phone = String(phone);
      if (firstName !== undefined) updates.firstName = String(firstName);
      if (lastName !== undefined) updates.lastName = String(lastName);

      await adminService.updateUser(id, updates);
      res.json({ status: "ok", message: "User updated successfully" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async resetUserPassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const result = await adminService.resetUserPassword(id, password);
      res.json({ status: "ok", data: result, message: "Password reset completed" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.deleteUser(id);
      res.json({ status: "ok", message: "User deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // PROVIDERS MANAGEMENT
  // ==========================================
  static async getProviders(req: Request, res: Response) {
    try {
      const { search, status } = req.query as Record<string, string>;
      const providers = await adminService.getProviders(search, status);
      res.json({ status: "ok", data: providers });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async verifyProvider(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isVerified, status } = req.body;
      if (isVerified !== undefined) {
        await adminService.verifyProvider(id, Boolean(isVerified));
      }
      if (status !== undefined) {
        await adminService.updateProviderStatus(id, String(status));
      }
      res.json({ status: "ok", message: "Provider updated" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async updateProvider(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.updateProvider(id, req.body);
      res.json({ status: "ok", message: "Provider profile updated" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // SERVICES MANAGEMENT
  // ==========================================
  static async getServices(req: Request, res: Response) {
    try {
      const { search, categoryId, status } = req.query as Record<string, string>;
      const services = await adminService.getServices(search, categoryId, status);
      res.json({ status: "ok", data: services });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async createService(req: Request, res: Response) {
    try {
      const result = await adminService.createService(req.body);
      res.status(201).json({ status: "ok", data: result, message: "Service created" });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message });
    }
  }

  static async updateService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.updateService(id, req.body);
      res.json({ status: "ok", message: "Service updated successfully" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async deleteService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.deleteService(id);
      res.json({ status: "ok", message: "Service deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // CATEGORIES MANAGEMENT
  // ==========================================
  static async getCategories(_req: Request, res: Response) {
    try {
      const categories = await adminService.getCategories();
      res.json({ status: "ok", data: categories });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const result = await adminService.createCategory(req.body);
      res.status(201).json({ status: "ok", data: result, message: "Category created" });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message });
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.updateCategory(id, req.body);
      res.json({ status: "ok", message: "Category updated successfully" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.deleteCategory(id);
      res.json({ status: "ok", message: "Category deleted" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // BOOKINGS MANAGEMENT
  // ==========================================
  static async getBookings(req: Request, res: Response) {
    try {
      const { status, search } = req.query as Record<string, string>;
      const bookings = await adminService.getBookings(status, search);
      res.json({ status: "ok", data: bookings });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async updateBookingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await adminService.updateBookingStatus(id, status);
      res.json({ status: "ok", message: `Booking status updated to ${status}` });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message });
    }
  }

  static async updateBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.updateBooking(id, req.body);
      res.json({ status: "ok", message: "Booking schedule updated successfully" });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // PAYMENTS & FINANCIALS
  // ==========================================
  static async getPayments(req: Request, res: Response) {
    try {
      const { status, search } = req.query as Record<string, string>;
      const payments = await adminService.getPayments(status, search);
      res.json({ status: "ok", data: payments });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, failureReason } = req.body;
      const result = await adminService.updatePaymentStatus(id, status, failureReason);
      res.json({ status: "ok", data: result, message: "Payment status updated" });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message });
    }
  }

  static async refundPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await adminService.refundPayment(id);
      res.json({ status: "ok", data: result, message: "Refund issued successfully" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // REVIEWS MODERATION
  // ==========================================
  static async getReviews(req: Request, res: Response) {
    try {
      const { rating, isHidden } = req.query as Record<string, string>;
      const rVal = rating ? Number(rating) : undefined;
      const hVal = isHidden !== undefined ? isHidden === "true" : undefined;
      const reviews = await adminService.getReviews(rVal, hVal);
      res.json({ status: "ok", data: reviews });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async moderateReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isHidden } = req.body;
      await adminService.moderateReview(id, Boolean(isHidden));
      res.json({ status: "ok", message: "Review visibility updated" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await adminService.deleteReview(id);
      res.json({ status: "ok", message: "Review deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // COMPLAINTS & DISPUTES
  // ==========================================
  static async getComplaints(req: Request, res: Response) {
    try {
      const { status } = req.query as Record<string, string>;
      const complaints = await adminService.getComplaints(status);
      res.json({ status: "ok", data: complaints });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async resolveComplaint(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes, adminName } = req.body;
      await adminService.resolveComplaint(id, status, notes, adminName);
      res.json({ status: "ok", message: "Complaint resolved" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // NOTIFICATIONS & BROADCASTS
  // ==========================================
  static async broadcastNotification(req: Request, res: Response) {
    try {
      const result = await adminService.broadcastNotification(req.body);
      res.status(201).json({ status: "ok", data: result, message: "Broadcast sent successfully" });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message });
    }
  }

  static async sendDirectNotification(req: Request, res: Response) {
    try {
      const result = await adminService.sendDirectNotification(req.body);
      res.status(201).json({ status: "ok", data: result, message: "Direct notification sent" });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message });
    }
  }

  static async getBroadcastHistory(_req: Request, res: Response) {
    try {
      const history = await adminService.getBroadcastHistory();
      res.json({ status: "ok", data: history });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  static async getActivityLogs(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 30;
      const logs = await adminService.getActivityLogs(limit);
      res.json({ status: "ok", data: logs });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // REPORTS & ANALYTICS
  // ==========================================
  static async getReports(_req: Request, res: Response) {
    try {
      const reports = await adminService.getReports();
      res.json({ status: "ok", data: reports });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  // ==========================================
  // PLATFORM SETTINGS
  // ==========================================
  static async getSettings(_req: Request, res: Response) {
    try {
      const settings = await adminService.getSettings();
      res.json({ status: "ok", data: settings });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      await adminService.updateSettings(req.body);
      res.json({ status: "ok", message: "Platform settings saved" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }
}
