import Link from "next/link";
import type { ProviderSummary } from "@service-booking/shared";
import StarRating from "./StarRating";
import { formatPrice, initials } from "./formatters";
import styles from "./catalog.module.css";

export default function ProviderCard({ provider }: { provider: ProviderSummary }) {
  return (
    <article className={styles.card}>
      <div className={styles.providerRow}>
        {provider.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={provider.profileImageUrl} alt="" className={styles.avatar} />
        ) : (
          <div className={styles.avatar} aria-hidden="true">
            {initials(provider.businessName)}
          </div>
        )}
        <div>
          <h3 className={styles.cardTitle}>
            <Link href={`/providers/${provider.slug}`} className={styles.cardLink}>
              {provider.businessName}
            </Link>
          </h3>
          <div className={styles.meta}>
            {provider.isVerified && <span className={styles.verified}>✓ Verified</span>}
            {provider.city && <span>{provider.city}</span>}
            {provider.distanceKm !== undefined && <span>· {provider.distanceKm} km away</span>}
          </div>
        </div>
      </div>

      {provider.headline && <p className={styles.desc}>{provider.headline}</p>}
      <StarRating average={provider.rating.average} count={provider.rating.count} />

      <div className={styles.meta}>
        {provider.categories.map((name) => (
          <span key={name} className={styles.pill}>
            {name}
          </span>
        ))}
      </div>

      <div className={styles.cardFooter}>
        <div>
          <div className={styles.price}>
            <span className={styles.priceNote}>From </span>
            {formatPrice(provider.startingPrice, provider.currency)}
          </div>
          <div className={styles.priceNote}>
            {provider.serviceCount} {provider.serviceCount === 1 ? "service" : "services"}
          </div>
        </div>
        <Link href={`/providers/${provider.slug}`} className={styles.button}>
          View profile
        </Link>
      </div>
    </article>
  );
}
