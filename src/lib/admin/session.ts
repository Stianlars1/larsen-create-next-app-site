import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { requireAdminConfig } from "./config";

export const ADMIN_COOKIE_NAME = "lcna_admin";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

const VERSION = "v1";

export type AdminSessionPayload = {
  iat: number;
  exp: number;
  jti: string;
};

function sign(signingInput: string, secret: string): string {
  return createHmac("sha256", secret).update(signingInput).digest("base64url");
}

function defaultSecret(): string {
  return requireAdminConfig().sessionSecret;
}

export function mintAdminSession(
  now: Date = new Date(),
  secret: string = defaultSecret(),
): string {
  const iat = Math.floor(now.getTime() / 1_000);
  const payload: AdminSessionPayload = {
    iat,
    exp: iat + ADMIN_SESSION_SECONDS,
    jti: randomBytes(16).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${VERSION}.${encoded}`;
  return `${signingInput}.${sign(signingInput, secret)}`;
}

function isPayload(value: unknown): value is AdminSessionPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<AdminSessionPayload>;
  return (
    Number.isInteger(payload.iat) &&
    Number.isInteger(payload.exp) &&
    typeof payload.jti === "string" &&
    payload.jti.length > 0
  );
}

export function verifyAdminSession(
  token: string | null | undefined,
  now: Date = new Date(),
  secret: string = defaultSecret(),
): AdminSessionPayload | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [version, encoded, providedSignature] = parts;
  if (version !== VERSION || !encoded || !providedSignature) return null;

  const expectedSignature = sign(`${VERSION}.${encoded}`, secret);
  const providedBuffer = Buffer.from(providedSignature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");
  if (providedBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isPayload(payload)) return null;
  if (payload.exp <= Math.floor(now.getTime() / 1_000)) return null;
  if (payload.exp <= payload.iat) return null;

  return payload;
}

export function passwordMatches(submitted: string, expected: string): boolean {
  const submittedHash = createHash("sha256").update(submitted).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(submittedHash, expectedHash);
}
