import "server-only";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ROUTE_ADMIN_UNLOCK } from "@/lib/routes";
import { readAdminConfig } from "./config";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "./session";

export function requireAdminConfigured(): void {
  if (!readAdminConfig()) notFound();
}

export async function readAdminSession(): Promise<boolean> {
  const config = readAdminConfig();
  if (!config) return false;

  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSession(token, new Date(), config.sessionSecret) !== null;
}

export async function requireAdminSession(): Promise<void> {
  requireAdminConfigured();
  if (!(await readAdminSession())) redirect(ROUTE_ADMIN_UNLOCK);
}
