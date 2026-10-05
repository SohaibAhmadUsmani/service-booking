import { Router } from "express";
import {
  getProfileHandler,
  updateProfileHandler,
  changePasswordHandler,
} from "./controller";
import { requireAuth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate";
import { updateProfileSchema, changePasswordSchema } from "./validation";

/** Owner: Muzammil - Identity & Access */
export const usersRouter = Router();

// Current user profile endpoints
usersRouter.get("/me", requireAuth, getProfileHandler);

usersRouter.put(
  "/me",
  requireAuth,
  validateRequest({ body: updateProfileSchema }),
  updateProfileHandler
);

usersRouter.put(
  "/me/password",
  requireAuth,
  validateRequest({ body: changePasswordSchema }),
  changePasswordHandler
);
