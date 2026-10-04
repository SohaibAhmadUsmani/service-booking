import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { registerModuleRoutes } from "./modules/registerRoutes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  registerModuleRoutes(app);

  app.use(errorHandler);

  return app;
}
