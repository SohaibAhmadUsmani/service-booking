import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate";
import { createServiceSchema, updateServiceSchema } from "./validation";
import {
  listServicesHandler,
  listMyServicesHandler,
  createServiceHandler,
  updateServiceHandler,
  deactivateServiceHandler,
} from "./controller";

/** Owner: Maira - Provider services */
export const servicesRouter = Router();

servicesRouter.get("/", listServicesHandler);
// "/mine" must come before "/:id" routes
servicesRouter.get("/mine", requireAuth, listMyServicesHandler);
servicesRouter.post("/", requireAuth, validateRequest({ body: createServiceSchema }), createServiceHandler);
servicesRouter.patch("/:id", requireAuth, validateRequest({ body: updateServiceSchema }), updateServiceHandler);
servicesRouter.delete("/:id", requireAuth, deactivateServiceHandler);