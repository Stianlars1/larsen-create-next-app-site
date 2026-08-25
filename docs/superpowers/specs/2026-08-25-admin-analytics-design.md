# Admin Analytics Design

Date: 2026-08-25
Status: Approved in conversation

## Context

The site is a public Next.js marketing and demo application deployed on Vercel. It already loads Vercel Web Analytics without consent and GA4 only after analytics consent. The new internal `/admin` surface must provide a small operator dashboard without introducing a user system, a new database, or a second product backend.

Tinify's admin console is a reference for security boundaries, isolated panel failures, and honest metric labeling only. Its deployment, credentials, Umami instance, and data are never shared with this site. This site needs a deliberately smaller implementation because it has one operator, one public page, no customer accounts, no billing, and no application database.

## Goals

- Let the operator unlock `/admin` with a password stored only in Vercel environment variables.
- Show current traffic, recent traffic, generator use, successful copy actions, npm downloads, package version status, and a small operational health snapshot.
- Use Umami as the source of truth for the admin dashboard.
- Keep Vercel Web Analytics as an independent analytics system.
- Keep the existing consent-gated GA4 integration.
- Keep admin activity out of all three analytics systems.
- Fail closed for authentication and fail independently for each external data source.

## Non-goals

- Multiple users, invitations, roles, Clerk, or another identity provider.
- A custom analytics database or raw event ingestion service.
- Combining or averaging Umami, Vercel Analytics, and GA4 numbers.
- External uptime monitoring, alerts, incident history, or service-level reporting.
- Changes to the create-next-app package or npm publication.
- Raw visitor records, IP addresses, commands, app names, or entered HEX values.

## Architecture

The implementation has four isolated areas:

1. `src/lib/admin/` owns configuration, password verification, signed sessions, guards, external data clients, time windows, and result types.
2. `src/lib/analytics/` owns one typed product-event contract and sends the same allowed event to Umami, Vercel Web Analytics, and consented GA4 where applicable.
3. `src/app/admin/` owns the unlock form, session routes, protected dashboard, loading state, error boundary, metadata, and operator-only presentation.
4. Existing public components report successful actions with a small source label. They do not know how any analytics provider works.

No analytics provider is queried from client code. The protected page is dynamically rendered, uses `no-store`, and reads all dashboard data on the server.

## Authentication and session

The environment contract is:

- `ADMIN_PASSWORD`: the human-entered password.
- `ADMIN_SESSION_SECRET`: at least 32 random bytes used only to sign sessions.

Both values are required. `ADMIN_PASSWORD` must contain at least 20 Unicode code points and at most 256 UTF-8 bytes. The owner-run setup generates at least 24 random printable characters rather than relying on a memorable composition rule. `ADMIN_SESSION_SECRET` must contain at least 32 random bytes and at most 512 UTF-8 bytes. If any bound is violated, every admin route answers 404 and the deployment preflight fails. There is no weak-password, empty-password, oversized-input, or unsigned-cookie mode.

The unlock flow is:

1. `GET /admin` checks for a valid signed session.
2. A missing or invalid session redirects to `/admin/unlock` only when admin is fully configured.
3. The unlock page posts a plain HTML password form to `/admin/session`.
4. The route rejects cross-site or unverifiable form posts, rejects submitted passwords larger than 256 UTF-8 bytes without retaining them, applies the same fixed delay to every attempt, rate-limits repeated attempts, hashes both password values to fixed-length buffers, and compares them with `timingSafeEqual`.
5. A successful attempt creates a versioned HMAC-signed token with issued-at, expiry, and random token ID claims.
6. The token is stored in a 12-hour `HttpOnly`, `Secure`, `SameSite=Strict`, path-scoped cookie.
7. `POST /admin/session/lock` clears the cookie and returns to the unlock page.

The in-memory rate limit is an additional brake, not the primary security control, because Vercel instances do not share module memory. The strong password, fixed delay, same-origin requirement, HMAC signature, short lifetime, and server-only secrets are the load-bearing controls.

## Analytics providers

### Umami

Umami Cloud is the only source displayed in `/admin`. The site receives its own Website record in the shared Umami Cloud account. Each application receives a distinct Website ID, so its traffic and events remain isolated even though billing and account management are shared.

Umami follows the approved cookie-free policy: its tracker writes no browser storage and mounts without analytics consent. This intentionally extends the repository rule that currently names only Vercel Analytics as always on. The implementation updates that rule to name both cookie-free providers and keeps GA4 as the only consent-gated provider. The dashboard therefore describes Umami as whole-audience aggregate traffic, subject to blockers and network failures, rather than consented traffic only.

Public tracking uses:

- `NEXT_PUBLIC_UMAMI_SRC` set to `https://cloud.umami.is/script.js`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

Server-side dashboard queries use:

- `UMAMI_API_URL` set to `https://api.umami.is/v1`
- `UMAMI_WEBSITE_ID`
- `UMAMI_API_KEY` sent as a Bearer token

The server client uses the Cloud API key as a Bearer token, applies a four-second timeout, and never exposes credentials or provider response bodies to the browser.

The dashboard uses the supported Umami endpoints for active visitors, summary statistics, pageview series, event series, and grouped metrics. "Active now" is labeled as unique visitors in the last five minutes, not as an exact count of open browser connections.

### Vercel Web Analytics

The existing `@vercel/analytics` integration remains enabled as an independent, cookie-free measurement system. It receives the shared allowed product events but is not queried by `/admin` in this version.

### Google Analytics

The existing GA4 integration remains consent-gated. It receives a product event only when the current GA integration is mounted after consent. GA4 data is not shown in `/admin`.

### Admin exclusion

The root analytics integrations must all return no tracker for `/admin` and every descendant path. Operator pageviews and actions must not inflate the data being inspected.

## Tracking contract

The public site reports these events:

| Event | Trigger | Allowed properties | Counting meaning |
| --- | --- | --- | --- |
| `palette_generator_used` | First successful user-triggered palette generation during one page lifetime | `surface`, `preset`, `format`, `neutral_tint` | Page lifetimes that actively used palette generation |
| `command_builder_used` | First user change to a command-builder option during one page lifetime | `control` | Page lifetimes that interacted with the command builder |
| `command_copied` | Clipboard write succeeds | `surface` | Successful command copies |
| `theme_css_copied` | Generated stylesheet clipboard write succeeds | `surface` | Successful stylesheet copies |
| `npm_link_clicked` | A public npm link is activated | `surface` | Intent to inspect the package on npm |

Every event and property value uses a closed runtime allowlist:

- `palette_generator_used.surface`: `palette_demo` or `command_builder`.
- `palette_generator_used.preset`: `shadcn`, `radix`, or `css-variables`.
- `palette_generator_used.format`: `hex`, `rgb`, `hsl`, `hsl-values`, `oklab`, or `oklch`.
- `palette_generator_used.neutral_tint`: `subtle` or `strong`.
- `command_builder_used.control`: `app_name`, `palette`, `seed_hex`, `preset`, `format`, `neutral_tint`, `linter`, `package_manager`, `skills`, `git`, `install`, or `cna_version`.
- `command_copied.surface`: `hero`, `palette_demo`, `command_builder`, `cli_examples`, or `footer`.
- `theme_css_copied.surface`: `palette_demo`.
- `npm_link_clicked.surface`: `hero` or `footer`.

The dispatcher rejects unknown event names, property names, missing required properties, and values outside these sets before calling any provider. Raw commands, app names, entered colors, full URLs, and free-form labels are forbidden.

The first-use events are deduplicated with in-memory React refs for the current page lifetime. No cookie, local storage key, or durable visitor identifier is added for product events. Copy events are not deduplicated because the requested metric is successful button use.

Provider failures are ignored at the interaction boundary. A tracking failure must never break palette generation, command building, navigation, or clipboard feedback.

## Dashboard

Version one is a single responsive overview page with a quiet operator layout rather than a multi-section console. It uses the site's existing design tokens and page-level CSS, with no Tailwind and no edits to the copied design-system files.

The page contains:

### Overview

- Active visitors in the last five minutes.
- Unique visitors and pageviews for 24 hours, 7 days, and 30 days.
- A 30-day pageview and visitor series.

### Product use

Every product-use tile uses the selected reporting window, with 30 days as the default and 24 hours and 7 days as alternate windows. Numerators and denominators always use the exact same UTC start and end timestamps.

- Palette-generator reach equals unique visitors with `palette_generator_used` divided by all unique visitors in the window.
- Command-builder reach equals unique visitors with `command_builder_used` divided by all unique visitors in the window.
- Command-copy reach equals unique visitors with `command_copied` divided by all unique visitors in the window.
- Stylesheet-copy reach equals unique visitors with `theme_css_copied` divided by all unique visitors in the window.
- Successful command-copy event count is reported separately from command-copy reach and can be grouped by `surface`.
- Successful stylesheet-copy event count is reported separately and is never added to command-copy visitors, because the same visitor may perform both actions.

Event counts come from the Umami event series. Unique event visitors come from Umami statistics filtered by the exact event name. If the Cloud API cannot provide a required filtered metric, the affected reach value renders unavailable instead of substituting event count or adding non-distinct visitor totals.

### npm

- Downloads for the last available day, last 7 days, and last 30 days.
- A daily 30-day download series.
- Current npm `latest` version and publication time.
- The package version currently installed by the site.
- A drift state when npm `latest` and the site dependency disagree.

npm figures are labeled as tarball downloads, not unique people or confirmed project creations.

### Health

- Public production URL HTTP status and response time.
- Umami API configuration and reachability.
- npm registry metadata reachability.
- npm downloads API reachability.
- Latest package version comparison.

This is a request-time snapshot. It is not independent uptime proof because the dashboard cannot be viewed while its own deployment is unavailable.

## Data handling and failures

Each provider call returns a discriminated result:

- `ok` with data and observation timestamp.
- `unconfigured` when its environment contract is absent.
- `timeout` when the deadline expires.
- `unreachable` for rejected or invalid provider responses.

Queries run concurrently. One failed result renders an unavailable panel with a concise reason and observation time while all other panels remain usable. Error boundaries never render raw exceptions, query strings, headers, secrets, or response bodies.

Short server-side caching may be used for historical data, but the active-visitor query remains uncached. The protected route and session checks are always dynamic and uncached.

## Search and privacy boundaries

- Admin metadata is `noindex`, `nofollow`, and `nocache`.
- Admin paths are not added to the sitemap or public navigation.
- `robots.txt` does not advertise the route with a special disallow entry.
- Analytics scripts do not mount under `/admin`.
- No PII or high-cardinality free-form values are sent as event properties.
- All provider credentials are server-only Vercel environment variables.
- The repository contains placeholders and variable names only, never values.

## Verification

Automated verification covers:

- Complete and incomplete admin configuration.
- Correct, wrong, and malformed password submissions.
- Same-origin and cross-site form posts.
- Session minting, signature verification, tampering, expiry, and logout.
- Rate-limit window behavior.
- Admin-path analytics exclusion.
- Public pre-consent behavior: Umami and Vercel Analytics mount, while GA4 does not.
- Product-event names, property allowlists, and first-use deduplication.
- Every copyable public component supplies an allowed copy kind and surface, including both CLI examples.
- Umami authentication, timeout, one-time 401 retry, response validation, and isolated failures.
- npm range and metadata response validation.
- Dashboard formatting and empty states.

Repository verification runs:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Browser verification covers desktop and mobile unlock, invalid password feedback, successful unlock, refresh persistence, lock, protected-route behavior, dashboard loading, and absence of analytics requests on admin routes.

## Rollout

1. Create or reuse the dedicated Umami Cloud Website record without changing Tinify or any other Website record.
2. Implement and verify locally with fake provider responses and local-only admin secrets.
3. Add public Umami identifiers and server credentials to Vercel as sensitive environment variables.
4. Add a new admin password and independently generated session secret to Vercel.
5. Deploy to preview and verify auth, layout, failure states, and analytics exclusion without claiming production data.
6. Deploy to production.
7. With consent denied, generate one controlled public pageview, one `palette_generator_used`, one `command_builder_used`, one `command_copied` from `cli_examples`, one `theme_css_copied`, and one `npm_link_clicked` event. Record the exact test window and allowed property values.
8. Wait for provider ingestion, then verify every event and the pageview in Umami and the matching Umami-derived totals in `/admin` without treating ingestion delay as an application failure.
9. Confirm Vercel Analytics still receives the public pageview and all supported product events while GA4 emits no request before consent.
10. Grant analytics consent, repeat one labeled product event, and confirm GA4 receives it without changing the Umami or Vercel event contract.
11. Visit `/admin/unlock`, unlock the console, navigate and refresh `/admin`, then verify in browser network evidence that no Umami script or event, Vercel Analytics script or event, or GA4 script or event is requested from any admin path.

Local tests, a preview deployment, a production deployment, and visible provider data are separate evidence boundaries. Completion requires all four relevant boundaries to be reported honestly.

## Alternatives considered

### Vercel Web Analytics as the admin source

This would reuse an installed provider and its public query API, but it would require a team-scoped Vercel access token in the application. It was rejected in favor of Umami for the admin source. Vercel Analytics remains enabled independently.

### A custom event database

This would provide full control but would add ingestion, schema, privacy, retention, bot filtering, session semantics, and database operations that this single-operator site does not need. It was rejected as unnecessary complexity.

### External uptime monitoring

This would provide independent availability evidence and alerts. It was explicitly excluded from version one; the health panel is a current snapshot only.
