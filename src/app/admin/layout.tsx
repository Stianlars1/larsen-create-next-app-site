import type { Metadata } from "next";

import { requireAdminConfigured } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  requireAdminConfigured();
  return children;
}
