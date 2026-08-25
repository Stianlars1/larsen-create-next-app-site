import "server-only";

import { PACKAGE_NAME, PACKAGE_VERSION } from "@/lib/content";
import type { AdminFailureReason, AdminResult } from "./result";

const TIMEOUT_MS = 4_000;
const ENCODED_PACKAGE_NAME = encodeURIComponent(PACKAGE_NAME);

export type DownloadPoint = {
  day: string;
  downloads: number;
};

export type NpmDownloads = {
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
  daily: DownloadPoint[];
};

export type NpmPackageMeta = {
  latestVersion: string;
  publishedAt: string;
  siteVersion: string;
  drift: boolean;
};

export type NpmSnapshot = {
  downloads: AdminResult<NpmDownloads>;
  package: AdminResult<NpmPackageMeta>;
};

function success<T>(data: T): AdminResult<T> {
  return { ok: true, data, at: new Date().toISOString() };
}

function failure<T>(reason: AdminFailureReason): AdminResult<T> {
  return { ok: false, reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function classify(error: unknown): AdminFailureReason {
  const name = (error as Error | undefined)?.name;
  return name === "TimeoutError" || name === "AbortError" ? "timeout" : "unreachable";
}

function isDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

export function createNpmClient(fetcher: typeof fetch = fetch) {
  async function get(url: string): Promise<AdminResult<unknown>> {
    try {
      const response = await fetcher(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
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

  async function getDownloads(): Promise<AdminResult<NpmDownloads>> {
    const [lastDay, lastWeek, range] = await Promise.all([
      get(`https://api.npmjs.org/downloads/point/last-day/${ENCODED_PACKAGE_NAME}`),
      get(`https://api.npmjs.org/downloads/point/last-week/${ENCODED_PACKAGE_NAME}`),
      get(`https://api.npmjs.org/downloads/range/last-month/${ENCODED_PACKAGE_NAME}`),
    ]);
    if (!lastDay.ok) return lastDay;
    if (!lastWeek.ok) return lastWeek;
    if (!range.ok) return range;
    if (!isRecord(lastDay.data) || !isRecord(lastWeek.data) || !isRecord(range.data)) {
      return failure("invalid_response");
    }

    const day = nonNegativeNumber(lastDay.data.downloads);
    const week = nonNegativeNumber(lastWeek.data.downloads);
    if (!Array.isArray(range.data.downloads) || day === null || week === null) {
      return failure("invalid_response");
    }

    const daily: DownloadPoint[] = [];
    for (const point of range.data.downloads) {
      if (!isRecord(point) || !isDay(point.day)) return failure("invalid_response");
      const downloads = nonNegativeNumber(point.downloads);
      if (downloads === null) return failure("invalid_response");
      daily.push({ day: point.day, downloads });
    }
    daily.sort((left, right) => left.day.localeCompare(right.day));

    return success({
      lastDay: day,
      lastWeek: week,
      lastMonth: daily.reduce((total, point) => total + point.downloads, 0),
      daily,
    });
  }

  async function getPackage(): Promise<AdminResult<NpmPackageMeta>> {
    const result = await get(`https://registry.npmjs.org/${ENCODED_PACKAGE_NAME}`);
    if (!result.ok) return result;
    if (!isRecord(result.data) || !isRecord(result.data["dist-tags"]) || !isRecord(result.data.time)) {
      return failure("invalid_response");
    }

    const latestVersion = result.data["dist-tags"].latest;
    if (typeof latestVersion !== "string" || latestVersion.length === 0) return failure("invalid_response");
    const publishedAt = result.data.time[latestVersion];
    if (typeof publishedAt !== "string" || !Number.isFinite(Date.parse(publishedAt))) {
      return failure("invalid_response");
    }

    return success({
      latestVersion,
      publishedAt,
      siteVersion: PACKAGE_VERSION,
      drift: latestVersion !== PACKAGE_VERSION,
    });
  }

  return {
    async getSnapshot(): Promise<NpmSnapshot> {
      const [downloads, packageMeta] = await Promise.all([getDownloads(), getPackage()]);
      return { downloads, package: packageMeta };
    },
  };
}

export const getNpmSnapshot = () => createNpmClient().getSnapshot();
