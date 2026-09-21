import { redirect } from "next/navigation";

import { readAdminSession } from "@/lib/admin/guard";
import { ROUTE_ADMIN, ROUTE_ADMIN_SESSION } from "@/lib/routes";
import styles from "./unlock.module.css";

const MESSAGES: Record<string, string> = {
  invalid: "That password is not correct.",
  rate: "Too many attempts. Try again shortly.",
};

type UnlockPageProps = {
  searchParams: Promise<{ e?: string; retry?: string }>;
};

export default async function AdminUnlockPage({ searchParams }: UnlockPageProps) {
  if (await readAdminSession()) redirect(ROUTE_ADMIN);

  const { e, retry } = await searchParams;
  const message = e ? MESSAGES[e] : undefined;
  const retrySeconds = Number(retry);
  const retryHint =
    e === "rate" && Number.isFinite(retrySeconds) && retrySeconds > 0
      ? ` Try again in about ${Math.ceil(retrySeconds / 60)} min.`
      : "";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Larsen create-next-app</p>
        <h1 className={styles.title}>Admin locked</h1>
        <p className={styles.copy}>Enter the admin password to continue. The session lasts 12 hours.</p>

        <form action={ROUTE_ADMIN_SESSION} method="post" className={styles.form}>
          <label className={styles.label} htmlFor="admin-password">
            Admin password
          </label>
          <input
            autoComplete="current-password"
            autoFocus
            className={styles.input}
            id="admin-password"
            name="password"
            required
            type="password"
          />
          <button className={styles.submit} type="submit">
            Unlock
          </button>
        </form>

        {message ? (
          <p className={styles.error} role="alert">
            {message}
            {retryHint}
          </p>
        ) : null}
      </section>
    </main>
  );
}
