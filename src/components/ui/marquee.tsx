"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./marquee.module.css";

/**
 * 40px/s is about five monospace characters a second at --text-sm: slow enough
 * to read a package name or a flag off a moving line, quick enough that a
 * clipped tail arrives within a couple of seconds. The duration is derived from
 * the distance so that rate holds for any string - a fixed duration makes a long
 * command race and a short one crawl.
 */
const PIXELS_PER_SECOND = 40;

/**
 * The empty run between the tail of one pass and the head of the next, in px.
 *
 * It lives in JS rather than as a token because the duration is derived from
 * it and getComputedStyle hands custom properties back unresolved - reading
 * --marquee-gap returns the string "3rem", not a pixel count. One number,
 * written into CSS below, beats two that can disagree.
 *
 * It matches --space-7. The stylesheet moves the track by exactly half its own
 * width, so the gap sits on both copies: a flex `gap` would place a single gap
 * between them, half of it would fall inside that translate, and the half left
 * over is precisely the seam this technique exists to avoid.
 */
const GAP_PX = 48;

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
 * re-measured whenever the box or the text changes. When it fits, and under
 * reduced motion, this is a plain scrollable line - and it only wears the
 * trailing fade when something is actually cut off, because a fade over text
 * that ends well inside the box just looks like a rendering fault.
 *
 * Hovering pauses it where it stands. The pause runs through an inherited
 * custom property, --marquee-play, so the surface around it can pause it too:
 * the copy button beside a command sits in the same pill, and reaching for it
 * should settle the line.
 *
 * Like every other loop in this project it stops while off screen, which is
 * both the house rule and the reason its compositor layer is not pinned for
 * the whole length of the page.
 *
 * A <span> throughout, so it stays valid inside phrasing content like <code>.
 */
export function Marquee({ children, className }: MarqueeProps) {
  const viewport = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const viewportEl = viewport.current;
    const contentEl = content.current;
    if (reduced || !viewportEl || !contentEl) return;

    const measure = () => {
      // Measured on the inner span, which never carries the gap, so the fit
      // test is about the text alone in both states.
      const text = contentEl.getBoundingClientRect().width;
      const room = viewportEl.clientWidth;
      // Rounding on its own can invent a fraction of a pixel of overflow, and
      // that is not worth moving for.
      setDuration(text > room + 1 ? (text + GAP_PX) / PIXELS_PER_SECOND : null);
    };

    // Measured once directly rather than waiting on the observer's first
    // delivery, so the decision does not depend on that callback arriving.
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewportEl);
    // The measured span is inline-block precisely so this fires: a
    // ResizeObserver never reports a non-replaced inline element, which is how
    // a late font or a changed command would otherwise go unnoticed.
    observer.observe(contentEl);

    // Same reasoning: assume visible until told otherwise, so a missed first
    // callback cannot leave the line permanently still.
    setInView(true);

    const visibility = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
    });
    visibility.observe(viewportEl);

    return () => {
      observer.disconnect();
      visibility.disconnect();
    };
    // children is a dependency because a new command has a new width, and the
    // container may not have changed size at all.
  }, [reduced, children]);

  const overflows = !reduced && duration !== null;
  const animated = overflows && inView;

  return (
    <span
      ref={viewport}
      className={className ? `${styles.marquee} ${className}` : styles.marquee}
      data-overflow={overflows ? "true" : undefined}
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
          <span ref={content} className={styles.measured}>
            {children}
          </span>
        </span>
        {animated && (
          <span className={styles.copy} aria-hidden="true">
            <span className={styles.measured}>{children}</span>
          </span>
        )}
      </span>
    </span>
  );
}
