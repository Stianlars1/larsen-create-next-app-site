"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useInViewLoop } from "@/lib/use-in-view";
import { PROMPT_STEPS, SKILLS } from "@/lib/content";
import styles from "./visuals.module.css";

/** Shared entrance for the small parts inside a visual. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/* ------------------------------------------------------------------ *
 * Terminal - the prompts answering themselves
 * ------------------------------------------------------------------ */

const TERMINAL_LINES = PROMPT_STEPS.filter((step) => !step.conditional).map((step) => ({
  question: step.question,
  answer: step.choices.find((choice) => choice.isDefault)?.label ?? step.choices[0].label,
}));

export function TerminalVisual() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(TERMINAL_LINES.length + 2, 900);
  const shown = reduced ? TERMINAL_LINES.length : Math.min(step, TERMINAL_LINES.length);

  return (
    <div className={styles.terminal} ref={ref} aria-hidden="true">
      <div className={styles.terminalBar}>
        <span /> <span /> <span />
      </div>
      <div className={styles.terminalBody}>
        <p className={styles.terminalCommand}>
          <span className={styles.dollar}>$</span> npx @larsen-utvikling/create-next-app
        </p>
        {TERMINAL_LINES.slice(0, shown).map((line) => (
          <motion.p
            key={line.question}
            className={styles.terminalLine}
            initial={reduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
          >
            <span className={styles.check}>◇</span>
            <span className={styles.question}>{line.question}</span>
            <span className={styles.answer}>{line.answer}</span>
          </motion.p>
        ))}
        {shown < TERMINAL_LINES.length && <span className={styles.caret} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Palette - swatches filling in, then flipping mode
 * ------------------------------------------------------------------ */

const ACCENT_STEPS = Array.from({ length: 12 }, (_, i) => i);

export function PaletteVisual() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(16, 220);
  const filled = reduced ? 12 : Math.min(step, 12);

  return (
    <div className={styles.paletteVisual} ref={ref} aria-hidden="true">
      <div className={styles.paletteSeed}>
        <span className={styles.seedChip} />
        <code>#4DA0FF</code>
      </div>
      <div className={styles.ramp}>
        {ACCENT_STEPS.map((i) => (
          <span
            key={i}
            className={styles.rampStep}
            data-filled={i < filled ? "true" : "false"}
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
      </div>
      <p className={styles.rampLabel}>--accent-1 … --accent-12</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dark mode - two surfaces, one attribute, no script
 * ------------------------------------------------------------------ */

export function ThemeVisual() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(2, 2200);
  const dark = reduced ? true : step === 1;

  return (
    <div className={styles.themeVisual} ref={ref} aria-hidden="true">
      <motion.div
        className={styles.themePane}
        data-mode={dark ? "dark" : "light"}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
      >
        <span className={styles.themeBar} />
        <span className={styles.themeBar} data-short="true" />
        <span className={styles.themeAccent} />
      </motion.div>
      <code className={styles.themeAttr}>
        data-theme=&quot;<AnimatedWord word={dark ? "dark" : "light"} />&quot;
      </code>
      <p className={styles.themeNote}>0 kB of JavaScript</p>
    </div>
  );
}

function AnimatedWord({ word }: { word: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{word}</>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={word}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.16, ease: EASE_OUT }}
        style={{ display: "inline-block" }}
      >
        {word}
      </motion.span>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ *
 * Motion - the duration ladder, timed to itself
 * ------------------------------------------------------------------ */

const DURATIONS = [
  { token: "--duration-press", ms: 140 },
  { token: "--duration-fast", ms: 160 },
  { token: "--duration-ui", ms: 200 },
  { token: "--duration-slow", ms: 240 },
  { token: "--duration-enter", ms: 300 },
];

export function MotionVisual() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(2, 1800);
  const out = reduced ? false : step === 1;

  return (
    <div className={styles.motionVisual} ref={ref} aria-hidden="true">
      {DURATIONS.map(({ token, ms }) => (
        <div key={token} className={styles.motionRow}>
          <code>{token}</code>
          <div className={styles.motionTrack}>
            <span
              className={styles.motionDot}
              style={{
                transform: out ? "translateX(0)" : "translateX(calc(100% * 6))",
                transitionDuration: `${ms}ms`,
              }}
            />
          </div>
          <span className={styles.motionMs}>{ms}ms</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Agent docs - the files that land in the repo
 * ------------------------------------------------------------------ */

const DOC_NAMES = ["AGENTS.md", "CLAUDE.md", "DESIGN.md", "NEXTJS.md", "README.md"];

export function DocsVisual() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(DOC_NAMES.length + 2, 700);

  return (
    <div className={styles.docsVisual} ref={ref} aria-hidden="true">
      {DOC_NAMES.map((name, i) => {
        const visible = reduced || i < step;
        return (
          <motion.div
            key={name}
            className={styles.docFile}
            data-active={!reduced && i === step - 1 ? "true" : undefined}
            initial={false}
            animate={{ opacity: visible ? 1 : 0.18, x: visible ? 0 : -8 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
          >
            <span className={styles.docIcon} />
            {name}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Skills - chips selecting themselves
 * ------------------------------------------------------------------ */

export function SkillsVisual() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(SKILLS.length + 3, 520);

  return (
    <div className={styles.skillsVisual} ref={ref} aria-hidden="true">
      {SKILLS.map((skill, i) => {
        const on = reduced ? skill.recommended : i < step;
        return (
          <motion.span
            key={skill.name}
            className={styles.skillChip}
            data-on={on ? "true" : "false"}
            animate={{ scale: !reduced && i === step - 1 ? 1.05 : 1 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            {skill.name}
          </motion.span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * No Tailwind - the dependency that never arrives
 * ------------------------------------------------------------------ */

const DEP_LINES = [
  { text: '"next": "16.3.0"', removed: false },
  { text: '"react": "19.2.0"', removed: false },
  { text: '"tailwindcss": "^4"', removed: true },
  { text: '"@tailwindcss/postcss": "^4"', removed: true },
  { text: '"typescript": "^5"', removed: false },
];

export function NoTailwindVisual() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(4, 1500);
  const struck = reduced || step >= 1;

  return (
    <div className={styles.depsVisual} ref={ref} aria-hidden="true">
      <p className={styles.depsLabel}>package.json</p>
      {DEP_LINES.map((line) => (
        <div
          key={line.text}
          className={styles.depLine}
          data-removed={line.removed && struck ? "true" : "false"}
        >
          <code>{line.text}</code>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Spacing scale - the ladder that built this page
 * ------------------------------------------------------------------ */

const SPACES = [4, 8, 12, 16, 24, 32, 48, 64];

export function SpacingVisual() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(SPACES.length + 3, 240);

  return (
    <div className={styles.spacingVisual} ref={ref} aria-hidden="true">
      {SPACES.map((px, i) => (
        <div key={px} className={styles.spacingRow}>
          <span
            className={styles.spacingBar}
            style={{ width: reduced || i < step ? `${px * 2.4}px` : 0 }}
          />
          <code>{px}</code>
        </div>
      ))}
    </div>
  );
}
