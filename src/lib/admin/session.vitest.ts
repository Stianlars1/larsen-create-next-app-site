// @vitest-environment node

import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ADMIN_SESSION_SECONDS,
  mintAdminSession,
  passwordMatches,
  verifyAdminSession,
} from "./session";

const SECRET = "s".repeat(32);
const OTHER_SECRET = "o".repeat(32);
const NOW = new Date("2026-08-25T12:00:00.000Z");

describe("admin sessions", () => {
  it("round trips a signed session", () => {
    const token = mintAdminSession(NOW, SECRET);
    const payload = verifyAdminSession(token, NOW, SECRET);

    expect(payload?.iat).toBe(Math.floor(NOW.getTime() / 1_000));
    expect(payload?.exp).toBe(payload!.iat + ADMIN_SESSION_SECONDS);
    expect(payload?.jti).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("uses a new random token id for every session", () => {
    expect(mintAdminSession(NOW, SECRET)).not.toBe(mintAdminSession(NOW, SECRET));
  });

  it("rejects a modified payload, signature, version, and secret", () => {
    const token = mintAdminSession(NOW, SECRET);
    const [version, encoded, signature] = token.split(".");
    const modifiedPayload = Buffer.from(
      JSON.stringify({ iat: 1, exp: 9_999_999_999, jti: "forged" }),
    ).toString("base64url");
    const modifiedSignature = `${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`;

    expect(verifyAdminSession(`${version}.${modifiedPayload}.${signature}`, NOW, SECRET)).toBeNull();
    expect(verifyAdminSession(`${version}.${encoded}.${modifiedSignature}`, NOW, SECRET)).toBeNull();
    expect(verifyAdminSession(`v2.${encoded}.${signature}`, NOW, SECRET)).toBeNull();
    expect(verifyAdminSession(token, NOW, OTHER_SECRET)).toBeNull();
  });

  it("rejects wrong-length signatures without throwing", () => {
    const [version, encoded] = mintAdminSession(NOW, SECRET).split(".");
    expect(() => verifyAdminSession(`${version}.${encoded}.deadbeef`, NOW, SECRET)).not.toThrow();
    expect(verifyAdminSession(`${version}.${encoded}.deadbeef`, NOW, SECRET)).toBeNull();
  });

  it("rejects expired and malformed sessions", () => {
    const token = mintAdminSession(NOW, SECRET);
    const expiredAt = new Date(NOW.getTime() + (ADMIN_SESSION_SECONDS + 1) * 1_000);

    expect(verifyAdminSession(token, expiredAt, SECRET)).toBeNull();
    expect(verifyAdminSession(undefined, NOW, SECRET)).toBeNull();
    expect(verifyAdminSession("not.a.session", NOW, SECRET)).toBeNull();

    const encoded = Buffer.from("not-json").toString("base64url");
    const signature = createHmac("sha256", SECRET).update(`v1.${encoded}`).digest("base64url");
    expect(verifyAdminSession(`v1.${encoded}.${signature}`, NOW, SECRET)).toBeNull();
  });

  it("compares passwords without leaking a length mismatch through an exception", () => {
    expect(passwordMatches("correct", "correct")).toBe(true);
    expect(passwordMatches("wrong", "correct")).toBe(false);
    expect(() => passwordMatches("x", "a much longer password")).not.toThrow();
  });
});
