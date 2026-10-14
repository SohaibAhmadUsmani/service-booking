import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate";
import {
  createPaymentHandler,
  getPaymentByBookingHandler,
  getPaymentHandler,
  listMyPaymentsHandler,
  listPaymentsHandler,
  processPaymentHandler,
  refundPaymentHandler,
} from "./controller";
import {
  bookingIdParamsSchema,
  createPaymentSchema,
  listPaymentsQuerySchema,
  paymentIdParamsSchema,
  processPaymentSchema,
} from "./validation";

/** Owner: Namra */
export const paymentsRouter = Router();

paymentsRouter.get(
  "/",
  requireAuth,
  validateRequest({ query: listPaymentsQuerySchema }),
  listPaymentsHandler
);
paymentsRouter.get(
  "/user/me",
  requireAuth,
  validateRequest({ query: listPaymentsQuerySchema }),
  listMyPaymentsHandler
);
paymentsRouter.get(
  "/booking/:bookingId",
  requireAuth,
  validateRequest({ params: bookingIdParamsSchema }),
  getPaymentByBookingHandler
);
paymentsRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: paymentIdParamsSchema }),
  getPaymentHandler
);
paymentsRouter.post(
  "/",
  requireAuth,
  validateRequest({ body: createPaymentSchema }),
  createPaymentHandler
);
paymentsRouter.post(
  "/:id/process",
  requireAuth,
  validateRequest({ params: paymentIdParamsSchema, body: processPaymentSchema }),
  processPaymentHandler
);
paymentsRouter.post(
  "/:id/refund",
  requireAuth,
  validateRequest({ params: paymentIdParamsSchema }),
  refundPaymentHandler
);
