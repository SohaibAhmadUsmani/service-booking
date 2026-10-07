import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { errorHandler } from "./middleware/errorHandler";
import { registerModuleRoutes } from "./modules/registerRoutes";

export function createApp() {
  const app = express();

  // Trust first proxy for accurate IP rate limiting in reverse proxy / load balancer setups
  app.set("trust proxy", 1);

  // Security CORS configuration
  app.use(
    cors({
      origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, "http://localhost:3000"]
        : true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // Comprehensive health check validating MongoDB connectivity
  app.get("/health", (_req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(isDbConnected ? 200 : 503).json({
      status: isDbConnected ? "ok" : "degraded",
      database: isDbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  registerModuleRoutes(app);

  app.use(errorHandler);

  return app;
}
