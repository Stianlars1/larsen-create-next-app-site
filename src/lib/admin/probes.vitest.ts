// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { deploymentIdentity, probePublicSite } from "./probes";

describe("admin health probes", () => {
  it("uses a successful HEAD response for the public front door", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 200 })) as unknown as typeof fetch;

    const result = await probePublicSite(request, "https://create-next-app.larsenutvikling.no/");

    expect(result).toMatchObject({ name: "Public site", status: "up" });
    expect(vi.mocked(request).mock.calls[0]?.[1]?.method).toBe("HEAD");
    expect(new Headers(vi.mocked(request).mock.calls[0]?.[1]?.headers).get("user-agent")).toBe(
      "larsen-create-next-app-admin-probe/1.0",
    );
  });

  it("falls back to GET only when HEAD is rejected", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 })) as unknown as typeof fetch;

    const result = await probePublicSite(request, "https://create-next-app.larsenutvikling.no/");

    expect(result.status).toBe("up");
    expect(vi.mocked(request).mock.calls[1]?.[1]?.method).toBe("GET");
  });

  it("reports HTTP failure and timeout honestly", async () => {
    const down = vi.fn().mockResolvedValue(new Response(null, { status: 503 })) as unknown as typeof fetch;
    const timeout = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("timed out"), { name: "TimeoutError" })) as unknown as typeof fetch;

    await expect(probePublicSite(down, "https://create-next-app.larsenutvikling.no/")).resolves.toMatchObject({
      status: "down",
      note: "HTTP 503",
    });
    await expect(probePublicSite(timeout, "https://create-next-app.larsenutvikling.no/")).resolves.toMatchObject({
      status: "down",
      note: "timed out",
    });
  });

  it("uses Vercel runtime values without an API call", () => {
    expect(
      deploymentIdentity({
        VERCEL_ENV: "production",
        VERCEL_GIT_COMMIT_SHA: "1234567890abcdef",
        VERCEL_GIT_COMMIT_REF: "main",
        VERCEL_REGION: "iad1",
      }),
    ).toMatchObject({
      environment: "production",
      commit: "1234567",
      branch: "main",
      region: "iad1",
    });
  });
});
