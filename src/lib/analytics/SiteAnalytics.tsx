"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";

import { CookieConsent } from "@/components/site/cookie-consent";
import GoogleAnalyticsProvider from "./GoogleAnalyticsProvider";
import { isAdminPath } from "./path";
import { UmamiAnalytics } from "./UmamiAnalytics";

function beforeSend(event: { url: string; type: "event" | "pageview" }) {
  try {
    return isAdminPath(new URL(event.url, window.location.origin).pathname) ? null : event;
  } catch {
    return event;
  }
}

export function SiteAnalytics() {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;

  return (
    <>
      <Analytics beforeSend={beforeSend} />
      <UmamiAnalytics />
      <GoogleAnalyticsProvider />
      <CookieConsent />
    </>
  );
}
