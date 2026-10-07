"use client";

import { useEffect, useRef, useState } from "react";
import type {
  FilterOptions,
  Paginated,
  ProviderSummary,
  SearchFilters,
  SearchSort,
  ServiceSearchResult,
} from "@service-booking/shared";
import { fetchFilterOptions, searchProviders, searchServices } from "@/lib/api/catalog";
import FilterPanel, { EMPTY_FILTERS, activeFilterCount, type UiFilters } from "./FilterPanel";
import Pagination from "./Pagination";
import ProviderCard from "./ProviderCard";
import ServiceCard from "./ServiceCard";
import styles from "./catalog.module.css";

type Mode = "services" | "providers";

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 350;

const SORT_CHOICES: { value: string; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "rating", label: "Highest rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
];

// ---- URL <-> filters ----------------------------------------------------
// The address bar mirrors the filters (so a search can be shared or reloaded)
// but is updated with history.replaceState, so changing a filter never
// navigates away from the page.

function parseUrl(search: string, fallbackMode: Mode): { filters: UiFilters; mode: Mode } {
  const p = new URLSearchParams(search);
  const page = Number(p.get("page"));
  const view = p.get("view");
  return {
    mode: view === "providers" || view === "services" ? view : fallbackMode,
    filters: {
      q: p.get("q") ?? "",
      category: p.get("category") ?? "",
      location: p.get("location") ?? "",
      minPrice: p.get("minPrice") ?? "",
      maxPrice: p.get("maxPrice") ?? "",
      minRating: p.get("minRating") ?? "",
      serviceTypes: (p.get("serviceType") ?? "").split(",").filter(Boolean),
      date: p.get("date") ?? "",
      available: p.get("available") === "true",
      sort: p.get("sort") ?? "relevance",
      page: Number.isInteger(page) && page > 0 ? page : 1,
    },
  };
}

function toUrl(f: UiFilters, mode: Mode, fallbackMode: Mode): string {
  const p = new URLSearchParams();
  if (mode !== fallbackMode) p.set("view", mode);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.category) p.set("category", f.category);
  if (f.location.trim()) p.set("location", f.location.trim());
  if (f.minPrice) p.set("minPrice", f.minPrice);
  if (f.maxPrice) p.set("maxPrice", f.maxPrice);
  if (f.minRating) p.set("minRating", f.minRating);
  if (f.serviceTypes.length) p.set("serviceType", f.serviceTypes.join(","));
  if (f.date) p.set("date", f.date);
  if (f.available) p.set("available", "true");
  if (f.sort !== "relevance") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  const text = p.toString();
  return text ? `?${text}` : window.location.pathname;
}

function toApi(f: UiFilters): SearchFilters {
  const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
  return {
    q: f.q.trim() || undefined,
    category: f.category || undefined,
    location: f.location.trim() || undefined,
    minPrice: num(f.minPrice),
    maxPrice: num(f.maxPrice),
    minRating: num(f.minRating),
    serviceType: f.serviceTypes.join(",") || undefined,
    date: f.date || undefined,
    available: f.available || undefined,
    sort: f.sort as SearchSort,
    page: f.page,
    limit: PAGE_SIZE,
  };
}

function validate(f: UiFilters): string | null {
  const min = f.minPrice === "" ? null : Number(f.minPrice);
  const max = f.maxPrice === "" ? null : Number(f.maxPrice);
  if ((min !== null && (Number.isNaN(min) || min < 0)) || (max !== null && (Number.isNaN(max) || max < 0))) {
    return "Prices must be positive numbers.";
  }
  if (min !== null && max !== null && min > max) {
    return "Minimum price can't be higher than the maximum.";
  }
  return null;
}

function sameExceptPage(a: UiFilters, b: UiFilters): boolean {
  return JSON.stringify({ ...a, page: 0 }) === JSON.stringify({ ...b, page: 0 });
}

// ---- component ----------------------------------------------------------

export default function CatalogBrowser({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  /** What the inputs show right now. */
  const [filters, setFilters] = useState<UiFilters>(EMPTY_FILTERS);
  /** What the results were requested with (lags `filters` while the user is typing). */
  const [applied, setApplied] = useState<UiFilters | null>(null);

  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [services, setServices] = useState<Paginated<ServiceSearchResult> | null>(null);
  const [providers, setProviders] = useState<Paginated<ProviderSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const requestId = useRef(0);
  const resultsTop = useRef<HTMLDivElement>(null);
  const skipScroll = useRef(true);

  // Read the starting filters from the address bar (client only).
  useEffect(() => {
    const parsed = parseUrl(window.location.search, initialMode);
    setMode(parsed.mode);
    setFilters(parsed.filters);
    setApplied(parsed.filters);
  }, [initialMode]);

  // Category / city options for the filter panel.
  useEffect(() => {
    fetchFilterOptions()
      .then(setOptions)
      .catch(() => setOptions(null)); // the panel still works without suggestions
  }, []);

  // Debounce typing; page changes apply immediately.
  useEffect(() => {
    if (applied === null || filters === applied) return;
    const delay = sameExceptPage(filters, applied) ? 0 : DEBOUNCE_MS;
    const timer = setTimeout(() => setApplied(filters), delay);
    return () => clearTimeout(timer);
  }, [filters, applied]);

  // Load results whenever the applied filters or the view change.
  useEffect(() => {
    if (applied === null) return;
    if (validate(applied)) {
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);

    const request =
      mode === "services"
        ? searchServices(toApi(applied)).then(setServices)
        : searchProviders(toApi(applied)).then(setProviders);

    request
      .catch(() => {
        if (id === requestId.current) setFailed(true);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [applied, mode, reloadKey]);

  // Keep the address bar in sync without navigating.
  useEffect(() => {
    if (applied === null) return;
    window.history.replaceState(null, "", toUrl(applied, mode, initialMode));
  }, [applied, mode, initialMode]);

  // Bring the top of the results into view after paging.
  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    resultsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [applied?.page]);

  function update(patch: Partial<UiFilters>) {
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  }

  function reset() {
    setFilters((current) => ({ ...EMPTY_FILTERS, q: current.q, sort: current.sort }));
  }

  const validationMessage = validate(filters);
  const current = mode === "services" ? services : providers;
  const noun = mode === "services" ? "service" : "provider";
  const total = current?.meta.total ?? 0;
  const hasResults = (current?.data.length ?? 0) > 0;
  const filterCount = activeFilterCount(filters);

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={
            mode === "services"
              ? "Search services, e.g. plumbing, haircut, tutor"
              : "Search providers by name or specialty"
          }
          aria-label="Search"
          value={filters.q}
          maxLength={100}
          onChange={(e) => update({ q: e.target.value })}
        />
        <div className={styles.segmented} role="group" aria-label="Show">
          {(["services", "providers"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`${styles.segment} ${mode === m ? styles.segmentActive : ""}`}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {m === "services" ? "Services" : "Providers"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.filterToggle}
          aria-expanded={showFilters}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters{filterCount > 0 ? ` (${filterCount})` : ""}
        </button>
      </div>

      {options && (
        <div className={styles.chips} aria-label="Quick categories">
          {options.categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`${styles.chip} ${filters.category === c.slug ? styles.chipActive : ""}`}
              aria-pressed={filters.category === c.slug}
              onClick={() => update({ category: filters.category === c.slug ? "" : c.slug })}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.layout}>
        <FilterPanel
          filters={filters}
          options={options}
          validationMessage={validationMessage}
          className={showFilters ? "" : styles.panelHidden}
          onChange={update}
          onReset={reset}
        />

        <section aria-label="Results">
          <div ref={resultsTop} />
          <div className={styles.resultsHeader}>
            <p className={styles.resultCount} aria-live="polite">
              {loading && !current
                ? "Searching…"
                : validationMessage
                  ? "Fix the filters to see results."
                  : `${total} ${noun}${total === 1 ? "" : "s"} found`}
            </p>
            <label className={styles.sortWrap}>
              Sort by
              <select
                className={styles.field}
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
              >
                {SORT_CHOICES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {failed ? (
            <div className={styles.state} role="alert">
              <h3 className={styles.stateTitle}>We couldn&apos;t load results</h3>
              <p>Check that the API server is running, then try again.</p>
              <button type="button" className={styles.button} onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            </div>
          ) : !current ? (
            <div className={styles.grid} aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : !hasResults && !loading ? (
            <div className={styles.state}>
              <h3 className={styles.stateTitle}>No {noun}s match your search</h3>
              <p>Try removing a filter or searching for something broader.</p>
              {(filterCount > 0 || filters.q) && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setFilters({ ...EMPTY_FILTERS })}
                >
                  Clear search and filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={`${styles.grid} ${loading ? styles.dimmed : ""}`} aria-busy={loading}>
                {mode === "services"
                  ? services?.data.map((s) => <ServiceCard key={s.id} service={s} />)
                  : providers?.data.map((p) => <ProviderCard key={p.id} provider={p} />)}
              </div>
              <Pagination
                page={current.meta.page}
                totalPages={current.meta.totalPages}
                onChange={(page) => setFilters((f) => ({ ...f, page }))}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
