import Link from "next/link";
import styles from "./catalog.module.css";

const LINKS = [
  { href: "/search", key: "search", label: "Search services" },
  { href: "/categories", key: "categories", label: "Categories" },
  { href: "/providers", key: "providers", label: "Providers" },
] as const;

export type CatalogNavKey = (typeof LINKS)[number]["key"];

/** Small top bar shared by the catalog pages. */
export default function CatalogNav({ active }: { active?: CatalogNavKey }) {
  return (
    <nav className={styles.nav} aria-label="Browse">
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand}>
          Service Booking
        </Link>
        {LINKS.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            aria-current={active === link.key ? "page" : undefined}
            className={`${styles.navLink} ${active === link.key ? styles.navLinkActive : ""}`}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/book" className={styles.navLink} style={{ fontWeight: 600, color: "#4f46e5" }}>
          Book a service
        </Link>
      </div>
    </nav>
  );
}
