import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import GoogleAnalyticsProvider from "@/lib/analytics/GoogleAnalyticsProvider";
import { CookieConsent } from "@/components/site/cookie-consent";
import { PaletteSessionProvider } from "@/components/theme/palette-session";
import { SiteThemeProvider } from "@/components/theme/site-theme";
import { fontVariables } from "@/lib/fonts";
import { PACKAGE_NAME } from "@/lib/content";
import { DEFAULT_DEMO_OPTIONS, generate } from "@/lib/palette";
import "./globals.css";

const SITE_URL = "https://create-next-app.larsenutvikling.no";

const description =
  "Scaffold the newest Next.js with a vanilla CSS design system: color tokens generated from one HEX, motion tokens, agent docs, and no Tailwind.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PACKAGE_NAME} - a Next.js starter with a real design system`,
    template: `%s | ${PACKAGE_NAME}`,
  },
  description,
  alternates: { canonical: "/" },
  keywords: [
    "create-next-app",
    "Next.js template",
    "design tokens",
    "vanilla CSS",
    "no Tailwind",
    "color palette generator",
    "AGENTS.md",
  ],
  authors: [{ name: "Stian Larsen", url: "https://www.larsenutvikling.no" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: PACKAGE_NAME,
    title: `${PACKAGE_NAME} - a Next.js starter with a real design system`,
    description,
    locale: "en",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialTheme = await generate(DEFAULT_DEMO_OPTIONS);

  return (
    <html lang="en" className={fontVariables} data-theme="dark" data-site-theme="custom">
      <body>
        <SiteThemeProvider
          initialSelection={{
            hex: DEFAULT_DEMO_OPTIONS.hex,
            neutralTint: DEFAULT_DEMO_OPTIONS.neutralTint,
          }}
          initialTokens={initialTheme.dark}
        >
          <PaletteSessionProvider
            initialOptions={DEFAULT_DEMO_OPTIONS}
            initialTheme={initialTheme}
          >
            {children}
          </PaletteSessionProvider>
        </SiteThemeProvider>
        {/* Cookie-free by design */}
        <Analytics />
        {/* Only mounts once consent is granted, and only with a measurement ID */}
        <GoogleAnalyticsProvider />
        <CookieConsent />
      </body>
    </html>
  );
}
