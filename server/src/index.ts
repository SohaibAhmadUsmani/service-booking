import "dotenv/config";
import { createApp } from "./app";
import { connectDb } from "./config/db";
import { startUpcomingAppointmentScheduler } from "./modules/notifications/reminderService";

const port = Number(process.env.PORT) || 4000;

async function start() {
  await connectDb();
  startUpcomingAppointmentScheduler();
  const app = createApp();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
