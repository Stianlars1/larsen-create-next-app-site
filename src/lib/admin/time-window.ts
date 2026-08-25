export type AnalyticsWindowKey = "24h" | "7d" | "30d";

export type AnalyticsWindow = {
  key: AnalyticsWindowKey;
  startAt: number;
  endAt: number;
  unit: "hour" | "day";
  timezone: "Europe/Oslo";
};

const DURATIONS: Record<AnalyticsWindowKey, number> = {
  "24h": 24 * 60 * 60 * 1_000,
  "7d": 7 * 24 * 60 * 60 * 1_000,
  "30d": 30 * 24 * 60 * 60 * 1_000,
};

export function parseAnalyticsWindow(value: unknown): AnalyticsWindowKey {
  return value === "24h" || value === "7d" || value === "30d" ? value : "30d";
}

export function analyticsWindow(
  key: AnalyticsWindowKey,
  now: Date = new Date(),
): AnalyticsWindow {
  const endAt = now.getTime();
  return {
    key,
    startAt: endAt - DURATIONS[key],
    endAt,
    unit: key === "24h" ? "hour" : "day",
    timezone: "Europe/Oslo",
  };
}
