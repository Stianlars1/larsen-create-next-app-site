"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./marquee.module.css";

/**
 * The empty run between the tail of one pass and the head of the next.
 *
 * The stylesheet moves the track by exactly half its own width, so the gap has
 * to sit on both copies. A flex `gap` would place a single gap between them,
 * half of it would fall inside that translate, and the half that is left over
 * is precisely the seam this technique exists to avoid.
 */
const GAP_PX = 48;

/**
 * 40px/s is about five monospace characters a second at --text-sm: slow enough
 * to read a package name or a flag off a moving line, quick enough that a
 * clipped tail arrives within a couple of seconds. The duration is derived from
 * the distance so that rate holds for any string - a fixed duration makes a long
 * command race and a short one crawl.
 */
const PIXELS_PER_SECOND = 40;

type MarqueeProps = {
  /** Rendered twice, so keep it presentational - no ids, nothing focusable. */
  children: ReactNode;
  className?: string;
};

/**
 * One line of text that carries its own overflow past the edge.
 *
 * It moves only while the text is wider than the box. A marquee on a line that
 * already fits is a fidget rather than information, so the fit is measured and
 * re-measured whenever either box changes size - a wider window, a larger text
 * setting or a late font all land here. When it fits, and under reduced motion,
 * this is a plain scrollable line with a fade on the cut edge.
 *
 * Hovering rewinds it rather than freezing it: the pass is abandoned and the
 * line returns to its start, so what you read is the beginning of the command
 * rather than whatever fragment it had reached. This runs through an inherited
 * custom property, --marquee-iterations, so the surface around it can drive the
 * same behaviour. That matters wherever a control sits beside the text - the
 * copy button next to a command is inside the same pill, and reaching for it
 * should settle the line.
 *
 * A <span> throughout, so it stays valid inside phrasing content like <code>.
 */
export function Marquee({ children, className }: MarqueeProps) {
  const viewport = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const viewportEl = viewport.current;
    const contentEl = content.current;
    if (reduced || !viewportEl || !contentEl) return;

    const observer = new ResizeObserver(() => {
      // Measured on the inner span, which never carries the gap, so the fit
      // test is about the text alone in both states.
      const text = contentEl.getBoundingClientRect().width;
      const room = viewportEl.clientWidth;
      // Rounding on its own can invent a fraction of a pixel of overflow, and
      // that is not worth moving for.
      setDuration(text > room + 1 ? (text + GAP_PX) / PIXELS_PER_SECOND : null);
    });

    // No separate measurement on mount: observing an element that has a size
    // delivers one immediately, after layout and before the first paint.
    observer.observe(viewportEl);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [reduced]);

  const animated = !reduced && duration !== null;

  return (
    <span
      ref={viewport}
      className={className ? `${styles.marquee} ${className}` : styles.marquee}
      data-animated={animated ? "true" : undefined}
      style={
        animated
          ? ({
              "--marquee-duration": `${duration.toFixed(2)}s`,
              "--marquee-gap": `${GAP_PX}px`,
            } as CSSProperties)
          : undefined
      }
    >
      {/* Continuous decorative movement, which motion.css stops outright. The
          duplicate is dropped in the same breath, so what is left is the
          scrollable line rather than a frozen half of a loop. */}
      <span className={styles.track} data-motion="decorative">
        <span className={styles.copy}>
          <span ref={content}>{children}</span>
        </span>
        {animated && (
          <span className={styles.copy} aria-hidden="true">
            <span>{children}</span>
          </span>
        )}
      </span>
    </span>
  );
}
