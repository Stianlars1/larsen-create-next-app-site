"use client";

import { AnimatePresence, motion } from "motion/react";
import { useInViewLoop } from "@/lib/use-in-view";
import { SKILLS } from "@/lib/content";
import styles from "./misc.module.css";

/**
 * Matches --ease-out, which motion.css documents for "entrances, exits".
 * AnimatePresence mode="wait" is exactly that - one word leaves before the
 * next arrives, so the two are never on screen together and --ease-in-out
 * (documented for travel between two on-screen poses) does not apply.
 */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/* ------------------------------------------------------------------ *
 * Theme - two surfaces, one attribute, no script
 * ------------------------------------------------------------------ */

export function ThemeSurface() {
  // 2600ms a side leaves ~1.8s of rest once the 740ms swap has landed, which is
  // what makes each mode read as a state rather than a frame in a flicker.
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(2, 2600);
  const dark = reduced ? true : step === 1;

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
        {reduced ? (
          dark ? "dark" : "light"
        ) : (
          /* The same text-swap treatment the copy button uses - blur masks the
             midpoint so the two words never read as overlapping states. */
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={dark ? "dark" : "light"}
              initial={{ opacity: 0, y: 5, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(2px)" }}
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
          {/* The number and what it moves are one fact, so they travel as one
              element - the card is too narrow to give each its own column. */}
          <span className={styles.motionMeta}>
            <span className={styles.motionUse}>{use}</span>
            <span className={styles.motionMs}>{ms}ms</span>
          </span>
          <div className={styles.motionTrack}>
            <span
              className={styles.motionDot}
              style={{
                transform: out ? "translateX(0)" : "translateX(560%)",
                transitionDuration: `${ms}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
