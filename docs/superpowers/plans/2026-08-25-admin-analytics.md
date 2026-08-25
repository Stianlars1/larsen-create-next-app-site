# Admin Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a password-protected `/admin` dashboard that reports Umami traffic and product use, npm downloads and version drift, and request-time health while retaining independent Vercel Web Analytics and consent-gated GA4.

**Architecture:** Keep authentication, provider clients, and aggregation in focused server-only modules. Public components emit one validated product-event union to Umami, Vercel, and mounted GA4, while one path-aware provider component prevents every analytics script from mounting under `/admin`. The admin page streams one server-rendered dashboard whose data sources fail independently and never expose provider credentials.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript, CSS Modules, Node crypto, Vitest, React Testing Library, self-hosted Umami v3 API, Vercel Web Analytics, GA4, and the public npm registry APIs.

**Spec:** `docs/superpowers/specs/2026-08-25-admin-analytics-design.md`

## Global Constraints

- Read `AGENTS.md`, the design spec, and the relevant local Next.js docs before editing behavior.
- Keep all repository and UI content in English and use only `-` as a dash character.
- Never add Tailwind or edit `src/styles/design-system/`.
- Preserve the unrelated local `AGENTS.md` addition already in the original worktree; stage only the consent-rule hunk introduced by this feature.
- Umami is the only analytics source rendered in `/admin`; never blend or average it with Vercel Analytics or GA4.
- Keep Vercel Web Analytics cookie-free and always on for public routes.
- Keep Umami cookie-free and always on for public routes.
- Keep GA4 consent-gated and optional when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is absent.
- Mount no Umami, Vercel Analytics, GA4, or consent-banner UI on `/admin` or descendants.
- Send no raw command, app name, HEX value, URL, free-form label, IP address, or other PII as product-event data.
- Require `ADMIN_PASSWORD` to contain at least 20 Unicode code points and at most 256 UTF-8 bytes.
- Generate the production admin password with at least 24 random printable characters.
- Require `ADMIN_SESSION_SECRET` to contain at least 32 random bytes and at most 512 UTF-8 bytes.
- Use a 12-hour HMAC-signed `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to `/admin` in HTTPS environments.
- Treat active users as Umami unique visitors in the last five minutes.
- Treat health as a request-time snapshot, not independent uptime evidence.
- Add no database, Clerk dependency, multi-user model, roles, external uptime monitor, or alerting service.
- Test generated/public behavior, not only helper functions.
- Keep local tests, preview behavior, production deployment, and visible provider ingestion as separate evidence boundaries.
- Do not push `main` until the complete local verification gate passes.

## File Map

### Test and configuration foundation

- Modify `package.json` and `package-lock.json` to add Vitest and split Node and Vitest test scripts while keeping `npm test` as the complete unit gate.
- Create `vitest.config.mts` for TS paths, React, and isolated `*.vitest.ts(x)` discovery.
- Create `src/test/setup.ts` for deterministic cleanup.
- Create `scripts/preflight.mjs` and `scripts/preflight.test.mjs` for fail-closed environment validation.

### Admin security

- Create `src/lib/routes.ts` for admin route constants.
- Create `src/lib/admin/credential-policy.ts` for shared size and strength validation.
- Create `src/lib/admin/config.ts` for server-only environment access.
- Create `src/lib/admin/session.ts` for HMAC session minting and verification.
- Create `src/lib/admin/origin.ts` for same-origin form validation.
- Create `src/lib/admin/rate-limit.ts` for the per-instance attempt brake.
- Create `src/lib/admin/result.ts` for honest success/failure result types.
- Create `src/lib/admin/guard.ts` for configured and authenticated route gates.
- Create colocated `*.vitest.ts` files for each security unit.

### Admin routes and presentation

- Create `src/app/admin/layout.tsx` for the configuration gate and non-indexing metadata.
- Create `src/app/admin/(gate)/unlock/page.tsx` and `unlock.module.css` for the zero-JavaScript password form.
- Create `src/app/admin/session/route.ts` and `src/app/admin/session/lock/route.ts` for unlock and logout.
- Create `src/app/admin/(console)/page.tsx`, `loading.tsx`, `error.tsx`, and `console.module.css` for the protected overview.
- Create `src/components/admin/dashboard.tsx`, `panels.tsx`, `format.ts`, and `dashboard.module.css` for synchronous dashboard rendering.
- Create presentational `*.vitest.ts(x)` tests where async Server Components are not involved.

### Public analytics and instrumentation

- Create `src/lib/analytics/events.ts` for the closed product-event union and provider dispatch.
- Create `src/lib/analytics/umami-track.ts` for the bounded early-event queue.
- Create `src/lib/analytics/UmamiAnalytics.tsx` for the public tracker script.
- Create `src/lib/analytics/SiteAnalytics.tsx` for public-path provider composition.
- Create `src/components/analytics/tracked-npm-link.tsx` for npm click intent.
- Modify public copy, palette, builder, hero, footer, and layout components to supply exhaustive event sources.
- Add analytics `*.vitest.ts(x)` tests for validation, consent boundaries, path exclusion, success-only copies, and first-use semantics.

### Provider data

- Create `src/lib/admin/time-window.ts` for shared UTC windows and Oslo display buckets.
- Create `src/lib/admin/umami.ts` for authenticated, validated, timeout-bounded Umami reads.
- Create `src/lib/admin/npm.ts` for npm download and version data.
- Create `src/lib/admin/probes.ts` for the production front-door snapshot and deployment identity.
- Create `src/lib/admin/dashboard.ts` for concurrent orchestration and rate calculations.
- Add provider `*.vitest.ts` tests with controlled fetch responses.

### Documentation and rollout

- Create `.env.example` with names and empty values only.
- Modify `README.md` with admin, analytics, environment, and verification contracts.
- Modify only the analytics-consent rule in `AGENTS.md`; preserve its existing unrelated dirty block.
- Use the existing Tinify Umami credentials without printing them, create a separate website record, configure Vercel, enable Vercel Web Analytics, deploy, and verify production.

---

### Task 1: Establish the test harness and security primitives

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.mts`
- Create: `src/test/setup.ts`
- Create: `src/lib/routes.ts`
- Create: `src/lib/admin/result.ts`
- Create: `src/lib/admin/credential-policy.ts`
- Create: `src/lib/admin/credential-policy.vitest.ts`
- Create: `src/lib/admin/config.ts`
- Create: `src/lib/admin/config.vitest.ts`
- Create: `src/lib/admin/session.ts`
- Create: `src/lib/admin/session.vitest.ts`
- Create: `src/lib/admin/origin.ts`
- Create: `src/lib/admin/origin.vitest.ts`
- Create: `src/lib/admin/rate-limit.ts`
- Create: `src/lib/admin/rate-limit.vitest.ts`

**Interfaces:**
- Produces: `ROUTE_ADMIN`, `ROUTE_ADMIN_UNLOCK`, `ROUTE_ADMIN_SESSION`, and `ROUTE_ADMIN_LOCK`.
- Produces: `AdminResult<T>` with reasons `unconfigured | unauthorized | timeout | unreachable | invalid_response`.
- Produces: `validateAdminCredentials(password, sessionSecret): CredentialValidation`.
- Produces: `readAdminConfig(environment?): AdminConfig | null` and `requireAdminConfig(environment?): AdminConfig`.
- Produces: `passwordMatches(submitted, expected): boolean`.
- Produces: `mintAdminSession(now?, secret?): string` and `verifyAdminSession(token, now?, secret?): AdminSessionPayload | null`.
- Produces: `checkAdminFormOrigin(request): FormOriginResult`.
- Produces: `consumeAttempt(key, now?): RateLimitResult`, `resetAttempts(key)`, and `attemptKey(request): string`.

- [ ] **Step 1: Synchronize installed dependencies with the existing lockfile**

Run:

```bash
npm ci
node -p 'require("./node_modules/@larsen-utvikling/create-next-app/package.json").version'
```

Expected: `npm ci` succeeds and the second command prints `0.6.0`. The pre-existing local `node_modules` currently reports `0.5.1`, so no behavioral verification is valid before this step.

- [ ] **Step 2: Install the official Next.js Vitest stack and preserve the existing Node tests**

Run:

```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

Set scripts to:

```json
{
  "test": "npm run test:node && npm run test:vitest",
  "test:node": "node --test src/lib/*.test.mjs",
  "test:vitest": "vitest run"
}
```

Create `vitest.config.mts`:

```ts
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.vitest.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `src/test/setup.ts`:

```ts
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
```

- [ ] **Step 3: Write failing credential, session, origin, and rate-limit tests**

Use `// @vitest-environment node` in server tests. Mock `server-only` before importing modules that use it.

Pin these credential cases:

```ts
expect(validateAdminCredentials("x".repeat(19), "s".repeat(32))).toEqual({
  ok: false,
  reason: "password_too_short",
});
expect(validateAdminCredentials("x".repeat(20), "s".repeat(32))).toEqual({ ok: true });
expect(validateAdminCredentials("x".repeat(257), "s".repeat(32))).toEqual({
  ok: false,
  reason: "password_too_large",
});
expect(validateAdminCredentials("x".repeat(20), "short")).toEqual({
  ok: false,
  reason: "session_secret_too_short",
});
```

Pin session round-trip, random `jti`, payload tampering, same-length MAC tampering, wrong-length MAC, wrong secret, malformed JSON, and expiry at 12 hours. Pin password success, failure, and oversized-input rejection without throwing.

Pin origin behavior with `Sec-Fetch-Site: same-origin`, cross-site, same-site sibling subdomain, matching fallback `Origin`, `Origin: null`, and missing evidence.

Pin rate limiting so the first five attempts for one ephemeral key pass, the sixth blocks with `Retry-After`, another key remains independent, the window resets after 15 minutes, and success clears the key.

- [ ] **Step 4: Run the new tests and verify the RED state**

Run:

```bash
npm run test:vitest -- src/lib/admin/credential-policy.vitest.ts src/lib/admin/session.vitest.ts src/lib/admin/origin.vitest.ts src/lib/admin/rate-limit.vitest.ts
```

Expected: FAIL because the admin modules do not exist.

- [ ] **Step 5: Implement the minimal security modules**

Use these route constants:

```ts
export const ROUTE_ADMIN = "/admin";
export const ROUTE_ADMIN_UNLOCK = `${ROUTE_ADMIN}/unlock`;
export const ROUTE_ADMIN_SESSION = `${ROUTE_ADMIN}/session`;
export const ROUTE_ADMIN_LOCK = `${ROUTE_ADMIN_SESSION}/lock`;
```

Use this result contract:

```ts
export type AdminFailureReason =
  | "unconfigured"
  | "unauthorized"
  | "timeout"
  | "unreachable"
  | "invalid_response";

export type AdminResult<T> =
  | { ok: true; data: T; at: string }
  | { ok: false; reason: AdminFailureReason };
```

Implement password policy with `[...password].length` for Unicode code points and `Buffer.byteLength(value, "utf8")` for byte ceilings. Never trim either secret. `readAdminConfig` returns `null` for absent, partial, or invalid configuration and `requireAdminConfig` throws only inside already-protected server code.

Use this session payload and cookie contract:

```ts
export const ADMIN_COOKIE_NAME = "lcna_admin";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

export type AdminSessionPayload = {
  iat: number;
  exp: number;
  jti: string;
};
```

Encode three dot-separated parts: literal `v1`, a base64url JSON payload, and a base64url HMAC-SHA256 signature. Compare decoded MAC buffers only after checking equal byte length. Hash submitted and expected passwords with SHA-256 before `timingSafeEqual` so different source lengths cannot throw.

For `attemptKey`, take the first `x-forwarded-for` entry, cap it at 128 characters, hash it with SHA-256, and keep only the hash in module memory. Use `unknown` when the trusted Vercel header is absent. Never log the input or hash.

- [ ] **Step 6: Run the security tests and complete the task gate**

Run:

```bash
npm run test:vitest -- src/lib/admin/credential-policy.vitest.ts src/lib/admin/config.vitest.ts src/lib/admin/session.vitest.ts src/lib/admin/origin.vitest.ts src/lib/admin/rate-limit.vitest.ts
npm run test:node
npx tsc --noEmit
```

Expected: all selected Vitest files pass, the existing Node tests pass, and TypeScript emits no errors.

- [ ] **Step 7: Commit the security foundation**

```bash
git add package.json package-lock.json vitest.config.mts src/test/setup.ts src/lib/routes.ts src/lib/admin/result.ts src/lib/admin/credential-policy.ts src/lib/admin/credential-policy.vitest.ts src/lib/admin/config.ts src/lib/admin/config.vitest.ts src/lib/admin/session.ts src/lib/admin/session.vitest.ts src/lib/admin/origin.ts src/lib/admin/origin.vitest.ts src/lib/admin/rate-limit.ts src/lib/admin/rate-limit.vitest.ts
git diff --cached --check
git commit -m "feat: add admin security foundation"
```

### Task 2: Add the fail-closed admin gate and unlock flow

**Files:**
- Create: `src/lib/admin/guard.ts`
- Create: `src/lib/admin/guard.vitest.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/(gate)/unlock/page.tsx`
- Create: `src/app/admin/(gate)/unlock/unlock.module.css`
- Create: `src/app/admin/session/route.ts`
- Create: `src/app/admin/session/route.vitest.ts`
- Create: `src/app/admin/session/lock/route.ts`
- Create: `src/app/admin/(console)/page.tsx`
- Create: `src/app/admin/(console)/console.module.css`
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: route constants, `readAdminConfig`, session helpers, origin validation, and rate limiting from Task 1.
- Produces: `readAdminSession(): Promise<boolean>`.
- Produces: `requireAdminConfigured(): void` and `requireAdminSession(): Promise<void>`.
- Produces: working `GET /admin`, `GET /admin/unlock`, `POST /admin/session`, and `POST /admin/session/lock` behavior.

- [ ] **Step 1: Write failing guard and route tests**

Mock `next/headers`, `next/navigation`, and `server-only`. Pin these transitions:

```ts
await expect(readAdminSession()).resolves.toBe(false);
await expect(requireAdminSession()).rejects.toThrow("NEXT_REDIRECT:/admin/unlock");
```

Test the route as native `Request` in and `Response` out:

```ts
const request = new Request("https://create-next-app.larsenutvikling.no/admin/session", {
  method: "POST",
  headers: { "sec-fetch-site": "same-origin" },
  body: new URLSearchParams({ password: VALID_PASSWORD }),
});
```

Pin unconfigured 404, cross-site 403, invalid 303 to `/admin/unlock?e=invalid`, rate-limited 303 with `Retry-After`, valid 303 to `/admin`, `Set-Cookie` flags, a submitted value over 256 bytes, and lock expiry with `Max-Age=0`. Use fake timers to advance the identical fixed delay instead of making tests sleep.

- [ ] **Step 2: Run the auth tests and verify the RED state**

Run:

```bash
npm run test:vitest -- src/lib/admin/guard.vitest.ts src/app/admin/session/route.vitest.ts
```

Expected: FAIL because guard and route modules do not exist.

- [ ] **Step 3: Implement the guard and route handlers**

`src/app/admin/layout.tsx` must call `requireAdminConfigured()` before rendering children and export only non-identifying metadata:

```ts
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};
```

`requireAdminSession` reads `(await cookies()).get(ADMIN_COOKIE_NAME)?.value`, verifies it, and redirects to `ROUTE_ADMIN_UNLOCK` on every failure. The protected page calls it as its first line.

The unlock route must:

1. reject unverifiable/cross-site posts;
2. return 404 when config is absent;
3. consume the hashed attempt key;
4. read at most one `password` form field;
5. reject values over 256 UTF-8 bytes;
6. compare with `passwordMatches`;
7. wait the same 350 ms for every configured attempt;
8. set a 303 redirect and signed cookie after success.

Set `secure: new URL(request.url).protocol === "https:"` so production and preview cookies are Secure while HTTP localhost remains testable. Keep every other cookie flag identical across environments.

- [ ] **Step 4: Build the unlock page and temporary protected page**

The unlock page is a Server Component with a plain HTML form, `autocomplete="current-password"`, an error message selected from a closed query-code map, and no client state. If a valid session already exists, redirect to `/admin`.

The temporary protected page renders:

```tsx
<main>
  <h1>Admin</h1>
  <p>The console is unlocked.</p>
  <form action={ROUTE_ADMIN_LOCK} method="post">
    <button type="submit">Lock</button>
  </form>
</main>
```

Use existing tokens in `unlock.module.css` and `console.module.css`; do not edit copied design-system files.

- [ ] **Step 5: Add admin-specific response headers**

Append a `/admin/:path*` entry after the global rule in `next.config.ts`:

```ts
{
  source: "/admin/:path*",
  headers: [
    { key: "Cache-Control", value: "private, no-store, max-age=0" },
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  ],
}
```

- [ ] **Step 6: Run auth verification**

Run:

```bash
npm run test:vitest -- src/lib/admin/guard.vitest.ts src/app/admin/session/route.vitest.ts
npx tsc --noEmit
npm run build
```

Expected: tests and build pass. With no admin environment, the build still passes and runtime admin routes fail closed.

- [ ] **Step 7: Commit the working gate**

```bash
git add src/lib/admin/guard.ts src/lib/admin/guard.vitest.ts src/app/admin next.config.ts
git diff --cached --check
git commit -m "feat: add password-protected admin gate"
```

### Task 3: Add provider-safe public analytics

**Files:**
- Create: `src/lib/analytics/events.ts`
- Create: `src/lib/analytics/events.vitest.ts`
- Create: `src/lib/analytics/umami-track.ts`
- Create: `src/lib/analytics/umami-track.vitest.ts`
- Create: `src/lib/analytics/UmamiAnalytics.tsx`
- Create: `src/lib/analytics/SiteAnalytics.tsx`
- Create: `src/lib/analytics/SiteAnalytics.vitest.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/site/cookie-consent.tsx`
- Modify: `src/lib/analytics/GoogleAnalytics.tsx`
- Modify: `src/lib/analytics/GoogleAnalyticsProvider.tsx`
- Create: `src/lib/analytics/GoogleAnalyticsProvider.vitest.tsx`
- Modify: `src/lib/analytics/google-analytics.ts`
- Modify but do not broadly stage: `AGENTS.md`

**Interfaces:**
- Produces: closed `ProductEvent` union.
- Produces: `trackProductEvent(event: ProductEvent): boolean`.
- Produces: `isAdminPath(pathname: string | null): boolean`.
- Produces: `umamiTrack(name, data)` and `flushPendingUmamiEvents()`.
- Produces: `<SiteAnalytics />`, the only root composition point for analytics and consent UI.

- [ ] **Step 1: Write failing event-contract and provider-boundary tests**

Define tests for all exact allowed property values from the design spec. Assert invalid runtime inputs return `false` and call no sink:

```ts
expect(trackProductEvent({
  name: "command_copied",
  data: { surface: "not-a-surface" },
} as never)).toBe(false);
expect(umamiTrackMock).not.toHaveBeenCalled();
expect(vercelTrackMock).not.toHaveBeenCalled();
expect(gaTrackMock).not.toHaveBeenCalled();
```

Assert a valid event reaches Umami and Vercel, reaches GA only when `window.gtag` exists, and never throws when any provider throws. Assert the bounded Umami queue holds at most 25 early events and flushes in order.

For `SiteAnalytics`, mock `usePathname`, `@vercel/analytics/next`, `next/script`, and the GA provider. Pin public rendering on `/`, null rendering on `/admin`, `/admin/unlock`, and `/admin/anything`, and public rendering on `/administrators`.

For `GoogleAnalyticsProvider`, pin no script before a consent answer, no script after denial, and script plus page tracker only after grant. This fixes the current implementation, which loads the GA script with denied storage before consent even though the repository contract says GA only mounts after acceptance.

- [ ] **Step 2: Run analytics tests and verify the RED state**

Run:

```bash
npm run test:vitest -- src/lib/analytics/events.vitest.ts src/lib/analytics/umami-track.vitest.ts src/lib/analytics/SiteAnalytics.vitest.tsx src/lib/analytics/GoogleAnalyticsProvider.vitest.tsx
```

Expected: FAIL because the product event and provider modules do not exist.

- [ ] **Step 3: Implement the closed event union and runtime validation**

Use explicit literal unions, not free-form maps:

```ts
export const PRODUCT_EVENT_NAMES = [
  "palette_generator_used",
  "command_builder_used",
  "command_copied",
  "theme_css_copied",
  "npm_link_clicked",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type CommandBuilderControl =
  | "app_name"
  | "palette"
  | "seed_hex"
  | "preset"
  | "format"
  | "neutral_tint"
  | "linter"
  | "package_manager"
  | "skills"
  | "git"
  | "install"
  | "cna_version";

export type CommandCopySurface =
  | "hero"
  | "palette_demo"
  | "command_builder"
  | "cli_examples"
  | "footer";

export type ProductEvent =
  | {
      name: "palette_generator_used";
      data: {
        surface: "palette_demo" | "command_builder";
        preset: "shadcn" | "radix" | "css-variables";
        format: "hex" | "rgb" | "hsl" | "hsl-values" | "oklab" | "oklch";
        neutral_tint: "subtle" | "strong";
      };
    }
  | { name: "command_builder_used"; data: { control: CommandBuilderControl } }
  | { name: "command_copied"; data: { surface: CommandCopySurface } }
  | { name: "theme_css_copied"; data: { surface: "palette_demo" } }
  | { name: "npm_link_clicked"; data: { surface: "hero" | "footer" } };
```

Validate exact keys as well as values, so an allowed property plus an unexpected property is rejected. Dispatch only after validation and after checking `!isAdminPath(window.location.pathname)`.

Call:

```ts
umamiTrack(event.name, event.data);
vercelTrack(event.name, event.data);
gaEvent(event.name, event.data);
```

Wrap each provider independently so one failure does not prevent the remaining sinks or reach the product interaction.

- [ ] **Step 4: Implement Umami script loading and root path exclusion**

`UmamiAnalytics` returns null unless both public variables exist. Render `next/script` with `strategy="afterInteractive"`, `data-website-id`, and `onLoad={flushPendingUmamiEvents}`.

`SiteAnalytics` owns the path check:

```tsx
"use client";

export function SiteAnalytics() {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;

  return (
    <>
      <Analytics />
      <UmamiAnalytics />
      <GoogleAnalyticsProvider />
      <CookieConsent />
    </>
  );
}
```

Replace the three root analytics/consent entries in `src/app/layout.tsx` with one `<SiteAnalytics />`.

Update consent copy to state that cookie-free Umami and Vercel traffic analytics run without storage consent and that accepting enables optional Google Analytics cookies. Keep the banner absent when no GA measurement ID exists.

Change `GoogleAnalyticsProvider` so it renders `GoogleAnalytics` and `PageTracker` only when `consent === "granted"`. Since the script no longer exists before consent, set the initial GA consent command in `GoogleAnalytics.tsx` to `analytics_storage: "granted"`; keep every advertising storage mode denied. When a previously granted visitor changes to denied, call `updateGoogleConsent("denied")` before the provider settles to null so an already-loaded global is revoked.

- [ ] **Step 5: Update the repository consent rule without consuming the existing dirty change**

Change only the current consent paragraph to:

```md
- **Cookie-free traffic analytics is always on.** Vercel Analytics and Umami
  use no cookies; GA4 only mounts after the banner is accepted and only when
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. No analytics provider mounts under
  `/admin`.
```

Do not stage `AGENTS.md` in this task. The original worktree already has an unrelated generated Next.js rules block. Task 8 stages only the consent hunk with a dedicated cached patch.

- [ ] **Step 6: Run the analytics gate**

Run:

```bash
npm run test:vitest -- src/lib/analytics/events.vitest.ts src/lib/analytics/umami-track.vitest.ts src/lib/analytics/SiteAnalytics.vitest.tsx src/lib/analytics/GoogleAnalyticsProvider.vitest.tsx
npx tsc --noEmit
npm run build
```

Expected: valid events reach allowed sinks, invalid events reach none, public providers render, admin providers render nothing, and the build passes with Umami and GA unconfigured.

- [ ] **Step 7: Commit analytics code without staging `AGENTS.md`**

```bash
git add src/lib/analytics src/app/layout.tsx src/components/site/cookie-consent.tsx
git diff --cached --check
git commit -m "feat: add privacy-safe analytics providers"
```

Expected after commit: `git status --short` still shows `M AGENTS.md`; no other Task 3 file remains uncommitted.

### Task 4: Instrument every public product action

**Files:**
- Create: `src/components/analytics/tracked-npm-link.tsx`
- Create: `src/components/analytics/tracked-npm-link.vitest.tsx`
- Modify: `src/components/ui/copy-command-button.tsx`
- Create: `src/components/ui/copy-command-button.vitest.tsx`
- Modify: `src/components/ui/code-block.tsx`
- Modify: `src/components/site/hero.tsx`
- Modify: `src/components/site/footer.tsx`
- Modify: `src/components/features/sections.tsx`
- Modify: `src/components/demo/palette-demo.tsx`
- Modify: `src/components/theme/palette-session.tsx`
- Create: `src/components/theme/palette-session.vitest.tsx`
- Modify: `src/components/features/command-builder.tsx`
- Create: `src/components/features/command-builder.vitest.tsx`

**Interfaces:**
- Consumes: `ProductEvent`, `CommandCopySurface`, and `trackProductEvent` from Task 3.
- Produces: required `CopyTracking` on every copy button.
- Produces: required `copyTracking` whenever `CodeBlock` has `copyable: true`.
- Produces: `PaletteUpdateOptions.source?: "palette_demo" | "command_builder"`.
- Produces: first-success palette event and first-interaction command-builder event per page lifetime.

- [ ] **Step 1: Write failing interaction tests**

Mock `navigator.clipboard.writeText` and `trackProductEvent`. Pin successful copy behavior:

```ts
await user.click(screen.getByRole("button", { name: "Copy command" }));
expect(navigator.clipboard.writeText).toHaveBeenCalledWith(command);
expect(trackProductEvent).toHaveBeenCalledWith({
  name: "command_copied",
  data: { surface: "hero" },
});
```

Rejecting clipboard writes must not track and must leave the button in the non-copied state.

Type `CodeBlockProps` as a discriminated union so this fails TypeScript:

```tsx
// @ts-expect-error A copyable block must declare its event and surface.
const missingTracking = <CodeBlock code="npm run build" copyable />;
```

and this succeeds:

```tsx
<CodeBlock
  code="npm run build"
  copyable
  copyTracking={{ event: "command_copied", surface: "cli_examples" }}
/>
```

Pin npm-link tracking for hero and footer. Pin one `palette_generator_used` only after a successful generated result, not on invalid HEX, failure, initial render, or a superseded request. Pin one `command_builder_used` on the first changed control and no second event after later controls change.

- [ ] **Step 2: Run interaction tests and verify the RED state**

Run:

```bash
npm run test:vitest -- src/components/analytics/tracked-npm-link.vitest.tsx src/components/ui/copy-command-button.vitest.tsx src/components/theme/palette-session.vitest.tsx src/components/features/command-builder.vitest.tsx
```

Expected: FAIL because tracking props and interaction hooks do not exist.

- [ ] **Step 3: Make copy tracking exhaustive and success-only**

Use this public prop:

```ts
export type CopyTracking =
  | { event: "command_copied"; surface: CommandCopySurface }
  | { event: "theme_css_copied"; surface: "palette_demo" };

export function CopyCommandButton({
  command,
  tracking,
}: {
  command: string;
  tracking: CopyTracking;
}) {}
```

Call `trackProductEvent({ name: tracking.event, data: { surface: tracking.surface } })` only after `navigator.clipboard.writeText` resolves.

Supply exact sources:

- Hero command: `hero`.
- Palette demo command: `palette_demo`.
- Command builder command: `command_builder`.
- Both CLI example code blocks: `cli_examples`.
- Footer command: `footer`.
- Generated `theme.css`: `theme_css_copied` with `palette_demo`.

- [ ] **Step 4: Track npm link intent with a focused client component**

`TrackedNpmLink` accepts only `surface: "hero" | "footer"`, preserves normal anchor behavior, and reports `npm_link_clicked` in `onClick`. Replace only the npm anchors in hero and footer; keep GitHub and other links as plain anchors.

- [ ] **Step 5: Track first successful palette generation**

Extend `PaletteUpdateOptions`:

```ts
type PaletteUpdateOptions = {
  delay?: number;
  activate?: boolean;
  source?: "palette_demo" | "command_builder";
};
```

Hold `const paletteUseTracked = useRef(false)`. In the accepted generation `.then`, after the request ID check and before updating rendered state, report once when `source` exists:

```ts
trackProductEvent({
  name: "palette_generator_used",
  data: {
    surface: source,
    preset: next.preset,
    format: next.format,
    neutral_tint: next.neutralTint,
  },
});
```

Set the ref only after the dispatcher accepts the event. Pass `source: "palette_demo"` from all palette-demo edits and `source: "command_builder"` from command-builder palette edits.

- [ ] **Step 6: Track first command-builder interaction**

Add `const builderUseTracked = useRef(false)` and:

```ts
const markBuilderUsed = (control: CommandBuilderControl) => {
  if (builderUseTracked.current) return;
  if (trackProductEvent({ name: "command_builder_used", data: { control } })) {
    builderUseTracked.current = true;
  }
};
```

Call it before every explicit state change using the closed control names from the design spec. Palette sub-controls both mark the command builder and call `updatePalette` with the command-builder source.

- [ ] **Step 7: Run interaction and full type verification**

Run:

```bash
npm run test:vitest -- src/components/analytics/tracked-npm-link.vitest.tsx src/components/ui/copy-command-button.vitest.tsx src/components/theme/palette-session.vitest.tsx src/components/features/command-builder.vitest.tsx
npm test
npx tsc --noEmit
npm run build
```

Expected: every public copy site supplies a typed source, failures do not track, first-use events do not duplicate, existing package-contract tests pass, and the build succeeds.

- [ ] **Step 8: Commit public instrumentation**

```bash
git add src/components/analytics src/components/ui/copy-command-button.tsx src/components/ui/copy-command-button.vitest.tsx src/components/ui/code-block.tsx src/components/site/hero.tsx src/components/site/footer.tsx src/components/features/sections.tsx src/components/demo/palette-demo.tsx src/components/theme/palette-session.tsx src/components/theme/palette-session.vitest.tsx src/components/features/command-builder.tsx src/components/features/command-builder.vitest.tsx
git diff --cached --check
git commit -m "feat: track generator and copy usage"
```

### Task 5: Build the authenticated Umami query client

**Files:**
- Create: `src/lib/admin/time-window.ts`
- Create: `src/lib/admin/time-window.vitest.ts`
- Create: `src/lib/admin/umami.ts`
- Create: `src/lib/admin/umami.vitest.ts`

**Interfaces:**
- Consumes: `AdminResult<T>` from Task 1 and the exact product-event names from Task 3.
- Produces: `AnalyticsWindowKey = "24h" | "7d" | "30d"`.
- Produces: `analyticsWindow(key, now?): AnalyticsWindow` and `parseAnalyticsWindow(value): AnalyticsWindowKey`.
- Produces: `getUmamiActive()`, `getUmamiStats(window)`, `getUmamiPageviews(window)`, `getUmamiEventStats(window, event)`, `getUmamiEventSeries(window)`, and `getUmamiEventValues(window, event, propertyName)`.

Export these validated provider shapes:

```ts
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
export type UmamiEventPoint = { event: ProductEventName; at: string; count: number };
export type UmamiEventValue = { value: string; total: number };
```

- [ ] **Step 1: Write failing time-window tests**

At `2026-08-25T12:00:00.000Z`, pin exact rolling starts:

```ts
expect(analyticsWindow("24h", now).startAt).toBe(Date.parse("2026-08-24T12:00:00.000Z"));
expect(analyticsWindow("7d", now).startAt).toBe(Date.parse("2026-08-18T12:00:00.000Z"));
expect(analyticsWindow("30d", now).startAt).toBe(Date.parse("2026-07-26T12:00:00.000Z"));
expect(parseAnalyticsWindow("unexpected")).toBe("30d");
```

Each returned window includes the same `endAt`, `timezone: "Europe/Oslo"`, and a unit of `hour` for 24 hours and `day` otherwise.

Use this exported contract:

```ts
export type AnalyticsWindowKey = "24h" | "7d" | "30d";

export type AnalyticsWindow = {
  key: AnalyticsWindowKey;
  startAt: number;
  endAt: number;
  unit: "hour" | "day";
  timezone: "Europe/Oslo";
};
```

- [ ] **Step 2: Write failing Umami configuration, auth, retry, and response tests**

Mock `server-only` and inject a controlled `fetch` implementation. Cover both auth mechanisms:

- `x-umami-api-key` when `UMAMI_API_KEY` exists.
- `POST /auth/login` and cached bearer token when username/password exist.
- no network request and `unconfigured` when base URL, website ID, or both auth mechanisms are incomplete.
- one fresh login and one retry after a 401, never a loop.
- a four-second timeout classified as `timeout`.
- non-OK response classified as `unreachable`.
- malformed JSON shape classified as `invalid_response`.

Pin exact v3 shapes:

```ts
{ visitors: 5 }
{ pageviews: 120, visitors: 40, visits: 55, bounces: 12, totaltime: 4200 }
{ data: { events: 18, visitors: 9, visits: 11, uniqueEvents: 1 } }
{ pageviews: [{ x: "2026-08-24T00:00:00Z", y: 12 }], sessions: [{ x: "2026-08-24T00:00:00Z", y: 7 }] }
[{ x: "command_copied", t: "2026-08-24T00:00:00Z", y: 4 }]
[{ value: "hero", total: 3 }]
```

- [ ] **Step 3: Run provider tests and verify the RED state**

Run:

```bash
npm run test:vitest -- src/lib/admin/time-window.vitest.ts src/lib/admin/umami.vitest.ts
```

Expected: FAIL because the time-window and Umami modules do not exist.

- [ ] **Step 4: Implement the shared window and validated Umami client**

Keep secrets in a server-only config:

```ts
type UmamiEnvironment = {
  UMAMI_API_URL?: string;
  UMAMI_WEBSITE_ID?: string;
  UMAMI_API_KEY?: string;
  UMAMI_USERNAME?: string;
  UMAMI_PASSWORD?: string;
};
```

Normalize `UMAMI_API_URL` by removing one trailing slash. Treat API key as preferred and username/password as fallback. Cache a bearer token for 55 minutes, clear it on a 401, and retry once.

Every request uses:

```ts
{
  cache: "no-store",
  signal: AbortSignal.timeout(4_000),
}
```

Build URLs with `URL` and `searchParams`, never string-concatenate values. The endpoint contract is:

- `/websites/:id/active` for last-five-minute visitors.
- `/websites/:id/stats` for overall traffic.
- `/websites/:id/pageviews` with `startAt`, `endAt`, `unit`, and `timezone`.
- `/websites/:id/events/stats` with exact `event` filter for event count and unique event visitors.
- `/websites/:id/events/series` for the product-activity series.
- `/websites/:id/event-data/values` with exact `event` and `propertyName=surface` for copy-source counts.

Accept plain numeric fields and the older `{ value: number }` wrapper where Tinify already proved both can occur. Do not coerce missing, negative, NaN, or string values to zero.

Map raw provider names at the boundary: `totaltime` becomes `totalTime`; the `/pageviews` response's `sessions` array becomes the exported `visitors` series after validation; and event-series `x`, `t`, and `y` become `event`, `at`, and `count`. Reject event names outside `PRODUCT_EVENT_NAMES` instead of casting them.

- [ ] **Step 5: Run the Umami gate**

Run:

```bash
npm run test:vitest -- src/lib/admin/time-window.vitest.ts src/lib/admin/umami.vitest.ts
npx tsc --noEmit
```

Expected: all window, auth, retry, timeout, and validation cases pass.

- [ ] **Step 6: Commit the Umami client**

```bash
git add src/lib/admin/time-window.ts src/lib/admin/time-window.vitest.ts src/lib/admin/umami.ts src/lib/admin/umami.vitest.ts
git diff --cached --check
git commit -m "feat: add Umami admin queries"
```

### Task 6: Add npm statistics and request-time health

**Files:**
- Modify: `src/lib/content.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/lib/admin/npm.ts`
- Create: `src/lib/admin/npm.vitest.ts`
- Create: `src/lib/admin/probes.ts`
- Create: `src/lib/admin/probes.vitest.ts`

**Interfaces:**
- Produces: exported `SITE_URL` beside existing package constants.
- Produces: `getNpmSnapshot(): Promise<NpmSnapshot>` with independently failing downloads and metadata.
- Produces: `probePublicSite(): Promise<Probe>` and `deploymentIdentity(): DeploymentIdentity`.

Use these public data contracts:

```ts
export type DownloadPoint = { day: string; downloads: number };

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

export type DeploymentIdentity = {
  environment: string;
  commit: string | null;
  branch: string | null;
  region: string | null;
  nodeVersion: string;
};
```

- [ ] **Step 1: Write failing npm client tests**

Mock these exact public responses:

```ts
{ downloads: 8, start: "2026-08-24", end: "2026-08-24", package: PACKAGE_NAME }
{ downloads: 40, start: "2026-08-18", end: "2026-08-24", package: PACKAGE_NAME }
{
  downloads: [
    { day: "2026-08-23", downloads: 6 },
    { day: "2026-08-24", downloads: 8 }
  ],
  start: "2026-07-26",
  end: "2026-08-24",
  package: PACKAGE_NAME
}
{
  "dist-tags": { latest: "0.6.0" },
  time: { "0.6.0": "2026-08-21T10:00:00.000Z" }
}
```

Assert that last month is the sum of the daily range, the series remains ordered, `siteVersion` comes from `PACKAGE_VERSION`, and drift is true only when npm `latest` differs. Pin timeout, non-OK, and invalid response as honest failures rather than zero. A download-API failure must leave package metadata available, and a registry failure must leave download totals available.

- [ ] **Step 2: Write failing probe tests**

Pin production front-door success and latency, HTTP failure, timeout, and deployment identity from `VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_REF`, `VERCEL_REGION`, and `process.version`. Never make a Vercel API call for deployment identity.

- [ ] **Step 3: Run npm and probe tests and verify the RED state**

Run:

```bash
npm run test:vitest -- src/lib/admin/npm.vitest.ts src/lib/admin/probes.vitest.ts
```

Expected: FAIL because the npm and probe modules do not exist.

- [ ] **Step 4: Implement npm reads with one shared timeout contract**

Encode the scoped package name with `encodeURIComponent(PACKAGE_NAME)`. Fetch concurrently:

```text
https://api.npmjs.org/downloads/point/last-day/%40larsen-utvikling%2Fcreate-next-app
https://api.npmjs.org/downloads/point/last-week/%40larsen-utvikling%2Fcreate-next-app
https://api.npmjs.org/downloads/range/last-month/%40larsen-utvikling%2Fcreate-next-app
https://registry.npmjs.org/%40larsen-utvikling%2Fcreate-next-app
```

Use `cache: "no-store"`, a four-second timeout, strict numeric/date validation, and the shared `AdminResult` reasons. Resolve the three download calls as one `downloads` result and registry metadata as a separate `package` result so either source can fail alone. Export `SITE_URL` from `content.ts` and reuse it in `layout.tsx` rather than keeping a second private constant.

- [ ] **Step 5: Implement the front-door probe and deployment identity**

Use `HEAD` first and fall back to `GET` only if the origin rejects `HEAD`. Send `User-Agent: larsen-create-next-app-admin-probe/1.0`; client analytics scripts do not execute during this server fetch, so the probe does not become product traffic.

Return:

```ts
export type Probe = {
  name: string;
  detail: string;
  status: "up" | "down" | "unknown";
  latencyMs: number | null;
  note?: string;
};
```

An unconfigured provider is `unknown`, never green. A request that ran and failed is `down`.

- [ ] **Step 6: Run provider verification**

Run:

```bash
npm run test:vitest -- src/lib/admin/npm.vitest.ts src/lib/admin/probes.vitest.ts
npx tsc --noEmit
npm run build
```

Expected: npm semantics, drift state, health honesty, and build all pass.

- [ ] **Step 7: Commit npm and health clients**

```bash
git add src/lib/content.ts src/app/layout.tsx src/lib/admin/npm.ts src/lib/admin/npm.vitest.ts src/lib/admin/probes.ts src/lib/admin/probes.vitest.ts
git diff --cached --check
git commit -m "feat: add npm and health data"
```

### Task 7: Assemble the server-rendered dashboard

**Files:**
- Create: `src/lib/admin/dashboard.ts`
- Create: `src/lib/admin/dashboard.vitest.ts`
- Create: `src/components/admin/format.ts`
- Create: `src/components/admin/format.vitest.ts`
- Create: `src/components/admin/panels.tsx`
- Create: `src/components/admin/panels.vitest.tsx`
- Create: `src/components/admin/dashboard.tsx`
- Create: `src/components/admin/dashboard.module.css`
- Modify: `src/app/admin/(console)/page.tsx`
- Create: `src/app/admin/(console)/loading.tsx`
- Create: `src/app/admin/(console)/error.tsx`
- Modify: `src/app/admin/(console)/console.module.css`

**Interfaces:**
- Consumes: time windows, Umami functions, npm snapshot, probes, deployment identity, and `AdminResult`.
- Produces: `getAdminDashboardData(windowKey): Promise<AdminDashboardData>`.
- Produces: synchronous `AdminDashboard`, `StatCard`, `ResultPanel`, `TimeSeries`, `BarList`, and status components.

Use these aggregation contracts:

```ts
export type ReachMetric = {
  count: number | null;
  visitors: number | null;
  reach: number | null;
  reason?: AdminFailureReason;
};

export type ProductMetrics = {
  paletteGenerator: ReachMetric;
  commandBuilder: ReachMetric;
  commandCopy: ReachMetric;
  stylesheetCopy: ReachMetric;
};

export type AdminDashboardData = {
  observedAt: string;
  window: AnalyticsWindow;
  active: AdminResult<{ visitors: number }>;
  traffic: AdminResult<UmamiStats>;
  trafficSeries: AdminResult<UmamiPageviewSeries>;
  product: ProductMetrics;
  productSeries: AdminResult<UmamiEventPoint[]>;
  commandCopySurfaces: AdminResult<UmamiEventValue[]>;
  npm: NpmSnapshot;
  publicSite: Probe;
  deployment: DeploymentIdentity;
};
```

Export `UmamiStats`, `UmamiPageviewSeries`, `UmamiEventPoint`, and `UmamiEventValue` from Task 5 rather than duplicating provider shapes here.

- [ ] **Step 1: Write failing aggregation and rate tests**

Mock provider functions and assert one shared `AnalyticsWindow` object supplies every numerator and denominator. Pin formulas:

```ts
expect(rate(10, 40)).toBe(0.25);
expect(rate(0, 40)).toBe(0);
expect(rate(1, 0)).toBeNull();
```

Pin palette reach, builder reach, command-copy reach, and stylesheet-copy reach separately. Never add command and stylesheet visitor totals. If filtered event visitors are unavailable, only that reach is unavailable while event count and other panels remain present.

Assert concurrent calls with one rejected source return an isolated failure result rather than reject the dashboard promise.

- [ ] **Step 2: Write failing format and panel tests**

Pin compact counts, percentages, dates, duration, and failure labels:

```ts
expect(formatCount(1_234)).toBe("1,234");
expect(formatRate(0.25)).toBe("25%");
expect(formatRate(null)).toBe("Unavailable");
expect(reasonLabel("timeout")).toBe("Timed out");
```

Render panels with React Testing Library and assert `unknown` is never styled or announced as healthy, charts have accessible titles/summaries, and empty series render an explicit no-data state.

- [ ] **Step 3: Run dashboard tests and verify the RED state**

Run:

```bash
npm run test:vitest -- src/lib/admin/dashboard.vitest.ts src/components/admin/format.vitest.ts src/components/admin/panels.vitest.tsx
```

Expected: FAIL because aggregation and presentation modules do not exist.

- [ ] **Step 4: Implement concurrent dashboard aggregation**

Use one window and `Promise.all` for:

- active users;
- overall stats;
- pageview/visitor series;
- event stats for `palette_generator_used`, `command_builder_used`, `command_copied`, and `theme_css_copied`;
- all allowed product-event series;
- command-copy `surface` values;
- npm snapshot;
- public-site probe;
- deployment identity.

Do not fetch raw event rows or sessions. Filter event-series names to the closed public contract before returning data to components.

- [ ] **Step 5: Build the one-page admin overview**

Render these sections in order:

1. Header with `Admin`, observation time, deployment identity, and a plain lock form.
2. Period links for `24h`, `7d`, and `30d`, with `30d` default.
3. Overview cards for active users, visitors, pageviews, and visits.
4. Pageview and visitor time series.
5. Product reach cards and separate event counts.
6. Product activity series and command-copy surface bars.
7. npm cards, daily download series, current version, site version, and drift status.
8. Health rows for public site, Umami, npm registry, and npm downloads API.

Use links with `aria-current="page"` for periods. Show the same start/end window beside every reach metric. Label npm as tarball downloads and health as a current snapshot.

Build SVG charts without a chart dependency. Include an accessible text summary and do not encode status with color alone.

- [ ] **Step 6: Add streaming, loading, and safe failure boundaries**

The protected page calls `requireAdminSession()` before starting any data work, renders the header, and wraps the async dashboard data in `Suspense`. `loading.tsx` matches the loaded grid dimensions. `error.tsx` is a client boundary that renders no error object, query, or response detail and offers one retry button.

Keep `export const dynamic = "force-dynamic"` and non-indexing metadata. No admin page sets an identifying document title that could leak through a configuration-gate 404.

- [ ] **Step 7: Implement responsive CSS using existing tokens**

Use a 12-column grid above 60rem, two columns for mid-width layouts, and one column on mobile. Keep body text at existing small sizes, use rare borders, avoid card-grid decoration, provide visible focus, and disable skeleton animation under `prefers-reduced-motion: reduce`.

- [ ] **Step 8: Run dashboard verification**

Run:

```bash
npm run test:vitest -- src/lib/admin/dashboard.vitest.ts src/components/admin/format.vitest.ts src/components/admin/panels.vitest.tsx
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all tests pass and the dashboard builds even when every external provider is unconfigured.

- [ ] **Step 9: Commit the dashboard**

```bash
git add src/lib/admin/dashboard.ts src/lib/admin/dashboard.vitest.ts src/components/admin src/app/admin/'(console)'
git diff --cached --check
git commit -m "feat: add admin analytics dashboard"
```

### Task 8: Add preflight, documentation, and complete local verification

**Files:**
- Create: `.env.example`
- Create: `scripts/preflight.mjs`
- Create: `scripts/preflight.test.mjs`
- Modify: `package.json`
- Modify: `README.md`
- Modify and partially stage: `AGENTS.md`

**Interfaces:**
- Consumes: credential bounds and provider environment contracts from previous tasks.
- Produces: `npm run preflight` and automatic `prebuild` validation.
- Produces: owner-facing environment and evidence documentation.

- [ ] **Step 1: Write failing preflight process tests**

Spawn `node scripts/preflight.mjs` with a cleaned environment. Pin:

- no admin or Umami variables exits 0;
- only `ADMIN_PASSWORD` exits 1;
- short password exits 1;
- short or oversized session secret exits 1;
- complete valid admin pair exits 0;
- only one public Umami variable exits 1;
- API URL and website ID without API key or username/password exits 1;
- complete username/password or API-key server auth exits 0;
- no output contains a supplied secret.

- [ ] **Step 2: Run preflight tests and verify the RED state**

Run:

```bash
node --test scripts/preflight.test.mjs
```

Expected: FAIL because the preflight script does not exist.

- [ ] **Step 3: Implement fail-closed preflight and wire it into builds**

`scripts/preflight.mjs` imports only pure credential-policy constants/helpers. It reports variable names and policy reasons, never values, prefixes, or lengths. Missing complete feature groups are allowed for local development; partial or invalid groups fail.

Add:

```json
{
  "preflight": "node scripts/preflight.mjs",
  "prebuild": "npm run preflight"
}
```

At this point update `test:node` to `node --test src/lib/*.test.mjs scripts/*.test.mjs`, so `npm test` runs both Node suites before Vitest.

- [ ] **Step 4: Document exact environment and evidence boundaries**

Create `.env.example` with empty assignments only:

```dotenv
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
NEXT_PUBLIC_UMAMI_SRC=
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
UMAMI_API_URL=
UMAMI_WEBSITE_ID=
UMAMI_API_KEY=
UMAMI_USERNAME=
UMAMI_PASSWORD=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

Update README with:

- the password/session model;
- Umami as admin source of truth;
- Vercel Analytics as independent public analytics;
- GA4 as optional and consent-gated;
- admin analytics exclusion;
- event names and prohibited properties;
- `npm run preflight`, test, lint, typecheck, and build commands;
- local, preview, production, and provider-ingestion evidence boundaries;
- the request-time-only meaning of health.

- [ ] **Step 5: Stage only the feature's `AGENTS.md` consent hunk**

First stage every other documentation/preflight file normally. Apply only the consent paragraph to the index:

```bash
git apply --cached <<'PATCH'
diff --git a/AGENTS.md b/AGENTS.md
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -82,3 +82,5 @@
-- **Nothing is measured before consent.** Vercel Analytics is cookie-free and
-  always on; GA4 only mounts after the banner is accepted and only when
-  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
+- **Cookie-free traffic analytics is always on.** Vercel Analytics and Umami
+  use no cookies; GA4 only mounts after the banner is accepted and only when
+  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. No analytics provider mounts under
+  `/admin`.
PATCH
```

Inspect:

```bash
git diff --cached -- AGENTS.md
git diff -- AGENTS.md
```

Expected: the cached diff contains only the cookie-free Umami/Vercel and admin-exclusion rule. The unstaged diff still contains the pre-existing generated Next.js agent-rules block. If either expectation fails, unstage only `AGENTS.md` with `git restore --staged AGENTS.md` and rebuild the cached patch; do not alter the worktree copy.

- [ ] **Step 6: Run the complete local gate**

Run:

```bash
npm run preflight
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
git diff --cached --unified=0 | perl -CSD -ne 'exit 1 if /\x{2013}|\x{2014}/'
```

Expected: every command passes and the Unicode-dash scan finds nothing in staged additions.

- [ ] **Step 7: Run local browser verification with non-production credentials**

Start the app with a 20-plus-character local password and 32-plus-byte local session secret. Verify:

- no configuration returns 404;
- wrong password returns the closed error;
- correct password sets the path-scoped cookie and opens `/admin`;
- refresh persists the session;
- tampered cookie redirects to unlock;
- lock clears the cookie;
- unconfigured provider panels say unavailable, not zero or healthy;
- `/admin` contains no Umami, Vercel Analytics, GA4, or consent-banner script/UI;
- `/admin` responses include private no-store and noindex headers;
- `/sitemap.xml` contains no admin URL;
- `/robots.txt` does not advertise the admin path;
- desktop and mobile layouts have no overflow or layout shift.

Capture desktop and mobile screenshots as review evidence outside the repository.

- [ ] **Step 8: Commit preflight and documentation**

```bash
git add .env.example scripts/preflight.mjs scripts/preflight.test.mjs package.json package-lock.json README.md
git diff --cached --check
git commit -m "docs: add admin analytics operations"
```

The cached AGENTS consent hunk must be included in this commit. After commit, `git status --short` may show only the original unrelated `AGENTS.md` block; every feature file must be clean.

### Task 9: Provision Umami, configure Vercel, deploy, and verify production

**Files:**
- No repository files should change.
- External state: one new Umami website record, target-project Vercel environment variables, Vercel Web Analytics enablement, production deployment, and one Keychain password item.

**Interfaces:**
- Consumes: the verified implementation and environment contracts.
- Produces: reachable protected admin, real Umami data, retained Vercel Analytics, and separately consent-gated GA4 behavior.

- [ ] **Step 1: Re-run the immutable pre-push gate and inspect scope**

Run:

```bash
git status --short --branch
git log --oneline origin/main..HEAD
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: only the preserved unrelated `AGENTS.md` block is dirty, all feature commits are listed, and all gates pass.

- [ ] **Step 2: Resolve Vercel project and team identifiers without hardcoding secrets**

Use the authenticated CLI:

```bash
TARGET_PROJECT_JSON=$(vercel api /v9/projects/larsen-create-next-app-site --raw)
TARGET_PROJECT_ID=$(printf '%s' "$TARGET_PROJECT_JSON" | jq -r '.id')
TEAM_ID=$(printf '%s' "$TARGET_PROJECT_JSON" | jq -r '.accountId')
test -n "$TARGET_PROJECT_ID"
test -n "$TEAM_ID"
```

Do not print the JSON because it contains account and deployment metadata.

- [ ] **Step 3: Read the existing Tinify Umami credentials without printing them**

Define a shell helper that resolves a production environment-variable ID from `tinify-dev` and then reads its decrypted value from the authenticated API:

```bash
read_vercel_env() {
  local project_name="$1"
  local env_key="$2"
  local env_id
  env_id=$(vercel api "/v10/projects/${project_name}/env?teamId=${TEAM_ID}" --raw | jq -er --arg key "$env_key" '.envs[] | select(.key == $key and (.target | index("production"))) | .id' | head -n 1)
  vercel api "/v1/projects/${project_name}/env/${env_id}?teamId=${TEAM_ID}" --raw | jq -er '.value'
}

UMAMI_API_URL_VALUE=$(read_vercel_env tinify-dev UMAMI_API_URL)
UMAMI_USERNAME_VALUE=$(read_vercel_env tinify-dev UMAMI_USERNAME)
UMAMI_PASSWORD_VALUE=$(read_vercel_env tinify-dev UMAMI_PASSWORD)
UMAMI_SRC_VALUE=$(read_vercel_env tinify-dev NEXT_PUBLIC_UMAMI_SRC)

test -n "$UMAMI_API_URL_VALUE"
test -n "$UMAMI_USERNAME_VALUE"
test -n "$UMAMI_PASSWORD_VALUE"
test -n "$UMAMI_SRC_VALUE"
```

Never echo, log, or write these variables to the repository or a temporary file.

- [ ] **Step 4: Create or reuse the dedicated Umami website**

Authenticate, list websites, and create only when the exact domain is absent:

```bash
UMAMI_LOGIN_JSON=$(curl -fsS "${UMAMI_API_URL_VALUE}/auth/login" -H 'Content-Type: application/json' --data "$(jq -cn --arg username "$UMAMI_USERNAME_VALUE" --arg password "$UMAMI_PASSWORD_VALUE" '{username:$username,password:$password}')")
UMAMI_TOKEN_VALUE=$(printf '%s' "$UMAMI_LOGIN_JSON" | jq -er '.token')
UMAMI_WEBSITES_JSON=$(curl -fsS "${UMAMI_API_URL_VALUE}/websites" -H "Authorization: Bearer ${UMAMI_TOKEN_VALUE}")
UMAMI_WEBSITE_ID_VALUE=$(printf '%s' "$UMAMI_WEBSITES_JSON" | jq -r '(.data // .)[] | select(.domain == "create-next-app.larsenutvikling.no") | .id' | head -n 1)

if [ -z "$UMAMI_WEBSITE_ID_VALUE" ]; then
  curl -fsS "${UMAMI_API_URL_VALUE}/websites" \
    -X POST \
    -H "Authorization: Bearer ${UMAMI_TOKEN_VALUE}" \
    -H 'Content-Type: application/json' \
    --data '{"name":"Larsen create-next-app","domain":"create-next-app.larsenutvikling.no"}' \
    >/dev/null
fi

UMAMI_WEBSITES_JSON=$(curl -fsS "${UMAMI_API_URL_VALUE}/websites" -H "Authorization: Bearer ${UMAMI_TOKEN_VALUE}")
UMAMI_MATCH_COUNT=$(printf '%s' "$UMAMI_WEBSITES_JSON" | jq -r '(.data // .)[] | select(.domain == "create-next-app.larsenutvikling.no") | .id' | wc -l | tr -d ' ')
test "$UMAMI_MATCH_COUNT" -eq 1
UMAMI_WEBSITE_ID_VALUE=$(printf '%s' "$UMAMI_WEBSITES_JSON" | jq -er '(.data // .)[] | select(.domain == "create-next-app.larsenutvikling.no") | .id')
```

The creation body is exactly:

```json
{
  "name": "Larsen create-next-app",
  "domain": "create-next-app.larsenutvikling.no"
}
```

Re-list and assert there is exactly one exact-domain match. Store its ID in `UMAMI_WEBSITE_ID_VALUE`. Never reuse Tinify's website ID.

- [ ] **Step 5: Generate and store the admin credentials**

Generate:

```bash
ADMIN_PASSWORD_VALUE=$(openssl rand -base64 24 | tr -d '\n')
ADMIN_SESSION_SECRET_VALUE=$(openssl rand -base64 48 | tr -d '\n')
```

Validate both with the same bounds as preflight. Store the human password in macOS Keychain under service `create-next-app.larsenutvikling.no admin` and account `stian` using `security add-generic-password -U`. Do not store the session secret outside Vercel.

```bash
test "${#ADMIN_PASSWORD_VALUE}" -ge 24
test "$(printf '%s' "$ADMIN_PASSWORD_VALUE" | wc -c | tr -d ' ')" -le 256
test "$(printf '%s' "$ADMIN_SESSION_SECRET_VALUE" | wc -c | tr -d ' ')" -ge 32
test "$(printf '%s' "$ADMIN_SESSION_SECRET_VALUE" | wc -c | tr -d ' ')" -le 512
security add-generic-password -U -a stian -s 'create-next-app.larsenutvikling.no admin' -w "$ADMIN_PASSWORD_VALUE"
```

- [ ] **Step 6: Set production Vercel environment variables without printing values**

Use stdin so no secret appears as a command argument:

```bash
add_sensitive_env() {
  local env_key="$1"
  local env_value="$2"
  printf '%s' "$env_value" | vercel env add "$env_key" production --project larsen-create-next-app-site --scope stians-applications --force --sensitive --yes
}

add_public_env() {
  local env_key="$1"
  local env_value="$2"
  printf '%s' "$env_value" | vercel env add "$env_key" production --project larsen-create-next-app-site --scope stians-applications --force --no-sensitive --yes
}

add_sensitive_env ADMIN_PASSWORD "$ADMIN_PASSWORD_VALUE"
add_sensitive_env ADMIN_SESSION_SECRET "$ADMIN_SESSION_SECRET_VALUE"
add_public_env NEXT_PUBLIC_UMAMI_SRC "$UMAMI_SRC_VALUE"
add_public_env NEXT_PUBLIC_UMAMI_WEBSITE_ID "$UMAMI_WEBSITE_ID_VALUE"
add_sensitive_env UMAMI_API_URL "$UMAMI_API_URL_VALUE"
add_sensitive_env UMAMI_WEBSITE_ID "$UMAMI_WEBSITE_ID_VALUE"
add_sensitive_env UMAMI_USERNAME "$UMAMI_USERNAME_VALUE"
add_sensitive_env UMAMI_PASSWORD "$UMAMI_PASSWORD_VALUE"
```

These are the configured variables:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_UMAMI_SRC`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- `UMAMI_API_URL`
- `UMAMI_WEBSITE_ID`
- `UMAMI_USERNAME`
- `UMAMI_PASSWORD`

Do not add `UMAMI_API_KEY` when the self-hosted instance uses username/password. Do not add `NEXT_PUBLIC_GA_MEASUREMENT_ID` unless an existing intended GA4 property is independently confirmed; keeping the optional code path does not authorize inventing a measurement ID.

List only variable names, targets, and sensitive/plain type afterward. Confirm every secret is sensitive and production-scoped.

- [ ] **Step 7: Enable and verify Vercel Web Analytics**

The query API currently reports that Web Analytics is disabled even though the component and project metadata exist. Enable it and prove the public query endpoint accepts the project:

```bash
vercel api "/web/insights/toggle?projectId=${TARGET_PROJECT_ID}" -X POST -F value=true --scope stians-applications >/dev/null
vercel api "/v1/query/web-analytics/visits/count?teamId=${TEAM_ID}&projectId=${TARGET_PROJECT_ID}" --raw --scope stians-applications >/dev/null
```

Expected: the second command no longer returns `Web Analytics is not enabled for this project`. Do not use Vercel data inside `/admin`.

- [ ] **Step 8: Push verified commits and wait for the Git-triggered production deployment**

Run:

```bash
git push origin main
```

Use Vercel project/deployment reads to wait for the commit deployment to become `READY` and promoted to production. A pushed commit is not deployment proof; record deployment ID, commit SHA, ready timestamp, and aliases only after Vercel reports them.

- [ ] **Step 9: Verify public and admin behavior in production**

With browser network inspection:

1. Visit the public page with GA consent denied.
2. Confirm Umami and Vercel Analytics load and GA4 does not.
3. Trigger one palette generation, one command-builder interaction, one CLI-example command copy, one generated CSS copy, and one npm click.
4. Visit `/admin/unlock`, test one wrong password, retrieve the password from Keychain, unlock, refresh, change periods, and lock.
5. Confirm `/admin` and descendants request no Umami script/event, Vercel Analytics script/event, GA4 script/event, or consent banner.
6. Confirm active visitors, traffic windows, event counts, npm downloads/version, drift, and health render honest non-stale states.
7. If an intended GA measurement ID is configured, repeat one labeled public event after granting consent and confirm GA4 receives it while Umami and Vercel behavior remains unchanged. If GA is unconfigured, confirm no GA script mounts and report that optional integration honestly instead of inventing a property.

Capture desktop and mobile screenshots and console/network evidence. Do not include the password, cookie, Umami token, or provider credentials in screenshots or logs.

- [ ] **Step 10: Verify provider ingestion after its real delay**

Poll Umami's authenticated stats/events endpoints using the exact controlled time window every 15 seconds for at most 10 minutes. Verify the same Umami-derived counts in `/admin`. Check Vercel Analytics independently over the same bounded window. If a provider still lacks the controlled event, report that evidence as failed and investigate instead of extending an unbounded wait. Do not call the feature complete while only local dispatch mocks pass.

- [ ] **Step 11: Report completion with evidence boundaries**

Report separately:

- local commit and clean feature scope;
- unit/lint/type/build commands and results;
- production deployment ID and SHA;
- public HTTP behavior;
- admin authentication behavior;
- Umami website identity and visible event counts without secrets;
- Vercel Analytics enabled and receiving public traffic;
- GA4 absent before consent and present only after consent when configured;
- preserved unrelated `AGENTS.md` worktree change;
- npm counts as downloads, not unique users or confirmed scaffolds;
- health as a request-time snapshot, not uptime proof.
