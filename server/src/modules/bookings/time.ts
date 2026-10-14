/** Pakistan time is UTC+5. Change this if the team uses another time zone. */
export const TZ_OFFSET_MINUTES = 5 * 60;

function nowLocal() {
  const d = new Date(Date.now() + TZ_OFFSET_MINUTES * 60000);
  return { date: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

/** True if the slot starting at `startTime` on `date` has already started or passed. */
export function isPastSlot(date: string, startTime: string) {
  const now = nowLocal();
  if (date < now.date) return true;
  if (date > now.date) return false;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(startTime ?? "");
  if (!m) return false; // bad times are rejected elsewhere
  return Number(m[1]) * 60 + Number(m[2]) <= now.minutes;
}