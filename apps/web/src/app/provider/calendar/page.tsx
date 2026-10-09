"use client";

import { useMemo, useState } from "react";

type Status = "Pending" | "Confirmed" | "Completed" | "Cancelled" | "No-show";

type Booking = {
  id: string;
  customer: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: Status;
};

// TODO: replace with Shanza's bookings API (filtered by provider and month)
const bookings: Booking[] = [
  { id: "BK-1001", customer: "Ali Khan", service: "Home Cleaning", date: "2026-10-08", time: "10:00", status: "Confirmed" },
  { id: "BK-1002", customer: "Sara Ahmed", service: "AC Repair", date: "2026-10-08", time: "14:00", status: "Pending" },
  { id: "BK-1003", customer: "Usman Raza", service: "Pipe Leak Fix", date: "2026-10-09", time: "11:30", status: "Completed" },
  { id: "BK-1004", customer: "Hina Malik", service: "Home Cleaning", date: "2026-10-10", time: "09:00", status: "Pending" },
  { id: "BK-1005", customer: "Bilal Shah", service: "AC Repair", date: "2026-10-06", time: "16:00", status: "No-show" },
  { id: "BK-1006", customer: "Ayesha Noor", service: "Pipe Leak Fix", date: "2026-10-05", time: "12:00", status: "Cancelled" },
  { id: "BK-1007", customer: "Ali Khan", service: "AC Repair", date: "2026-10-14", time: "10:30", status: "Confirmed" },
  { id: "BK-1008", customer: "Sara Ahmed", service: "Home Cleaning", date: "2026-10-14", time: "15:00", status: "Confirmed" },
  { id: "BK-1009", customer: "Usman Raza", service: "Home Cleaning", date: "2026-10-21", time: "09:30", status: "Pending" },
];

const MOCK_TODAY = "2026-10-09"; // replace with the real current date once real data is connected

const chip: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-200 text-gray-600 line-through",
  "No-show": "bg-red-100 text-red-700",
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function key(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState({ year: 2026, month: 9 }); // October 2026 (mock data month)
  const [selected, setSelected] = useState<string | null>(MOCK_TODAY);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      (map[b.date] ??= []).push(b);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, []);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const offset = (first.getDay() + 6)