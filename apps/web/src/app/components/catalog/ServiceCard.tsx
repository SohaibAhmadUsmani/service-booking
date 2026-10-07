import Link from "next/link";
import type { ServiceSearchResult } from "@service-booking/shared";
import StarRating from "./StarRating";
import { SERVICE_TYPE_LABELS, bookServiceHref, formatDuration, formatPrice } from "./formatters";
import styles from "./catalog.module.css";

export default function ServiceCard({ service }: { service: ServiceSearchResult }) {
  const { provider } = service;
  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.pill}>{service.category.name}</span>
        <span className={`${styles.pill} ${styles.pillNeutral}`}>
          {SERVICE_TYPE_LABELS[service.serviceType] ?? service.serviceType}
        </span>
      </div>

      <h3 className={styles.cardTitle}>{service.name}</h3>
      {service.description && <p className={styles.desc}>{service.description}</p>}

      <div className={styles.meta}>
        <Link href={`/providers/${provider.slug}`} className={styles.cardLink}>
          <strong>{provider.businessName}</strong>
        </Link>
        {provider.isVerified && <span className={styles.verified}>✓ Verified</span>}
        {provider.city && <span>· {provider.city}</span>}
        {service.distanceKm !== undefined && <span>· {service.distanceKm} km away</span>}
      </div>
      <StarRating average={provider.rating.average} count={provider.rating.count} />

      <div className={styles.cardFooter}>
        <div>
          <div className={styles.price}>{formatPrice(service.price, service.currency)}</div>
          <div className={styles.priceNote}>{formatDuration(service.durationMinutes)}</div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <Link
            href={`/providers/${provider.slug}`}
            className={`${styles.button} ${styles.buttonGhost}`}
          >
            Profile
          </Link>
          <Link href={bookServiceHref(service.id, provider.id)} className={styles.button}>
            Book
          </Link>
        </div>
      </div>
    </article>
  );
}
