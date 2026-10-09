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
import { Notification } from "../src/modules/notifications/model";

async function main() {
  const ctx = await startTestServer();
  const { baseUrl } = ctx;

  try {
    const customer = await registerUser(baseUrl, "customer");
    const provider = await registerUser(baseUrl, "provider");
    const other = await registerUser(baseUrl, "customer");

    const adminToken = jwt.sign(
      { userId: other.id, email: other.email, role: "admin" },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256", expiresIn: "1h" }
    );

    let seedCounter = 0;
    function seed(userId: string, overrides: Record<string, unknown> = {}) {
      seedCounter += 1;
      return Notification.create({
        userId,
        type: "provider_update",
        title: `Seed ${seedCounter}`,
        message: "Seeded notification",
        ...overrides,
      });
    }

    async function listFor(token: string, query = "") {
      const normalized = query.replace(/^[?&]+/, "");
      const qs = normalized ? `?${normalized}` : "?limit=100";
      const res = await api(baseUrl, `/api/notifications${qs}`, { token });
      assertEqual(res.status, 200, `list should return 200 (${normalized || "no query"})`);
      return res.body.data;
    }

    async function typesFor(token: string, query = "") {
      const data = await listFor(token, query);
      return (data.items as any[]).map((item) => item.type);
    }

    async function unreadCountFor(token: string) {
      const res = await api(baseUrl, "/api/notifications/unread-count", { token });
      assertEqual(res.status, 200, "unread-count should return 200");
      return res.body.data.count as number;
    }

    await test("Unauthenticated requests are rejected", async () => {
      const list = await api(baseUrl, "/api/notifications");
      assertEqual(list.status, 401, "list without token");
      const unread = await api(baseUrl, "/api/notifications/unread-count");
      assertEqual(unread.status, 401, "unread-count without token");
      const readAll = await api(baseUrl, "/api/notifications/read-all", { method: "PATCH" });
      assertEqual(readAll.status, 401, "read-all without token");
      const del = await api(baseUrl, "/api/notifications/657ab858f00d9a1c22e2aaaa", {
        method: "DELETE",
      });
      assertEqual(del.status, 401, "delete without token");
    });

    await test("Invalid query parameters are rejected", async () => {
      const badLimit = await api(baseUrl, "/api/notifications?limit=0", { token: customer.token });
      assertEqual(badLimit.status, 400, "limit=0 rejected");
      const badType = await api(baseUrl, "/api/notifications?type=bogus", {
        token: customer.token,
      });
      assertEqual(badType.status, 400, "unknown type rejected");
      const badId = await api(baseUrl, "/api/notifications/not-an-id/read", {
        method: "PATCH",
        token: customer.token,
      });
      assertEqual(badId.status, 400, "malformed id rejected");
    });

    await test("List returns only the caller's notifications with unread count", async () => {
      await seed(customer.id);
      await seed(customer.id, { read: true, readAt: new Date() });
      await seed(customer.id);
      await seed(other.id);
      await seed(other.id);

      const data = await listFor(customer.token);
      const ownCount = await Notification.countDocuments({ userId: customer.id });
      const unreadExpected = await Notification.countDocuments({
        userId: customer.id,
        read: false,
      });
      assertEqual(data.total, ownCount, "total matches own count");
      assertEqual(data.items.length, ownCount, "items contain only own notifications");
      assertEqual(data.unreadCount, unreadExpected, "unreadCount matches own unread");
      assert(
        (data.items as any[]).every((item) => item.userId === customer.id),
        "every item belongs to the caller"
      );
      assert(typeof data.page === "number", "page is a number");
      assert(typeof data.totalPages === "number", "totalPages is a number");
      assert((data.items as any[]).every((item) => typeof item.id === "string"), "items expose id");
    });

    await test("Pagination works", async () => {
      const totalOwn = await Notification.countDocuments({ userId: customer.id });
      const data = await listFor(customer.token, "&page=1&limit=2");
      assertEqual(data.limit, 2, "limit honored");
      assertEqual(data.page, 1, "page honored");
      assertEqual(data.items.length, Math.min(2, totalOwn), "page size respected");
      assertEqual(data.totalPages, Math.max(1, Math.ceil(totalOwn / 2)), "totalPages computed");
    });

    await test("Type filter works", async () => {
      await seed(customer.id, { type: "booking_cancelled" });
      const items = (await listFor(customer.token, "&type=booking_cancelled")).items as any[];
      assert(items.length >= 1, "filtered results present");
      assert(
        items.every((item) => item.type === "booking_cancelled"),
        "only requested type returned"
      );
    });

    await test("Unread filter works", async () => {
      const items = (await listFor(customer.token, "&unread=true")).items as any[];
      assert(items.length >= 1, "unread results present");
      assert(
        items.every((item) => item.read === false),
        "only unread returned"
      );
    });

    await test("Foreign userId filter is rejected for non-admins and allowed for admins", async () => {
      const forbidden = await api(baseUrl, `/api/notifications?userId=${provider.id}`, {
        token: customer.token,
      });
      assertEqual(forbidden.status, 403, "non-admin cannot list another user's notifications");

      const asAdmin = await api(baseUrl, `/api/notifications?userId=${customer.id}&limit=100`, {
        token: adminToken,
      });
      assertEqual(asAdmin.status, 200, "admin can list any user's notifications");
      const items = asAdmin.body.data.items as any[];
      assert(items.length > 0, "admin sees target user's notifications");
      assert(
        items.every((item) => item.userId === customer.id),
        "admin list scoped to requested user"
      );
    });

    await test("unread-count reflects the caller only", async () => {
      const expected = await Notification.countDocuments({ userId: customer.id, read: false });
      assertEqual(await unreadCountFor(customer.token), expected, "own unread count");
      const foreignExpected = await Notification.countDocuments({
        userId: other.id,
        read: false,
      });
      assert(foreignExpected > 0, "other user has unread notifications to compare against");
    });

    await test("Owner can mark a notification read; others get 404", async () => {
      const notification = await seed(customer.id);
      const id = String(notification._id);

      const res = await api(baseUrl, `/api/notifications/${id}/read`, {
        method: "PATCH",
        token: customer.token,
      });
      assertEqual(res.status, 200, "mark read status");
      assertEqual(res.body.data.read, true, "read set to true");
      assert(res.body.data.readAt, "readAt timestamp set");

      const again = await api(baseUrl, `/api/notifications/${id}/read`, {
        method: "PATCH",
        token: customer.token,
      });
      assertEqual(again.status, 200, "idempotent mark read");
      assertEqual(again.body.data.read, true, "still read");

      const foreign = await seed(other.id);
      const denied = await api(baseUrl, `/api/notifications/${String(foreign._id)}/read`, {
        method: "PATCH",
        token: customer.token,
      });
      assertEqual(denied.status, 404, "foreign notification hidden behind 404");
    });

    await test("read-all marks every unread notification of the caller", async () => {
      const foreign = await seed(other.id);
      const expected = await Notification.countDocuments({ userId: customer.id, read: false });
      assert(expected > 0, "caller has unread notifications before");

      const res = await api(baseUrl, "/api/notifications/read-all", {
        method: "PATCH",
        token: customer.token,
      });
      assertEqual(res.status, 200, "read-all status");
      assertEqual(res.body.data.modified, expected, "all own unread marked");

      const foreignAfter = await Notification.findById(foreign._id);
      assert(foreignAfter && foreignAfter.read === false, "foreign notification untouched");
      assertEqual(
        await Notification.countDocuments({ userId: customer.id, read: false }),
        0,
        "no unread left for caller"
      );
    });

    await test("Owner can delete; foreign delete returns 404", async () => {
      const notification = await seed(customer.id);
      const id = String(notification._id);

      const res = await api(baseUrl, `/api/notifications/${id}`, {
        method: "DELETE",
        token: customer.token,
      });
      assertEqual(res.status, 200, "delete status");
      assertEqual(res.body.data.deleted, true, "deleted flag");
      assert(!(await Notification.findById(id)), "document removed");

      const foreign = await seed(other.id);
      const denied = await api(baseUrl, `/api/notifications/${String(foreign._id)}`, {
        method: "DELETE",
        token: customer.token,
      });
      assertEqual(denied.status, 404, "foreign delete rejected");
      assert(await Notification.findById(String(foreign._id)), "foreign document kept");
    });

    await test("Admin can create; customers cannot; body is validated", async () => {
      const created = await api(baseUrl, "/api/notifications", {
        method: "POST",
        token: adminToken,
        body: {
          userId: customer.id,
          type: "provider_update",
          title: "Scheduled maintenance",
          message: "The service will be briefly unavailable.",
        },
      });
      assertEqual(created.status, 201, "admin create status");
      assertEqual(created.body.success, true, "envelope success");
      assert(typeof created.body.data.id === "string", "created notification exposes id");

      const forbidden = await api(baseUrl, "/api/notifications", {
        method: "POST",
        token: customer.token,
        body: {
          userId: customer.id,
          type: "provider_update",
          title: "Self serve",
          message: "Customers cannot create notifications.",
        },
      });
      assertEqual(forbidden.status, 403, "customer create rejected");

      const invalid = await api(baseUrl, "/api/notifications", {
        method: "POST",
        token: adminToken,
        body: { userId: customer.id, type: "bogus", title: "X", message: "Y" },
      });
      assertEqual(invalid.status, 400, "invalid body rejected");
    });

    await test("Paying a booking notifies both parties (payment + confirmation)", async () => {
      const booking = await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "pending",
        price: 75,
      });
      const created = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: String(booking._id), method: "card" },
      });
      assertEqual(created.status, 201, "payment created");

      const processed = await api(baseUrl, `/api/payments/${created.body.data.id}/process`, {
        method: "POST",
        token: customer.token,
        body: { outcome: "paid" },
      });
      assertEqual(processed.status, 200, "payment processed");

      const customerTypes = await typesFor(customer.token);
      assert(customerTypes.includes("payment_received"), "customer got payment_received");
      assert(customerTypes.includes("booking_confirmed"), "customer got booking_confirmed");
      const providerTypes = await typesFor(provider.token);
      assert(providerTypes.includes("payment_received"), "provider got payment_received");
      assert(providerTypes.includes("booking_confirmed"), "provider got booking_confirmed");

      const paymentNote = (await listFor(customer.token, "&type=payment_received")).items[0];
      assert(
        String(paymentNote.message).includes("75 USD"),
        "payment message includes the amount"
      );
      assert(paymentNote.data && paymentNote.data.bookingDbId, "payment data references booking");
    });

    await test("Refunding notifies both parties", async () => {
      const list = await listFor(customer.token, "&type=payment_received");
      const paymentId = (list.items as any[])[0].data.paymentId;
      const res = await api(baseUrl, `/api/payments/${paymentId}/refund`, {
        method: "POST",
        token: customer.token,
      });
      assertEqual(res.status, 200, "refund status");

      assert(
        (await typesFor(customer.token)).includes("payment_refunded"),
        "customer got payment_refunded"
      );
      assert(
        (await typesFor(provider.token)).includes("payment_refunded"),
        "provider got payment_refunded"
      );
    });

    await test("Creating a review notifies the provider", async () => {
      const booking = await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "completed",
      });
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        token: customer.token,
        body: { bookingId: String(booking._id), rating: 5, comment: "Excellent work." },
      });
      assert(res.status >= 200 && res.status < 300, `review created (got ${res.status})`);

      const providerTypes = await typesFor(provider.token);
      assert(providerTypes.includes("new_review"), "provider got new_review");
      const note = (await listFor(provider.token, "&type=new_review")).items[0];
      assert(String(note.message).includes("5-star"), "review message includes rating");
    });

    await test("Cancelling a booking notifies both parties", async () => {
      const booking = await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "pending",
      });
      const res = await api(baseUrl, `/api/bookings/${String(booking._id)}/cancel`, {
        method: "PATCH",
        token: customer.token,
      });
      assertEqual(res.status, 200, "cancel status");

      assert(
        (await typesFor(customer.token)).includes("booking_cancelled"),
        "customer got booking_cancelled"
      );
      assert(
        (await typesFor(provider.token)).includes("booking_cancelled"),
        "provider got booking_cancelled"
      );
    });

    await test("Rescheduling a booking notifies both parties", async () => {
      const workingDays = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        start: "08:00",
        end: "17:00",
        breaks: [],
      }));
      const availability = await api(baseUrl, `/api/availability/${provider.id}`, {
        method: "PUT",
        body: { slotDurationMinutes: 30, workingDays },
      });
      assertEqual(availability.status, 200, "availability set");

      const booking = await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "pending",
        date: "2026-10-15",
        startTime: "10:00",
      });
      const res = await api(baseUrl, `/api/bookings/${String(booking._id)}/reschedule`, {
        method: "PATCH",
        token: customer.token,
        body: { date: "2026-10-16", startTime: "11:00" },
      });
      assertEqual(res.status, 200, `reschedule status (got ${res.status})`);

      assert(
        (await typesFor(customer.token)).includes("booking_rescheduled"),
        "customer got booking_rescheduled"
      );
      assert(
        (await typesFor(provider.token)).includes("booking_rescheduled"),
        "provider got booking_rescheduled"
      );
    });

    await test("Completing a booking notifies both parties", async () => {
      const booking = await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "pending",
      });
      const confirm = await api(baseUrl, `/api/bookings/${String(booking._id)}/status`, {
        method: "PATCH",
        token: customer.token,
        body: { status: "confirmed" },
      });
      assertEqual(confirm.status, 200, "confirm status");
      const complete = await api(baseUrl, `/api/bookings/${String(booking._id)}/status`, {
        method: "PATCH",
        token: customer.token,
        body: { status: "completed" },
      });
      assertEqual(complete.status, 200, "complete status");

      assert(
        (await typesFor(customer.token)).includes("booking_completed"),
        "customer got booking_completed"
      );
      assert(
        (await typesFor(provider.token)).includes("booking_completed"),
        "provider got booking_completed"
      );
      const note = (await listFor(customer.token, "&type=booking_completed")).items[0];
      assert(String(note.message).includes("review"), "completed message prompts a review");
    });
  } finally {
    await ctx.close();
  }

  reportAndExit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
