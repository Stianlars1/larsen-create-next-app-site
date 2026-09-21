// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PACKAGE_VERSION } from "../content";
import { createNpmClient } from "./npm";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fetchMock(...responses: Array<Response | Error>) {
  return vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("Unexpected fetch");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
}

describe("npm admin data", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns downloads and package metadata independently", async () => {
    const request = fetchMock(
      json({ downloads: 8, start: "2026-08-24", end: "2026-08-24" }),
      json({ downloads: 40, start: "2026-08-18", end: "2026-08-24" }),
      json({
        downloads: [
          { day: "2026-08-24", downloads: 8 },
          { day: "2026-08-23", downloads: 6 },
        ],
      }),
      json({
        "dist-tags": { latest: PACKAGE_VERSION },
        time: { [PACKAGE_VERSION]: "2026-08-21T10:00:00.000Z" },
      }),
    );

    const result = await createNpmClient(request).getSnapshot();

    expect(result.downloads).toMatchObject({
      ok: true,
      data: {
        lastDay: 8,
        lastWeek: 40,
        lastMonth: 14,
        daily: [
          { day: "2026-08-23", downloads: 6 },
          { day: "2026-08-24", downloads: 8 },
        ],
      },
    });
    expect(result.package).toMatchObject({
      ok: true,
      data: {
        latestVersion: PACKAGE_VERSION,
        siteVersion: PACKAGE_VERSION,
        drift: false,
      },
    });
    expect(String(vi.mocked(request).mock.calls[0]?.[0])).toContain(
      "%40larsen-utvikling%2Fcreate-next-app",
    );
  });

  it("reports version drift without changing download semantics", async () => {
    const request = fetchMock(
      json({ downloads: 1 }),
      json({ downloads: 2 }),
      json({ downloads: [{ day: "2026-08-24", downloads: 3 }] }),
      json({
        "dist-tags": { latest: "999.0.0" },
        time: { "999.0.0": "2026-08-25T10:00:00.000Z" },
      }),
    );

    const result = await createNpmClient(request).getSnapshot();

    expect(result.downloads).toMatchObject({ ok: true });
    expect(result.package).toMatchObject({ ok: true, data: { drift: true } });
  });

  it("keeps registry metadata when a downloads request fails", async () => {
    const request = fetchMock(
      new Response(null, { status: 503 }),
      json({ downloads: 2 }),
      json({ downloads: [] }),
      json({
        "dist-tags": { latest: PACKAGE_VERSION },
        time: { [PACKAGE_VERSION]: "2026-08-21T10:00:00.000Z" },
      }),
    );

    const result = await createNpmClient(request).getSnapshot();

    expect(result.downloads).toEqual({ ok: false, reason: "unreachable" });
    expect(result.package).toMatchObject({ ok: true, data: { latestVersion: PACKAGE_VERSION } });
  });

  it("keeps downloads when registry metadata is invalid", async () => {
    const request = fetchMock(
      json({ downloads: 1 }),
      json({ downloads: 2 }),
      json({ downloads: [{ day: "2026-08-24", downloads: 3 }] }),
      json({ "dist-tags": { latest: PACKAGE_VERSION }, time: {} }),
    );

    const result = await createNpmClient(request).getSnapshot();

    expect(result.downloads).toMatchObject({ ok: true, data: { lastMonth: 3 } });
    expect(result.package).toEqual({ ok: false, reason: "invalid_response" });
  });
});
