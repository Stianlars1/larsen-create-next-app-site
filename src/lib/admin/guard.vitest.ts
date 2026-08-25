// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ROUTE_ADMIN_UNLOCK } from "@/lib/routes";
import { mintAdminSession } from "./session";
import {
  readAdminSession,
  requireAdminConfigured,
  requireAdminSession,
} from "./guard";

const PASSWORD = "p".repeat(20);
const SECRET = "s".repeat(32);

const mockedCookies = vi.mocked(cookies);

function configureAdmin() {
  vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
  vi.stubEnv("ADMIN_SESSION_SECRET", SECRET);
}

function withCookie(value?: string) {
  mockedCookies.mockResolvedValue({
    get: (name: string) => (name === "lcna_admin" && value ? { value } : undefined),
  } as never);
}

describe("admin guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withCookie();
  });

  it("404s when the admin is not configured", () => {
    expect(() => requireAdminConfigured()).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("reads no session when configuration is absent", async () => {
    await expect(readAdminSession()).resolves.toBe(false);
  });

  it("passes a valid signed cookie", async () => {
    configureAdmin();
    withCookie(mintAdminSession(new Date(), SECRET));

    await expect(requireAdminSession()).resolves.toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects an unconfigured session to unlock only after configuration exists", async () => {
    configureAdmin();

    await expect(requireAdminSession()).rejects.toThrow(
      `NEXT_REDIRECT:${ROUTE_ADMIN_UNLOCK}`,
    );
    expect(redirect).toHaveBeenCalledWith(ROUTE_ADMIN_UNLOCK);
  });

  it("does not accept a cookie signed by another secret", async () => {
    configureAdmin();
    withCookie(mintAdminSession(new Date(), "o".repeat(32)));

    await expect(requireAdminSession()).rejects.toThrow(
      `NEXT_REDIRECT:${ROUTE_ADMIN_UNLOCK}`,
    );
  });
});
