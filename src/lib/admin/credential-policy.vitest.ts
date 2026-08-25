// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  MAX_ADMIN_PASSWORD_BYTES,
  MAX_ADMIN_SESSION_SECRET_BYTES,
  MIN_ADMIN_PASSWORD_CODE_POINTS,
  MIN_ADMIN_SESSION_SECRET_BYTES,
  validateAdminCredentials,
} from "./credential-policy";

describe("admin credential policy", () => {
  it("accepts the exact lower bounds", () => {
    expect(
      validateAdminCredentials(
        "x".repeat(MIN_ADMIN_PASSWORD_CODE_POINTS),
        "s".repeat(MIN_ADMIN_SESSION_SECRET_BYTES),
      ),
    ).toEqual({ ok: true });
  });

  it("counts password code points rather than UTF-16 units", () => {
    expect(
      validateAdminCredentials(
        "😀".repeat(MIN_ADMIN_PASSWORD_CODE_POINTS),
        "s".repeat(MIN_ADMIN_SESSION_SECRET_BYTES),
      ),
    ).toEqual({ ok: true });
  });

  it("rejects a missing or short password", () => {
    expect(validateAdminCredentials(undefined, "s".repeat(32))).toEqual({
      ok: false,
      reason: "password_missing",
    });
    expect(validateAdminCredentials("x".repeat(19), "s".repeat(32))).toEqual({
      ok: false,
      reason: "password_too_short",
    });
  });

  it("rejects a password over the byte ceiling", () => {
    expect(
      validateAdminCredentials("x".repeat(MAX_ADMIN_PASSWORD_BYTES + 1), "s".repeat(32)),
    ).toEqual({ ok: false, reason: "password_too_large" });
  });

  it("rejects a missing, short, or oversized session secret", () => {
    expect(validateAdminCredentials("x".repeat(20), undefined)).toEqual({
      ok: false,
      reason: "session_secret_missing",
    });
    expect(validateAdminCredentials("x".repeat(20), "s".repeat(31))).toEqual({
      ok: false,
      reason: "session_secret_too_short",
    });
    expect(
      validateAdminCredentials("x".repeat(20), "s".repeat(MAX_ADMIN_SESSION_SECRET_BYTES + 1)),
    ).toEqual({ ok: false, reason: "session_secret_too_large" });
  });
});
