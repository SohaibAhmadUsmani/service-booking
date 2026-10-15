import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getSessionsHandler,
  revokeSessionHandler,
  verifyEmailHandler,
  resendVerificationHandler,
} from "./controller";
import { validateRequest } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import {
  authLoginLimiter,
  authRegisterLimiter,
  authRefreshLimiter,
  forgotPasswordLimiter,
  sessionReadLimiter,
} from "../../middleware/rateLimiter";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sessionParamSchema,
  verifyEmailSchema,
  resendVerificationSchema,
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

authRouter.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  forgotPasswordHandler
);

authRouter.post(
  "/reset-password",
  authLoginLimiter,
  validateRequest({ body: resetPasswordSchema }),
  resetPasswordHandler
);

authRouter.post(
  "/verify-email",
  validateRequest({ body: verifyEmailSchema }),
  verifyEmailHandler
);

authRouter.post(
  "/resend-verification",
  authLoginLimiter,
  validateRequest({ body: resendVerificationSchema }),
  resendVerificationHandler
);

authRouter.get(
  "/sessions",
  requireAuth,
  sessionReadLimiter,
  getSessionsHandler
);

authRouter.delete(
  "/sessions/:id",
  requireAuth,
  validateRequest({ params: sessionParamSchema }),
  revokeSessionHandler
);
