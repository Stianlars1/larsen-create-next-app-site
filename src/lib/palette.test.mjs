import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_DEMO_OPTIONS,
  PREDEFINED_COLOURS,
  buildCommand,
  changedScaleSteps,
  countChangedScaleSteps,
  formatChangedScaleSteps,
  normalizeHex,
  rampkitHarmonyUrl,
} from "./palette.ts";

const base = {
  hex: "#4DA0FF",
  preset: "shadcn",
  format: "hsl-values",
  neutralTint: "subtle",
};

test("the command omits the default subtle neutral tint", () => {
  assert.equal(
    buildCommand(base),
    "npx --yes @larsen-utvikling/create-next-app@0.5.1 my-app --defaults --hex 4DA0FF",
  );
});

test("the command emits the strong neutral tint", () => {
  assert.equal(
    buildCommand({ ...base, neutralTint: "strong" }),
    "npx --yes @larsen-utvikling/create-next-app@0.5.1 my-app --defaults --hex 4DA0FF --neutral-tint strong",
  );
});

test("HEX normalization expands shorthand and rejects invalid input", () => {
  assert.equal(normalizeHex(" #AbC "), "#aabbcc");
  assert.equal(normalizeHex("4DA0FF"), "#4da0ff");
  assert.equal(normalizeHex("#abcd"), null);
  assert.equal(normalizeHex("not-a-colour"), null);
});

test("the command is absent for invalid HEX and expands valid shorthand", () => {
  assert.equal(buildCommand({ ...base, hex: "#abcd" }), null);
  assert.equal(
    buildCommand({ ...base, hex: "#AbC" }),
    "npx --yes @larsen-utvikling/create-next-app@0.5.1 my-app --defaults --hex AABBCC",
  );
});

test("the Rampkit harmony URL follows the current valid HEX", () => {
  assert.equal(
    rampkitHarmonyUrl("#4da0ff"),
    "https://rampkit.app/?hex=4DA0FF&harmonized=true",
  );
  assert.equal(rampkitHarmonyUrl("not-a-colour"), null);
});

test("the main demo starts from the CLI default without a tint flag", () => {
  assert.deepEqual(DEFAULT_DEMO_OPTIONS, {
    hex: "#4DA0FF",
    preset: "shadcn",
    format: "hsl-values",
    neutralTint: "subtle",
  });
  assert.equal(buildCommand(DEFAULT_DEMO_OPTIONS).includes("--neutral-tint"), false);
});

test("the approved named colour shortcuts are unique valid HEX seeds", () => {
  assert.deepEqual(
    PREDEFINED_COLOURS.map(({ name, hex }) => [name, hex]),
    [
      ["Neutral", "#A1A1A1"],
      ["Amber", "#973C00"],
      ["Blue", "#193CB8"],
      ["Cyan", "#005F78"],
      ["Emerald", "#006045"],
      ["Fuchsia", "#8A0194"],
      ["Green", "#016630"],
      ["Indigo", "#372AAC"],
      ["Lime", "#7CCF00"],
      ["Orange", "#9F2D00"],
      ["Pink", "#A3004C"],
      ["Purple", "#6E11B0"],
      ["Red", "#9F0712"],
      ["Rose", "#A50036"],
      ["Sky", "#00598A"],
      ["Teal", "#005F5A"],
      ["Violet", "#5D0EC0"],
      ["Yellow", "#EFB100"],
    ],
  );
  assert.equal(new Set(PREDEFINED_COLOURS.map(({ name }) => name)).size, 18);
  assert.equal(new Set(PREDEFINED_COLOURS.map(({ hex }) => hex)).size, 18);
  assert.equal(PREDEFINED_COLOURS.every(({ hex }) => /^#[0-9A-F]{6}$/.test(hex)), true);
});

test("changed scale steps are counted from actual generated token values", () => {
  const before = { "gray-1": "0 0% 1%", "gray-2": "0 0% 2%", "accent-1": "x" };
  const after = { "gray-1": "0 0% 1%", "gray-2": "220 4% 2%", "accent-1": "y" };

  assert.equal(countChangedScaleSteps(before, after, "gray"), 1);
  assert.equal(countChangedScaleSteps(before, after, "accent"), 1);
  assert.deepEqual(changedScaleSteps(before, after, "gray"), ["gray-2"]);
});

test("changed scale steps are formatted as compact ranges", () => {
  assert.equal(
    formatChangedScaleSteps(["gray-1", "gray-3", "gray-4", "gray-5", "gray-6", "gray-7", "gray-8", "gray-9", "gray-10", "gray-11"]),
    "1, 3-11",
  );
  assert.equal(formatChangedScaleSteps([]), "");
});

test("changed-step formatting works in supported browsers without toSorted", () => {
  const descriptor = Object.getOwnPropertyDescriptor(Array.prototype, "toSorted");
  delete Array.prototype.toSorted;
  try {
    assert.equal(formatChangedScaleSteps(["gray-4", "gray-2", "gray-3"]), "2-4");
  } finally {
    if (descriptor) Object.defineProperty(Array.prototype, "toSorted", descriptor);
  }
});
