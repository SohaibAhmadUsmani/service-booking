"use client";

import { useState } from "react";

export type Service = {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMin: number;
  description: string;
};

type Props = {
  initial?: Service;
  onSave: (data: Omit<Service, "id">) => void;
  onCancel: () => void;
};

const categories = ["Cleaning", "Repair", "Plumbing", "Electrical", "Beauty", "Other"];

export default function ServiceForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [durationMin, setDurationMin] = useState(initial ? String(initial.durationMin) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = "Name must be at least 3 characters";
    if (!category) e.category = "Choose a category";
    if (!price || Number(price) <= 0) e.price = "Price must be greater than 0";
    if (!durationMin || Number(durationMin) < 15) e.durationMin = "Minimum duration is 15 minutes";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      category,
      price: Number(price),
      durationMin: Number(durationMin),
      description: description.trim(),
    });
  }

  const input = "mt-1 w-full rounded-lg border px-3 py-2 text-sm";
  const err = "mt-1 text-xs text-red-600";

  return (
    <div className="space-y-4 rounded-xl border bg-white p-5">
      <h2 className="text-lg font-medium">{initial ? "Edit service" : "Add service"}</h2>

      <div>
        <label className="text-sm font-medium">Service name</label>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
        {errors.name && <p className={err}>{errors.name}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Category</label>
        <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && <p className={err}>{errors.category}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Price ($)</label>
          <input type="number" className={input} value={price} onChange={(e) => setPrice(e.target.value)} />
          {errors.price && <p className={err}>{errors.price}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Duration (minutes)</label>
          <input type="number" className={input} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
          {errors.durationMin && <p className={err}>{errors.durationMin}</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea className={input} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button onClick={handleSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Save
        </button>
        <button onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}