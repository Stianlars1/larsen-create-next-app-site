import { NextResponse } from "next/server";

import { readAdminConfig } from "@/lib/admin/config";
import { checkAdminFormOrigin } from "@/lib/admin/origin";
import { attemptKey, consumeAttempt, resetAttempts } from "@/lib/admin/rate-limit";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_SECONDS,
  mintAdminSession,
  passwordMatches,
} from "@/lib/admin/session";
import { MAX_ADMIN_PASSWORD_BYTES } from "@/lib/admin/credential-policy";
import { ROUTE_ADMIN, ROUTE_ADMIN_UNLOCK } from "@/lib/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const ADMIN_UNLOCK_DELAY_MS = 350;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ADMIN_UNLOCK_DELAY_MS));
}

function unlockRedirect(request: Request, reason: "invalid" | "rate", retryAfterSeconds?: number) {
  const url = new URL(ROUTE_ADMIN_UNLOCK, request.url);
  url.searchParams.set("e", reason);
  if (retryAfterSeconds) url.searchParams.set("retry", String(retryAfterSeconds));

  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  if (retryAfterSeconds) response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

function passwordByteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

export async function POST(request: Request): Promise<Response> {
  const config = readAdminConfig();
  if (!config) return new Response(null, { status: 404 });

  const origin = checkAdminFormOrigin(request);
  if (!origin.ok) {
    return Response.json(
      { error: { code: "invalid_origin", message: "The admin requires a same-origin request." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const key = attemptKey(request);
  const limit = consumeAttempt(key);
  if (!limit.allowed) {
    await delay();
    return unlockRedirect(request, "rate", limit.retryAfterSeconds);
  }

  let submitted = "";
  try {
    submitted = String((await request.formData()).get("password") ?? "");
  } catch {
    submitted = "";
  }

  const valid =
    passwordByteLength(submitted) <= MAX_ADMIN_PASSWORD_BYTES &&
    passwordMatches(submitted, config.password);
  await delay();

  if (!valid) return unlockRedirect(request, "invalid");

  resetAttempts(key);
  const response = NextResponse.redirect(new URL(ROUTE_ADMIN, request.url), 303);
  response.cookies.set(ADMIN_COOKIE_NAME, mintAdminSession(new Date(), config.sessionSecret), {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "strict",
    path: ROUTE_ADMIN,
    maxAge: ADMIN_SESSION_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
