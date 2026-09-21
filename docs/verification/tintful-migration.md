# Tintful migration verification

Local verification on 2026-09-22. No deployment or npm publication is claimed.

## Dependency and release order

The site pins `@larsen-utvikling/create-next-app@0.7.0`, which depends on
`tintful@0.1.1`. CLI source gitHead:
`4a47ba0da029fa04bbc4484b2219c57f966320d0`.

The installed and tested release candidate is:
`/var/folders/h1/82t44wr13fj06v4fr9mkkfk40000gn/T/lu-release-candidate-84mmZk/larsen-utvikling-create-next-app-0.7.0.tgz`.
SHA-256: `63b4004cf75eadc926b87540970fc18bf391901d9ba5cb6d7d0cc09815703763`.

The lockfile retains its exact integrity with the intended registry URL. This
version is not yet published. Stian must publish that same verified tarball,
then run `npm ci` and `node scripts/verify-cli-release.mjs --require-published`
before deployment. The gate checks version, integrity and gitHead against npm.
Hosted Vercel builds run the gate automatically. Its current rejection of the
unpublished version was verified locally.

To reproduce local checks before publication, install the candidate explicitly
with `npm install --no-save --package-lock=false <candidate>`; do not commit a
machine-specific file dependency or treat this as a registry installation.

## Results

- 33 tests passed, including 18 named seeds under all three neutrals, final
  contrast, choices against engine capabilities, byte parity, removed-token
  checks, Worker correlation, transport failures and restart.
- ESLint, TypeScript and production build passed against the exact candidate.
- All copied design-system files match CLI masters, including original audit
  artifacts and separate consumer document styling.
- Browser verified a bundler-managed Worker, rapid-input latest-result handling,
  the named seed picker, Strong/Weak comparison, 48 swatches and native previews.
- Actual browser downloads matched CLI CSS for cyan/Radix/RGB/weak,
  emerald/shadcn/HSL-channels/weak and cyan/canonical/OKLAB/strong.
- Clipboard command matched accepted options and 0.7.0.
- Unsupported Radix HSL channels, Radix HEX fidelity failures, consumer-margin
  failures and invalid HEX suppress exports/commands. Builder and demo both
  explain the failure while retaining an explicitly labelled last passing view.
- Emerald browser text-role measurements across canvas/muted/card were at least
  8.8898:1; ring measurements across canvas/card/popover at least 4.8448:1.
- Desktop and 390px mobile visuals inspected; no horizontal overflow at 390px.

Local browser console had expected unavailable Vercel Analytics endpoint errors
and font preload warnings; no Worker/application exceptions were observed.

## Quality limitations

A passing palette is not a full application WCAG certification. All exports
require engine generation and export quality plus the shared consumer contrast
gate. Tintful 0.1.1 can reject Radix exports because of alpha-equivalent fidelity.
The shared consumer additionally rejects three HSL-channel seeds across all
neutrals whose native text pairs measure 4.5997-4.5999, below the project's exact
4.6 target despite the engine's passing status. It does not rewrite engine CSS.
The 18 named picker colors pass their default shadcn configurations; each
changed preset/format is checked anew and can be explicitly rejected.
