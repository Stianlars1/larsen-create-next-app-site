import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));
vi.mock("next/script", () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-host-url={String(props["data-host-url"])}
      data-src={String(props.src)}
      data-testid="umami-script"
    />
  ),
}));

import { UmamiAnalytics } from "./UmamiAnalytics";

describe("UmamiAnalytics", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_UMAMI_SRC", "/stats/script.js");
    vi.stubEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", "site-id");
  });

  it("loads on a public route", () => {
    usePathnameMock.mockReturnValue("/");

    render(<UmamiAnalytics />);

    expect(screen.getByTestId("umami-script").getAttribute("data-src")).toBe(
      "/stats/script.js",
    );
    expect(screen.getByTestId("umami-script").getAttribute("data-host-url")).toBe("/stats");
  });

  it.each(["/admin", "/admin/unlock", "/admin/anything"])(
    "does not load on %s",
    (pathname) => {
      usePathnameMock.mockReturnValue(pathname);

      render(<UmamiAnalytics />);

      expect(screen.queryByTestId("umami-script")).toBeNull();
    },
  );

  it("does not load when public configuration is incomplete", () => {
    vi.stubEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", "");
    usePathnameMock.mockReturnValue("/");

    render(<UmamiAnalytics />);

    expect(screen.queryByTestId("umami-script")).toBeNull();
  });
});
