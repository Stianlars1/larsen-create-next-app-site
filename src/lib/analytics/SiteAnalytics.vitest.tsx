import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));
vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));
vi.mock("./UmamiAnalytics", () => ({
  UmamiAnalytics: () => <div data-testid="umami-analytics" />,
}));
vi.mock("./GoogleAnalyticsProvider", () => ({
  default: () => <div data-testid="google-analytics" />,
}));
vi.mock("@/components/site/cookie-consent", () => ({
  CookieConsent: () => <div data-testid="cookie-consent" />,
}));

import { SiteAnalytics } from "./SiteAnalytics";

describe("SiteAnalytics", () => {
  it("renders all public analytics providers", () => {
    usePathnameMock.mockReturnValue("/");

    render(<SiteAnalytics />);

    expect(screen.getByTestId("vercel-analytics")).not.toBeNull();
    expect(screen.getByTestId("umami-analytics")).not.toBeNull();
    expect(screen.getByTestId("google-analytics")).not.toBeNull();
    expect(screen.getByTestId("cookie-consent")).not.toBeNull();
  });

  it.each(["/admin", "/admin/unlock", "/admin/anything"])(
    "renders no analytics provider on %s",
    (pathname) => {
      usePathnameMock.mockReturnValue(pathname);

      render(<SiteAnalytics />);

      expect(screen.queryByTestId("vercel-analytics")).toBeNull();
      expect(screen.queryByTestId("umami-analytics")).toBeNull();
      expect(screen.queryByTestId("google-analytics")).toBeNull();
      expect(screen.queryByTestId("cookie-consent")).toBeNull();
    },
  );

  it("keeps public providers for a similarly named path", () => {
    usePathnameMock.mockReturnValue("/administrators");

    render(<SiteAnalytics />);

    expect(screen.getByTestId("vercel-analytics")).not.toBeNull();
  });
});
