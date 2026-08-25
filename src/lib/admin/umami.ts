import "server-only";

import { PRODUCT_EVENT_NAMES, type ProductEventName } from "@/lib/analytics/product-event-contract";
import type { AdminFailureReason, AdminResult } from "./result";
import type { AnalyticsWindow } from "./time-window";

const TIMEOUT_MS = 4_000;
const TOKEN_CACHE_MS = 55 * 60 * 1_000;

export type UmamiEnvironment = Record<string, string | undefined> & {
  UMAMI_API_URL?: string;
  UMAMI_WEBSITE_ID?: string;
  UMAMI_API_KEY?: string;
  UMAMI_USERNAME?: string;
  UMAMI_PASSWORD?: string;
};

export type UmamiStats = {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totalTime: number;
};

export type UmamiSeriesPoint = { x: string; y: number };

export type UmamiPageviewSeries = {
  pageviews: UmamiSeriesPoint[];
  visitors: UmamiSeriesPoint[];
};

export type UmamiEventStats = {
  events: number;
  visitors: number;
  visits: number;
};

export type UmamiEventPoint = {
  event: ProductEventName;
  at: string;
  count: number;
};

export type UmamiEventValue = {
  value: string;
  total: number;
};

type UmamiConfig = {
  base: string;
  websiteId: string;
  apiKey?: string;
  username?: string;
  password?: string;
};

type CachedToken = {
  base: string;
  username: string;
  token: string;
  expiresAt: number;
};

type HeaderResult =
  | { ok: true; headers: Record<string, string>; retryable: boolean }
  | { ok: false; reason: AdminFailureReason };

let cachedToken: CachedToken | null = null;

function readConfig(environment: UmamiEnvironment): UmamiConfig | null {
  const base = environment.UMAMI_API_URL?.trim().replace(/\/$/, "");
  const websiteId = environment.UMAMI_WEBSITE_ID?.trim();
  const apiKey = environment.UMAMI_API_KEY;
  const username = environment.UMAMI_USERNAME;
  const password = environment.UMAMI_PASSWORD;

  if (!base || !websiteId) return null;
  try {
    new URL(base);
  } catch {
    return null;
  }
  if (apiKey) return { base, websiteId, apiKey };
  if (username && password) return { base, websiteId, username, password };
  return null;
}

function failure<T>(reason: AdminFailureReason): AdminResult<T> {
  return { ok: false, reason };
}

function success<T>(data: T): AdminResult<T> {
  return { ok: true, data, at: new Date().toISOString() };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function numberValue(value: unknown): number | null {
  const raw = isRecord(value) && "value" in value ? value.value : value;
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? raw : null;
}

function series(value: unknown): UmamiSeriesPoint[] | null {
  if (!Array.isArray(value)) return null;
  const points: UmamiSeriesPoint[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.x !== "string") return null;
    const y = numberValue(entry.y);
    if (y === null) return null;
    points.push({ x: entry.x, y });
  }
  return points;
}

function classify(error: unknown): AdminFailureReason {
  const name = (error as Error | undefined)?.name;
  return name === "TimeoutError" || name === "AbortError" ? "timeout" : "unreachable";
}

function windowParams(window: AnalyticsWindow): Record<string, string> {
  return {
    startAt: String(window.startAt),
    endAt: String(window.endAt),
    unit: window.unit,
    timezone: window.timezone,
  };
}

function isProductEventName(value: string): value is ProductEventName {
  return (PRODUCT_EVENT_NAMES as readonly string[]).includes(value);
}

export function resetUmamiTokenCacheForTests(): void {
  cachedToken = null;
}

export function createUmamiClient(
  environment: UmamiEnvironment = process.env,
  fetcher: typeof fetch = fetch,
) {
  const config = readConfig(environment);

  async function login(activeConfig: UmamiConfig): Promise<string | AdminFailureReason> {
    if (!activeConfig.username || !activeConfig.password) return "unconfigured";
    try {
      const response = await fetcher(`${activeConfig.base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: activeConfig.username, password: activeConfig.password }),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return "unreachable";
      const body: unknown = await response.json();
      if (!isRecord(body) || typeof body.token !== "string" || body.token.length === 0) {
        return "invalid_response";
      }
      cachedToken = {
        base: activeConfig.base,
        username: activeConfig.username,
        token: body.token,
        expiresAt: Date.now() + TOKEN_CACHE_MS,
      };
      return body.token;
    } catch (error) {
      return classify(error);
    }
  }

  async function headers(activeConfig: UmamiConfig, fresh = false): Promise<HeaderResult> {
    if (activeConfig.apiKey) {
      return { ok: true as const, headers: { "x-umami-api-key": activeConfig.apiKey }, retryable: false };
    }
    if (
      !fresh &&
      cachedToken &&
      cachedToken.base === activeConfig.base &&
      cachedToken.username === activeConfig.username &&
      cachedToken.expiresAt > Date.now()
    ) {
      return {
        ok: true as const,
        headers: { Authorization: `Bearer ${cachedToken.token}` },
        retryable: true,
      };
    }

    const token = await login(activeConfig);
    if (typeof token !== "string") return { ok: false as const, reason: token };
    return { ok: true as const, headers: { Authorization: `Bearer ${token}` }, retryable: true };
  }

  async function get(path: string, params: Record<string, string> = {}): Promise<AdminResult<unknown>> {
    if (!config) return failure("unconfigured");

    const url = new URL(`${config.base}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const firstHeaders = await headers(config);
    if (!firstHeaders.ok) return failure(firstHeaders.reason);

    async function send(requestHeaders: Record<string, string>) {
      return fetcher(url.toString(), {
        headers: requestHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    }

    try {
      let response = await send(firstHeaders.headers);
      if (response.status === 401 && firstHeaders.retryable) {
        cachedToken = null;
        const retryHeaders = await headers(config, true);
        if (!retryHeaders.ok) return failure(retryHeaders.reason);
        response = await send(retryHeaders.headers);
      }
      if (!response.ok) return failure("unreachable");
      try {
        return success(await response.json());
      } catch {
        return failure("invalid_response");
      }
    } catch (error) {
      return failure(classify(error));
    }
  }

  async function validated<T>(
    path: string,
    params: Record<string, string>,
    parse: (value: unknown) => T | null,
  ): Promise<AdminResult<T>> {
    const result = await get(path, params);
    if (!result.ok) return result;
    const data = parse(result.data);
    return data === null ? failure("invalid_response") : { ...result, data };
  }

  const websitePath = config ? `/websites/${encodeURIComponent(config.websiteId)}` : "/websites/missing";

  return {
    getActive: () =>
      validated(`${websitePath}/active`, {}, (value) => {
        if (!isRecord(value)) return null;
        const visitors = numberValue(value.visitors);
        return visitors === null ? null : { visitors };
      }),
    getStats: (window: AnalyticsWindow) =>
      validated(`${websitePath}/stats`, windowParams(window), (value) => {
        if (!isRecord(value)) return null;
        const pageviews = numberValue(value.pageviews);
        const visitors = numberValue(value.visitors);
        const visits = numberValue(value.visits);
        const bounces = numberValue(value.bounces);
        const totalTime = numberValue(value.totaltime ?? value.totalTime);
        return pageviews === null || visitors === null || visits === null || bounces === null || totalTime === null
          ? null
          : { pageviews, visitors, visits, bounces, totalTime };
      }),
    getPageviews: (window: AnalyticsWindow) =>
      validated(`${websitePath}/pageviews`, windowParams(window), (value) => {
        if (!isRecord(value)) return null;
        const pageviews = series(value.pageviews);
        const visitors = series(value.sessions);
        return pageviews === null || visitors === null ? null : { pageviews, visitors };
      }),
    getEventStats: (window: AnalyticsWindow, event: ProductEventName) =>
      validated(`${websitePath}/events/stats`, { ...windowParams(window), event }, (value) => {
        const body = isRecord(value) && isRecord(value.data) ? value.data : value;
        if (!isRecord(body)) return null;
        const events = numberValue(body.events);
        const visitors = numberValue(body.visitors);
        const visits = numberValue(body.visits);
        return events === null || visitors === null || visits === null ? null : { events, visitors, visits };
      }),
    getEventSeries: (window: AnalyticsWindow) =>
      validated(`${websitePath}/events/series`, windowParams(window), (value) => {
        if (!Array.isArray(value)) return null;
        const events: UmamiEventPoint[] = [];
        for (const entry of value) {
          if (!isRecord(entry) || typeof entry.x !== "string" || typeof entry.t !== "string") return null;
          const count = numberValue(entry.y);
          if (count === null) return null;
          if (isProductEventName(entry.x)) events.push({ event: entry.x, at: entry.t, count });
        }
        return events;
      }),
    getEventValues: (window: AnalyticsWindow, event: ProductEventName, propertyName: "surface") =>
      validated(
        `${websitePath}/event-data/values`,
        { ...windowParams(window), event, propertyName },
        (value) => {
          if (!Array.isArray(value)) return null;
          const rows: UmamiEventValue[] = [];
          for (const entry of value) {
            if (!isRecord(entry) || typeof entry.value !== "string") return null;
            const total = numberValue(entry.total);
            if (total === null) return null;
            rows.push({ value: entry.value, total });
          }
          return rows;
        },
      ),
  };
}

export const getUmamiActive = () => createUmamiClient().getActive();
export const getUmamiStats = (window: AnalyticsWindow) => createUmamiClient().getStats(window);
export const getUmamiPageviews = (window: AnalyticsWindow) => createUmamiClient().getPageviews(window);
export const getUmamiEventStats = (window: AnalyticsWindow, event: ProductEventName) =>
  createUmamiClient().getEventStats(window, event);
export const getUmamiEventSeries = (window: AnalyticsWindow) =>
  createUmamiClient().getEventSeries(window);
export const getUmamiEventValues = (
  window: AnalyticsWindow,
  event: ProductEventName,
  propertyName: "surface",
) => createUmamiClient().getEventValues(window, event, propertyName);
