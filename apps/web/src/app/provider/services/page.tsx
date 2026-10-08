"use client";

import { useState } from "react";
import ServiceForm, { Service } from "../../../components/provider/services/ServiceForm";

const initialServices: Service[] = [
  { id: "s1", name: "Home Cleaning", category: "Cleaning", price: 60, durationMin: 120, description: "Full home cleaning" },
  { id: "s2", name: "AC Repair", category: "Repair", price: 45, durationMin: 60, description: "AC diagnosis and repair" },
  { id: "s3", name: "Pipe Leak Fix", category: "Plumbing", price: 35, durationMin: 45, description: "Leak repair" },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editing, setEditing] = useState<Service | null>(null);
  const [adding, setAdding] = useState(false);

  function handleSave(data: Omit<Service, "id">) {
    if (editing) {
      setServices((list) => list.map((s) => (s.id === editing.id ? { ...s, ...data } : s)));
    } else {
      setServices((list) => [...list, { id: crypto.randomUUID(), ...data }]);
    }
    setEditing(null);
    setAdding(false);
  }

  function handleDelete(s: Service) {
    if (window.confirm(`Delete "${s.name}"? This cannot be undone.`)) {
      setServices((list) => list.filter((x) => x.id !== s.id));
    }
  }

  const showForm = adding || editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Services</h1>
        {!showForm && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add service
          </button>
        )}
      </div>

      {showForm && (
        <ServiceForm
          key={editing?.id ?? "new"}
          initial={editing ?? undefined}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-5 py-3 font-medium">{s.name}</td>
                <td className="px-5 py-3">{s.category}</td>
                <td className="px-5 py-3">${s.price}</td>
                <td className="px-5 py-3">{s.durationMin} min</td>
                <td className="space-x-3 px-5 py-3">
                  <button onClick={() => { setAdding(false); setEditing(s); }} className="text-indigo-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(s)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  No services yet. Click "Add service" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}