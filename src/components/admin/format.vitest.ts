import { describe, expect, it } from "vitest";

import { formatCount, formatDuration, formatLatency, formatRate, reasonLabel } from "./format";

describe("admin formatting", () => {
  it("formats counts, rates, durations, and latency honestly", () => {
    expect(formatCount(1_234)).toBe("1,234");
    expect(formatRate(0.25)).toBe("25%");
    expect(formatRate(null)).toBe("Unavailable");
    expect(formatDuration(65)).toBe("1m 5s");
    expect(formatLatency(null)).toBe("Unavailable");
    expect(formatLatency(12)).toBe("12 ms");
  });

  it("uses readable failure labels", () => {
    expect(reasonLabel("unconfigured")).toBe("Not configured");
    expect(reasonLabel("timeout")).toBe("Timed out");
    expect(reasonLabel("invalid_response")).toBe("Invalid response");
  });
});
