export const MIN_ADMIN_PASSWORD_CODE_POINTS = 20;
export const MAX_ADMIN_PASSWORD_BYTES = 256;
export const MIN_ADMIN_SESSION_SECRET_BYTES = 32;
export const MAX_ADMIN_SESSION_SECRET_BYTES = 512;

export type CredentialValidation =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "password_missing"
        | "password_too_short"
        | "password_too_large"
        | "session_secret_missing"
        | "session_secret_too_short"
        | "session_secret_too_large";
    };

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

export function validateAdminCredentials(
  password: string | undefined,
  sessionSecret: string | undefined,
): CredentialValidation {
  if (password === undefined || password.length === 0) {
    return { ok: false, reason: "password_missing" };
  }
  if ([...password].length < MIN_ADMIN_PASSWORD_CODE_POINTS) {
    return { ok: false, reason: "password_too_short" };
  }
  if (byteLength(password) > MAX_ADMIN_PASSWORD_BYTES) {
    return { ok: false, reason: "password_too_large" };
  }

  if (sessionSecret === undefined || sessionSecret.length === 0) {
    return { ok: false, reason: "session_secret_missing" };
  }
  if (byteLength(sessionSecret) < MIN_ADMIN_SESSION_SECRET_BYTES) {
    return { ok: false, reason: "session_secret_too_short" };
  }
  if (byteLength(sessionSecret) > MAX_ADMIN_SESSION_SECRET_BYTES) {
    return { ok: false, reason: "session_secret_too_large" };
  }

  return { ok: true };
}
