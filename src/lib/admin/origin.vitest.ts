// @vitest-environment node

import { describe, expect, it } from "vitest";

import { checkAdminFormOrigin } from "./origin";

function request(headers: Record<string, string>) {
  return new Request("https://create-next-app.larsenutvikling.no/admin/session", {
    method: "POST",
    headers: new Headers({ host: "create-next-app.larsenutvikling.no", ...headers }),
  });
}

describe("admin form origin", () => {
  it("accepts same-origin requests even when Origin is null", () => {
    expect(
      checkAdminFormOrigin(request({ "sec-fetch-site": "same-origin", origin: "null" })),
    ).toEqual({ ok: true });
  });

  it("rejects cross-site and same-site sibling requests", () => {
    expect(checkAdminFormOrigin(request({ "sec-fetch-site": "cross-site" }))).toEqual({
      ok: false,
      reason: "cross_site",
    });
    expect(checkAdminFormOrigin(request({ "sec-fetch-site": "same-site" }))).toEqual({
      ok: false,
      reason: "cross_site",
    });
  });

  it("uses Origin only as a fallback for older browsers", () => {
    expect(
      checkAdminFormOrigin(
        request({ origin: "https://create-next-app.larsenutvikling.no", "x-forwarded-proto": "https" }),
      ),
    ).toEqual({ ok: true });
    expect(checkAdminFormOrigin(request({ origin: "https://evil.example" }))).toEqual({
      ok: false,
      reason: "cross_site",
    });
    expect(checkAdminFormOrigin(request({ origin: "null" }))).toEqual({
      ok: false,
      reason: "unverifiable",
    });
  });
});
