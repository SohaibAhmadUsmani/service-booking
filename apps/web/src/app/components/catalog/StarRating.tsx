import styles from "./catalog.module.css";

interface Props {
  average: number;
  count: number;
  /** Hide the "(12)" count text. */
  compact?: boolean;
}

/** Five stars filled to the given average, plus "4.7 (12)" text. */
export default function StarRating({ average, count, compact }: Props) {
  if (count === 0) {
    return <span className={styles.starText}>No reviews yet</span>;
  }
  const percent = Math.max(0, Math.min(100, (average / 5) * 100));
  return (
    <span className={styles.stars} aria-label={`Rated ${average.toFixed(1)} out of 5 from ${count} reviews`}>
      <span className={styles.starGlyphs} aria-hidden="true">
        ★★★★★
        <span className={styles.starFill} style={{ width: `${percent}%` }}>
          ★★★★★
        </span>
      </span>
      <strong>{average.toFixed(1)}</strong>
      {!compact && <span className={styles.starText}>({count})</span>}
    </span>
  );
}
