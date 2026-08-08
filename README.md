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
npm run build
npm run lint
```

## Deployment

Vercel, from `main`. The domain is attached in the Vercel dashboard;
`NEXT_PUBLIC_GA_MEASUREMENT_ID` is set there too.

## License

MIT
