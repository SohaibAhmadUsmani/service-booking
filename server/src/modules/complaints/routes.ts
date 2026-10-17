import { Router } from "express";
import { ComplaintsController } from "./controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate";
import { createComplaintSchema, resolveComplaintSchema } from "./validation";
import { UserRole } from "@service-booking/shared";

export const complaintsRouter = Router();

// Customer creates complaint for their booking
complaintsRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.Customer, UserRole.Admin),
  validateRequest({ body: createComplaintSchema }),
  ComplaintsController.create
);

// List complaints (scoped by role: customer sees own, provider sees against them, admin sees all)
complaintsRouter.get(
  "/",
  requireAuth,
  ComplaintsController.list
);

// Get single complaint details
complaintsRouter.get(
  "/:id",
  requireAuth,
  ComplaintsController.getById
);

// Admin resolves/updates complaint status
complaintsRouter.patch(
  "/:id/resolve",
  requireAuth,
  requireRole(UserRole.Admin),
  validateRequest({ body: resolveComplaintSchema }),
  ComplaintsController.resolve
);
