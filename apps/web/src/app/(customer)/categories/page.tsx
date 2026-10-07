/** Owner: Khadija — category browsing. */
import Link from "next/link";
import CatalogNav from "../../components/catalog/CatalogNav";
import styles from "../../components/catalog/catalog.module.css";
import { fetchCategories } from "@/lib/api/catalog";

export const metadata = { title: "Categories | Service Booking" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];
  let failed = false;
  try {
    categories = await fetchCategories();
  } catch {
    failed = true;
  }

  return (
    <div className={styles.root}>
      <CatalogNav active="categories" />
      <main className={styles.container}>
        <h1 className={styles.pageTitle}>Browse by category</h1>
        <p className={styles.pageSubtitle}>Pick a category to see the services available.</p>

        {failed ? (
          <div className={styles.state} role="alert">
            <h2 className={styles.stateTitle}>We couldn&apos;t load categories</h2>
            <p>Check that the API server is running and refresh the page.</p>
          </div>
        ) : categories.length === 0 ? (
          <div className={styles.state}>
            <h2 className={styles.stateTitle}>No categories yet</h2>
            <p>Categories will appear here once they are added.</p>
          </div>
        ) : (
          <div className={styles.categoryGrid}>
            {categories.map((c) => (
              <Link key={c.id} href={`/search?category=${encodeURIComponent(c.slug)}`} className={styles.categoryCard}>
                <div className={styles.categoryIcon} aria-hidden="true">
                  {c.icon ?? "🛠️"}
                </div>
                <h2 className={styles.cardTitle} style={{ marginTop: "0.6rem" }}>
                  {c.name}
                </h2>
                {c.description && <p className={styles.desc}>{c.description}</p>}
                <p className={styles.priceNote} style={{ marginTop: "0.5rem" }}>
                  {c.serviceCount} {c.serviceCount === 1 ? "service" : "services"} · {c.providerCount}{" "}
                  {c.providerCount === 1 ? "provider" : "providers"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
