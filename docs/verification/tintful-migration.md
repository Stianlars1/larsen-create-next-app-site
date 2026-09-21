# Tintful migration verification

The site uses the CLI's shared integration with published tintful@0.1.1.
Node >=22.20.0 is required. Native shadcn, Radix and canonical exports retain
original CSS/audit/manifests. Worker previews share the same serialization.

## Correction of the initial contrast report

The initially reported 4.5997-4.5999 boundary failures were consumer verifier
false negatives, not Tintful defects. Color.js's general XYZ-D65 luminance is
not WCAG's normative weighted linear sRGB luminance. The corrected CLI verifier
uses normative coefficients and accepts #7B534B, #5736FE and #FE9762 under all
three neutrals. No Tintful change, lower target or rejection allowlist is needed.

The original candidate hash 63b4004cf75eadc926b87540970fc18bf391901d9ba5cb6d7d0cc09815703763
is superseded. Final released dependency identity and deployed state are recorded
below after registry/deployment verification.

## Scope and retained verification

The migration retains 18 named seed shortcuts, validates every requested export,
and uses exact downloaded CSS bytes matching the CLI. Native canonical ramp maps
power 48 swatches and gradients. Both demo and builder hide rejected outputs and
show errors. Worker correlation, transport failures, restart and stale-result
handling are tested. Consumer CSS no longer references removed legacy ramps.

The previous implementation passed 33 tests, lint, types, production build and
browser checks at desktop and 390px widths. The current release also merges the
remote main admin and privacy-safe analytics implementation rather than reverting
those live features. The combined suite and build are rerun before deployment.

Passing palettes do not certify entire applications against WCAG. Actual Tintful
Radix alpha-fidelity rejections remain enforced; they are separate from the
retracted consumer-luminance finding. No implicit format fallback is permitted.

Hosted builds require the CLI's published version, integrity and gitHead to
match the installed package. Publish the verified CLI first, install it from
npm, then deploy and verify this website.

## Corrected release candidate and combined checks

CLI PR #5 is merged at 497e1baaf23b90413f6a91a4132cd6937b6dd1e1.
Candidate: /var/folders/h1/82t44wr13fj06v4fr9mkkfk40000gn/T/lu-release-candidate-ZfnKJN/larsen-utvikling-create-next-app-0.7.0.tgz.
SHA-256: e389782fda81cf0a94076e4b5724ae3c5c50b422414ffa20836b44efb838bf89.

CLI: 74 tests, 2,286/2,286 sweep exports, exact tarball smoke and full
install/build smoke passed. Lowest normative text ratio: 4.60002238236111.
Website after integrating remote main: 39 Node tests and 84 Vitest tests pass;
lint, TypeScript and production build pass. Admin token references and product
event enums are migrated to native Tintful roles/choices while preserving auth,
analytics privacy boundaries and the existing proxy configuration.

The npm publish attempt reached the browser 2FA gate but timed out before
publication. Registry confirmed 0.7.0 absent afterward. Publication and website
deployment await renewed owner authentication; no production change is claimed.
The lockfile records the candidate integrity at its intended future registry URL;
local checks used the exact tarball. Run npm ci and the registry gate after publish.

## Published dependency verification

CLI 0.7.0 was published and independently verified on 2026-09-22 Europe/Oslo.
Registry version/latest, integrity, gitHead and downloaded tarball bytes match
the corrected release candidate above. The CLI release is at
https://github.com/Stianlars1/larsen-create-next-app/releases/tag/v0.7.0.

The site installed 0.7.0 from npm and completed npm ci. The required publication
gate passed against the public registry. The combined suite passes 39 Node tests
and 84 Vitest tests; ESLint, TypeScript and production build pass. This supersedes
the earlier authentication blocker. Live deployment is verified separately.
