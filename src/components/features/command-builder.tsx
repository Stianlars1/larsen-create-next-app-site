"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { CopyCommandButton } from "@/components/ui/copy-command-button";
import { HexField } from "@/components/ui/hex-field";
import { NeutralTintDisclosure } from "@/components/ui/neutral-tint-disclosure";
import { SKILLS } from "@/lib/content";
import {
  DEFAULT_CNA_VERSION,
  DEFAULT_FORMAT,
  DEFAULT_LINTER,
  DEFAULT_NEUTRAL_TINT,
  DEFAULT_PM,
  DEFAULT_PRESET,
  buildScaffoldCommand,
  isValidAppName,
  isValidVersionSpec,
  type CustomPalette,
  type Linter,
  type PackageManager,
  type PaletteChoice,
  type SkillsChoice,
} from "@/lib/command-builder";
import {
  FORMATS,
  PRESETS,
  isValidHex,
} from "@/lib/palette";
import styles from "./command-builder.module.css";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

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

const PALETTE_CHOICES = [
  { value: "default", label: "Default theme" },
  { value: "custom", label: "From a HEX" },
] as const;

const SKILL_CHOICES = [
  { value: "none", label: "None" },
  { value: "recommended", label: "Recommended" },
  { value: "all", label: "All Larsen" },
  { value: "pick", label: "Let me pick" },
] as const;

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

const RECOMMENDED_NAMES = SKILLS.filter((skill) => skill.recommended).map((skill) => skill.name);

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
  const [cnaVersion, setCnaVersion] = useState("");

  // Kept so switching away from a branch and back does not silently discard
  // the answers that branch already had.
  const lastCustom = useRef<CustomPalette>({
    kind: "custom",
    hex: "#4DA0FF",
    preset: DEFAULT_PRESET,
    format: DEFAULT_FORMAT,
    neutralTint: DEFAULT_NEUTRAL_TINT,
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
      buildScaffoldCommand({ appName, palette, pm, linter, skills, git, install, cnaVersion }),
    [appName, palette, pm, linter, skills, git, install, cnaVersion],
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
          Every option the scaffold takes, as a control. The copied command answers all of them and
          runs without follow-up prompts.
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
                    <HexField
                      id="builder-hex"
                      label="Seed HEX"
                      value={palette.hex}
                      onChange={(hex) => updateCustom({ hex })}
                      invalid={hexInvalid}
                      describedBy={hexInvalid ? "builder-hex-error" : undefined}
                      surface="raised"
                    />
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

                  <NeutralTintDisclosure
                    wide
                    value={palette.neutralTint}
                    onChange={(neutralTint) => updateCustom({ neutralTint })}
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
              legend="Agent skills"
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
            The command answers every control. <code>--defaults</code> closes the prompt flow, and
            selected overrides are added explicitly.
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
