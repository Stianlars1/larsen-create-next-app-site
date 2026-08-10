/**
 * Drift guard between this site and the CLI it describes.
 *
 * Every claim below is checked against the installed
 * @larsen-utvikling/create-next-app package rather than against the copy that
 * happened to be written here. The site has shipped false claims before, so a
 * flag, choice, skill or prompt that changes in the package has to fail here
 * before it can reach a visitor.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  OPTION_CONTRACT,
  optionChoices,
  optionDefault,
} from "@larsen-utvikling/create-next-app/src/options.js";
import {
  ALL_SKILLS,
  RECOMMENDED_SKILLS,
  SELECTABLE_SKILLS,
} from "@larsen-utvikling/create-next-app/src/skills.js";
import {
  PALETTE_PROMPT_CONTRACT,
  SKILLS_PROMPT_CONTRACT,
} from "@larsen-utvikling/create-next-app/src/prompts.js";
import {
  FORMATS as PACKAGE_FORMATS,
  NEUTRAL_TINTS as PACKAGE_NEUTRAL_TINTS,
  PRESETS as PACKAGE_PRESETS,
} from "@larsen-utvikling/create-next-app/palette/index.js";

import { checkThemeContrast } from "@larsen-utvikling/create-next-app/src/theme-contrast.mjs";
import { generateThemeCss } from "@larsen-utvikling/create-next-app/palette/index.js";

import { FLAGS, LARSEN_SKILLS, PROMPT_STEPS, THIRD_PARTY_SKILLS } from "./content.ts";
import {
  FORMATS,
  NEUTRAL_TINTS,
  PREDEFINED_COLOURS,
  PRESETS,
  DEFAULT_DEMO_OPTIONS,
} from "./palette.ts";

const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const HUELESS_NEUTRAL_TINT_EXCEPTIONS = ["#000000", "#010101", "#FEFEFE", "#FFFFFF"];

const hexClaims = (copy) =>
  [...copy.matchAll(/#[0-9a-f]{6}/gi)].map((match) => match[0].toUpperCase());

test("the documented flag list is exactly the package option contract", () => {
  // The site collapses each boolean pair into one row, and prefixes the two
  // flags that have a short form.
  const documented = new Set(
    FLAGS.flatMap(({ flag }) =>
      flag
        .split(" / ")
        .map((part) => part.trim().replace(/^-\w,\s*/, "").split(" ")[0])
        .filter((part) => part.startsWith("--")),
    ),
  );
  const shipped = new Set(OPTION_CONTRACT.map((option) => `--${option.name}`));

  assert.deepEqual([...documented].sort(), [...shipped].sort());
});

test("the palette choices are the package's own choices", () => {
  assert.deepEqual(
    PRESETS.map((preset) => preset.value),
    Object.keys(PACKAGE_PRESETS),
  );
  assert.deepEqual(
    [...FORMATS.map((format) => format.value)].sort(),
    Object.keys(PACKAGE_FORMATS).sort(),
  );
  assert.deepEqual(
    NEUTRAL_TINTS.map((tint) => tint.value),
    [...PACKAGE_NEUTRAL_TINTS],
  );
});

test("the demo and the builder start from the CLI's own defaults", () => {
  assert.equal(DEFAULT_DEMO_OPTIONS.preset, optionDefault("preset"));
  assert.equal(DEFAULT_DEMO_OPTIONS.format, optionDefault("format"));
  assert.equal(DEFAULT_DEMO_OPTIONS.neutralTint, optionDefault("neutral-tint"));

  const builder = read("../components/features/command-builder.tsx");
  assert.match(
    builder,
    new RegExp(`DEFAULT_NEUTRAL_TINT: NeutralTint = "${optionDefault("neutral-tint")}"`),
  );
});

test("the labelled tint is the one the CLI falls back to", () => {
  const fallback = optionDefault("neutral-tint");
  const labelled = NEUTRAL_TINTS.filter((tint) => tint.label.includes("(default)"));
  assert.deepEqual(
    labelled.map((tint) => tint.value),
    [fallback],
    "exactly the CLI's fallback value may be labelled as the default",
  );
});

test("the palette walkthrough asks what the CLI asks, in the CLI's words", () => {
  const step = PROMPT_STEPS.find((entry) => entry.id === "palette");
  assert.ok(step, "the site still documents the palette prompt");

  assert.equal(step.question, PALETTE_PROMPT_CONTRACT.confirmation.message);

  // The walkthrough mirrors the CLI's own prompt contract, question for
  // question and in order, rather than a hand-kept copy of it.
  const expected = PALETTE_PROMPT_CONTRACT.followUps.map((entry) => entry.option);
  assert.deepEqual(
    step.followUps?.map((entry) => entry.id),
    expected,
  );
  assert.deepEqual(
    step.followUps?.map((entry) => entry.question),
    PALETTE_PROMPT_CONTRACT.followUps.map((entry) => entry.message),
  );

  const NUMERALS = ["zero", "one", "two", "three", "four", "five", "six"];
  assert.match(
    step.why,
    new RegExp(`${NUMERALS[expected.length]} follow-up questions`, "i"),
    `the palette step should say "${NUMERALS[expected.length]} follow-up questions"`,
  );

  const tintStep = step.followUps?.find((entry) => entry.id === "neutral-tint");
  assert.ok(tintStep, "the site documents the neutral tint question");
  assert.deepEqual(
    tintStep.choices.map((choice) => ({ label: choice.label, hint: choice.hint })),
    optionChoices("neutral-tint").map((choice) => ({ label: choice.label, hint: choice.hint })),
  );
  assert.equal(
    tintStep.choices.filter((choice) => choice.isDefault).length,
    1,
    "exactly one neutral tint is marked as the default",
  );
  assert.equal(
    tintStep.choices.find((choice) => choice.isDefault)?.label,
    optionChoices("neutral-tint").find(
      (choice) => choice.value === optionDefault("neutral-tint"),
    )?.label,
  );
});

test("neutral tint copy limits accent invariance to chromatic seeds and lists every hueless exception", () => {
  const paletteStep = PROMPT_STEPS.find((entry) => entry.id === "palette");
  const tintStep = paletteStep?.followUps?.find((entry) => entry.id === "neutral-tint");
  assert.ok(tintStep, "the site documents the neutral tint question");

  const strong = tintStep.choices.find((choice) => choice.label === "Strong");
  assert.match(strong?.hint ?? "", /chromatic accent scale unchanged/i);
  assert.match(tintStep.why, /chromatic accent scales stay unchanged/i);
  assert.deepEqual(hexClaims(tintStep.why), HUELESS_NEUTRAL_TINT_EXCEPTIONS);

  const disclosure = read("../components/ui/neutral-tint-disclosure.tsx");
  assert.match(disclosure, /Subtle is the CLI default and needs no flag\./);
  assert.match(disclosure, /Strong adds more seed hue to the grays\./);
  assert.match(disclosure, /Accent colours stay unchanged, except for/);
  assert.deepEqual(hexClaims(disclosure), HUELESS_NEUTRAL_TINT_EXCEPTIONS);
  assert.doesNotMatch(disclosure, /tokens built on it|largest single-channel difference/i);

  for (const copy of [strong?.hint ?? "", tintStep.why, disclosure]) {
    assert.doesNotMatch(
      copy,
      /\bnever\b[^.!?\n]{0,80}\baccent scale\b|\baccent scale\b[^.!?\n]{0,80}\bnever\b/i,
      "neutral tint copy must not make an unconditional 'never changes accent' claim",
    );
  }
});

test("palette change summaries separate the count from the outlined steps", () => {
  const demo = read("../components/demo/palette-demo.tsx");

  assert.match(demo, /\$\{scale\.changed\.length\}\/12 changed/);
  assert.match(demo, /Outlined steps:/);
  assert.match(demo, /className=\{styles\.changedSteps\}/);
  assert.doesNotMatch(demo, /moved by Strong|unchanged by Strong/);
});

test("the skill catalogue matches the package, source by source", () => {
  assert.deepEqual(
    LARSEN_SKILLS.map((skill) => skill.name),
    [...ALL_SKILLS],
  );
  assert.deepEqual(
    LARSEN_SKILLS.filter((skill) => skill.recommended).map((skill) => skill.name),
    [...RECOMMENDED_SKILLS],
  );
  assert.deepEqual(
    THIRD_PARTY_SKILLS.map((skill) => skill.name),
    SELECTABLE_SKILLS.filter((name) => !ALL_SKILLS.includes(name)),
  );
  assert.equal(
    LARSEN_SKILLS.every((skill) => skill.source === "larsen"),
    true,
  );
  assert.equal(
    THIRD_PARTY_SKILLS.every((skill) => skill.source === "third-party"),
    true,
  );
});

test("the skills prompt is quoted verbatim from the package contract", () => {
  const step = PROMPT_STEPS.find((entry) => entry.id === "skills");
  assert.ok(step, "the site still documents a skills prompt");
  assert.equal(step.question, SKILLS_PROMPT_CONTRACT.confirmation.message);

  const which = step.followUps?.find((entry) => entry.id === "skills-which");
  assert.ok(which, "the site still documents the follow-up");
  assert.equal(which.question, SKILLS_PROMPT_CONTRACT.selection.message);
  assert.deepEqual(
    which.choices.map((choice) => choice.label),
    SKILLS_PROMPT_CONTRACT.selection.options.map((option) => option.label),
  );

  const recommended = which.choices.find((choice) => choice.label === "Recommended");
  assert.equal(recommended?.hint, RECOMMENDED_SKILLS.join(", "));
});

test("the skills headline counts what the package actually ships", () => {
  const NUMERALS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const larsenWord = NUMERALS[ALL_SKILLS.length] ?? String(ALL_SKILLS.length);
  const thirdPartyWord = NUMERALS[SELECTABLE_SKILLS.length - ALL_SKILLS.length];

  const sections = read("../components/features/sections.tsx");
  assert.match(
    sections,
    new RegExp(`${larsenWord} Larsen skills`, "i"),
    `the headline should say "${larsenWord} Larsen skills"`,
  );
  assert.match(
    sections,
    new RegExp(`${thirdPartyWord} direct third-party opt-in`, "i"),
    `the headline should say "${thirdPartyWord} direct third-party opt-in"`,
  );
  assert.match(sections, new RegExp(`All ${larsenWord}`, "i"));
});

test("every named seed clears the package's own contrast gate, both tints", () => {
  const failures = [];
  for (const { name, hex } of PREDEFINED_COLOURS) {
    for (const neutralTint of NEUTRAL_TINTS.map((tint) => tint.value)) {
      const css = generateThemeCss({ hex, preset: "shadcn", format: "hsl-values", neutralTint });
      for (const failure of checkThemeContrast(css)) {
        failures.push(`${name} ${hex} ${neutralTint}: ${failure}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("no page still offers the removed scheme flag", () => {
  for (const file of [
    "./content.ts",
    "./palette.ts",
    "../components/demo/palette-demo.tsx",
    "../components/features/command-builder.tsx",
    "../components/ui/neutral-tint-disclosure.tsx",
  ]) {
    assert.doesNotMatch(read(file), /--scheme|\bSCHEMES\b/, `${file} still mentions --scheme`);
  }
});
