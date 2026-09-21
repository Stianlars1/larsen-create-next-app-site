import { NextResponse } from "next/server";

import { readAdminConfig } from "@/lib/admin/config";
import { checkAdminFormOrigin } from "@/lib/admin/origin";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/session";
import { ROUTE_ADMIN, ROUTE_ADMIN_UNLOCK } from "@/lib/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!readAdminConfig()) return new Response(null, { status: 404 });

  const origin = checkAdminFormOrigin(request);
  if (!origin.ok) {
    return Response.json(
      { error: { code: "invalid_origin", message: "The admin requires a same-origin request." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.redirect(new URL(ROUTE_ADMIN_UNLOCK, request.url), 303);
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "strict",
    path: ROUTE_ADMIN,
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
