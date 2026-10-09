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

async function main() {
  const ctx = await startTestServer();
  const { baseUrl } = ctx;

  try {
    const provider = await registerUser(baseUrl, "provider");
    const customer = await registerUser(baseUrl, "customer");
    const intruder = await registerUser(baseUrl, "customer");

    const b1 = await createBookingFixture({ customerId: customer.id, providerId: provider.id, status: "pending", price: 50 });
    const b2 = await createBookingFixture({ customerId: customer.id, providerId: provider.id, status: "pending", price: 30 });
    const b3 = await createBookingFixture({ customerId: customer.id, providerId: provider.id, status: "confirmed", price: 20 });
    const b4 = await createBookingFixture({ customerId: customer.id, providerId: provider.id, status: "confirmed", price: 10 });

    let payment1 = "";
    let payment2 = "";
    let payment3 = "";
    let payment4 = "";

    await test("1. Unauthenticated payment creation rejected", async () => {
      const res = await api(baseUrl, "/api/payments", {
        method: "POST",
        body: { bookingId: b1._id.toString() },
      });
      assertEqual(res.status, 401, "expected 401 without token");
    });

    await test("2. Invalid booking rejected", async () => {
      const missing = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: "0123456789abcdef01234567" },
      });
      assertEqual(missing.status, 404, "expected 404 for missing booking");

      const malformed = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: "not-an-id" },
      });
      assertEqual(malformed.status, 400, "expected 400 for malformed bookingId");
    });

    await test("3. Unauthorized payment creation rejected", async () => {
      const byStranger = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: intruder.token,
        body: { bookingId: b1._id.toString() },
      });
      assertEqual(byStranger.status, 403, "expected 403 for non-customer");

      const byProvider = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: provider.token,
        body: { bookingId: b1._id.toString() },
      });
      assertEqual(byProvider.status, 403, "expected 403 for provider paying own booking");
    });

    await test("5 + 14 + 15. Creation derives providerId/amount from booking; initial status pending; client amount rejected", async () => {
      const withAmount = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: b1._id.toString(), amount: 999, method: "card" },
      });
      assertEqual(withAmount.status, 400, "client-supplied amount must be rejected (strict schema)");

      const badMethod = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: b1._id.toString(), method: "bitcoin" },
      });
      assertEqual(badMethod.status, 400, "invalid payment method rejected");

      const res = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: b1._id.toString(), method: "card" },
      });
      assertEqual(res.status, 201, "expected 201 on payment creation");
      const payment = res.body.data;
      payment1 = payment.id;
      assertEqual(payment.status, "pending", "initial status must be pending");
      assertEqual(payment.providerId, provider.id, "providerId matches booking.providerId");
      assertEqual(payment.customerId, customer.id, "customerId matches booking.customerId");
      assertEqual(payment.amount, b1.price, "amount comes from booking price");
      assertEqual(payment.method, "card", "method stored");
      assert(payment.transactionReference, "mock transaction reference assigned");
      assert(payment.paidAt === null || payment.paidAt === undefined, "paidAt empty while pending");
    });

    await test("4. Duplicate payment prevented", async () => {
      const res = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: b1._id.toString() },
      });
      assertEqual(res.status, 409, "expected 409 for duplicate payment");
    });

    await test("Payment retrievable by booking and by id (owner)", async () => {
      const byBooking = await api(baseUrl, `/api/payments/booking/${b1._id}`, { token: customer.token });
      assertEqual(byBooking.status, 200, "expected 200 for owner by booking");
      assertEqual(byBooking.body.data.id, payment1, "same payment returned");

      const byId = await api(baseUrl, `/api/payments/${payment1}`, { token: customer.token });
      assertEqual(byId.status, 200, "expected 200 for owner by id");

      const byProvider = await api(baseUrl, `/api/payments/${payment1}`, { token: provider.token });
      assertEqual(byProvider.status, 200, "provider (payee) can view the payment");
    });

    await test("6. Pending → paid works (paidAt set, booking confirmed)", async () => {
      const res = await api(baseUrl, `/api/payments/${payment1}/process`, {
        method: "POST",
        token: customer.token,
        body: { outcome: "paid" },
      });
      assertEqual(res.status, 200, "expected 200 on process");
      assertEqual(res.body.data.status, "paid", "status paid");
      assert(res.body.data.paidAt, "paidAt set");

      const booking = await api(baseUrl, `/api/bookings/${b1._id}`);
      assertEqual(booking.body.status, "confirmed", "related booking moved pending → confirmed");
    });

    await test("8. Paid payment cannot be processed again", async () => {
      const res = await api(baseUrl, `/api/payments/${payment1}/process`, {
        method: "POST",
        token: customer.token,
        body: { outcome: "paid" },
      });
      assertEqual(res.status, 409, "expected 409 for already paid payment");
    });

    await test("7. Pending → failed works", async () => {
      const created = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: b2._id.toString(), method: "card" },
      });
      assertEqual(created.status, 201, "second payment created");
      payment2 = created.body.data.id;
      assertEqual(created.body.data.status, "pending", "starts pending");

      const res = await api(baseUrl, `/api/payments/${payment2}/process`, {
        method: "POST",
        token: customer.token,
        body: { outcome: "failed" },
      });
      assertEqual(res.status, 200, "expected 200 on process");
      assertEqual(res.body.data.status, "failed", "status failed");
      assert(res.body.data.failureReason, "failure reason recorded");
      assert(!res.body.data.paidAt, "paidAt not set on failure");
    });

    await test("9. Failed payment cannot be processed as paid", async () => {
      const res = await api(baseUrl, `/api/payments/${payment2}/process`, {
        method: "POST",
        token: customer.token,
        body: { outcome: "paid" },
      });
      assertEqual(res.status, 409, "expected 409 for failed payment");
    });

    await test("10. Refund before paid rejected (pending and failed)", async () => {
      const pending = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: b4._id.toString() },
      });
      assertEqual(pending.status, 201, "payment for refund-pending test created");
      payment4 = pending.body.data.id;

      const onPending = await api(baseUrl, `/api/payments/${payment4}/refund`, {
        method: "POST",
        token: customer.token,
      });
      assertEqual(onPending.status, 409, "refund of pending payment rejected");

      const onFailed = await api(baseUrl, `/api/payments/${payment2}/refund`, {
        method: "POST",
        token: customer.token,
      });
      assertEqual(onFailed.status, 409, "refund of failed payment rejected");
    });

    await test("11. Paid → refunded works", async () => {
      const created = await api(baseUrl, "/api/payments", {
        method: "POST",
        token: customer.token,
        body: { bookingId: b3._id.toString(), method: "wallet" },
      });
      assertEqual(created.status, 201, "third payment created");
      payment3 = created.body.data.id;

      const paid = await api(baseUrl, `/api/payments/${payment3}/process`, {
        method: "POST",
        token: customer.token,
        body: { outcome: "paid" },
      });
      assertEqual(paid.body.data.status, "paid", "payment paid");

      const res = await api(baseUrl, `/api/payments/${payment3}/refund`, {
        method: "POST",
        token: customer.token,
      });
      assertEqual(res.status, 200, "expected 200 on refund");
      assertEqual(res.body.data.status, "refunded", "status refunded");
      assert(res.body.data.refundedAt, "refundedAt set");
    });

    await test("12. Refund twice rejected", async () => {
      const res = await api(baseUrl, `/api/payments/${payment3}/refund`, {
        method: "POST",
        token: customer.token,
      });
      assertEqual(res.status, 409, "expected 409 for double refund");
    });

    await test("13. User cannot access another user's payment", async () => {
      const byId = await api(baseUrl, `/api/payments/${payment1}`, { token: intruder.token });
      assertEqual(byId.status, 404, "stranger GET by id → 404");

      const byBooking = await api(baseUrl, `/api/payments/booking/${b1._id}`, { token: intruder.token });
      assertEqual(byBooking.status, 404, "stranger GET by booking → 404");

      const process = await api(baseUrl, `/api/payments/${payment4}/process`, {
        method: "POST",
        token: intruder.token,
        body: { outcome: "paid" },
      });
      assertEqual(process.status, 404, "stranger cannot process → 404");

      const refund = await api(baseUrl, `/api/payments/${payment1}/refund`, {
        method: "POST",
        token: intruder.token,
      });
      assertEqual(refund.status, 404, "stranger cannot refund → 404");
    });

    await test("Scoped listing: /user/me returns only own payments", async () => {
      const mine = await api(baseUrl, "/api/payments/user/me", { token: customer.token });
      assertEqual(mine.status, 200, "expected 200");
      assertEqual(mine.body.data.total, 4, "customer sees own 4 payments");
      assert(
        mine.body.data.items.every((p: any) => p.customerId === customer.id || p.providerId === customer.id),
        "only own payments"
      );

      const theirs = await api(baseUrl, "/api/payments/user/me", { token: intruder.token });
      assertEqual(theirs.body.data.total, 0, "intruder sees no payments");

      const filtered = await api(baseUrl, "/api/payments?status=paid", { token: customer.token });
      assertEqual(filtered.body.data.total, 1, "scoped status filter works");
      assertEqual(filtered.body.data.items[0].id, payment1, "paid payment listed");
    });

    await test("Unauthenticated access rejected on all read endpoints", async () => {
      for (const path of ["/api/payments", "/api/payments/user/me", `/api/payments/${payment1}`]) {
        const res = await api(baseUrl, path);
        assertEqual(res.status, 401, `expected 401 for ${path}`);
      }
    });
  } finally {
    await ctx.close();
  }

  reportAndExit();
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
