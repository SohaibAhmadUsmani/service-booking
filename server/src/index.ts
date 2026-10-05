import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { connectMongo } from "./config/mongo";

const port = Number(process.env.PORT) || 4000;
const app = createApp();

async function startServer() {
  try {
    await connectMongo();
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
