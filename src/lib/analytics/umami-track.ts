type EventData = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: EventData) => void;
    };
  }
}

const MAX_PENDING = 25;
const pending: Array<{ name: string; data: EventData }> = [];

export function flushPendingUmamiEvents(): void {
  if (typeof window === "undefined" || !window.umami) return;

  while (pending.length > 0) {
    const next = pending.shift();
    if (!next) return;
    try {
      window.umami.track(next.name, next.data);
    } catch {
      return;
    }
  }
}

export function umamiTrack(name: string, data: EventData = {}): void {
  if (typeof window === "undefined") return;

  if (window.umami) {
    try {
      window.umami.track(name, data);
    } catch {
      return;
    }
    return;
  }

  if (pending.length < MAX_PENDING) pending.push({ name, data });
}
