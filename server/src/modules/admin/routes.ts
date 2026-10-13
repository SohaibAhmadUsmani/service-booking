import { Router } from "express";
import { AdminController } from "./controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@service-booking/shared";

/** Owner: Aiman */
export const adminRouter = Router();

// Platform health status (unauthenticated)
adminRouter.get("/", (req, res) => {
  res.json({ module: "admin", status: "ready" });
});

// Enforce authentication and Admin role for all administrative endpoints
adminRouter.use(requireAuth, requireRole(UserRole.Admin));

adminRouter.get("/overview", AdminController.getOverview);

// User management
adminRouter.get("/users", AdminController.getUsers);
adminRouter.patch("/users/:id", AdminController.updateUser);

// Provider management
adminRouter.get("/providers", AdminController.getProviders);
adminRouter.patch("/providers/:id", AdminController.verifyProvider);

// Services management
adminRouter.get("/services", AdminController.getServices);
adminRouter.post("/services", AdminController.createService);
adminRouter.patch("/services/:id", AdminController.updateService);
adminRouter.delete("/services/:id", AdminController.deleteService);

// Category management
adminRouter.get("/categories", AdminController.getCategories);
adminRouter.post("/categories", AdminController.createCategory);
adminRouter.patch("/categories/:id", AdminController.updateCategory);
adminRouter.delete("/categories/:id", AdminController.deleteCategory);

// Bookings management
adminRouter.get("/bookings", AdminController.getBookings);
adminRouter.patch("/bookings/:id/status", AdminController.updateBookingStatus);

// Reviews management
adminRouter.get("/reviews", AdminController.getReviews);
adminRouter.patch("/reviews/:id", AdminController.moderateReview);

// Complaints management
adminRouter.get("/complaints", AdminController.getComplaints);
adminRouter.patch("/complaints/:id", AdminController.resolveComplaint);

// Reports & analytics
adminRouter.get("/reports", AdminController.getReports);

// Platform settings
adminRouter.get("/settings", AdminController.getSettings);
adminRouter.put("/settings", AdminController.updateSettings);
