"use client";

import type { FilterOptions } from "@service-booking/shared";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_OPTIONS, formatPrice } from "./formatters";
import styles from "./catalog.module.css";

export interface UiFilters {
  q: string;
  category: string;
  location: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  serviceTypes: string[];
  date: string;
  available: boolean;
  sort: string;
  page: number;
}

export const EMPTY_FILTERS: UiFilters = {
  q: "",
  category: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  serviceTypes: [],
  date: "",
  available: false,
  sort: "relevance",
  page: 1,
};

/** Number of filters (not counting search text, sort and page) that are switched on. */
export function activeFilterCount(f: UiFilters): number {
  return [
    f.category,
    f.location,
    f.minPrice,
    f.maxPrice,
    f.minRating,
    f.date,
    f.serviceTypes.length > 0,
    f.available,
  ].filter(Boolean).length;
}

interface Props {
  filters: UiFilters;
  options: FilterOptions | null;
  validationMessage: string | null;
  className?: string;
  onChange: (patch: Partial<UiFilters>) => void;
  onReset: () => void;
}

const RATING_CHOICES = [
  { value: "", label: "Any rating" },
  { value: "3", label: "3.0 & up" },
  { value: "4", label: "4.0 & up" },
  { value: "4.5", label: "4.5 & up" },
];

export default function FilterPanel({
  filters,
  options,
  validationMessage,
  className,
  onChange,
  onReset,
}: Props) {
  const count = activeFilterCount(filters);
  const currency = options?.priceRange.currency ?? "PKR";

  function toggleType(type: string) {
    const next = filters.serviceTypes.includes(type)
      ? filters.serviceTypes.filter((t) => t !== type)
      : [...filters.serviceTypes, type];
    onChange({ serviceTypes: next });
  }

  return (
    <aside className={`${styles.panel} ${className ?? ""}`} aria-label="Filters">
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Filters{count > 0 ? ` (${count})` : ""}</h2>
        <button type="button" className={styles.linkButton} disabled={count === 0} onClick={onReset}>
          Clear all
        </button>
      </div>

      <div className={styles.group}>
        <label className={styles.label} htmlFor="f-category">
          Category
        </label>
        <select
          id="f-category"
          className={styles.field}
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {options?.categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.serviceCount})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label} htmlFor="f-location">
          Location
        </label>
        <input
          id="f-location"
          className={styles.field}
          type="text"
          list="f-cities"
          placeholder="City or area"
          value={filters.location}
          maxLength={100}
          onChange={(e) => onChange({ location: e.target.value })}
        />
        <datalist id="f-cities">
          {options?.cities.map((c) => (
            <option key={c.name} value={c.name} />
          ))}
        </datalist>
      </div>

      <fieldset className={styles.group}>
        <legend className={styles.label}>Price ({currency})</legend>
        <div className={styles.row2}>
          <input
            className={styles.field}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            aria-label="Minimum price"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <input
            className={styles.field}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            aria-label="Maximum price"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
        {options && options.priceRange.max > 0 && (
          <p className={styles.hint}>
            Prices range from {formatPrice(options.priceRange.min, currency)} to{" "}
            {formatPrice(options.priceRange.max, currency)}
          </p>
        )}
        {validationMessage && (
          <p className={styles.fieldError} role="alert">
            {validationMessage}
          </p>
        )}
      </fieldset>

      <div className={styles.group}>
        <label className={styles.label} htmlFor="f-rating">
          Rating
        </label>
        <select
          id="f-rating"
          className={styles.field}
          value={filters.minRating}
          onChange={(e) => onChange({ minRating: e.target.value })}
        >
          {RATING_CHOICES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className={styles.group}>
        <legend className={styles.label}>Service type</legend>
        {SERVICE_TYPE_OPTIONS.map((type) => (
          <label key={type} className={styles.check}>
            <input
              type="checkbox"
              checked={filters.serviceTypes.includes(type)}
              onChange={() => toggleType(type)}
            />
            {SERVICE_TYPE_LABELS[type]}
          </label>
        ))}
      </fieldset>

      <div className={styles.group}>
        <label className={styles.label} htmlFor="f-date">
          Available on
        </label>
        <input
          id="f-date"
          className={styles.field}
          type="date"
          value={filters.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={filters.available}
            onChange={(e) => onChange({ available: e.target.checked })}
          />
          Accepting bookings
        </label>
      </div>
    </aside>
  );
}
