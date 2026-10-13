"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError, useAuthedApi } from "../../../lib/api/useAuthedApi";

type Break = { start: string; end: string };

type DayRow = {
  day: number; // 0 = Sunday ... 6 = Saturday (API format)
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  extraBreaks: Break[]; // any breaks beyond the first are kept as they are
};

type ApiSchedule = {
  slotDurationMinutes?: number;
  workingDays?: { day: number; start: string; end: string; breaks?: Break[] }[];
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // show Monday first
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BASE_SLOT_OPTIONS = [15, 30, 45, 60];

function emptyRows(): DayRow[] {
  return DAY_ORDER.map((day) => ({
    day,
    enabled: false,
    start: "09:00",
    end: "17:00",
    breakStart: "",
    breakEnd: "",
    extraBreaks: [],
  }));
}

function fromApi(schedule: ApiSchedule): DayRow[] {
  const rows = emptyRows();
  (schedule.workingDays ?? []).forEach((w) => {
    const row = rows.find((r) => r.day === w.day);
    if (!row) return;
    const [first, ...rest] = w.breaks ?? [];
    row.enabled = true;
    row.start = w.start;
    row.end = w.end;
    row.breakStart = first?.start ?? "";
    row.breakEnd = first?.end ?? "";
    row.extraBreaks = rest;
  });
  return rows;
}

export default function AvailabilityPage() {
  const request = useAuthedApi();
  const { user } = useAuth();
  const info = (user ?? {}) as Record<string, unknown>;
  const providerId = String(info.id ?? info._id ?? "");

  const [rows, setRows] = useState<DayRow[]>(emptyRows());
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);
  const [noScheduleYet, setNoScheduleYet] = useState(false);

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setServerError("");
    try {
      const json = (await request<unknown>(`/api/availability/${providerId}`)) as Record<string, unknown>;
      const data = ((json.data as ApiSchedule | undefined) ?? (json as ApiSchedule)) as ApiSchedule;
      setRows(fromApi(data));
      setSlotMinutes(data.slotDurationMinutes ?? 30);
      setNoScheduleYet(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        // No schedule saved yet: show an empty editor
        setRows(emptyRows());
        setNoScheduleYet(true);
      } else {
        setServerError(e instanceof Error ? e.message : "Could not load availability");
      }
    } finally {
      setLoading(false);
    }
  }, [providerId, request]);

  useEffect(() => {
    load();
  }, [load]);

  function update(day: number, patch: Partial<DayRow>) {
    setSaved(false);
    setRows((list) => list.map((r) => (r.day === day ? { ...r, ...patch } : r)));
  }

  function validate() {
    const e: Record<number, string> = {};
    rows.forEach((r) => {
      if (!r.enabled) return;
      if (!r.start || !r.end || r.start >= r.end) {
        e[r.day] = "End time must be after start time";
        return;
      }
      const hasStart = !!r.breakStart;
      const hasEnd = !!r.breakEnd;
      if (hasStart !== hasEnd) {
        e[r.day] = "Set both break times, or leave both empty";
      } else if (hasStart && hasEnd) {
        if (r.breakStart >= r.breakEnd) e[r.day] = "Break end must be after break start";
        else if (r.breakStart < r.start || r.breakEnd > r.end) e[r.day] = "Break must be within working hours";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    setSaved(false);
    setServerError("");
    if (!validate()) return;

    const workingDays = rows
      .filter((r) => r.enabled)
      .map((r) => {
        const breaks: Break[] = [];
        if (r.breakStart && r.breakEnd) breaks.push({ start: r.breakStart, end: r.breakEnd });
        breaks.push(...r.extraBreaks);
        return { day: r.day, start: r.start, end: r.end, breaks };
      });

    setSaving(true);
    try {
      await request(`/api/availability/${providerId}`, {
        method: "PUT",
        body: { slotDurationMinutes: slotMinutes, workingDays },
      });
      setSaved(true);
      setNoScheduleYet(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Could not save availability");
    } finally {
      setSaving(false);
    }
  }

  const slotOptions = BASE_SLOT_OPTIONS.includes(slotMinutes)
    ? BASE_SLOT_OPTIONS
    : [...BASE_SLOT_OPTIONS, slotMinutes].sort((a, b) => a - b);

  const time = "rounded-lg border px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400";

  if (!providerId) {
    return <div className="text-sm text-gray-500">Loading your account...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Availability</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="font-medium">Slot length</label>
          <select
            className="rounded-lg border px-2 py-1"
            value={slotMinutes}
            disabled={loading}
            onChange={(e) => {
              setSaved(false);
              setSlotMinutes(Number(e.target.value));
            }}
          >
            {slotOptions.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>
      </div>

      {noScheduleYet && !loading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          You haven't set a schedule yet. Tick your working days, set the hours, and save.
        </div>
      )}

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          Loading your schedule...
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-white">
          {rows.map((r) => (
            <div key={r.day} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <label className="flex w-40 items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => update(r.day, { enabled: e.target.checked })}
                />
                {DAY_NAMES[r.day]}
              </label>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Hours</span>
                <input type="time" className={time} value={r.start} disabled={!r.enabled}
                  onChange={(e) => update(r.day, { start: e.target.value })} />
                <span>to</span>
                <input type="time" className={time} value={r.end} disabled={!r.enabled}
                  onChange={(e) => update(r.day, { end: e.target.value })} />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Break</span>
                <input type="time" className={time} value={r.breakStart} disabled={!r.enabled}
                  onChange={(e) => update(r.day, { breakStart: e.target.value })} />
                <span>to</span>
                <input type="time" className={time} value={r.breakEnd} disabled={!r.enabled}
                  onChange={(e) => update(r.day, { breakEnd: e.target.value })} />
              </div>

              {r.extraBreaks.length > 0 && (
                <span className="text-xs text-gray-500">
                  +{r.extraBreaks.length} more break(s) kept
                </span>
              )}

              {errors[r.day] && <p className="w-full text-xs text-red-600">{errors[r.day]}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save availability"}
        </button>
        {saved && <span className="text-sm text-green-600">Availability saved</span>}
      </div>
    </div>
  );
}