/**
 * Thin wrapper around the palette engine shipped inside the published CLI.
 *
 * Importing it from the package - rather than reimplementing it - is what
 * guarantees the demo shows exactly what `npx` produces. The engine pulls in
 * colorjs.io and the full Radix color data (~95 KB gzipped), so it is loaded
 * lazily on first interaction instead of on page load.
 */

import { PACKAGE_NAME, PACKAGE_VERSION } from "./content.ts";

export const PRESETS = [
  { value: "shadcn", label: "shadcn/ui", hint: "approved semantic token names + Larsen scales" },
  { value: "radix", label: "Radix Themes", hint: "57 custom-palette override names + 26 Larsen tokens" },
  { value: "css-variables", label: "CSS Variables", hint: "accent + gray scales" },
] as const;

export const FORMATS = [
  { value: "hsl-values", label: "HSL Values", sample: "212 100% 65%" },
  { value: "hex", label: "HEX", sample: "#4DA0FF" },
  { value: "rgb", label: "RGB", sample: "rgb(77, 160, 255)" },
  { value: "hsl", label: "HSL", sample: "hsl(212, 100%, 65%)" },
  { value: "oklab", label: "OKLAB", sample: "oklab(69% 0.02 -0.15)" },
  { value: "oklch", label: "OKLCH", sample: "oklch(69% 0.16 254)" },
] as const;

export const NEUTRAL_TINTS = [
  { value: "subtle", label: "Subtle (default)" },
  { value: "strong", label: "Strong" },
] as const;

/**
 * Named starting points for this site's seed field.
 *
 * Nothing is imported from anywhere: each entry is a plain HEX handed to
 * Larsen's own generator, exactly as if it had been typed. They are not theme
 * presets, and picking one does not change how the palette is built. The names
 * are the common colour vocabulary these shades are known by, which is what
 * makes them findable.
 *
 * What is guaranteed is measured, not assumed: `package-contract.test.mjs`
 * runs every one of them through the published generator under both neutral
 * tints and asserts the package's own contrast gate returns no failures.
 */
export const PREDEFINED_COLOURS = [
  { name: "Neutral", hex: "#A1A1A1" },
  { name: "Amber", hex: "#973C00" },
  { name: "Blue", hex: "#193CB8" },
  { name: "Cyan", hex: "#005F78" },
  { name: "Emerald", hex: "#006045" },
  { name: "Fuchsia", hex: "#8A0194" },
  { name: "Green", hex: "#016630" },
  { name: "Indigo", hex: "#372AAC" },
  { name: "Lime", hex: "#7CCF00" },
  { name: "Orange", hex: "#9F2D00" },
  { name: "Pink", hex: "#A3004C" },
  { name: "Purple", hex: "#6E11B0" },
  { name: "Red", hex: "#9F0712" },
  { name: "Rose", hex: "#A50036" },
  { name: "Sky", hex: "#00598A" },
  { name: "Teal", hex: "#005F5A" },
  { name: "Violet", hex: "#5D0EC0" },
  { name: "Yellow", hex: "#EFB100" },
] as const;

export type Preset = (typeof PRESETS)[number]["value"];
export type Format = (typeof FORMATS)[number]["value"];
export type NeutralTint = (typeof NEUTRAL_TINTS)[number]["value"];

export type PaletteOptions = {
  hex: string;
  preset: Preset;
  format: Format;
  neutralTint: NeutralTint;
};

export const DEFAULT_DEMO_OPTIONS = {
  hex: "#4DA0FF",
  preset: "shadcn",
  format: "hsl-values",
  neutralTint: "subtle",
} as const satisfies PaletteOptions;

/** Token name -> value, for one mode. */
export type TokenMap = Record<string, string>;

/** Normalizes CLI-valid three- or six-digit HEX input, or rejects it. */
export function normalizeHex(hex: string): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const digits = match[1].toLowerCase();
  const full = digits.length === 3 ? digits.replace(/./g, (digit) => digit + digit) : digits;
  return `#${full}`;
}

/** Returns byte-different token names in one generated twelve-step scale. */
export function changedScaleSteps(
  before: TokenMap,
  after: TokenMap,
  scale: "accent" | "gray",
): string[] {
  return Array.from({ length: 12 }, (_, index) => `${scale}-${index + 1}`).filter(
    (token) => before[token] !== after[token],
  );
}

/** Formats changed scale token names as compact numeric steps, such as `1, 3-11`. */
export function formatChangedScaleSteps(tokens: string[]): string {
  const steps = Array.from(
    new Set(
      tokens
        .map((token) => Number(token.slice(token.lastIndexOf("-") + 1)))
        .filter((step) => Number.isInteger(step) && step > 0),
    ),
  ).sort((left, right) => left - right);

  const ranges: string[] = [];
  for (let index = 0; index < steps.length; ) {
    const start = steps[index];
    let end = start;
    while (steps[index + 1] === end + 1) {
      end = steps[++index];
    }
    ranges.push(start === end ? String(start) : `${start}-${end}`);
    index += 1;
  }
  return ranges.join(", ");
}

/** Counts byte-different values in one generated twelve-step scale. */
export function countChangedScaleSteps(
  before: TokenMap,
  after: TokenMap,
  scale: "accent" | "gray",
): number {
  return changedScaleSteps(before, after, scale).length;
}

export type GeneratedTheme = {
  css: string;
  light: TokenMap;
  dark: TokenMap;
};

type Engine = {
  generateThemeCss: (options: PaletteOptions) => string;
};

let enginePromise: Promise<Engine> | null = null;

/** Loads the engine once and reuses it for every later generation. */
export function loadEngine(): Promise<Engine> {
  enginePromise ??= import("@larsen-utvikling/create-next-app/palette/index.js") as Promise<Engine>;
  return enginePromise;
}

/** True once the engine is in memory, so the UI can skip its loading state. */
export function isEngineLoaded(): boolean {
  return enginePromise !== null;
}

export async function generate(options: PaletteOptions): Promise<GeneratedTheme> {
  const hex = normalizeHex(options.hex);
  if (!hex) throw new Error("Cannot generate a palette for invalid HEX input.");
  const engine = await loadEngine();
  const css = engine.generateThemeCss({ ...options, hex });
  return { css, light: parseBlock(css, ":root {", "@media"), dark: parseBlock(css, "@media", '[data-theme="light"]') };
}

/** Accepts "4DA0FF" and "#4da0ff" alike - same rule as the CLI prompt. */
export function isValidHex(hex: string): boolean {
  return normalizeHex(hex) !== null;
}

/** The exact command that reproduces the current selection. */
export function buildCommand(options: PaletteOptions, appName = "my-app"): string | null {
  const hex = normalizeHex(options.hex);
  if (!hex) return null;

  const parts = [
    `npx --yes ${PACKAGE_NAME}@${PACKAGE_VERSION} ${appName}`,
    "--defaults",
    `--hex ${hex.slice(1).toUpperCase()}`,
  ];
  if (options.preset !== "shadcn") parts.push(`--preset ${options.preset}`);
  if (options.format !== "hsl-values") parts.push(`--format ${options.format}`);
  if (options.neutralTint !== "subtle") parts.push(`--neutral-tint ${options.neutralTint}`);
  return parts.join(" ");
}

/** The harmony explorer keeps the visitor's current valid seed. */
export function rampkitHarmonyUrl(hex: string): string | null {
  const normalized = normalizeHex(hex);
  return normalized ? `https://rampkit.app/?hex=${normalized.slice(1).toUpperCase()}&harmonized=true` : null;
}

/**
 * Pulls the declarations out of one block of the generated stylesheet. The
 * engine emits `:root` for light and a `prefers-color-scheme` media query for
 * dark, both of which we need to render side by side.
 */
function parseBlock(css: string, from: string, to: string): TokenMap {
  const start = css.indexOf(from);
  if (start === -1) return {};
  const end = css.indexOf(to, start + from.length);
  const segment = css.slice(start, end === -1 ? undefined : end);
  const tokens: TokenMap = {};
  for (const match of segment.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[match[1]] ??= match[2].trim();
  }
  return tokens;
}
