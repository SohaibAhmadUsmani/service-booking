"use client";

import { useState } from "react";

export type Category = { id: string; name: string };

export type Service = {
  id: string;
  name: string;
  categoryId?: string;
  price: number;
  duration?: number;
  description?: string;
  isActive: boolean;
};

export type ServiceInput = {
  name: string;
  categoryId: string;
  price: number;
  duration: number;
  description: string;
};

type Props = {
  initial?: Service;
  categories: Category[];
  onSave: (data: ServiceInput) => void;
  onCancel: () => void;
};

export default function ServiceForm({ initial, categories, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [duration, setDuration] = useState(initial?.duration ? String(initial.duration) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = "Name must be at least 3 characters";
    if (!categoryId) e.categoryId = "Choose a category";
    if (!price || Number(price) <= 0) e.price = "Price must be greater than 0";
    const mins = Number(duration);
    if (!duration || !Number.isInteger(mins) || mins < 15 || mins > 480) {
      e.duration = "Enter whole minutes between 15 and 480";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      categoryId,
      price: Number(price),
      duration: Number(duration),
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
        <select className={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">No categories are available yet.</p>
        )}
        {errors.categoryId && <p className={err}>{errors.categoryId}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Price (PKR)</label>
          <input type="number" className={input} value={price} onChange={(e) => setPrice(e.target.value)} />
          {errors.price && <p className={err}>{errors.price}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Duration (minutes)</label>
          <input type="number" className={input} value={duration} onChange={(e) => setDuration(e.target.value)} />
          {errors.duration && <p className={err}>{errors.duration}</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea className={input} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Save
        </button>
        <button onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}