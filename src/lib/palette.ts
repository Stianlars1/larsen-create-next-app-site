/**
 * Thin wrapper around the palette engine shipped inside the published CLI.
 *
 * Importing it from the package - rather than reimplementing it - is what
 * guarantees the demo shows exactly what `npx` produces. The engine pulls in
 * colorjs.io and the full Radix color data (~95 KB gzipped), so it is loaded
 * lazily on first interaction instead of on page load.
 */

export const PRESETS = [
  { value: "shadcn", label: "shadcn/ui", hint: "semantic tokens + scales" },
  { value: "radix", label: "Radix Colors", hint: "accent + gray scales" },
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

export const SCHEMES = ["analogous", "monochromatic", "complementary", "triadic"] as const;

export type Preset = (typeof PRESETS)[number]["value"];
export type Format = (typeof FORMATS)[number]["value"];
export type Scheme = (typeof SCHEMES)[number];

export type PaletteOptions = {
  hex: string;
  preset: Preset;
  format: Format;
  scheme: Scheme;
};

/** Token name -> value, for one mode. */
export type TokenMap = Record<string, string>;

export type GeneratedTheme = {
  css: string;
  light: TokenMap;
  dark: TokenMap;
};

type Engine = {
  generateThemeCss: (options: PaletteOptions) => string;
  isValidHex: (hex: string) => boolean;
  normalizeHex: (hex: string) => string;
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
  const engine = await loadEngine();
  const css = engine.generateThemeCss(options);
  return { css, light: parseBlock(css, ":root {", "@media"), dark: parseBlock(css, "@media", '[data-theme="light"]') };
}

export async function normalize(hex: string): Promise<string> {
  const engine = await loadEngine();
  return engine.normalizeHex(hex);
}

/** Accepts "4DA0FF" and "#4da0ff" alike - same rule as the CLI prompt. */
export function isValidHex(hex: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim());
}

/** The exact command that reproduces the current selection. */
export function buildCommand(options: PaletteOptions, appName = "my-app"): string {
  const parts = [`npx @larsen-utvikling/create-next-app ${appName}`, `--hex ${options.hex.replace(/^#/, "")}`];
  if (options.preset !== "shadcn") parts.push(`--preset ${options.preset}`);
  if (options.format !== "hsl-values") parts.push(`--format ${options.format}`);
  if (options.scheme !== "analogous") parts.push(`--scheme ${options.scheme}`);
  return parts.join(" ");
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
