import { PACKAGE_NAME, PACKAGE_VERSION } from "./content.ts";
import { isValidHex, type Format, type NeutralTint, type Preset } from "./palette.ts";

export const DEFAULT_PRESET: Preset = "shadcn";
export const DEFAULT_FORMAT: Format = "hsl-values";
export const DEFAULT_NEUTRAL_TINT: NeutralTint = "subtle";
export const DEFAULT_CNA_VERSION = "latest";
export const DEFAULT_PM = "npm";
export const DEFAULT_LINTER = "eslint";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type Linter = "eslint" | "biome" | "none";

export type CustomPalette = {
  kind: "custom";
  hex: string;
  preset: Preset;
  format: Format;
  neutralTint: NeutralTint;
};

export type PaletteChoice = { kind: "default" } | CustomPalette;

export type SkillsChoice =
  | { kind: "none" }
  | { kind: "recommended" }
  | { kind: "all" }
  | { kind: "pick"; names: string[] };

export type ScaffoldAnswers = {
  appName: string;
  palette: PaletteChoice;
  pm: PackageManager;
  linter: Linter;
  skills: SkillsChoice;
  git: boolean;
  install: boolean;
  cnaVersion: string;
};

export function isValidAppName(name: string): boolean {
  return name.length <= 214 && /^[a-z0-9][a-z0-9._-]*$/.test(name);
}

export function isValidVersionSpec(spec: string): boolean {
  return /^[A-Za-z0-9.-]+$/.test(spec);
}

function skillsFlag(skills: SkillsChoice): string | undefined {
  const picked = skills.kind === "pick" ? skills.names : [];
  const kind = skills.kind === "pick" && picked.length === 0 ? "none" : skills.kind;

  if (kind === "none") return undefined;
  if (kind === "recommended") return "--skills recommended";
  if (kind === "all") return "--skills all";
  return `--skills ${picked.join(",")}`;
}

function flagsFor(answers: ScaffoldAnswers): string[] {
  const flags = ["--defaults"];

  if (answers.palette.kind === "custom" && isValidHex(answers.palette.hex)) {
    const { hex, preset, format, neutralTint } = answers.palette;
    flags.push(`--hex ${hex.trim().replace(/^#/, "")}`);
    if (preset !== DEFAULT_PRESET) flags.push(`--preset ${preset}`);
    if (format !== DEFAULT_FORMAT) flags.push(`--format ${format}`);
    if (neutralTint !== DEFAULT_NEUTRAL_TINT) flags.push(`--neutral-tint ${neutralTint}`);
  }

  if (answers.pm !== DEFAULT_PM) flags.push(`--pm ${answers.pm}`);
  if (answers.linter !== DEFAULT_LINTER) flags.push(`--linter ${answers.linter}`);

  const skills = skillsFlag(answers.skills);
  if (skills) flags.push(skills);

  if (!answers.git) flags.push("--no-git");
  if (!answers.install) flags.push("--no-install");

  const spec = answers.cnaVersion.trim();
  if (spec && spec !== DEFAULT_CNA_VERSION && isValidVersionSpec(spec)) {
    flags.push(`--cna-version ${spec}`);
  }

  return flags;
}

const MAX_LINE = 64;

function wrap(head: string, flags: string[]): string {
  const lines = [head];
  for (const flag of flags) {
    const last = lines.length - 1;
    const joined = `${lines[last]} ${flag}`;
    if (joined.length <= MAX_LINE) lines[last] = joined;
    else lines.push(`  ${flag}`);
  }
  return lines.join(" \\\n");
}

export function buildScaffoldCommand(answers: ScaffoldAnswers): string {
  const name = answers.appName.trim();
  const packageSpec = `${PACKAGE_NAME}@${PACKAGE_VERSION}`;
  const head = isValidAppName(name)
    ? `npx --yes ${packageSpec} ${name}`
    : `npx --yes ${packageSpec}`;
  return wrap(head, flagsFor(answers));
}
