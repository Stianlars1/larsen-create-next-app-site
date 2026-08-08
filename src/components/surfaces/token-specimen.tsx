"use client";

import { useInViewLoop } from "@/lib/use-in-view";
import styles from "./token-specimen.module.css";

const SPACES = [
  { token: "--space-1", px: 4 },
  { token: "--space-2", px: 8 },
  { token: "--space-3", px: 12 },
  { token: "--space-4", px: 16 },
  { token: "--space-5", px: 24 },
  { token: "--space-6", px: 32 },
  { token: "--space-7", px: 48 },
  { token: "--space-8", px: 64 },
];

const RADII = [
  { token: "--radius-sm", px: 4 },
  { token: "--radius-md", px: 8 },
  { token: "--radius-lg", px: 16 },
  { token: "--radius-full", px: 999 },
];

/**
 * Tokens shown at their actual size rather than described in a table. The
 * spacing ladder is the spacing ladder, drawn with the values it names.
 */
export function TokenSpecimen() {
  const { ref, step, reduced } = useInViewLoop<HTMLDivElement>(SPACES.length + 4, 180);
  const filled = reduced ? SPACES.length : Math.min(step, SPACES.length);

  return (
    <div className={styles.specimen} ref={ref}>
      <figure className={styles.panel}>
        <figcaption className={styles.caption}>
          Spacing <span>8 steps · 4px base</span>
        </figcaption>
        <div className={styles.ladder}>
          {SPACES.map((space, index) => (
            <div key={space.token} className={styles.rung}>
              <span
                className={styles.bar}
                style={{ width: index < filled ? `${space.px * 3.4}px` : 0 }}
              />
              <code>{space.token}</code>
              <span className={styles.px}>{space.px}</span>
            </div>
          ))}
        </div>
      </figure>

      <div className={styles.column}>
        <figure className={styles.panel}>
          <figcaption className={styles.caption}>
            Type <span>unitless leading</span>
          </figcaption>
          <div className={styles.type}>
            <p className={styles.typeHeading}>Heading 1.1</p>
            <p className={styles.typeBody}>
              Body copy at 1.5, so a paragraph that wraps to three lines still has room to
              breathe.
            </p>
            <p className={styles.typeLabel}>Label 0.05em</p>
          </div>
        </figure>

        <figure className={styles.panel}>
          <figcaption className={styles.caption}>
            Radii <span>4 · 8 · 16 · pill</span>
          </figcaption>
          <div className={styles.radii}>
            {RADII.map((radius) => (
              <span
                key={radius.token}
                className={styles.radius}
                style={{ borderRadius: `${radius.px}px` }}
              />
            ))}
          </div>
        </figure>
      </div>
    </div>
  );
}
