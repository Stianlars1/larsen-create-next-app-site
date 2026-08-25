"use client";

import styles from "./console.module.css";

export default function AdminConsoleError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <section role="alert">
        <h1>Something failed to load</h1>
        <p>This section could not be rendered. Try again.</p>
        <button onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
