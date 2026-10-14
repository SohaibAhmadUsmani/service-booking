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
import { ProviderProfileModel } from "../src/modules/users/models/providerProfile.model";

async function main() {
  const ctx = await startTestServer();
  const { baseUrl } = ctx;

  try {
    const provider = await registerUser(baseUrl, "provider");
    const customer = await registerUser(baseUrl, "customer");
    const otherCustomer = await registerUser(baseUrl, "customer");

    const completedBooking = await createBookingFixture({
      customerId: customer.id,
      providerId: provider.id,
      status: "completed",
      price: 75,
    });
    const pendingBooking = await createBookingFixture({
      customerId: customer.id,
      providerId: provider.id,
      status: "pending",
      price: 40,
    });
    const completedBooking2 = await createBookingFixture({
      customerId: otherCustomer.id,
      providerId: provider.id,
      status: "completed",
      price: 60,
    });

    let review1Id = "";
    let review2Id = "";

    await test("1. Unauthenticated review creation rejected (401)", async () => {
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        body: { bookingId: completedBooking._id.toString(), rating: 5 },
      });
      assertEqual(res.status, 401, "expected 401 without token");
    });

    await test("2. Client-supplied provider/customer ids are ignored/rejected (strict schema → 400)", async () => {
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        token: customer.token,
        body: {
          bookingId: completedBooking._id.toString(),
          rating: 5,
          providerId: otherCustomer.id,
          customerId: otherCustomer.id,
        },
      });
      assertEqual(res.status, 400, "expected strict-schema 400 for unknown fields");
    });

    await test("3. Invalid rating values rejected (400)", async () => {
      for (const rating of [0, 6, 2.5]) {
        const res = await api(baseUrl, "/api/reviews", {
          method: "POST",
          token: customer.token,
          body: { bookingId: completedBooking._id.toString(), rating },
        });
        assertEqual(res.status, 400, `expected 400 for rating ${rating}`);
      }
    });

    await test("4. Review for nonexistent booking rejected (404)", async () => {
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        token: customer.token,
        body: { bookingId: "0123456789abcdef01234567", rating: 5 },
      });
      assertEqual(res.status, 404, "expected 404 for missing booking");
    });

    await test("5. Unauthorized customer cannot review someone else's booking (403)", async () => {
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        token: otherCustomer.token,
        body: { bookingId: completedBooking._id.toString(), rating: 5 },
      });
      assertEqual(res.status, 403, "expected 403 for non-customer review");
    });

    await test("6. Review on non-completed booking rejected (409)", async () => {
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        token: customer.token,
        body: { bookingId: pendingBooking._id.toString(), rating: 5 },
      });
      assertEqual(res.status, 409, "expected 409 for pending booking");
    });

    await test("7. Valid review created with server-derived ownership (201)", async () => {
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        token: customer.token,
        body: { bookingId: completedBooking._id.toString(), rating: 5, comment: "Excellent work" },
      });
      assertEqual(res.status, 201, "expected 201 on create");
      const review = res.body.data.review;
      review1Id = review.id;
      assertEqual(review.customerId, customer.id, "customerId must come from booking");
      assertEqual(review.providerId, provider.id, "providerId must match booking.providerId");
      assertEqual(review.serviceId, completedBooking.serviceId.toString(), "serviceId must come from booking");
      assertEqual(review.rating, 5, "rating stored");
      assertEqual(res.body.data.rating.averageRating, 5, "summary after first review");
      assertEqual(res.body.data.rating.reviewCount, 1, "count after first review");
    });

    await test("8. Duplicate review for same booking rejected (409)", async () => {
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        token: customer.token,
        body: { bookingId: completedBooking._id.toString(), rating: 4 },
      });
      assertEqual(res.status, 409, "expected 409 for duplicate review");
    });

    await test("9. ProviderProfile rating aggregate synced on create", async () => {
      const profile = await ProviderProfileModel.findOne({ userId: provider.id }).lean();
      assert(profile, "provider profile must exist");
      assertEqual(profile!.rating, 5, "profile rating");
      assertEqual(profile!.reviewCount, 1, "profile reviewCount");
    });

    await test("10. Second review recalculates average (4.5 over 2 reviews)", async () => {
      const res = await api(baseUrl, "/api/reviews", {
        method: "POST",
        token: otherCustomer.token,
        body: { bookingId: completedBooking2._id.toString(), rating: 4 },
      });
      assertEqual(res.status, 201, "expected 201 for second review");
      review2Id = res.body.data.review.id;
      assertEqual(res.body.data.rating.averageRating, 4.5, "average rating");
      assertEqual(res.body.data.rating.reviewCount, 2, "review count");

      const profile = await ProviderProfileModel.findOne({ userId: provider.id }).lean();
      assertEqual(profile!.rating, 4.5, "profile rating updated");
      assertEqual(profile!.reviewCount, 2, "profile count updated");
    });

    await test("11. Public listing by providerId returns only that provider's reviews, paginated", async () => {
      const res = await api(baseUrl, `/api/reviews?providerId=${provider.id}&page=1&limit=1`);
      assertEqual(res.status, 200, "expected 200");
      const { items, total, page, limit, totalPages } = res.body.data;
      assertEqual(total, 2, "total reviews for provider");
      assertEqual(page, 1, "page echo");
      assertEqual(limit, 1, "limit echo");
      assertEqual(totalPages, 2, "totalPages");
      assertEqual(items.length, 1, "page size respected");
      assert(items.every((r: any) => r.providerId === provider.id), "all items belong to provider");

      const all = await api(baseUrl, `/api/reviews?providerId=${provider.id}&page=1&limit=100`);
      const allItems = all.body.data.items;
      assertEqual(allItems.length, 2, "both reviews returned");
      assert(
        String(allItems[0].createdAt) >= String(allItems[1].createdAt),
        "sorted newest first"
      );
      const secondPage = await api(baseUrl, `/api/reviews?providerId=${provider.id}&page=2&limit=1`);
      assert(secondPage.body.data.items[0].id !== allItems[0].id, "page 2 holds the older review");
    });

    await test("12. GET single review works; malformed id rejected (400)", async () => {
      const ok = await api(baseUrl, `/api/reviews/${review1Id}`);
      assertEqual(ok.status, 200, "expected 200 for existing review");
      assertEqual(ok.body.data.rating, 5, "review fetched");

      const bad = await api(baseUrl, "/api/reviews/not-a-valid-id");
      assertEqual(bad.status, 400, "expected 400 for malformed id");
    });

    await test("13. Provider rating summary endpoint aggregates correctly", async () => {
      const res = await api(baseUrl, `/api/reviews/provider/${provider.id}`);
      assertEqual(res.status, 200, "expected 200");
      assertEqual(res.body.data.averageRating, 4.5, "average rating");
      assertEqual(res.body.data.reviewCount, 2, "review count");
      assertEqual(res.body.data.providerId, provider.id, "provider id echo");
    });

    await test("14. Another user cannot edit the review (404)", async () => {
      const res = await api(baseUrl, `/api/reviews/${review1Id}`, {
        method: "PATCH",
        token: otherCustomer.token,
        body: { rating: 1 },
      });
      assertEqual(res.status, 404, "expected 404 for non-owner edit");
    });

    await test("15. Owner edits review; aggregates recalculated (3.5 over 2)", async () => {
      const res = await api(baseUrl, `/api/reviews/${review1Id}`, {
        method: "PATCH",
        token: customer.token,
        body: { rating: 3, comment: "Updated comment" },
      });
      assertEqual(res.status, 200, "expected 200 on edit");
      assertEqual(res.body.data.review.rating, 3, "updated rating");
      assertEqual(res.body.data.rating.averageRating, 3.5, "recalculated average");
      assertEqual(res.body.data.rating.reviewCount, 2, "count unchanged after edit");

      const summary = await api(baseUrl, `/api/reviews/provider/${provider.id}`);
      assertEqual(summary.body.data.averageRating, 3.5, "summary endpoint reflects edit");
    });

    await test("16. Another user cannot delete the review (404)", async () => {
      const res = await api(baseUrl, `/api/reviews/${review2Id}`, {
        method: "DELETE",
        token: customer.token,
      });
      assertEqual(res.status, 404, "expected 404 for non-owner delete");
    });

    await test("17. Owner deletes review; aggregates recalculated (3 over 1)", async () => {
      const res = await api(baseUrl, `/api/reviews/${review2Id}`, {
        method: "DELETE",
        token: otherCustomer.token,
      });
      assertEqual(res.status, 200, "expected 200 on delete");
      assertEqual(res.body.data.rating.averageRating, 3, "average after delete");
      assertEqual(res.body.data.rating.reviewCount, 1, "count after delete");

      const profile = await ProviderProfileModel.findOne({ userId: provider.id }).lean();
      assertEqual(profile!.rating, 3, "profile rating after delete");
      assertEqual(profile!.reviewCount, 1, "profile count after delete");

      const gone = await api(baseUrl, `/api/reviews/${review2Id}`);
      assertEqual(gone.status, 404, "deleted review no longer accessible");
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
