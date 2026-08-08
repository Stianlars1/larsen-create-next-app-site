"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import styles from "./bento-card.module.css";

type BentoCardProps = {
  title: string;
  description: string;
  /** The animated surface. Sits above the text and carries the explanation. */
  visual: ReactNode;
  /** Grid span - "wide" takes two columns, "tall" takes two rows. */
  span?: "wide" | "tall" | "full";
  index?: number;
  /** Anchors a deeper section further down the page. */
  href?: string;
};

export function BentoCard({ title, description, visual, span, index = 0, href }: BentoCardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      className={styles.card}
      data-span={span}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{
        duration: 0.4,
        // Matches --ease-out in the shipped motion.css
        ease: [0.23, 1, 0.32, 1],
        delay: reduced ? 0 : index * 0.05,
      }}
    >
      <div className={styles.visual}>{visual}</div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        {href && (
          <a className={styles.more} href={href}>
            How it works
          </a>
        )}
      </div>
    </motion.article>
  );
}
