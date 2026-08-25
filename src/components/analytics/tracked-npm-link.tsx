"use client";

import type { ReactNode } from "react";

import { trackProductEvent } from "@/lib/analytics/events";
import { NPM_URL } from "@/lib/content";

export function TrackedNpmLink({
  children,
  surface,
}: {
  children: ReactNode;
  surface: "hero" | "footer";
}) {
  return (
    <a
      href={NPM_URL}
      onClick={() => trackProductEvent({ name: "npm_link_clicked", data: { surface } })}
    >
      {children}
    </a>
  );
}
