import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireOwnProvider } from "./access";
import { getAvailability, getSlots, setAvailability } from "./controller";

/** Owner: Shanza */
export const availabilityRouter = Router();

// Public: customers need to see working hours and free slots before logging in.
availabilityRouter.get("/:providerId", getAvailability);
availabilityRouter.get("/:providerId/slots", getSlots);

// Provider only: a provider can change their own schedule (admins can change any).
availabilityRouter.put("/:providerId", requireAuth, requireOwnProvider, setAvailability);