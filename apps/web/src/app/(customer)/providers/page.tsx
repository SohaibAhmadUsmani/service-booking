/** Owner: Khadija — public provider listing. */
import { Suspense } from "react";
import CatalogBrowser from "../../components/catalog/CatalogBrowser";
import CatalogNav from "../../components/catalog/CatalogNav";
import styles from "../../components/catalog/catalog.module.css";

export const metadata = { title: "Providers | Service Booking" };

export default function ProvidersPage() {
  return (
    <div className={styles.root}>
      <CatalogNav active="providers" />
      <main className={styles.container}>
        <h1 className={styles.pageTitle}>Service providers</h1>
        <p className={styles.pageSubtitle}>Browse providers and open a profile to see services and prices.</p>
        <Suspense fallback={null}>
          <CatalogBrowser initialMode="providers" />
        </Suspense>
      </main>
    </div>
  );
}
