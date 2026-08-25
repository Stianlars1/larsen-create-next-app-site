"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

import { isAdminPath } from "./path";
import { flushPendingUmamiEvents } from "./umami-track";

export function UmamiAnalytics() {
  const pathname = usePathname();
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (isAdminPath(pathname) || !src || !websiteId) return null;

  return (
    <Script
      data-host-url="/stats"
      data-website-id={websiteId}
      onLoad={flushPendingUmamiEvents}
      src={src}
      strategy="afterInteractive"
    />
  );
}
