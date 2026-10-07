import styles from "./catalog.module.css";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Page numbers with a window around the current page: 1 … 4 5 [6] 7 8 … 20 */
function pageList(page: number, total: number): (number | "gap")[] {
  const pages = new Set<number>([1, total, page, page - 1, page + 1, page - 2, page + 2]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        className={styles.pageButton}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹ Prev
      </button>
      {pageList(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className={styles.pageButton} aria-hidden="true" style={{ border: 0 }}>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            className={`${styles.pageButton} ${item === page ? styles.pageButtonActive : ""}`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className={styles.pageButton}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next ›
      </button>
    </nav>
  );
}
