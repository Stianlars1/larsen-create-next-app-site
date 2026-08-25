import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("..", import.meta.url));

function run(environment = {}) {
  return spawnSync(process.execPath, ["scripts/preflight.mjs"], {
    cwd,
    encoding: "utf8",
    env: { PATH: process.env.PATH, ...environment },
  });
}

const PASSWORD = "p".repeat(20);
const SECRET = "s".repeat(32);

test("preflight permits an entirely unconfigured local admin", () => {
  const result = run();

  assert.equal(result.status, 0, result.stderr);
});

test("preflight rejects partial or weak admin configuration without echoing secrets", () => {
  const partial = run({ ADMIN_PASSWORD: PASSWORD });
  const weak = run({ ADMIN_PASSWORD: "hidden", ADMIN_SESSION_SECRET: SECRET });

  assert.equal(partial.status, 1);
  assert.match(partial.stderr, /ADMIN_PASSWORD and ADMIN_SESSION_SECRET/);
  assert.equal(weak.status, 1);
  assert.match(weak.stderr, /password_too_short/);
  assert.doesNotMatch(weak.stderr, /hidden/);
});

test("preflight accepts complete valid admin configuration", () => {
  const result = run({ ADMIN_PASSWORD: PASSWORD, ADMIN_SESSION_SECRET: SECRET });

  assert.equal(result.status, 0, result.stderr);
});

test("preflight rejects partial public and server Umami configuration", () => {
  const publicPartial = run({ NEXT_PUBLIC_UMAMI_SRC: "https://analytics.example/script.js" });
  const serverPartial = run({
    UMAMI_API_URL: "https://analytics.example/api",
    UMAMI_WEBSITE_ID: "website-id",
  });

  assert.equal(publicPartial.status, 1);
  assert.match(publicPartial.stderr, /NEXT_PUBLIC_UMAMI_SRC and NEXT_PUBLIC_UMAMI_WEBSITE_ID/);
  assert.equal(serverPartial.status, 1);
  assert.match(serverPartial.stderr, /UMAMI_API_KEY must be set/);
});

test("preflight accepts complete Umami Cloud configuration", () => {
  const apiKey = run({
    NEXT_PUBLIC_UMAMI_SRC: "https://analytics.example/script.js",
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: "website-id",
    UMAMI_API_URL: "https://analytics.example/api",
    UMAMI_WEBSITE_ID: "website-id",
    UMAMI_API_KEY: "api-key",
  });

  assert.equal(apiKey.status, 0, apiKey.stderr);
});
