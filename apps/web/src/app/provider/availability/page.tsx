"use client";

import { useState } from "react";

type DaySchedule = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

const initialSchedule: DaySchedule[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
].map((day) => ({
  day,
  enabled: day !== "Sunday",
  start: "09:00",
  end: "17:00",
  breakStart: "13:00",
  breakEnd: "14:00",
}));

const slotOptions = [15, 30, 45, 60];

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule);
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function update(index: number, patch: Partial<DaySchedule>) {
    setSaved(false);
    setSchedule((list) => list.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function validate() {
    const e: Record<string, string> = {};
    schedule.forEach((d) => {
      if (!d.enabled) return;
      if (d.start >= d.end) {
        e[d.day] = "End time must be after start time";
      } else if (d.breakStart && d.breakEnd) {
        if (d.breakStart >= d.breakEnd) {
          e[d.day] = "Break end must be after break start";
        } else if (d.breakStart < d.start || d.breakEnd > d.end) {
          e[d.day] = "Break must be within working hours";
        }
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) {
      setSaved(false);
      return;
    }
    // TODO: send to Shanza's availability API once it is ready
    console.log("Availability payload", { slotMinutes, schedule });
    setSaved(true);
  }

  const time = "rounded-lg border px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Availability</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="font-medium">Slot length</label>
          <select
            className="rounded-lg border px-2 py-1"
            value={slotMinutes}
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

      <div className="divide-y rounded-xl border bg-white">
        {schedule.map((d, i) => (
          <div key={d.day} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <label className="flex w-40 items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={d.enabled}
                onChange={(e) => update(i, { enabled: e.target.checked })}
              />
              {d.day}
            </label>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Hours</span>
              <input type="time" className={time} value={d.start} disabled={!d.enabled}
                onChange={(e) => update(i, { start: e.target.value })} />
              <span>to</span>
              <input type="time" className={time} value={d.end} disabled={!d.enabled}
                onChange={(e) => update(i, { end: e.target.value })} />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Break</span>
              <input type="time" className={time} value={d.breakStart} disabled={!d.enabled}
                onChange={(e) => update(i, { breakStart: e.target.value })} />
              <span>to</span>
              <input type="time" className={time} value={d.breakEnd} disabled={!d.enabled}
                onChange={(e) => update(i, { breakEnd: e.target.value })} />
            </div>

            {errors[d.day] && (
              <p className="w-full text-xs text-red-600">{errors[d.day]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Save availability
        </button>
        {saved && <span className="text-sm text-green-600">Availability saved</span>}
      </div>
    </div>
  );
}