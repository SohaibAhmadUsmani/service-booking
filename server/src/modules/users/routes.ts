import { Router } from "express";
import {
  getProfileHandler,
  updateProfileHandler,
  changePasswordHandler,
} from "./controller";
import { requireAuth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate";
import { passwordChangeLimiter } from "../../middleware/rateLimiter";
import { updateProfileSchema, changePasswordSchema } from "./validation";

/** Owner: Muzammil - Identity & Access */
export const usersRouter = Router();

// Current user profile endpoints
usersRouter.get("/me", requireAuth, getProfileHandler);

// Support both PUT and PATCH for profile updates
usersRouter.put(
  "/me",
  requireAuth,
  validateRequest({ body: updateProfileSchema }),
  updateProfileHandler
);

usersRouter.patch(
  "/me",
  requireAuth,
  validateRequest({ body: updateProfileSchema }),
  updateProfileHandler
);

// Password update with rate limiting protection
usersRouter.put(
  "/me/password",
  requireAuth,
  passwordChangeLimiter,
  validateRequest({ body: changePasswordSchema }),
  changePasswordHandler
);
