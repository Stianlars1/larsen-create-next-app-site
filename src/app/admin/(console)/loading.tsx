import styles from "./console.module.css";

export default function AdminLoading() {
  return (
    <main className={styles.page} aria-busy="true" aria-live="polite">
      <div className={styles.skeleton}>
        <span />
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
