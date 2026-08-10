# AGENTS.md

Rules for working on the landing page at `create-next-app.larsenutvikling.no`.

## What this repo is

The marketing and demo site for
[`@larsen-utvikling/create-next-app`](https://github.com/Stianlars1/larsen-create-next-app).
It exists to explain that package - it is not the product.

**To understand the product, read
[PROJECT.md in the package repo](https://github.com/Stianlars1/larsen-create-next-app/blob/main/PROJECT.md).**
It is the source of truth for every prompt, flag, token and file. Do not
describe the CLI's behaviour on this site from memory - check it there, or in
the CLI source.

## The two rules that shape everything here

**1. The page is built with the design system it is selling.**
`src/styles/design-system/` is a copy of what the package ships -
`core.css`, `theme.css`, `motion.css`, `base.css`, unchanged. Page-level
concerns (type scale, layout widths, surfaces) live in `src/app/globals.css`.
If a change needs a token the template does not have, that is a signal to add
it page-level, not to edit the design system copy.

**2. The demo runs the real engine.**
`src/lib/palette.ts` imports
`@larsen-utvikling/create-next-app/palette/index.js` from the installed
package. What a visitor generates is byte-for-byte what `npx` writes - this has
been verified by diffing both outputs for the same seed. Never reimplement or
copy the engine; that property is the whole point.

## Content accuracy

`src/lib/content.ts` is the single source of truth for the page: every prompt,
choice, flag, token and file. Components render from it, so a capability
cannot ship in the CLI and quietly go missing here.

When the CLI changes, update `content.ts` first, then the components.

Two claims have already shipped wrong and been corrected - "validated against
npm's naming rules" (it is the package's own regex) and "seven questions"
beside a list of ten (seven top-level, three follow-ups). **Check factual
statements against the CLI source, do not infer them.**

`src/lib/package-contract.test.mjs` enforces that mechanically. It imports the
installed package's `OPTION_CONTRACT`, `SKILLS_PROMPT_CONTRACT`, skill lists
and palette constants, and fails when this site's flags, choices, defaults,
skill catalogue, prompt wording or skill counts drift from them. It reads the
*installed* package, so it also fails while `package.json` still pins a
version older than the behaviour the site describes. That is the intended
gate, not a nuisance: bump the dependency, reinstall, then make the claim.

## Design direction

Restraint over decoration. The reference points are Linear, Vercel, Raycast and
Emil Kowalski's site.

- **Borders are rare.** Depth comes from a lifted background (`--surface-1`,
  `--surface-2`) and space. An earlier version had 40 bordered cards and read
  as generic; it is down to 3. Do not reintroduce a uniform card grid.
- **The rhythm is editorial:** a small label, a tight headline, one line of
  prose, then a visual that is allowed to be large. `FeatureBlock` implements
  it. Alternate `side` and `stacked`.
- **Type is small and tight.** 15px body. Headlines are `font-weight: 500` with
  negative tracking, not huge and bold.
- **Copy is short.** One line where one line will do.
- **Motion:** Motion (Framer) for orchestration - `whileInView`, sequences,
  layout. CSS transitions for anything high-cardinality, like the palette
  swatches, where animating fifty elements would stutter.
- **Ambient loops pause offscreen.** `useInViewLoop` drives them and stops when
  the element is not visible.

## Non-negotiables

- **Never Tailwind.**
- **Only `-` as a dash.** Never `—` or `–`.
- **Everything is English.** This site is for an international audience;
  larsenutvikling.no is the Norwegian one.
- **Clarify, do not guess.** Ask Stian with concrete options when a decision
  has more than one defensible answer.
- **Nothing is measured before consent.** Vercel Analytics is cookie-free and
  always on; GA4 only mounts after the banner is accepted and only when
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.

## Gotchas

- `getComputedStyle` on an offscreen element can return the pre-transition
  value, because the browser stalls transitions there. Verify against the
  inline style, or disable the transition before measuring.
- `react-hooks/set-state-in-effect` will reject state updates driven from an
  effect. Drive generation from the interaction that asked for it, and read
  external state (media queries, consent) with `useSyncExternalStore`.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm test          # pure logic plus the package-contract drift guard
npx tsc --noEmit
```

## Deployment

Vercel, from `main`. The domain and `NEXT_PUBLIC_GA_MEASUREMENT_ID` are set in
the Vercel dashboard - there is no config for them in this repo.
