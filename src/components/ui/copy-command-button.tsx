"use client";

import { interpolate } from "flubber";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./copy-command-button.module.css";

/*
 * The icon is drawn from three paths in one 24x24 frame. The front sheet of
 * the copy icon morphs into the check; the back sheet fades away underneath.
 * Lucide's Copy geometry, kept so the resting state matches the icon set.
 */
const COPY_FRONT =
  "M10 8 H20 A2 2 0 0 1 22 10 V20 A2 2 0 0 1 20 22 H10 A2 2 0 0 1 8 20 V10 A2 2 0 0 1 10 8 Z";
const COPY_BACK = "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2";
const CHECK = "M4.5 12.5 L9.75 18 L19.5 6.5";

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

function MorphIcon({ copied, reduced }: { copied: boolean; reduced: boolean }) {
  const progress = useMotionValue(copied ? 1 : 0);
  const scale = useMotionValue(1);
  const blur = useMotionValue(0);
  const filter = useMotionTemplate`blur(${blur}px)`;
  const mounted = useRef(false);

  const morph = useMemo(() => interpolate(COPY_FRONT, CHECK, { maxSegmentLength: 0.75 }), []);
  const d = useTransform(progress, (t) =>
    t <= 0.001 ? COPY_FRONT : t >= 0.999 ? CHECK : morph(t),
  );

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reduced) {
      progress.set(copied ? 1 : 0);
      return;
    }
    const morphControls = animate(progress, copied ? 1 : 0, {
      duration: 0.26,
      ease: EASE_IN_OUT,
    });
    // The Apple-style beat: dip fast, then a spring with a visible overshoot.
    const bounce = animate([
      [scale, 0.72, { duration: 0.09, ease: "easeIn" }],
      [scale, 1, { type: "spring", stiffness: 500, damping: 14 }],
    ]);
    const blurControls = animate(blur, [0, 2, 0], { duration: 0.3, ease: "easeInOut" });
    return () => {
      morphControls.stop();
      bounce.stop();
      blurControls.stop();
    };
  }, [copied, reduced, progress, scale, blur]);

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ scale, filter }}
      aria-hidden="true"
    >
      <motion.path
        d={COPY_BACK}
        animate={{ opacity: copied ? 0 : 1, scale: copied ? 0.8 : 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.18, ease: EASE_IN_OUT }}
        style={{ transformOrigin: "16px 16px" }}
      />
      <motion.path d={d} />
    </motion.svg>
  );
}

export function CopyCommandButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);

      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }

      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleCopy}
      aria-label={copied ? "Command copied" : "Copy command"}
    >
      <MorphIcon copied={copied} reduced={reduced} />
      <span className={styles.label} aria-live="polite">
        {/* Reserves the width of the longer word so the pill never resizes. */}
        <span className={styles.sizer} aria-hidden="true">
          Copied
        </span>
        {reduced ? (
          <span className={styles.word}>{copied ? "Copied" : "Copy"}</span>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? "copied" : "copy"}
              className={styles.word}
              initial={{ opacity: 0, y: 5, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(2px)" }}
              transition={{ duration: 0.15, ease: EASE_IN_OUT }}
            >
              {copied ? "Copied" : "Copy"}
            </motion.span>
          </AnimatePresence>
        )}
      </span>
    </button>
  );
}
