---
title: "I got tired of the same 30 minutes, so I built my own create-next-app"
description: "Why a starter template needs a design system, what happens when you generate a colour palette from one HEX, and the contrast bug that made dark mode unusable."
date: 2026-08-08
lang: en
alternate: /blogg/jeg-bygget-min-egen-create-next-app
tags:
  - Next.js
  - Design systems
  - CSS
  - Open source
excerpt: "Every new project started the same way: run create-next-app, delete the boilerplate, copy tokens from the last project, write the same AGENTS.md again. So I packaged it."
---

Every new project started the same way. Run `create-next-app`. Delete the demo
page. Delete the CSS that came with it. Copy the spacing tokens from whatever I
built last. Try to remember which easing curve I settled on. Write more or less
the same `AGENTS.md` again, slightly worse than last time because I was writing
it from memory.

Thirty minutes, give or take, before the project was actually mine. Multiply
that by every prototype, every client spike, every idea that lasted a weekend.

So I packaged it: `npx @larsen-utvikling/create-next-app`.

## What a starter is actually missing

The official `create-next-app` is good at what it does. It gives you the
framework, correctly configured, at the newest version. What it cannot give you
is a point of view, because it has to serve everyone.

That is fine for the framework and useless for everything above it. You still
have to decide your spacing scale, your type scale, how dark mode works, what
your durations are. Most of us decide those things once and then re-derive them
badly, project after project.

A template with a point of view can just answer them:

- **Spacing**: eight steps on a 4px base. 4, 8, 12, 16, 24, 32, 48, 64.
- **Type**: unitless leading so it scales, tracking that tightens on display sizes.
- **Motion**: durations named for what moves, four curves in one file.
- **Colour**: generated, not hand-picked - more on that below.
- **Dark mode**: `prefers-color-scheme` with a `data-theme` override. No JavaScript.

None of that is novel. The point is that it is decided, written down, and in the
first commit.

## Why no Tailwind

This is not a criticism of Tailwind, it is a criticism of what happens when
utilities are the only layer you have. When every value lives in a class name
in markup, the design system stops existing as a thing you can look at. Ask
"what are our spacing steps?" and the honest answer becomes "whatever people
typed".

Vanilla CSS with custom properties keeps the system as an artifact. Five small
files you can read in a sitting:

```
src/lib/design-system/
├── index.css    the only import your app needs
├── core.css     spacing, widths, radii, type, layering
├── theme.css    colour, light and dark
├── motion.css   durations, curves, reduced motion
└── base.css     reset
```

Your `globals.css` is one line. The system is one thing you can version, replace
or delete.

## A palette from a single HEX

Colour is the part people re-derive worst, because doing it properly is real
work. You need a 12-step accent scale where each step has a job, a gray scale
that carries a hint of your hue, semantic colours for success and danger, and
all of it again for dark mode.

I already had an engine for this - I built [rampkit](https://rampkit.app) to do
exactly that. So the CLI vendors it and runs it locally during install. You
answer one prompt with `#22C55E` and get the whole system written to
`theme.css`, in whichever format you asked for.

The landing page runs the same engine in your browser, imported from the
published package, so what you generate there is byte-for-byte what `npx`
writes. I checked that with a diff rather than assuming it.

## The bug that made dark mode unusable

Here is the part worth writing down, because I nearly shipped it.

The default theme is monochrome - black and white with a blue accent, matching
my own brand. So I seeded the generator with `#0A0A0A`, near-black, and it
produced a perfectly reasonable light mode.

Then I measured dark mode.

```
--background: 0 0% 6%    #0F0F0F
--primary:    0 0% 4%    #0A0A0A   contrast vs background: 1.03:1
--ring:       0 0% 4%    #0A0A0A   contrast vs background: 1.03:1
```

A 1.03:1 contrast ratio is invisible. Every primary button and every focus ring
would have been a black rectangle on a black surface. The page looked fine,
because my demo page did not happen to use `--primary` - which is exactly how
this kind of thing survives a visual review.

The cause is structural rather than a mistake in the maths. The engine keeps
`--primary` and `--ring` at your seed colour in *both* modes. That is correct for
a mid-range colour: a green button is green in light and dark. It falls apart at
the extremes, because a near-black seed produces a near-black primary on a
near-black dark surface.

The fix is to stop pretending one seed serves both modes. Light mode needs a
dark accent; dark mode needs a light one. So each mode is now generated from the
seed that works in it, and an extreme seed is automatically paired with its
lightness-inverted counterpart. Dark-mode `--primary` went from **1.03:1 to
18.97:1**.

A contrast check now runs in the test suite before every release, and it is
written to catch the specific failure rather than colour choices in general - a
brand accent is allowed to sit below the WCAG non-text threshold as a button
surface, but nothing is allowed to be invisible.

## Motion belongs in the template

Most starters ship no motion layer at all, which means every project invents its
own curves, and they never quite match across components.

The values in `motion.css` come from the `motion-craft` skill in my
[Larsen Skills](https://github.com/Stianlars1/larsen-skills) collection, and are
the ones larsenutvikling.no already runs. Durations are named for what moves -
`--duration-press`, `--duration-ui`, `--duration-slow` - so you pick by what you
are animating rather than by taste.

The part I care most about is reduced motion. The standard snippet kills every
animation with `animation-duration: 0.01ms !important`, including the loading
spinners and progress indicators that people rely on to know something is
happening. Reduced motion targets vestibular triggers, not feedback.

So instead of a blanket rule, the distance, scale and stagger tokens collapse:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --enter-distance: 0px;
    --enter-scale: 1;
    --press-scale: 1;
    --stagger-item: 0ms;
  }
}
```

Transitions keep running. Movement stops. Anything genuinely decorative and
continuous opts out with `data-motion="decorative"`.

## Docs are part of the deliverable

An agent that does not know your conventions will invent them, and it will
invent them differently every session. So every project gets an `AGENTS.md` with
the actual rules - never Tailwind, the token idiom for the palette you chose,
the motion rules - and a `CLAUDE.md` that contains a single `@AGENTS.md` import
rather than a second copy that drifts.

`create-next-app` writes its own `AGENTS.md` full of framework guidance. That is
genuinely useful, so it is preserved as `NEXTJS.md` rather than overwritten.

There is also an optional install of the skills collection itself, into
`.agents/skills/`, which every agent picks up.

## What I would tell you before you build one

Three things surprised me.

**Vendoring beats reimplementing.** The palette engine lives in one folder with
a single exported function and a `NOTICE.md` pinning the upstream commit.
Because the landing page imports it from the published package rather than
copying it, the demo cannot drift from the CLI. That property came free from
where the code lives.

**Test the generated thing, not the generator.** The smoke test scaffolds real
apps and asserts on the files that come out - the design system exists, no
Tailwind dependency, no unsubstituted placeholders, contrast passes. It runs
automatically before every publish. A green run means the tarball is verified.

**Run the matrix.** I tested every package manager, every linter, several
palette combinations, and every invalid input, in one script. It found two real
bugs I would otherwise have shipped: a wrong page-surface colour with one preset,
and a CLI that hung in CI and died with a cryptic Node warning instead of saying
which flag to pass.

## Try it

```bash
npx @larsen-utvikling/create-next-app my-app
```

Seven questions, each with a flag if you would rather not answer them. The
source is on [GitHub](https://github.com/Stianlars1/larsen-create-next-app), and
there is a [live colour demo](https://create-next-app.larsenutvikling.no) if you
want to see what your brand colour turns into first.

It is MIT, and it is mostly built for me - but if it saves you the same thirty
minutes, that is the whole idea.
