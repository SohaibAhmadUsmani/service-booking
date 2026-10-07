export function formatPrice(amount: number, currency = "PKR"): string {
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  home_visit: "Home visit",
  in_store: "At provider",
  online: "Online",
};

export const SERVICE_TYPE_OPTIONS = ["home_visit", "in_store", "online"] as const;

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "13:00" -> "1:00 PM" */
export function formatClock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Where "Book" buttons send the customer. The booking flow (service -> provider ->
 * date -> time -> details -> confirm) is owned by the booking module; change this
 * one function if its route or query parameters differ.
 */
export function bookServiceHref(serviceId: string, providerId: string): string {
  return `/bookings?serviceId=${encodeURIComponent(serviceId)}&providerId=${encodeURIComponent(providerId)}`;
}
