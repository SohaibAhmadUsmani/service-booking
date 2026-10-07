import Link from "next/link";
import CatalogNav from "../../../components/catalog/CatalogNav";
import styles from "../../../components/catalog/catalog.module.css";

export default function ProviderNotFound() {
  return (
    <div className={styles.root}>
      <CatalogNav active="providers" />
      <main className={styles.container}>
        <div className={styles.state}>
          <h1 className={styles.stateTitle}>Provider not found</h1>
          <p>This provider doesn&apos;t exist or is no longer available.</p>
          <Link href="/providers" className={styles.button}>
            Back to providers
          </Link>
        </div>
      </main>
    </div>
  );
}
