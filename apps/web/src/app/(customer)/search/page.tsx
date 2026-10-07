/** Owner: Khadija — filters update results on this page without navigation. */
import { Suspense } from "react";
import CatalogBrowser from "../../components/catalog/CatalogBrowser";
import CatalogNav from "../../components/catalog/CatalogNav";
import styles from "../../components/catalog/catalog.module.css";

export const metadata = { title: "Search services | Service Booking" };

export default function SearchPage() {
  return (
    <div className={styles.root}>
      <CatalogNav active="search" />
      <main className={styles.container}>
        <h1 className={styles.pageTitle}>Find a service</h1>
        <p className={styles.pageSubtitle}>
          Search by name, then narrow down by category, location, price, rating, type and date.
        </p>
        <Suspense fallback={null}>
          <CatalogBrowser initialMode="services" />
        </Suspense>
      </main>
    </div>
  );
}
