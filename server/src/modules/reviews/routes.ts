import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate";
import {
  createReviewHandler,
  deleteReviewHandler,
  getProviderSummaryHandler,
  getReviewHandler,
  listReviewsHandler,
  updateReviewHandler,
} from "./controller";
import {
  createReviewSchema,
  listReviewsQuerySchema,
  providerIdParamsSchema,
  reviewIdParamsSchema,
  updateReviewSchema,
} from "./validation";

/** Owner: Namra */
export const reviewsRouter = Router();

reviewsRouter.get("/", validateRequest({ query: listReviewsQuerySchema }), listReviewsHandler);
reviewsRouter.get(
  "/provider/:providerId",
  validateRequest({ params: providerIdParamsSchema }),
  getProviderSummaryHandler
);
reviewsRouter.get("/:id", validateRequest({ params: reviewIdParamsSchema }), getReviewHandler);
reviewsRouter.post(
  "/",
  requireAuth,
  validateRequest({ body: createReviewSchema }),
  createReviewHandler
);
reviewsRouter.patch(
  "/:id",
  requireAuth,
  validateRequest({ params: reviewIdParamsSchema, body: updateReviewSchema }),
  updateReviewHandler
);
reviewsRouter.delete(
  "/:id",
  requireAuth,
  validateRequest({ params: reviewIdParamsSchema }),
  deleteReviewHandler
);
