"use client";

import { useInViewLoop } from "@/lib/use-in-view";
import { Highlight } from "@/components/ui/highlight";
import { PACKAGE_EXEC, PROMPT_STEPS } from "@/lib/content";
import styles from "./terminal.module.css";

const LINES = PROMPT_STEPS.map((step) => ({
  question: step.question,
  answer: step.choices.find((choice) => choice.isDefault)?.label ?? step.choices[0].label,
  flag: step.flag,
}));

/**
 * The prompts answering themselves.
 *
 * Every line is rendered from the first frame and only its opacity changes, so
 * the surface never resizes as the sequence plays - no layout shift, and no
 * clipping when a longer question arrives.
 */
export function Terminal() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(LINES.length + 4, 780);
  const shown = reduced ? LINES.length : Math.min(step, LINES.length);
  const done = shown >= LINES.length;

  return (
    <div className={styles.frame} ref={ref}>
      <div className={styles.chrome} aria-hidden="true">
        <span />
        <span />
        <span />
        <p className={styles.chromeTitle}>my-app</p>
      </div>

      <div className={styles.body}>
        <p className={styles.command}>
          <span className={styles.dollar}>$</span>
          <Highlight code={PACKAGE_EXEC} language="shell" />
        </p>

        <ul className={styles.lines}>
          {LINES.map((line, index) => (
            <li key={line.question} className={styles.line} data-shown={index < shown ? "true" : "false"}>
              <span className={styles.glyph} aria-hidden="true">
                ◇
              </span>
              <span className={styles.question}>{line.question}</span>
              <span className={styles.answer}>{line.answer}</span>
            </li>
          ))}
        </ul>

        <p className={styles.done} data-shown={done ? "true" : "false"}>
          <span className={styles.glyphDone} aria-hidden="true">
            └
          </span>
          Done. cd my-app &amp;&amp; npm run dev
        </p>
      </div>
    </div>
  );
}
