import capabilities from "@larsen-utvikling/create-next-app/palette/capabilities.json" with { type: "json" };
import { PACKAGE_NAME, PACKAGE_VERSION } from "./content.ts";

export const PRESETS = [
  { value: "shadcn", label: "shadcn/ui", hint: "native Tintful shadcn tokens" },
  {
    value: "radix",
    label: "Radix Themes",
    hint: "native Radix Themes custom-palette tokens",
  },
  {
    value: "canonical",
    label: "Canonical",
    hint: "native Tintful ramps and semantic roles",
  },
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
  { value: "none", label: "None" },
  { value: "weak", label: "Weak (default)" },
  { value: "strong", label: "Strong" },
] as const;

/** Named seeds are input shortcuts, subject to the same export quality gate. */
export { PREDEFINED_COLOURS } from "@larsen-utvikling/create-next-app/palette/seeds.js";

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
  neutralTint: "weak",
} as const satisfies PaletteOptions;

/** Token name -> value, for one mode. */
export type TokenMap = Record<string, string>;

/** Normalizes CLI-valid three- or six-digit HEX input, or rejects it. */
export function normalizeHex(hex: string): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const digits = match[1].toLowerCase();
  const full =
    digits.length === 3
      ? digits.replace(/./g, (digit) => digit + digit)
      : digits;
  return `#${full}`;
}

/** Returns byte-different token names in one generated twelve-step scale. */
export function changedScaleSteps(
  before: TokenMap,
  after: TokenMap,
  scale: "accent" | "gray",
): string[] {
  return Array.from(
    { length: 12 },
    (_, index) =>
      `cpe-ramp-${scale === "accent" ? "brand-primary" : "neutral"}-${index + 1}`,
  ).filter((token) => before[token] !== after[token]);
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
  for (let index = 0; index < steps.length;) {
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
  options: PaletteOptions;
  css: string;
  artifacts: {
    fileName: string;
    text: string;
    sha256: string;
    id: string;
    auditSidecarId?: string;
  }[];
  manifest: Record<string, unknown>;
  ramps: { light: TokenMap; dark: TokenMap };
  light: TokenMap;
  dark: TokenMap;
};

/**
 * The engine emits `hsl-values` as bare triplets, because that is the shape
 * shadcn tokens take. Every other format is already a complete CSS colour.
 */
function asCssColour(value: string, format: Format): string {
  return format === "hsl-values" ? `hsl(${value})` : value;
}

/**
 * All four generated scales, in the same order the page explains them.
 * A conic gradient lets that sequence travel around a panel perimeter instead
 * of turning the palette into another row of swatches.
 *
 * The start angle is read from `--palette-angle` rather than written here, so
 * the stylesheet can sweep the sequence around the perimeter. The literal
 * fallback keeps the gradient valid wherever that property is not registered.
 */
export function paletteBorderGradient(
  theme: GeneratedTheme,
  format: Format,
): string {
  const scale = (mode: "light" | "dark", name: "accent" | "gray") =>
    Array.from(
      { length: 12 },
      (_, index) =>
        theme.ramps[mode][
          `cpe-ramp-${name === "accent" ? "brand-primary" : "neutral"}-${index + 1}`
        ],
    )
      .filter((value): value is string => Boolean(value))
      .map((value) => asCssColour(value, format));

  const colours = [
    ...scale("dark", "accent"),
    ...scale("dark", "gray"),
    ...scale("light", "accent"),
    ...scale("light", "gray"),
  ];

  if (colours.length < 2) {
    return "conic-gradient(from var(--palette-angle, 225deg), var(--hairline), var(--hairline))";
  }

  // Repeat the first colour only to close the loop without a hard seam.
  return `conic-gradient(from var(--palette-angle, 225deg), ${colours.join(", ")}, ${colours[0]})`;
}

/**
 * The four stops the ambient glow behind the panel is built from.
 *
 * Steps 8 to 11 are where a generated scale carries its chroma - 1 to 7 are
 * surfaces and 12 is text, and either of those turns a heavily softened glow
 * into a grey wash. The modes alternate so the aura holds a light and a dark
 * reading of the same seed rather than one flat tone.
 *
 * Gray is deliberately absent. It is near-neutral by construction, so blurring
 * it into the accent would desaturate exactly the thing the glow exists to
 * show. It stays on the perimeter ring, where it reads as data rather than
 * decoration.
 */
export function paletteAuraColours(
  theme: GeneratedTheme,
  format: Format,
): string[] {
  const stops = [
    ["dark", "cpe-ramp-brand-primary-9"],
    ["light", "cpe-ramp-brand-primary-10"],
    ["dark", "cpe-ramp-brand-primary-11"],
    ["light", "cpe-ramp-brand-primary-8"],
  ] as const;

  return stops.map(([mode, token]) => {
    const value = theme.ramps[mode][token];
    return value ? asCssColour(value, format) : "var(--hairline-strong)";
  });
}

type Engine = {
  generateThemePreview: (options: PaletteOptions) => GeneratedTheme;
};
let enginePromise: Promise<Engine> | null = null;
export function loadEngine(): Promise<Engine> {
  enginePromise ??=
    import("@larsen-utvikling/create-next-app/palette/index.js") as Promise<Engine>;
  return enginePromise;
}
export function isEngineLoaded(): boolean {
  return enginePromise !== null;
}
export async function generate(
  options: PaletteOptions,
): Promise<GeneratedTheme> {
  if (typeof window !== "undefined") {
    const { generateInWorker } = await import("./palette-worker-client");
    return generateInWorker(options);
  }
  return (await loadEngine()).generateThemePreview(options);
}
export function formatsFor(preset: Preset) {
  return FORMATS.filter((option) =>
    capabilities[preset].includes(option.value),
  );
}

/** Accepts "4DA0FF" and "#4da0ff" alike - same rule as the CLI prompt. */
export function isValidHex(hex: string): boolean {
  return normalizeHex(hex) !== null;
}

/** The exact command that reproduces the current selection. */
export function buildCommand(
  options: PaletteOptions,
  appName = "my-app",
): string | null {
  const hex = normalizeHex(options.hex);
  if (
    !hex ||
    !formatsFor(options.preset).some((f) => f.value === options.format)
  )
    return null;

  const parts = [
    `npx --yes ${PACKAGE_NAME}@${PACKAGE_VERSION} ${appName}`,
    "--defaults",
    `--hex ${hex.slice(1).toUpperCase()}`,
  ];
  if (options.preset !== "shadcn") parts.push(`--preset ${options.preset}`);
  if (options.format !== "hsl-values") parts.push(`--format ${options.format}`);
  if (options.neutralTint !== "weak")
    parts.push(`--neutral-tint ${options.neutralTint}`);
  return parts.join(" ");
}

/** The harmony explorer keeps the visitor's current valid seed. */
export function tintfulUrl(hex: string): string | null {
  const normalized = normalizeHex(hex);
  return normalized ? `https://tintful.app/` : null;
}
