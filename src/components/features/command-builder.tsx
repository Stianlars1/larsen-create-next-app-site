"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { CopyCommandButton } from "@/components/ui/copy-command-button";
import { PACKAGE_NAME, SKILLS } from "@/lib/content";
import {
  FORMATS,
  PRESETS,
  SCHEMES,
  isValidHex,
  type Format,
  type Preset,
  type Scheme,
} from "@/lib/palette";
import styles from "./command-builder.module.css";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/*
 * Every default below is the one OPTION_CONTRACT declares in the published
 * package. A flag is emitted only where the answer differs from it, so the
 * command never repeats back what the CLI would have chosen anyway.
 */
const DEFAULT_PRESET: Preset = "shadcn";
const DEFAULT_FORMAT: Format = "hsl-values";
const DEFAULT_SCHEME: Scheme = "analogous";
const DEFAULT_CNA_VERSION = "latest";

const PACKAGE_MANAGERS = [
  { value: "npm", label: "npm" },
  { value: "pnpm", label: "pnpm" },
  { value: "yarn", label: "yarn" },
  { value: "bun", label: "bun" },
] as const;

const LINTERS = [
  { value: "eslint", label: "ESLint" },
  { value: "biome", label: "Biome" },
  { value: "none", label: "None" },
] as const;

type PackageManager = (typeof PACKAGE_MANAGERS)[number]["value"];
type Linter = (typeof LINTERS)[number]["value"];

const DEFAULT_PM: PackageManager = "npm";
const DEFAULT_LINTER: Linter = "eslint";

const SCHEME_OPTIONS = SCHEMES.map((scheme) => ({ value: scheme, label: scheme }));

const PALETTE_CHOICES = [
  { value: "default", label: "Default theme" },
  { value: "custom", label: "From a HEX" },
] as const;

const SKILL_CHOICES = [
  { value: "none", label: "None" },
  { value: "recommended", label: "Recommended" },
  { value: "all", label: "All" },
  { value: "pick", label: "Let me pick" },
] as const;

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

const PROMPT_MODES = [
  { value: "ask", label: "Ask me" },
  { value: "skip", label: "Skip them" },
] as const;

const RECOMMENDED_NAMES = SKILLS.filter((skill) => skill.recommended).map((skill) => skill.name);

/*
 * --preset, --format and --scheme each require --hex, and --hex conflicts
 * with --default-palette. Carrying the palette as a discriminated union is
 * what makes that rejected combination impossible to click into rather than
 * something the UI has to warn about afterwards.
 */
type CustomPalette = {
  kind: "custom";
  hex: string;
  preset: Preset;
  format: Format;
  scheme: Scheme;
};

type PaletteChoice = { kind: "default" } | CustomPalette;

/* --skills and --no-skills conflict, so one value answers both. */
type SkillsChoice =
  | { kind: "none" }
  | { kind: "recommended" }
  | { kind: "all" }
  | { kind: "pick"; names: string[] };

type Answers = {
  appName: string;
  palette: PaletteChoice;
  pm: PackageManager;
  linter: Linter;
  skills: SkillsChoice;
  git: boolean;
  install: boolean;
  /** --defaults, which answers every prompt the other flags leave open. */
  unattended: boolean;
  cnaVersion: string;
};

/** The CLI's own name rule. The empty-directory check it also runs cannot be
 *  reproduced in a browser, so it is not claimed here. */
function isValidAppName(name: string): boolean {
  return name.length <= 214 && /^[a-z0-9][a-z0-9._-]*$/.test(name);
}

/** Narrower than npm's spec grammar on purpose: these characters need no
 *  shell quoting, so a copied command survives the paste unchanged. */
function isValidVersionSpec(spec: string): boolean {
  return /^[A-Za-z0-9.-]+$/.test(spec);
}

/** The input takes a bare HEX too, so the swatch needs the # put back. */
function swatchColour(hex: string): string {
  return `#${hex.trim().replace(/^#/, "")}`;
}

/**
 * Pressing enter through the prompts installs the recommended four, while
 * --defaults installs nothing. The flag is needed only where the answer
 * differs from whichever of those two the command is running under.
 */
function skillsFlag(skills: SkillsChoice, unattended: boolean): string | undefined {
  // An empty selection installs nothing, which is what --no-skills says - and
  // it keeps `--skills` from ever being written with an empty value.
  const picked = skills.kind === "pick" ? skills.names : [];
  const kind = skills.kind === "pick" && picked.length === 0 ? "none" : skills.kind;

  if (kind === "none") return unattended ? undefined : "--no-skills";
  if (kind === "recommended") return unattended ? "--skills recommended" : undefined;
  if (kind === "all") return "--skills all";
  return `--skills ${picked.join(",")}`;
}

function flagsFor(answers: Answers): string[] {
  const flags: string[] = [];
  if (answers.unattended) flags.push("--defaults");

  if (answers.palette.kind === "custom" && isValidHex(answers.palette.hex)) {
    const { hex, preset, format, scheme } = answers.palette;
    // Written without the leading #, the way the CLI's own examples write it
    flags.push(`--hex ${hex.trim().replace(/^#/, "")}`);
    if (preset !== DEFAULT_PRESET) flags.push(`--preset ${preset}`);
    if (format !== DEFAULT_FORMAT) flags.push(`--format ${format}`);
    if (scheme !== DEFAULT_SCHEME) flags.push(`--scheme ${scheme}`);
  }

  if (answers.pm !== DEFAULT_PM) flags.push(`--pm ${answers.pm}`);
  if (answers.linter !== DEFAULT_LINTER) flags.push(`--linter ${answers.linter}`);

  const skills = skillsFlag(answers.skills, answers.unattended);
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

/**
 * Wraps into shell line continuations. A flag and its value stay on one line,
 * and the join leaves no whitespace after the backslash, so the copied string
 * runs as written rather than only reading well.
 */
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

function buildCommand(answers: Answers): string {
  const name = answers.appName.trim();
  // An invalid name is left out rather than pasted into a command that would
  // be rejected. Without it the CLI asks, or uses my-app under --defaults.
  const head = isValidAppName(name) ? `npx ${PACKAGE_NAME} ${name}` : `npx ${PACKAGE_NAME}`;
  return wrap(head, flagsFor(answers));
}

/**
 * Every option the published CLI accepts, as controls, with the exact command
 * falling out of them. The relationships the option contract encodes are
 * modelled in the state rather than validated after the fact.
 */
export function CommandBuilder() {
  const reduced = useReducedMotion() ?? false;

  const [appName, setAppName] = useState("my-app");
  const [palette, setPalette] = useState<PaletteChoice>({ kind: "default" });
  const [pm, setPm] = useState<PackageManager>(DEFAULT_PM);
  const [linter, setLinter] = useState<Linter>(DEFAULT_LINTER);
  const [skills, setSkills] = useState<SkillsChoice>({ kind: "recommended" });
  const [git, setGit] = useState(true);
  const [install, setInstall] = useState(true);
  const [unattended, setUnattended] = useState(false);
  const [cnaVersion, setCnaVersion] = useState("");

  // Kept so switching away from a branch and back does not silently discard
  // the answers that branch already had.
  const lastCustom = useRef<CustomPalette>({
    kind: "custom",
    hex: "#4DA0FF",
    preset: DEFAULT_PRESET,
    format: DEFAULT_FORMAT,
    scheme: DEFAULT_SCHEME,
  });
  const lastPicked = useRef<string[]>(RECOMMENDED_NAMES);

  const updateCustom = (patch: Partial<Omit<CustomPalette, "kind">>) => {
    lastCustom.current = { ...lastCustom.current, ...patch };
    setPalette(lastCustom.current);
  };

  const toggleSkill = (name: string) => {
    const current = skills.kind === "pick" ? skills.names : [];
    const next = current.includes(name)
      ? current.filter((entry) => entry !== name)
      : // Held in the collection's own order, so the flag reads the same
        // whichever chip you press first.
        SKILLS.filter((skill) => skill.name === name || current.includes(skill.name)).map(
          (skill) => skill.name,
        );
    lastPicked.current = next;
    setSkills({ kind: "pick", names: next });
  };

  const command = useMemo(
    () =>
      buildCommand({ appName, palette, pm, linter, skills, git, install, unattended, cnaVersion }),
    [appName, palette, pm, linter, skills, git, install, unattended, cnaVersion],
  );

  const trimmedName = appName.trim();
  const nameInvalid = trimmedName.length > 0 && !isValidAppName(trimmedName);
  const hexInvalid = palette.kind === "custom" && !isValidHex(palette.hex);
  const trimmedSpec = cnaVersion.trim();
  const specInvalid = trimmedSpec.length > 0 && !isValidVersionSpec(trimmedSpec);

  const reveal = {
    initial: { opacity: 0, y: reduced ? 0 : -6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduced ? 0 : -4 },
    transition: { duration: reduced ? 0.12 : 0.2, ease: EASE_OUT },
  };

  return (
    <section className="section" id="builder">
      <div className="page">
        <p className="label">The command</p>
        <h2 className="headline">Click the answers. Copy the command.</h2>
        <p className="lead">
          Every option the scaffold takes, as a control - and a flag appears only where your answer
          differs from the CLI&apos;s own default.
        </p>

        <div className={styles.builder}>
          <div className={styles.controls}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="builder-name">
                App name
              </label>
              <div className={styles.input} data-invalid={nameInvalid ? "true" : undefined}>
                <input
                  id="builder-name"
                  value={appName}
                  onChange={(event) => setAppName(event.target.value)}
                  spellCheck={false}
                  aria-invalid={nameInvalid}
                  aria-describedby={nameInvalid ? "builder-name-error" : undefined}
                />
              </div>
              {nameInvalid && (
                <p className={styles.error} id="builder-name-error">
                  Lowercase letters, digits, &apos;.&apos;, &apos;_&apos; and &apos;-&apos; only,
                  starting with a letter or digit, up to 214 characters. The name stays out of the
                  command until it matches.
                </p>
              )}
            </div>

            <Segmented
              legend="Palette"
              value={palette.kind}
              options={PALETTE_CHOICES}
              onChange={(kind) =>
                setPalette(kind === "custom" ? lastCustom.current : { kind: "default" })
              }
            />

            <AnimatePresence initial={false}>
              {palette.kind === "custom" && (
                <motion.div key="palette" className={styles.nested} {...reveal}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="builder-hex">
                      Seed HEX
                    </label>
                    <div className={styles.input} data-invalid={hexInvalid ? "true" : undefined}>
                      <span
                        className={styles.swatch}
                        style={{
                          background: hexInvalid ? "transparent" : swatchColour(palette.hex),
                        }}
                      />
                      <input
                        id="builder-hex"
                        value={palette.hex}
                        onChange={(event) => updateCustom({ hex: event.target.value })}
                        spellCheck={false}
                        aria-invalid={hexInvalid}
                        aria-describedby={hexInvalid ? "builder-hex-error" : undefined}
                      />
                    </div>
                    {hexInvalid && (
                      <p className={styles.error} id="builder-hex-error">
                        Enter a valid HEX colour, with or without the #. The palette flags stay out
                        of the command until it is valid.
                      </p>
                    )}
                  </div>

                  <Segmented
                    legend="Framework / style"
                    value={palette.preset}
                    options={PRESETS}
                    onChange={(preset) => updateCustom({ preset })}
                  />

                  <Segmented
                    wide
                    legend="Colour format"
                    value={palette.format}
                    options={FORMATS}
                    onChange={(format) => updateCustom({ format })}
                  />

                  <Segmented
                    wide
                    legend="Colour scheme"
                    hint="No prompt asks this one - it is reachable by flag only. It currently tints the neutral ramp: monochromatic differs, and the other three generate the same theme."
                    value={palette.scheme}
                    options={SCHEME_OPTIONS}
                    onChange={(scheme) => updateCustom({ scheme })}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Segmented legend="Linter" value={linter} options={LINTERS} onChange={setLinter} />

            <Segmented
              legend="Package manager"
              value={pm}
              options={PACKAGE_MANAGERS}
              onChange={setPm}
            />

            <Segmented
              wide
              legend="Larsen Skills"
              value={skills.kind}
              options={SKILL_CHOICES}
              onChange={(kind) =>
                setSkills(kind === "pick" ? { kind: "pick", names: lastPicked.current } : { kind })
              }
            />

            <AnimatePresence initial={false}>
              {skills.kind === "pick" && (
                <motion.div key="skills" className={styles.nested} {...reveal}>
                  <fieldset className={styles.field} data-wide="true">
                    <legend className={styles.fieldLabel}>Which skills</legend>
                    <div className={styles.chips}>
                      {SKILLS.map((skill) => {
                        const on = skills.names.includes(skill.name);
                        return (
                          <button
                            key={skill.name}
                            type="button"
                            className={styles.chip}
                            data-active={on ? "true" : undefined}
                            aria-pressed={on}
                            onClick={() => toggleSkill(skill.name)}
                          >
                            {skill.name}
                          </button>
                        );
                      })}
                    </div>
                    {skills.names.length === 0 && (
                      <p className={styles.fieldHint}>Nothing picked, so nothing is installed.</p>
                    )}
                  </fieldset>
                </motion.div>
              )}
            </AnimatePresence>

            <Segmented
              legend="Git"
              value={git ? "yes" : "no"}
              options={YES_NO}
              onChange={(value) => setGit(value === "yes")}
            />

            <Segmented
              legend="Install dependencies"
              value={install ? "yes" : "no"}
              options={YES_NO}
              onChange={(value) => setInstall(value === "yes")}
            />

            <Segmented
              legend="Prompts"
              value={unattended ? "skip" : "ask"}
              options={PROMPT_MODES}
              onChange={(value) => setUnattended(value === "skip")}
            />

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="builder-cna">
                create-next-app version
              </label>
              <div className={styles.input} data-invalid={specInvalid ? "true" : undefined}>
                <input
                  id="builder-cna"
                  value={cnaVersion}
                  onChange={(event) => setCnaVersion(event.target.value)}
                  placeholder={DEFAULT_CNA_VERSION}
                  spellCheck={false}
                  aria-invalid={specInvalid}
                  aria-describedby={
                    specInvalid ? "builder-cna-hint builder-cna-error" : "builder-cna-hint"
                  }
                />
              </div>
              <p className={styles.fieldHint} id="builder-cna-hint">
                The upstream Next.js scaffolder, passed through as
                <code> create-next-app@&lt;spec&gt;</code>. Not this package&apos;s own version.
              </p>
              {specInvalid && (
                <p className={styles.error} id="builder-cna-error">
                  A tag or an exact version - letters, digits, &apos;.&apos; and &apos;-&apos;.
                </p>
              )}
            </div>
          </div>

          <div className={styles.command}>
            <header className={styles.commandHeader}>
              <span id="builder-command-label" className={styles.commandLabel}>
                Your command
              </span>
              <CopyCommandButton command={command} />
            </header>
            {/* The whole point of the section. Announced politely so a change
                supersedes the last one instead of queueing a backlog. */}
            <pre
              className={styles.commandCode}
              aria-live="polite"
              aria-labelledby="builder-command-label"
            >
              <code>{command}</code>
            </pre>
          </div>

          <p className={styles.note}>
            {unattended
              ? "--defaults answers the rest. It installs no skills unless --skills asks for some."
              : "Only the answers that differ from a default become flags - the CLI asks for the rest."}
          </p>
        </div>
      </div>
    </section>
  );
}

type SegmentedOption<T extends string> = { readonly value: T; readonly label: string };

/**
 * The palette demo's control, kept identical so the page has one segmented
 * pattern rather than two that almost match.
 */
function Segmented<T extends string>({
  legend,
  hint,
  wide,
  value,
  options,
  onChange,
}: {
  legend: string;
  hint?: string;
  /** Spans both columns, for the rows with more choices than fit beside one. */
  wide?: boolean;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className={styles.field} data-wide={wide ? "true" : undefined}>
      <legend className={styles.fieldLabel}>{legend}</legend>
      <div className={styles.segmented}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-active={value === option.value ? "true" : undefined}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </fieldset>
  );
}
