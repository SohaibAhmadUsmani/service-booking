import { Request, Response } from "express";
import { AdminService } from "./service";

const adminService = new AdminService();

export class AdminController {
  static async getOverview(_req: Request, res: Response) {
    try {
      const stats = await adminService.getOverview();
      res.json({ status: "ok", data: stats });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const { search, role, status } = req.query as Record<string, string>;
      const users = await adminService.getUsers(search, role, status);
      res.json({ status: "ok", data: users });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive, role } = req.body;
      if (isActive !== undefined) {
        await adminService.updateUserStatus(id, Boolean(isActive));
      }
      if (role !== undefined) {
        await adminService.updateUserRole(id, String(role));
      }
      res.json({ status: "ok", message: "User updated successfully" });
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

  static async getProviders(_req: Request, res: Response) {
    try {
      const providers = await adminService.getProviders();
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
      res.json({ status: "ok", message: "Provider status updated" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async getServices(_req: Request, res: Response) {
    try {
      const services = await adminService.getServices();
      res.json({ status: "ok", data: services });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async createService(req: Request, res: Response) {
    try {
      const result = await adminService.createService(req.body);
      res.status(201).json({ status: "ok", data: result });
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
      res.status(201).json({ status: "ok", data: result });
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

  static async getReviews(_req: Request, res: Response) {
    try {
      const reviews = await adminService.getReviews();
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
      res.json({ status: "ok", message: "Review updated" });
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

  static async getComplaints(_req: Request, res: Response) {
    try {
      const complaints = await adminService.getComplaints();
      res.json({ status: "ok", data: complaints });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async resolveComplaint(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      await adminService.resolveComplaint(id, status, notes);
      res.json({ status: "ok", message: "Complaint resolved" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

  static async getReports(_req: Request, res: Response) {
    try {
      const reports = await adminService.getReports();
      res.json({ status: "ok", data: reports });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  }

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
