"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ServiceForm, { Category, Service, ServiceInput } from "../../../components/provider/services/ServiceForm";
import { useAuthedApi } from "../../../lib/api/useAuthedApi";

function pickList<T>(json: unknown): T[] {
  const root = (json ?? {}) as { data?: unknown };
  const list = Array.isArray(json) ? json : Array.isArray(root.data) ? root.data : [];
  return list as T[];
}

function pickOne(json: unknown): Service | null {
  const root = (json ?? {}) as { data?: unknown };
  const item = (root.data ?? json) as Partial<Service> | null;
  return item && typeof item.id === "string" ? (item as Service) : null;
}

export default function ServicesPage() {
  const request = useAuthedApi();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const problems: string[] = [];

    try {
      setServices(pickList<Service>(await request<unknown>("/api/services/mine")));
    } catch (e) {
      problems.push(e instanceof Error ? e.message : "Could not load your services");
    }

    try {
      setCategories(pickList<Category>(await request<unknown>("/api/services/categories")));
    } catch (e) {
      problems.push(`Categories: ${e instanceof Error ? e.message : "could not load"}`);
    }

    setError(problems.join(" · "));
    setLoading(false);
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id?: string) => (id ? map.get(id) ?? "Unknown" : "—");
  }, [categories]);

  function closeForm() {
    setEditing(null);
    setAdding(false);
    setFormError("");
  }

  async function handleSave(data: ServiceInput) {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const json = await request<unknown>(`/api/services/${editing.id}`, { method: "PATCH", body: data });
        const updated = pickOne(json);
        setServices((list) => list.map((s) => (s.id === editing.id ? { ...s, ...(updated ?? data) } : s)));
      } else {
        const json = await request<unknown>("/api/services", { method: "POST", body: data });
        const created = pickOne(json);
        if (created) setServices((list) => [created, ...list]);
        else await load();
      }
      closeForm();
    } catch (e) {
      // keep the form open so nothing the provider typed is lost
      setFormError(e instanceof Error ? e.message : "Could not save the service");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(s: Service, active: boolean) {
    if (!active && !window.confirm(`Deactivate "${s.name}"? Customers will no longer be able to book it.`)) {
      return;
    }
    setBusyId(s.id);
    setError("");
    try {
      const json = active
        ? await request<unknown>(`/api/services/${s.id}`, { method: "PATCH", body: { isActive: true } })
        : await request<unknown>(`/api/services/${s.id}`, { method: "DELETE" });
      const updated = pickOne(json);
      setServices((list) =>
        list.map((x) => (x.id === s.id ? { ...x, ...(updated ?? {}), isActive: active } : x))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the service");
    } finally {
      setBusyId(null);
    }
  }

  const showForm = adding || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Services</h1>
        <div className="flex items-center gap-3">
          <button onClick={load} className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50">
            Refresh
          </button>
          {!showForm && (
            <button
              onClick={() => {
                setFormError("");
                setAdding(true);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add service
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <div className="space-y-3">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          {saving && <p className="text-sm text-gray-500">Saving...</p>}
          <ServiceForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            categories={categories}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price (PKR)</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  Loading your services...
                </td>
              </tr>
            )}
            {!loading &&
              services.map((s) => (
                <tr key={s.id} className={`border-t ${s.isActive ? "" : "bg-gray-50 text-gray-400"}`}>
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3">{categoryName(s.categoryId)}</td>
                  <td className="px-5 py-3">{Number(s.price).toLocaleString()}</td>
                  <td className="px-5 py-3">{s.duration ? `${s.duration} min` : "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        s.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="space-x-3 px-5 py-3">
                    <button
                      disabled={busyId === s.id}
                      onClick={() => {
                        setAdding(false);
                        setFormError("");
                        setEditing(s);
                      }}
                      className="text-indigo-600 hover:underline disabled:opacity-50"
                    >
                      Edit
                    </button>
                    {s.isActive ? (
                      <button
                        disabled={busyId === s.id}
                        onClick={() => setActive(s, false)}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        disabled={busyId === s.id}
                        onClick={() => setActive(s, true)}
                        className="text-indigo-600 hover:underline disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            {!loading && services.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No services yet. Click "Add service" to create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}