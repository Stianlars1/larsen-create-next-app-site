"use client";

import { useRef, useState, type CSSProperties } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { DOC_FILES } from "@/lib/content";
import styles from "./docs-scroll.module.css";

/** Matches --ease-in-out: travel between two on-screen poses, per motion.css. */
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/**
 * The docs section, read one file at a time.
 *
 * The old version advanced on a timer, which meant the reader either waited for
 * a file or missed it. Here scroll position picks the file, so the pace is
 * theirs. Narrow, short and reduced-motion viewports get the same five files as
 * a plain stack - the pinning is layered on in CSS and nothing depends on it,
 * so there is no scroll to hijack and nothing to preventDefault.
 *
 * This carries its own header rather than sitting in a FeatureBlock, because
 * the pinned panel has to be the section, not a visual inside one.
 */
export function DocsScroll() {
  const track = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  // 0 the moment the panel pins, 1 the moment it lets go.
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });

  // A continuous rail, so progress reads between the steps and not only at them.
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const step = Math.floor(progress * DOC_FILES.length);
    setActive(Math.min(DOC_FILES.length - 1, Math.max(0, step)));
  });

  return (
    <section
      id="docs"
      ref={track}
      className={styles.track}
      // The stylesheet needs the file count to size the scroll track, and
      // content.ts is the only place allowed to know how many files there are.
      style={{ "--docs-count": DOC_FILES.length } as CSSProperties}
    >
      <div className={styles.panel}>
        <div className="page">
          <p className="label">Agent docs</p>
          <h2 className="headline">The rules your agent reads before it writes</h2>
          <p className="lead">
            An agent that does not know your conventions invents them, differently every session.
            These ship with the project.
          </p>

          <div className={styles.stage}>
            <div className={styles.listColumn}>
              <span className={styles.rail} aria-hidden="true">
                <motion.span className={styles.railFill} style={{ scaleY: railScale }} />
              </span>

              <ol className={styles.list}>
                {DOC_FILES.map((doc, index) => (
                  <li
                    key={doc.file}
                    className={styles.row}
                    data-active={index === active ? "true" : undefined}
                    aria-current={index === active ? "true" : undefined}
                  >
                    {index === active && (
                      <motion.span
                        layoutId="docs-active-row"
                        className={styles.rowMark}
                        transition={reduced ? { duration: 0 } : { duration: 0.2, ease: EASE_IN_OUT }}
                        aria-hidden="true"
                      />
                    )}
                    <code className={styles.file}>{doc.file}</code>
                    <span className={styles.role}>{doc.role}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.detail}>
              {DOC_FILES.map((doc, index) => (
                <article
                  key={doc.file}
                  className={styles.card}
                  data-active={index === active ? "true" : undefined}
                  /* The other four are stacked underneath at opacity 0, which
                     hides them visually but leaves all five in the
                     accessibility tree, read out back to back. */
                  aria-hidden={index === active ? undefined : "true"}
                >
                  <p className={styles.cardHead}>
                    <span className={styles.cardFile}>{doc.file}</span>
                    <span className={styles.cardCount}>
                      {String(index + 1).padStart(2, "0")} / {String(DOC_FILES.length).padStart(2, "0")}
                    </span>
                  </p>
                  <p className={styles.cardRole}>{doc.role}</p>
                  <p className={styles.cardDetail}>{doc.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
