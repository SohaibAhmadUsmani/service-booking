import { Router } from "express";
import { AdminController } from "./controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@service-booking/shared";

/** Owner: Aiman */
export const adminRouter = Router();

// Platform health status (unauthenticated)
adminRouter.get("/", (_req, res) => {
  res.json({ module: "admin", status: "ready" });
});

// Enforce authentication and Admin role for all administrative endpoints
adminRouter.use(requireAuth, requireRole(UserRole.Admin));

// Platform overview & stats
adminRouter.get("/overview", AdminController.getOverview);

// User management
adminRouter.get("/users", AdminController.getUsers);
adminRouter.post("/users", AdminController.createUser);
adminRouter.patch("/users/:id", AdminController.updateUser);
adminRouter.post("/users/:id/reset-password", AdminController.resetUserPassword);
adminRouter.delete("/users/:id", AdminController.deleteUser);

// Provider management
adminRouter.get("/providers", AdminController.getProviders);
adminRouter.patch("/providers/:id", AdminController.verifyProvider);
adminRouter.put("/providers/:id", AdminController.updateProvider);

// Services catalog management
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
adminRouter.patch("/bookings/:id", AdminController.updateBooking);
adminRouter.patch("/bookings/:id/status", AdminController.updateBookingStatus);

// Payments & Financials
adminRouter.get("/payments", AdminController.getPayments);
adminRouter.patch("/payments/:id/status", AdminController.updatePaymentStatus);
adminRouter.post("/payments/:id/refund", AdminController.refundPayment);

// Reviews management & moderation
adminRouter.get("/reviews", AdminController.getReviews);
adminRouter.patch("/reviews/:id", AdminController.moderateReview);
adminRouter.delete("/reviews/:id", AdminController.deleteReview);

// Complaints & Dispute resolution
adminRouter.get("/complaints", AdminController.getComplaints);
adminRouter.patch("/complaints/:id", AdminController.resolveComplaint);

// Notifications & Broadcast announcements
adminRouter.post("/notifications/broadcast", AdminController.broadcastNotification);
adminRouter.post("/notifications/direct", AdminController.sendDirectNotification);
adminRouter.get("/notifications/history", AdminController.getBroadcastHistory);

// Audit & Activity logs
adminRouter.get("/activity-logs", AdminController.getActivityLogs);

// Reports & analytics
adminRouter.get("/reports", AdminController.getReports);

// Platform settings
adminRouter.get("/settings", AdminController.getSettings);
adminRouter.put("/settings", AdminController.updateSettings);