// @vitest-environment node

import { describe, expect, it } from "vitest";

import { analyticsWindow, parseAnalyticsWindow } from "./time-window";

const NOW = new Date("2026-08-25T12:00:00.000Z");

describe("analytics windows", () => {
  it("uses exact rolling UTC boundaries", () => {
    expect(analyticsWindow("24h", NOW)).toMatchObject({
      startAt: Date.parse("2026-08-24T12:00:00.000Z"),
      endAt: NOW.getTime(),
      unit: "hour",
      timezone: "Europe/Oslo",
    });
    expect(analyticsWindow("7d", NOW).startAt).toBe(Date.parse("2026-08-18T12:00:00.000Z"));
    expect(analyticsWindow("30d", NOW).startAt).toBe(Date.parse("2026-07-26T12:00:00.000Z"));
  });

  it("falls back to the 30 day reporting window", () => {
    expect(parseAnalyticsWindow("24h")).toBe("24h");
    expect(parseAnalyticsWindow("7d")).toBe("7d");
    expect(parseAnalyticsWindow("unexpected")).toBe("30d");
    expect(parseAnalyticsWindow(undefined)).toBe("30d");
  });
});
