// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ADMIN_COOKIE_NAME } from "@/lib/admin/session";
import { ROUTE_ADMIN_UNLOCK } from "@/lib/routes";
import { POST } from "./route";

const PASSWORD = "p".repeat(20);
const SECRET = "s".repeat(32);

function request(headers: Record<string, string> = {}) {
  return new Request("https://create-next-app.larsenutvikling.no/admin/session/lock", {
    method: "POST",
    headers: { "sec-fetch-site": "same-origin", ...headers },
  });
}

describe("admin lock route", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
    vi.stubEnv("ADMIN_SESSION_SECRET", SECRET);
  });

  it("returns 404 while the console is unconfigured", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "");

    const response = await POST(request());

    expect(response.status).toBe(404);
  });

  it("rejects a cross-site post", async () => {
    const response = await POST(request({ "sec-fetch-site": "cross-site" }));

    expect(response.status).toBe(403);
  });

  it("clears the admin cookie and returns to unlock", async () => {
    const response = await POST(request());
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(new URL(ROUTE_ADMIN_UNLOCK, request().url).toString());
    expect(cookie).toContain(`${ADMIN_COOKIE_NAME}=`);
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("Path=/admin");
  });
});
