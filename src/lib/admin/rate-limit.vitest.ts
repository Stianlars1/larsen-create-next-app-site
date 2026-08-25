// @vitest-environment node

import { beforeEach, describe, expect, it } from "vitest";

import { attemptKey, clearAllAttempts, consumeAttempt, resetAttempts } from "./rate-limit";

const START = 1_000_000;
const WINDOW_MS = 15 * 60 * 1_000;

describe("admin rate limiting", () => {
  beforeEach(() => clearAllAttempts());

  it("allows five attempts then blocks the sixth", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(consumeAttempt("visitor", START).allowed).toBe(true);
    }
    expect(consumeAttempt("visitor", START)).toMatchObject({ allowed: false });
  });

  it("resets after the window and successful unlock", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) consumeAttempt("visitor", START);
    expect(consumeAttempt("visitor", START).allowed).toBe(false);
    expect(consumeAttempt("visitor", START + WINDOW_MS).allowed).toBe(true);

    for (let attempt = 0; attempt < 4; attempt += 1) consumeAttempt("visitor", START + WINDOW_MS);
    resetAttempts("visitor");
    expect(consumeAttempt("visitor", START + WINDOW_MS).allowed).toBe(true);
  });

  it("keeps visitor buckets independent", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) consumeAttempt("one", START);
    expect(consumeAttempt("one", START).allowed).toBe(false);
    expect(consumeAttempt("two", START).allowed).toBe(true);
  });

  it("hashes the forwarded address without retaining it as the key", () => {
    const first = attemptKey(new Request("https://example.test", { headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" } }));
    const same = attemptKey(new Request("https://example.test", { headers: { "x-forwarded-for": "203.0.113.1" } }));
    const different = attemptKey(new Request("https://example.test", { headers: { "x-forwarded-for": "203.0.113.2" } }));

    expect(first).toBe(same);
    expect(first).not.toBe(different);
    expect(first).not.toContain("203.0.113.1");
  });
});
