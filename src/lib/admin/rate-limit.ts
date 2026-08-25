import { createHash } from "node:crypto";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1_000;

type AttemptRecord = {
  count: number;
  windowStart: number;
};

const attempts = new Map<string, AttemptRecord>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function attemptKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const input = (forwarded || "unknown").slice(0, 128);
  return createHash("sha256").update(input).digest("base64url");
}

export function consumeAttempt(key: string, now: number = Date.now()): RateLimitResult {
  const current = attempts.get(key);
  if (!current || now - current.windowStart >= WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - current.windowStart)) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetAttempts(key: string): void {
  attempts.delete(key);
}

export function clearAllAttempts(): void {
  attempts.clear();
}
