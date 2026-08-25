import "server-only";

import { SITE_URL } from "@/lib/content";

const TIMEOUT_MS = 4_000;
const USER_AGENT = "larsen-create-next-app-admin-probe/1.0";

export type Probe = {
  name: string;
  detail: string;
  status: "up" | "down" | "unknown";
  latencyMs: number | null;
  note?: string;
};

export type DeploymentIdentity = {
  environment: string;
  commit: string | null;
  branch: string | null;
  region: string | null;
  nodeVersion: string;
};

function timeoutNote(error: unknown): string {
  return (error as Error | undefined)?.name === "TimeoutError" ? "timed out" : "unreachable";
}

export async function probePublicSite(
  fetcher: typeof fetch = fetch,
  siteUrl: string = SITE_URL,
): Promise<Probe> {
  const startedAt = Date.now();
  const request = (method: "HEAD" | "GET") =>
    fetcher(siteUrl, {
      method,
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

  try {
    let response = await request("HEAD");
    if (response.status === 405 || response.status === 501) response = await request("GET");
    const latencyMs = Date.now() - startedAt;
    return response.ok
      ? {
          name: "Public site",
          detail: new URL(siteUrl).host,
          status: "up",
          latencyMs,
        }
      : {
          name: "Public site",
          detail: new URL(siteUrl).host,
          status: "down",
          latencyMs,
          note: `HTTP ${response.status}`,
        };
  } catch (error) {
    return {
      name: "Public site",
      detail: new URL(siteUrl).host,
      status: "down",
      latencyMs: Date.now() - startedAt,
      note: timeoutNote(error),
    };
  }
}

export function deploymentIdentity(
  environment: Record<string, string | undefined> = process.env,
): DeploymentIdentity {
  return {
    environment: environment.VERCEL_ENV ?? "development",
    commit: environment.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    branch: environment.VERCEL_GIT_COMMIT_REF ?? null,
    region: environment.VERCEL_REGION ?? null,
    nodeVersion: process.version,
  };
}
