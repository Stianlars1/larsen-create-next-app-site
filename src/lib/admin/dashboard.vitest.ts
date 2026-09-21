// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUmamiActive: vi.fn(),
  getUmamiStats: vi.fn(),
  getUmamiPageviews: vi.fn(),
  getUmamiEventStats: vi.fn(),
  getUmamiEventSeries: vi.fn(),
  getUmamiEventValues: vi.fn(),
  getNpmSnapshot: vi.fn(),
  probePublicSite: vi.fn(),
  deploymentIdentity: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./umami", () => ({
  getUmamiActive: mocks.getUmamiActive,
  getUmamiStats: mocks.getUmamiStats,
  getUmamiPageviews: mocks.getUmamiPageviews,
  getUmamiEventStats: mocks.getUmamiEventStats,
  getUmamiEventSeries: mocks.getUmamiEventSeries,
  getUmamiEventValues: mocks.getUmamiEventValues,
}));
vi.mock("./npm", () => ({ getNpmSnapshot: mocks.getNpmSnapshot }));
vi.mock("./probes", () => ({
  probePublicSite: mocks.probePublicSite,
  deploymentIdentity: mocks.deploymentIdentity,
}));

import { getAdminDashboardData, rate } from "./dashboard";

const now = new Date("2026-08-25T12:00:00.000Z");
const ok = <T,>(data: T) => ({ ok: true as const, data, at: now.toISOString() });

function configureSuccess() {
  mocks.getUmamiActive.mockResolvedValue(ok({ visitors: 3 }));
  mocks.getUmamiStats.mockResolvedValue(
    ok({ pageviews: 100, visitors: 40, visits: 50, bounces: 10, totalTime: 1000 }),
  );
  mocks.getUmamiPageviews.mockResolvedValue(
    ok({ pageviews: [{ x: "2026-08-24T00:00:00Z", y: 10 }], visitors: [{ x: "2026-08-24T00:00:00Z", y: 7 }] }),
  );
  mocks.getUmamiEventStats.mockResolvedValue(ok({ events: 10, visitors: 5, visits: 6 }));
  mocks.getUmamiEventSeries.mockResolvedValue(ok([]));
  mocks.getUmamiEventValues.mockResolvedValue(ok([{ value: "hero", total: 3 }]));
  mocks.getNpmSnapshot.mockResolvedValue({
    downloads: ok({ lastDay: 1, lastWeek: 2, lastMonth: 3, daily: [], }),
    package: ok({ latestVersion: "0.6.0", publishedAt: now.toISOString(), siteVersion: "0.6.0", drift: false }),
  });
  mocks.probePublicSite.mockResolvedValue({
    name: "Public site",
    detail: "create-next-app.larsenutvikling.no",
    status: "up",
    latencyMs: 12,
  });
  mocks.deploymentIdentity.mockReturnValue({
    environment: "production",
    commit: "1234567",
    branch: "main",
    region: "iad1",
    nodeVersion: "v24.18.0",
  });
}

describe("admin dashboard data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureSuccess();
  });

  it("uses one reporting window for every traffic and event numerator", async () => {
    const data = await getAdminDashboardData("7d", now);

    expect(data.window).toMatchObject({ key: "7d", startAt: Date.parse("2026-08-18T12:00:00.000Z") });
    for (const call of [
      mocks.getUmamiStats,
      mocks.getUmamiPageviews,
      mocks.getUmamiEventSeries,
    ]) {
      expect(call).toHaveBeenCalledWith(expect.objectContaining({ key: "7d" }));
    }
    expect(mocks.getUmamiEventValues).toHaveBeenCalledWith(
      expect.objectContaining({ key: "7d" }),
      "command_copied",
      "surface",
    );
    expect(mocks.getUmamiEventStats).toHaveBeenCalledTimes(4);
    expect(data.product.paletteGenerator).toMatchObject({ count: 10, visitors: 5, reach: 0.125 });
  });

  it("keeps a failed reach metric unavailable without hiding other data", async () => {
    mocks.getUmamiEventStats.mockImplementation(async (_window: unknown, event: string) =>
      event === "command_copied" ? { ok: false as const, reason: "timeout" } : ok({ events: 10, visitors: 5, visits: 6 }),
    );

    const data = await getAdminDashboardData("30d", now);

    expect(data.product.commandCopy).toEqual({ count: null, visitors: null, reach: null, reason: "timeout" });
    expect(data.product.paletteGenerator).toMatchObject({ reach: 0.125 });
    expect(data.npm.downloads).toMatchObject({ ok: true });
  });

  it("returns null rather than an infinite rate when no visitors exist", () => {
    expect(rate(10, 40)).toBe(0.25);
    expect(rate(0, 40)).toBe(0);
    expect(rate(1, 0)).toBeNull();
    expect(rate(null, 40)).toBeNull();
  });
});
