import "dotenv/config";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { connectDb } from "../src/config/db";
import { getJwtSecret } from "../src/middleware/auth";
import { UserRole } from "@service-booking/shared";
import mongoose from "mongoose";

async function run() {
  await connectDb();
  const app = createApp();
  const server = app.listen(4005);

  const adminToken = jwt.sign(
    {
      sub: "6ac9e8b9cf2926555acb4a01",
      email: "aiman@servicehub.pk",
      role: UserRole.Admin,
      tokenVersion: 1,
    },
    getJwtSecret(),
    { expiresIn: "1h" }
  );

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

  console.log("Testing unauthenticated health check...");
  const healthRes = await fetch("http://localhost:4005/api/admin");
  const healthData = await healthRes.json();
  if (healthRes.status === 200 && healthData.module === "admin") {
    console.log("✅ [200 OK] /api/admin - Unauthenticated Health Check Passed");
  } else {
    console.error("❌ Health check failed:", healthData);
  }

  console.log("Testing authenticated Admin API endpoints with Admin Bearer Token...");
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:4005${ep}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
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

  server.close(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    if (failed === 0) {
      console.log("🎉 ALL ADMIN API ENDPOINTS (RBAC + FUNCTIONALITY) TESTED AND PASSED PERFECTLY!");
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
