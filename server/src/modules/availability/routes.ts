import { Router } from "express";
import { getAvailability, getSlots, setAvailability } from "./controller";

/** Owner: Shanza */
export const availabilityRouter = Router();

availabilityRouter.get("/:providerId", getAvailability);
availabilityRouter.put("/:providerId", setAvailability);
availabilityRouter.get("/:providerId/slots", getSlots);
