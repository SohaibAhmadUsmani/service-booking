/** Owner: Khadija — public provider profile (services and prices; booking checkout is Shanza's module). */
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogNav from "../../../components/catalog/CatalogNav";
import StarRating from "../../../components/catalog/StarRating";
import {
  DAY_NAMES,
  SERVICE_TYPE_LABELS,
  bookServiceHref,
  formatClock,
  formatDuration,
  formatMonthYear,
  formatPrice,
  initials,
} from "../../../components/catalog/formatters";
import styles from "@/components/catalog/catalog.module.css";
import { fetchProvider } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

async function load(id: string) {
  try {
    return { profile: await fetchProvider(id), error: null as null | "not_found" | "unavailable" };
  } catch (err) {
    const notFound = err instanceof Error && err.message.includes("404");
    return { profile: null, error: notFound ? ("not_found" as const) : ("unavailable" as const) };
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const { profile } = await load(id);
  return { title: profile ? `${profile.businessName} | Service Booking` : "Provider | Service Booking" };
}

export default async function ProviderProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const { profile, error } = await load(id);

  if (error === "not_found") notFound();

  if (!profile) {
    return (
      <div className={styles.root}>
        <CatalogNav active="providers" />
        <main className={styles.container}>
          <div className={styles.state} role="alert">
            <h1 className={styles.stateTitle}>
              We couldn&apos;t load this provider
            </h1>
            <p>Check that the API server is running and try again.</p>
            <Link href="/providers" className={styles.button}>
              Back to providers
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hoursByDay = new Map<number, string[]>();
  for (const h of profile.workingHours) {
    const list = hoursByDay.get(h.dayOfWeek) ?? [];
    list.push(`${formatClock(h.start)} – ${formatClock(h.end)}`);
    hoursByDay.set(h.dayOfWeek, list);
  }
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const maxBucket = Math.max(1, ...profile.rating.distribution);

  return (
    <div className={styles.root}>
      <CatalogNav active="providers" />
      <main className={styles.container}>
        <section className={styles.hero}>
          <div
            className={styles.cover}
            style={profile.coverImageUrl ? { backgroundImage: `url(${profile.coverImageUrl})` } : undefined}
          />
          <div className={styles.heroBody}>
            {profile.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profileImageUrl} alt="" className={`${styles.avatar} ${styles.avatarLarge}`} />
            ) : (
              <div className={`${styles.avatar} ${styles.avatarLarge}`} aria-hidden="true">
                {initials(profile.businessName)}
              </div>
            )}
            <div className={styles.heroText}>
              <h1 className={styles.heroName}>{profile.businessName}</h1>
              {profile.headline && <p className={styles.pageSubtitle} style={{ margin: "0.2rem 0 0.5rem" }}>{profile.headline}</p>}
              <div className={styles.meta}>
                {profile.isVerified && <span className={styles.verified}>✓ Verified</span>}
                {profile.city && <span>{profile.city}{profile.addressLine ? `, ${profile.addressLine}` : ""}</span>}
                {profile.yearsExperience != null && <span>· {profile.yearsExperience} yrs experience</span>}
                <span>· Member since {formatMonthYear(profile.memberSince)}</span>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <StarRating average={profile.rating.average} count={profile.rating.count} />
              </div>
            </div>
          </div>
        </section>

        <div className={styles.profileLayout}>
          <div>
            {profile.bio && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>About</h2>
                <p style={{ margin: 0 }}>{profile.bio}</p>
              </section>
            )}

            <section className={styles.section} aria-label="Services">
              <h2 className={styles.sectionTitle}>Services &amp; prices</h2>
              {profile.services.length === 0 ? (
                <p className={styles.closed}>This provider has no services listed right now.</p>
              ) : (
                profile.services.map((s) => (
                  <div key={s.id} className={styles.serviceRow}>
                    <div className={styles.serviceInfo}>
                      <h3 className={styles.serviceName}>{s.name}</h3>
                      <div className={styles.meta}>
                        <span className={styles.pill}>{s.category.name}</span>
                        <span className={`${styles.pill} ${styles.pillNeutral}`}>
                          {SERVICE_TYPE_LABELS[s.serviceType] ?? s.serviceType}
                        </span>
                        <span>{formatDuration(s.durationMinutes)}</span>
                      </div>
                      {s.description && <p className={styles.desc} style={{ marginTop: "0.3rem" }}>{s.description}</p>}
                    </div>
                    <div className={styles.servicePrice}>
                      <div className={styles.price}>{formatPrice(s.price, s.currency)}</div>
                      <Link href={bookServiceHref(s.id, profile.id)} className={styles.button} style={{ marginTop: "0.4rem" }}>
                        Book
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className={styles.section} aria-label="Reviews">
              <h2 className={styles.sectionTitle}>Reviews</h2>
              {profile.rating.count === 0 ? (
                <p className={styles.closed}>No reviews yet.</p>
              ) : (
                profile.recentReviews.map((r) => (
                  <div key={r.id} className={styles.review}>
                    <div className={styles.reviewHead}>
                      <strong>{r.customerName}</strong>
                      <StarRating average={r.rating} count={1} compact />
                      {r.serviceName && <span className={styles.priceNote}>for {r.serviceName}</span>}
                      <span className={styles.priceNote}>
                        · {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
                  </div>
                ))
              )}
            </section>
          </div>

          <aside>
            <section className={styles.section} aria-label="Rating summary">
              <h2 className={styles.sectionTitle}>Rating</h2>
              {profile.rating.count === 0 ? (
                <p className={styles.closed}>Not rated yet.</p>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span className={styles.bigRating}>{profile.rating.average.toFixed(1)}</span>
                    <span className={styles.priceNote}>{profile.rating.count} reviews</span>
                  </div>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const n = profile.rating.distribution[stars - 1];
                    return (
                      <div key={stars} className={styles.distRow}>
                        <span>{stars} ★</span>
                        <div className={styles.distBar}>
                          <div className={styles.distFill} style={{ width: `${(n / maxBucket) * 100}%` }} />
                        </div>
                        <span>{n}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </section>

            <section className={styles.section} aria-label="Working hours">
              <h2 className={styles.sectionTitle}>Working hours</h2>
              {profile.workingHours.length === 0 ? (
                <p className={styles.closed}>Hours not published yet.</p>
              ) : (
                <table className={styles.hoursTable}>
                  <tbody>
                    {dayOrder.map((d) => {
                      const slots = hoursByDay.get(d);
                      return (
                        <tr key={d}>
                          <td>{DAY_NAMES[d]}</td>
                          <td className={slots ? undefined : styles.closed}>{slots ? slots.join(", ") : "Closed"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
