import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
} from "./controller";
import { validateRequest } from "../../middleware/validate";
import { registerSchema, loginSchema, refreshSchema } from "./validation";

/** Owner: Muzammil - Identity & Access */
export const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest({ body: registerSchema }),
  registerHandler
);

authRouter.post(
  "/login",
  validateRequest({ body: loginSchema }),
  loginHandler
);

authRouter.post(
  "/refresh",
  validateRequest({ body: refreshSchema }),
  refreshHandler
);

authRouter.post("/logout", logoutHandler);
