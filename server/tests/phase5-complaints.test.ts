import jwt from "jsonwebtoken";
import {
  api,
  assert,
  assertEqual,
  createBookingFixture,
  registerUser,
  reportAndExit,
  startTestServer,
  test,
} from "./helpers";
import { UserModel } from "../src/modules/users/models/user.model";
import { getJwtSecret } from "../src/middleware/auth";
import { ComplaintCategory, ComplaintStatus } from "@service-booking/shared";

async function main() {
  const ctx = await startTestServer();
  const { baseUrl } = ctx;

  try {
    const customer = await registerUser(baseUrl, "customer");
    const provider = await registerUser(baseUrl, "provider");
    const otherCustomer = await registerUser(baseUrl, "customer");
    const adminUser = await registerUser(baseUrl, "customer");
    await UserModel.updateOne({ _id: adminUser.id }, { role: "admin" });

    const adminToken = jwt.sign(
      {
        userId: adminUser.id,
        email: adminUser.email,
        role: "admin",
        tokenVersion: 0,
      },
      getJwtSecret(),
      {
        algorithm: "HS256",
        expiresIn: "1h",
        issuer: process.env.JWT_ISSUER || "service-booking-api",
        audience: process.env.JWT_AUDIENCE || "service-booking-client",
      }
    );

    const booking = await createBookingFixture({
      customerId: customer.id,
      providerId: provider.id,
      status: "completed",
    });

    let complaintId = "";

    await test("1. Unauthenticated complaint creation rejected (401)", async () => {
      const res = await api(baseUrl, "/api/complaints", {
        method: "POST",
        body: {
          bookingId: String(booking._id),
          category: ComplaintCategory.PoorQuality,
          description: "Service did not meet expectations and was delayed.",
        },
      });
      assertEqual(res.status, 401, "expected 401 unauthenticated");
    });

    await test("2. Cannot file complaint on someone else's booking (403)", async () => {
      const res = await api(baseUrl, "/api/complaints", {
        method: "POST",
        token: otherCustomer.token,
        body: {
          bookingId: String(booking._id),
          category: ComplaintCategory.PoorQuality,
          description: "Trying to dispute another user's booking.",
        },
      });
      assertEqual(res.status, 403, "expected 403 forbidden");
    });

    await test("3. Customer successfully files complaint (201)", async () => {
      const res = await api(baseUrl, "/api/complaints", {
        method: "POST",
        token: customer.token,
        body: {
          bookingId: String(booking._id),
          category: ComplaintCategory.PoorQuality,
          description: "Service did not meet expectations and was delayed by over an hour.",
        },
      });
      assertEqual(res.status, 201, "expected 201 created");
      assertEqual(res.body.data.category, ComplaintCategory.PoorQuality, "category set");
      assertEqual(res.body.data.status, ComplaintStatus.Open, "initial status open");
      assert(res.body.data.complaintId, "complaintId generated");
      complaintId = res.body.data._id || res.body.data.id;
    });

    await test("4. Customer lists their complaints", async () => {
      const res = await api(baseUrl, "/api/complaints", {
        token: customer.token,
      });
      assertEqual(res.status, 200, "expected 200");
      const items = res.body.data.items;
      assert(items.length >= 1, "at least one complaint returned");
      assertEqual(items[0].category, ComplaintCategory.PoorQuality, "matches category");
    });

    await test("5. Provider views complaints against them", async () => {
      const res = await api(baseUrl, "/api/complaints", {
        token: provider.token,
      });
      assertEqual(res.status, 200, "expected 200");
      const items = res.body.data.items;
      assert(items.length >= 1, "provider sees complaint");
    });

    await test("6. Non-admin cannot resolve complaint (403)", async () => {
      const res = await api(baseUrl, `/api/complaints/${complaintId}/resolve`, {
        method: "PATCH",
        token: customer.token,
        body: {
          status: ComplaintStatus.Resolved,
          resolutionNotes: "Self-resolving is not allowed.",
        },
      });
      assertEqual(res.status, 403, "expected 403");
    });

    await test("7. Admin resolves complaint with notes (200)", async () => {
      const res = await api(baseUrl, `/api/complaints/${complaintId}/resolve`, {
        method: "PATCH",
        token: adminToken,
        body: {
          status: ComplaintStatus.Resolved,
          resolutionNotes: "Dispute reviewed by support. Partial credit issued.",
        },
      });
      assertEqual(res.status, 200, "expected 200 resolved");
      assertEqual(res.body.data.status, ComplaintStatus.Resolved, "status resolved");
      assertEqual(res.body.data.resolutionNotes, "Dispute reviewed by support. Partial credit issued.", "notes set");
    });

    await test("8. Customer gets single complaint and verifies resolution", async () => {
      const res = await api(baseUrl, `/api/complaints/${complaintId}`, {
        token: customer.token,
      });
      assertEqual(res.status, 200, "expected 200");
      assertEqual(res.body.data.status, ComplaintStatus.Resolved, "status is resolved");
    });
  } finally {
    await ctx.close();
  }

  reportAndExit();
}

main().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
