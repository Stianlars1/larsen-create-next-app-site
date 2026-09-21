import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { measurementIdMock, updateConsentMock } = vi.hoisted(() => ({
  measurementIdMock: vi.fn(),
  updateConsentMock: vi.fn(),
}));

vi.mock("./google-analytics", () => ({
  getGoogleAnalyticsMeasurementId: measurementIdMock,
  updateGoogleConsent: updateConsentMock,
}));
vi.mock("./GoogleAnalytics", () => ({
  default: () => <div data-testid="google-script" />,
}));
vi.mock("./PageTracker", () => ({
  default: () => <div data-testid="google-page-tracker" />,
}));

import GoogleAnalyticsProvider from "./GoogleAnalyticsProvider";

describe("GoogleAnalyticsProvider", () => {
  beforeEach(() => {
    measurementIdMock.mockReturnValue("G-TEST");
    document.cookie = "larsen_utvikling_consent=; max-age=0; path=/";
  });

  it("does not mount the Google script before a consent answer", async () => {
    render(<GoogleAnalyticsProvider />);

    await waitFor(() => expect(updateConsentMock).not.toHaveBeenCalled());
    expect(screen.queryByTestId("google-script")).toBeNull();
  });

  it("does not mount after declined consent", async () => {
    document.cookie = "larsen_utvikling_consent=denied; path=/";

    render(<GoogleAnalyticsProvider />);

    await waitFor(() => expect(updateConsentMock).toHaveBeenCalledWith("denied"));
    expect(screen.queryByTestId("google-script")).toBeNull();
  });

  it("mounts script and page tracking only after granted consent", async () => {
    document.cookie = "larsen_utvikling_consent=granted; path=/";

    render(<GoogleAnalyticsProvider />);

    await waitFor(() => expect(screen.getByTestId("google-script")).not.toBeNull());
    expect(screen.getByTestId("google-page-tracker")).not.toBeNull();
  });
});
