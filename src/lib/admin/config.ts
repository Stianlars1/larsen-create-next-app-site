import "server-only";

import { validateAdminCredentials } from "./credential-policy";

export type AdminEnvironment = Record<string, string | undefined> & {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

export type AdminConfig = {
  password: string;
  sessionSecret: string;
};

export function readAdminConfig(
  environment: AdminEnvironment = process.env,
): AdminConfig | null {
  const password = environment.ADMIN_PASSWORD;
  const sessionSecret = environment.ADMIN_SESSION_SECRET;
  const validation = validateAdminCredentials(password, sessionSecret);
  if (!validation.ok || password === undefined || sessionSecret === undefined) return null;

  return { password, sessionSecret };
}

export function requireAdminConfig(
  environment: AdminEnvironment = process.env,
): AdminConfig {
  const config = readAdminConfig(environment);
  if (!config) throw new Error("Admin is not configured.");
  return config;
}
