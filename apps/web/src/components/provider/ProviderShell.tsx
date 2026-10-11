"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/provider", label: "Dashboard" },
  { href: "/provider/services", label: "Services" },
  { href: "/provider/availability", label: "Availability" },
  { href: "/provider/calendar", label: "Calendar" },
  { href: "/provider/bookings", label: "Bookings" },
  { href: "/provider/customers", label: "Customers" },
  { href: "/provider/earnings", label: "Earnings" },
  { href: "/provider/reviews", label: "Reviews" },
  { href: "/provider/settings", label: "Profile Settings" },
];

export default function ProviderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-white transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b px-6 text-lg font-semibold">
          Provider Panel
        </div>
        <nav className="space-y-1 p-3">
          {links.map((l) => {
            const active =
              l.href === "/provider" ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4">
          <button
            className="rounded-lg border px-3 py-1 text-sm md:hidden"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <span className="hidden text-sm text-gray-500 md:block">Welcome back</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Maira Asim</span>
            <div className="h-8 w-8 rounded-full bg-indigo-500" />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}