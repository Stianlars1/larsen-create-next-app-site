// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { analyticsWindow } from "./time-window";
import { createUmamiClient } from "./umami";

const WINDOW = analyticsWindow("30d", new Date("2026-08-25T12:00:00.000Z"));

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

describe("Umami admin client", () => {
  it("fails honestly without complete configuration", async () => {
    const request = vi.fn() as unknown as typeof fetch;
    const client = createUmamiClient({}, request);

    await expect(client.getActive()).resolves.toEqual({ ok: false, reason: "unconfigured" });
    expect(request).not.toHaveBeenCalled();
  });

  it("uses an API key for a configured active-visitor request", async () => {
    const request = fetchMock(json({ visitors: 5 }));
    const client = createUmamiClient(
      {
        UMAMI_API_URL: "https://api.umami.is/v1/",
        UMAMI_WEBSITE_ID: "website-id",
        UMAMI_API_KEY: "api-key",
      },
      request,
    );

    const result = await client.getActive();

    expect(result).toMatchObject({ ok: true, data: { visitors: 5 } });
    const [url, init] = vi.mocked(request).mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.umami.is/v1/websites/website-id/active");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer api-key");
  });

  it("returns timeout and invalid-response results rather than zero", async () => {
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    const timeoutClient = createUmamiClient(
      { UMAMI_API_URL: "https://api.umami.is/v1", UMAMI_WEBSITE_ID: "website-id", UMAMI_API_KEY: "key" },
      fetchMock(timeout),
    );
    const invalidClient = createUmamiClient(
      { UMAMI_API_URL: "https://api.umami.is/v1", UMAMI_WEBSITE_ID: "website-id", UMAMI_API_KEY: "key" },
      fetchMock(json({ visitors: "five" })),
    );

    await expect(timeoutClient.getActive()).resolves.toEqual({ ok: false, reason: "timeout" });
    await expect(invalidClient.getActive()).resolves.toEqual({
      ok: false,
      reason: "invalid_response",
    });
  });

  it("validates and maps pageviews, events, and event-data values", async () => {
    const request = fetchMock(
      json({
        pageviews: [{ x: "2026-08-24T00:00:00Z", y: 12 }],
        sessions: [{ x: "2026-08-24T00:00:00Z", y: 7 }],
      }),
      json([
        { x: "command_copied", t: "2026-08-24T00:00:00Z", y: 4 },
        { x: "untrusted_event", t: "2026-08-24T00:00:00Z", y: 99 },
      ]),
      json({ data: { events: 18, visitors: 9, visits: 11, uniqueEvents: 1 } }),
      json([{ value: "hero", total: 3 }]),
    );
    const client = createUmamiClient(
      { UMAMI_API_URL: "https://api.umami.is/v1", UMAMI_WEBSITE_ID: "website-id", UMAMI_API_KEY: "key" },
      request,
    );

    await expect(client.getPageviews(WINDOW)).resolves.toMatchObject({
      ok: true,
      data: {
        pageviews: [{ x: "2026-08-24T00:00:00Z", y: 12 }],
        visitors: [{ x: "2026-08-24T00:00:00Z", y: 7 }],
      },
    });
    await expect(client.getEventSeries(WINDOW)).resolves.toMatchObject({
      ok: true,
      data: [{ event: "command_copied", at: "2026-08-24T00:00:00Z", count: 4 }],
    });
    await expect(client.getEventStats(WINDOW, "command_copied")).resolves.toMatchObject({
      ok: true,
      data: { events: 18, visitors: 9, visits: 11 },
    });
    await expect(client.getEventValues(WINDOW, "command_copied", "surface")).resolves.toMatchObject({
      ok: true,
      data: [{ value: "hero", total: 3 }],
    });
  });
});
