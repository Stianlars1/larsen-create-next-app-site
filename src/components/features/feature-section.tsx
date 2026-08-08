import type { ReactNode } from "react";
import styles from "./feature-section.module.css";

type FeatureSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  /** Alternating tint so long pages keep a rhythm. */
  tinted?: boolean;
};

export function FeatureSection({ id, eyebrow, title, lead, children, tinted }: FeatureSectionProps) {
  return (
    <section className={styles.section} id={id} data-tinted={tinted ? "true" : undefined}>
      <div className="page">
        <header className={styles.header}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="sectionTitle">{title}</h2>
          <p className="sectionLead">{lead}</p>
        </header>
        {children}
      </div>
    </section>
  );
}
