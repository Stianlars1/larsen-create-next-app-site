import { requireAdminSession } from "@/lib/admin/guard";
import { ROUTE_ADMIN_LOCK } from "@/lib/routes";
import styles from "./console.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Admin</h1>
        <p className={styles.copy}>The console is unlocked.</p>
        <form action={ROUTE_ADMIN_LOCK} method="post">
          <button className={styles.lock} type="submit">
            Lock
          </button>
        </form>
      </section>
    </main>
  );
}
