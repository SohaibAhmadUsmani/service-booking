import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
} from "./controller";
import { validateRequest } from "../../middleware/validate";
import {
  authLoginLimiter,
  authRegisterLimiter,
  authRefreshLimiter,
} from "../../middleware/rateLimiter";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "./validation";

/** Owner: Muzammil - Identity & Access */
export const authRouter = Router();

authRouter.post(
  "/register",
  authRegisterLimiter,
  validateRequest({ body: registerSchema }),
  registerHandler
);

authRouter.post(
  "/login",
  authLoginLimiter,
  validateRequest({ body: loginSchema }),
  loginHandler
);

authRouter.post(
  "/refresh",
  authRefreshLimiter,
  validateRequest({ body: refreshSchema }),
  refreshHandler
);

authRouter.post(
  "/logout",
  validateRequest({ body: logoutSchema }),
  logoutHandler
);
