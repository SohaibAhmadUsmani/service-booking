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
import {
  isReminderEligible,
  scanUpcomingAppointments,
} from "../src/modules/notifications/reminderService";

const LEAD_MS = 60 * 60 * 1000;
const NOW = new Date("2026-10-15T09:30:00Z");

async function main() {
  const ctx = await startTestServer();
  const { baseUrl } = ctx;

  try {
    const customer = await registerUser(baseUrl, "customer");
    const provider = await registerUser(baseUrl, "provider");
    const other = await registerUser(baseUrl, "customer");

    async function reminders() {
      return Notification.find({ type: "upcoming_appointment" }).lean();
    }

    async function reminderUserIds(): Promise<string[]> {
      return (await reminders()).map((n) => String(n.userId));
    }

    async function listFor(token: string) {
      const res = await api(baseUrl, "/api/notifications?limit=100", { token });
      assertEqual(res.status, 200, "list should return 200");
      return res.body.data.items as any[];
    }

    await test("Eligibility ignores cancelled, past and far-future bookings", () => {
      assert(
        isReminderEligible({ status: "pending", date: "2026-10-15", startTime: "10:00" }, NOW.getTime(), LEAD_MS),
        "pending within window is eligible"
      );
      assert(
        isReminderEligible({ status: "confirmed", date: "2026-10-15", startTime: "10:00" }, NOW.getTime(), LEAD_MS),
        "confirmed within window is eligible"
      );
      assert(
        !isReminderEligible({ status: "cancelled", date: "2026-10-15", startTime: "10:00" }, NOW.getTime(), LEAD_MS),
        "cancelled is not eligible"
      );
      assert(
        !isReminderEligible({ status: "completed", date: "2026-10-15", startTime: "10:00" }, NOW.getTime(), LEAD_MS),
        "completed is not eligible"
      );
      assert(
        !isReminderEligible({ status: "pending", date: "2026-10-15", startTime: "09:00" }, NOW.getTime(), LEAD_MS),
        "past appointment is not eligible"
      );
      assert(
        !isReminderEligible({ status: "pending", date: "2026-10-15", startTime: "12:00" }, NOW.getTime(), LEAD_MS),
        "outside the lead window is not eligible"
      );
      assert(
        !isReminderEligible({ status: "pending", date: "not-a-date", startTime: "10:00" }, NOW.getTime(), LEAD_MS),
        "malformed date is not eligible"
      );
    });

    await test("Upcoming booking notifies the customer and the provider", async () => {
      const booking = await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "confirmed",
        date: "2026-10-15",
        startTime: "10:00",
      });

      const result = await scanUpcomingAppointments({ now: NOW, leadMs: LEAD_MS });
      assertEqual(result.sent, 2, "one reminder for each recipient");

      const created = await reminders();
      assertEqual(created.length, 2, "two reminder notifications persisted");
      const userIds = created.map((n) => String(n.userId));
      assert(userIds.includes(customer.id), "customer received the reminder");
      assert(userIds.includes(provider.id), "provider received the reminder");
      assert(!userIds.includes(other.id), "unrelated user did not receive a reminder");
      assert(
        created.every((n) => (n.data as any).bookingDbId === String(booking._id)),
        "reminder data references the booking"
      );
      assert(
        (await listFor(customer.token)).some((n) => n.type === "upcoming_appointment"),
        "customer sees the reminder in their list"
      );
      assert(
        (await listFor(provider.token)).some((n) => n.type === "upcoming_appointment"),
        "provider sees the reminder in their list"
      );
    });

    await test("Re-running the scan does not duplicate reminders", async () => {
      const before = (await reminders()).length;
      const first = await scanUpcomingAppointments({ now: NOW, leadMs: LEAD_MS });
      const second = await scanUpcomingAppointments({ now: NOW, leadMs: LEAD_MS });
      assertEqual(first.sent + second.sent, 0, "no further reminders sent");
      assertEqual((await reminders()).length, before, "reminder count unchanged");
    });

    await test("Cancelled and out-of-window bookings are not notified", async () => {
      await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "cancelled",
        date: "2026-10-15",
        startTime: "10:15",
      });
      await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "pending",
        date: "2026-10-15",
        startTime: "12:00",
      });
      await createBookingFixture({
        customerId: customer.id,
        providerId: provider.id,
        status: "pending",
        date: "2026-11-01",
        startTime: "10:00",
      });

      const before = await reminderUserIds();
      const result = await scanUpcomingAppointments({ now: NOW, leadMs: LEAD_MS });
      assertEqual(result.sent, 0, "ineligible bookings produce no reminders");
      assertEqual(
        (await reminderUserIds()).length,
        before.length,
        "reminder set unchanged"
      );
    });

    await test("Reminders are private to their recipient through the API", async () => {
      const customerItems = await listFor(customer.token);
      assert(
        customerItems.every((n) => n.userId === customer.id),
        "customer list contains only their own notifications"
      );
      const providerItems = await listFor(provider.token);
      assert(
        providerItems.every((n) => n.userId === provider.id),
        "provider list contains only their own notifications"
      );
      const otherItems = await listFor(other.token);
      assert(
        !otherItems.some((n) => (n as any).type === "upcoming_appointment"),
        "unrelated user has no appointment reminders"
      );
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
