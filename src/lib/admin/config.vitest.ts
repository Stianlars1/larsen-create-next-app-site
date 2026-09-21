// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readAdminConfig, requireAdminConfig } from "./config";

const VALID_PASSWORD = "p".repeat(20);
const VALID_SECRET = "s".repeat(32);

describe("admin configuration", () => {
  it("reads a complete valid configuration without trimming secrets", () => {
    expect(
      readAdminConfig({
        ADMIN_PASSWORD: VALID_PASSWORD,
        ADMIN_SESSION_SECRET: VALID_SECRET,
      }),
    ).toEqual({ password: VALID_PASSWORD, sessionSecret: VALID_SECRET });
  });

  it("fails closed for absent, partial, and invalid configuration", () => {
    expect(readAdminConfig({})).toBeNull();
    expect(readAdminConfig({ ADMIN_PASSWORD: VALID_PASSWORD })).toBeNull();
    expect(readAdminConfig({ ADMIN_SESSION_SECRET: VALID_SECRET })).toBeNull();
    expect(
      readAdminConfig({ ADMIN_PASSWORD: "short", ADMIN_SESSION_SECRET: VALID_SECRET }),
    ).toBeNull();
  });

  it("throws only when protected server code explicitly requires config", () => {
    expect(() => requireAdminConfig({})).toThrow("Admin is not configured");
  });
});
