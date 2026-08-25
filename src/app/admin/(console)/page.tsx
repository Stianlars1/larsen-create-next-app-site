import { Suspense } from "react";

import { AdminDashboard } from "@/components/admin/dashboard";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { requireAdminSession } from "@/lib/admin/guard";
import { parseAnalyticsWindow } from "@/lib/admin/time-window";
import styles from "./console.module.css";

export const dynamic = "force-dynamic";

async function DashboardContent({ windowKey }: { windowKey: "24h" | "7d" | "30d" }) {
  const data = await getAdminDashboardData(windowKey);
  return <AdminDashboard data={data} />;
}

type AdminPageProps = {
  searchParams: Promise<{ window?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminSession();
  const { window } = await searchParams;
  const windowKey = parseAnalyticsWindow(window);

  return (
    <main className={styles.page}>
      <Suspense fallback={<AdminLoadingFallback />}>
        <DashboardContent windowKey={windowKey} />
      </Suspense>
    </main>
  );
}

function AdminLoadingFallback() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-live="polite">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
