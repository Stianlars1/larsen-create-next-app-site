import type { AdminFailureReason } from "@/lib/admin/result";

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatCount(value: number | null): string {
  return value === null ? "Unavailable" : numberFormatter.format(value);
}

export function formatRate(value: number | null): string {
  return value === null ? "Unavailable" : `${Math.round(value * 100)}%`;
}

export function formatDuration(value: number | null): string {
  if (value === null) return "Unavailable";
  const seconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

export function formatLatency(value: number | null): string {
  return value === null ? "Unavailable" : `${Math.round(value)} ms`;
}

export function formatDate(value: string | null): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Oslo",
  }).format(date);
}

export function reasonLabel(reason: AdminFailureReason): string {
  switch (reason) {
    case "unconfigured":
      return "Not configured";
    case "unauthorized":
      return "Unauthorized";
    case "timeout":
      return "Timed out";
    case "unreachable":
      return "Unavailable";
    case "invalid_response":
      return "Invalid response";
  }
}
