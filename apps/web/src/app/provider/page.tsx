const stats = [
  { label: "Today's Bookings", value: "5" },
  { label: "Upcoming Bookings", value: "12" },
  { label: "Total Earnings", value: "$2,480" },
  { label: "Average Rating", value: "4.8" },
];

const recent = [
  { id: "BK-1001", customer: "Ali Khan", service: "Home Cleaning", date: "08 Oct, 10:00 AM", status: "Confirmed" },
  { id: "BK-1002", customer: "Sara Ahmed", service: "AC Repair", date: "08 Oct, 02:00 PM", status: "Pending" },
  { id: "BK-1003", customer: "Usman Raza", service: "Plumbing", date: "09 Oct, 11:30 AM", status: "Completed" },
];

export default function ProviderDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white">
        <h2 className="border-b px-5 py-3 font-medium">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="px-5 py-3">{b.id}</td>
                  <td className="px-5 py-3">{b.customer}</td>
                  <td className="px-5 py-3">{b.service}</td>
                  <td className="px-5 py-3">{b.date}</td>
                  <td className="px-5 py-3">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}