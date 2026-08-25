// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { clearAllAttempts } from "@/lib/admin/rate-limit";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/session";
import { ROUTE_ADMIN, ROUTE_ADMIN_UNLOCK } from "@/lib/routes";
import { ADMIN_UNLOCK_DELAY_MS, POST } from "./route";

const PASSWORD = "p".repeat(20);
const SECRET = "s".repeat(32);

function request(password: string, headers: Record<string, string> = {}) {
  return new Request("https://create-next-app.larsenutvikling.no/admin/session", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "sec-fetch-site": "same-origin",
      "x-forwarded-for": "203.0.113.10",
      ...headers,
    },
    body: new URLSearchParams({ password }),
  });
}

describe("admin unlock route", () => {
  beforeEach(() => {
    clearAllAttempts();
    vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
    vi.stubEnv("ADMIN_SESSION_SECRET", SECRET);
  });

  it("returns 404 before it processes a partially configured console", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "");

    const response = await POST(request(PASSWORD));

    expect(response.status).toBe(404);
  });

  it("rejects cross-site form posts", async () => {
    const response = await POST(request(PASSWORD, { "sec-fetch-site": "cross-site" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "invalid_origin" } });
  });

  it("redirects a wrong password after the fixed delay", async () => {
    const startedAt = Date.now();
    const response = await POST(request("wrong password"));

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(ADMIN_UNLOCK_DELAY_MS - 25);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain(`${ROUTE_ADMIN_UNLOCK}?e=invalid`);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects oversized passwords without setting a cookie", async () => {
    const response = await POST(request("x".repeat(257)));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain(`${ROUTE_ADMIN_UNLOCK}?e=invalid`);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sets a secure signed cookie and redirects after a correct password", async () => {
    const response = await POST(request(PASSWORD));
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(new URL(ROUTE_ADMIN, request(PASSWORD).url).toString());
    expect(cookie).toContain(`${ADMIN_COOKIE_NAME}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toMatch(/SameSite=strict/i);
    expect(cookie).toContain("Path=/admin");
  });
});
