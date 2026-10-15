import "dotenv/config";
import { createApp } from "../src/app";
import { connectDb } from "../src/config/db";

async function run() {
  await connectDb();
  const app = createApp();
  const server = app.listen(4005);

  const endpoints = [
    "/api/admin/overview",
    "/api/admin/users",
    "/api/admin/providers",
    "/api/admin/services",
    "/api/admin/categories",
    "/api/admin/bookings",
    "/api/admin/payments",
    "/api/admin/reviews",
    "/api/admin/complaints",
    "/api/admin/notifications/history",
    "/api/admin/activity-logs",
    "/api/admin/reports",
    "/api/admin/settings",
  ];

  console.log("Testing all Admin API endpoints...");
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:4005${ep}`);
      const data = await res.json();
      if (res.status === 200 && data.status === "ok") {
        console.log(`✅ [200 OK] ${ep} - Success (${Array.isArray(data.data) ? data.data.length + " items" : "Object"})`);
      } else {
        console.error(`❌ [${res.status}] ${ep} - Error:`, data);
        failed++;
      }
    } catch (e: any) {
      console.error(`❌ ${ep} - Exception: ${e.message}`);
      failed++;
    }
  }

  server.close(() => {
    if (failed === 0) {
      console.log("🎉 ALL 13 ADMIN API ENDPOINTS TESTED AND PASSED WITH FLYING COLORS!");
      process.exit(0);
    } else {
      console.error(`⚠️ ${failed} endpoints failed.`);
      process.exit(1);
    }
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
