# create-next-app.larsenutvikling.no

The landing page for
[`@larsen-utvikling/create-next-app`](https://github.com/Stianlars1/larsen-create-next-app).

## What is interesting here

The page is built with the design system the package ships - `core.css`,
`theme.css`, `motion.css` and `base.css` are copied in unchanged under
`src/styles/design-system/`. That is the argument the page is making, so it
should be true of the page itself.

The colour demo imports the palette engine straight out of the published
package:

```ts
import("@larsen-utvikling/create-next-app/palette/index.js")
```

So what a visitor sees is byte-for-byte what `npx` writes to `theme.css` -
verified by diffing both outputs for the same seed. The default palette is
generated on the server at build time, and the engine (~95 kB gzipped) only
loads when someone changes a control.

Feature copy lives in `src/lib/content.ts` - a single source of truth for every
prompt, flag, token and file the CLI produces, so a capability cannot ship in
the CLI and quietly go missing from the site.

## Development

```bash
npm install
npm run dev
npm run preflight
npm test
npm run build
npm run lint
npx tsc --noEmit
```

## Analytics and admin

The public site keeps two cookie-free analytics providers:

- Umami Cloud is the source of truth for `/admin` traffic and product-use reporting.
- Vercel Web Analytics remains an independent public measurement system.

Google Analytics is optional and mounts only after analytics consent when
`NEXT_PUBLIC_GA_MEASUREMENT_ID` is configured. No analytics provider or consent
banner mounts under `/admin`.

The public event contract is deliberately small and does not send commands,
app names, entered HEX values, URLs, or other free-form data:

- `palette_generator_used`
- `command_builder_used`
- `command_copied`
- `theme_css_copied`
- `npm_link_clicked`

`/admin` is a one-operator password gate. It requires both `ADMIN_PASSWORD`
and an independent `ADMIN_SESSION_SECRET`. The password must contain at least
20 Unicode code points and no more than 256 UTF-8 bytes. The session secret
must contain at least 32 random bytes. The session is HMAC-signed, HTTP-only,
Secure on HTTPS, SameSite Strict, scoped to `/admin`, and expires after 12
hours.

Use [.env.example](.env.example) for variable names only. Never commit values.
The preflight script permits an entirely unconfigured local admin, but rejects
partial or invalid admin and Umami configuration before a build.

The admin dashboard displays an on-demand snapshot of the public site, Umami,
npm registry, and npm downloads API. It is not independent uptime monitoring.
npm figures are package downloads, not unique visitors, installs, or confirmed
project creations.

## Deployment

Vercel deploys from `main`. Production configuration is managed in the Vercel
dashboard or CLI. Set `NEXT_PUBLIC_UMAMI_SRC` to
`https://cloud.umami.is/script.js`, use this app's own Website ID for the public
and server Website ID variables, and set the shared Cloud API key as the
server-only `UMAMI_API_KEY`. The Cloud API endpoint is `https://api.umami.is/v1`.
Also set the admin password and session secret, and optionally the GA measurement
ID.

Treat local tests, preview behavior, the production deployment, and visible
provider ingestion as separate verification boundaries. A green local test does
not prove a Vercel environment variable, an Umami website record, or production
analytics ingestion.

## License

MIT
