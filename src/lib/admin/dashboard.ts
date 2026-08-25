import "server-only";

import { PRODUCT_EVENT_NAMES, type ProductEventName } from "@/lib/analytics/product-event-contract";
import { getNpmSnapshot, type NpmSnapshot } from "./npm";
import { deploymentIdentity, probePublicSite, type DeploymentIdentity, type Probe } from "./probes";
import type { AdminFailureReason, AdminResult } from "./result";
import { analyticsWindow, type AnalyticsWindow, type AnalyticsWindowKey } from "./time-window";
import {
  getUmamiActive,
  getUmamiEventSeries,
  getUmamiEventStats,
  getUmamiEventValues,
  getUmamiPageviews,
  getUmamiStats,
  type UmamiEventPoint,
  type UmamiEventStats,
  type UmamiEventValue,
  type UmamiPageviewSeries,
  type UmamiStats,
} from "./umami";

export type ReachMetric = {
  count: number | null;
  visitors: number | null;
  reach: number | null;
  reason?: AdminFailureReason;
};

export type ProductMetrics = {
  paletteGenerator: ReachMetric;
  commandBuilder: ReachMetric;
  commandCopy: ReachMetric;
  stylesheetCopy: ReachMetric;
};

export type AdminDashboardData = {
  observedAt: string;
  window: AnalyticsWindow;
  active: AdminResult<{ visitors: number }>;
  traffic: AdminResult<UmamiStats>;
  trafficSeries: AdminResult<UmamiPageviewSeries>;
  product: ProductMetrics;
  productSeries: AdminResult<UmamiEventPoint[]>;
  commandCopySurfaces: AdminResult<UmamiEventValue[]>;
  npm: NpmSnapshot;
  publicSite: Probe;
  deployment: DeploymentIdentity;
};

export function rate(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return numerator / denominator;
}

function reachMetric(
  result: AdminResult<UmamiEventStats>,
  totalVisitors: number | null,
): ReachMetric {
  if (!result.ok) return { count: null, visitors: null, reach: null, reason: result.reason };
  return {
    count: result.data.events,
    visitors: result.data.visitors,
    reach: rate(result.data.visitors, totalVisitors),
  };
}

export async function getAdminDashboardData(
  windowKey: AnalyticsWindowKey,
  now: Date = new Date(),
): Promise<AdminDashboardData> {
  const window = analyticsWindow(windowKey, now);
  const [active, traffic, trafficSeries, eventSeries, commandCopySurfaces, npm, publicSite, eventResults] =
    await Promise.all([
      getUmamiActive(),
      getUmamiStats(window),
      getUmamiPageviews(window),
      getUmamiEventSeries(window),
      getUmamiEventValues(window, "command_copied", "surface"),
      getNpmSnapshot(),
      probePublicSite(),
      Promise.all(
        [
          "palette_generator_used",
          "command_builder_used",
          "command_copied",
          "theme_css_copied",
        ].map((event) => getUmamiEventStats(window, event as ProductEventName)),
      ),
    ]);

  const [paletteGenerator, commandBuilder, commandCopy, stylesheetCopy] = eventResults;
  const totalVisitors = traffic.ok ? traffic.data.visitors : null;

  return {
    observedAt: now.toISOString(),
    window,
    active,
    traffic,
    trafficSeries,
    product: {
      paletteGenerator: reachMetric(paletteGenerator, totalVisitors),
      commandBuilder: reachMetric(commandBuilder, totalVisitors),
      commandCopy: reachMetric(commandCopy, totalVisitors),
      stylesheetCopy: reachMetric(stylesheetCopy, totalVisitors),
    },
    productSeries: eventSeries.ok
      ? {
          ...eventSeries,
          data: eventSeries.data.filter((point) => PRODUCT_EVENT_NAMES.includes(point.event)),
        }
      : eventSeries,
    commandCopySurfaces,
    npm,
    publicSite,
    deployment: deploymentIdentity(),
  };
}
