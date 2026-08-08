"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useInViewLoop } from "@/lib/use-in-view";
import { DOC_FILES, SKILLS } from "@/lib/content";
import styles from "./misc.module.css";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/* ------------------------------------------------------------------ *
 * Theme - two surfaces, one attribute, no script
 * ------------------------------------------------------------------ */

export function ThemeSurface() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(2, 2600);
  const dark = reduced ? true : step === 1;
  const reducedMotion = useReducedMotion();

  return (
    <div className={styles.theme} ref={ref}>
      <div className={styles.themePane} data-mode={dark ? "dark" : "light"}>
        <div className={styles.themeNav}>
          <span className={styles.themeDot} />
          <span className={styles.themeLine} style={{ width: "34%" }} />
        </div>
        <span className={styles.themeLine} style={{ width: "72%" }} />
        <span className={styles.themeLine} style={{ width: "54%", opacity: 0.5 }} />
        <div className={styles.themeRow}>
          <span className={styles.themeButton} />
          <span className={styles.themeGhost} />
        </div>
      </div>

      <code className={styles.themeCode}>
        &lt;html data-theme=&quot;
        {reducedMotion ? (
          dark ? "dark" : "light"
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={dark ? "dark" : "light"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.16, ease: EASE_OUT }}
              style={{ display: "inline-block", color: "hsl(var(--brand-blue))" }}
            >
              {dark ? "dark" : "light"}
            </motion.span>
          </AnimatePresence>
        )}
        &quot;&gt;
      </code>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Docs - the files that land in the repo
 * ------------------------------------------------------------------ */

export function DocsSurface() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(DOC_FILES.length + 3, 1600);
  const active = reduced ? 0 : Math.min(step, DOC_FILES.length - 1);

  return (
    <div className={styles.docs} ref={ref}>
      <ul className={styles.docList}>
        {DOC_FILES.map((doc, index) => (
          <li key={doc.file} data-active={index === active ? "true" : undefined}>
            <code>{doc.file}</code>
            <span>{doc.role}</span>
          </li>
        ))}
      </ul>

      <div className={styles.docDetail}>
        <p className={styles.docDetailName}>{DOC_FILES[active].file}</p>
        <p className={styles.docDetailText}>{DOC_FILES[active].detail}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Skills - chips selecting themselves
 * ------------------------------------------------------------------ */

export function SkillsSurface() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(SKILLS.length + 4, 420);

  return (
    <div className={styles.skills} ref={ref}>
      <div className={styles.skillGrid}>
        {SKILLS.map((skill, index) => (
          <span
            key={skill.name}
            className={styles.skill}
            data-on={(reduced ? skill.recommended : index < step) ? "true" : "false"}
          >
            <code>{skill.name}</code>
            <em>{skill.blurb}</em>
          </span>
        ))}
      </div>
      <p className={styles.skillPath}>
        <span>→</span> .agents/skills/
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Motion - the duration ladder, timed to itself
 * ------------------------------------------------------------------ */

const DURATIONS = [
  { token: "--duration-press", ms: 140, use: ":active" },
  { token: "--duration-fast", ms: 160, use: "hover, exits" },
  { token: "--duration-ui", ms: 200, use: "menus" },
  { token: "--duration-slow", ms: 240, use: "modals" },
  { token: "--duration-enter", ms: 300, use: "entrances" },
];

export function MotionSurface() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(2, 1900);
  const out = reduced ? false : step === 1;

  return (
    <div className={styles.motion} ref={ref}>
      {DURATIONS.map(({ token, ms, use }) => (
        <div key={token} className={styles.motionRow}>
          <code>{token}</code>
          <div className={styles.motionTrack}>
            <span
              className={styles.motionDot}
              style={{
                transform: out ? "translateX(0)" : "translateX(560%)",
                transitionDuration: `${ms}ms`,
              }}
            />
          </div>
          <span className={styles.motionUse}>{use}</span>
          <span className={styles.motionMs}>{ms}ms</span>
        </div>
      ))}
    </div>
  );
}
