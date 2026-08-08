import type { ReactNode } from "react";
import styles from "./feature-block.module.css";

type FeatureBlockProps = {
  id?: string;
  label: string;
  headline: string;
  lead: string;
  /** Short supporting points. Kept to a few words each - this is not prose. */
  points?: { term: string; detail: string }[];
  /** The wide visual that does the explaining. */
  visual: ReactNode;
  /** Text beside the visual instead of above it, for narrower surfaces. */
  layout?: "stacked" | "side";
  /** Mirrors a side layout, so consecutive blocks alternate. */
  flip?: boolean;
};

/**
 * The page's main rhythm: a small label, a tight headline, one line of prose,
 * then a visual that is allowed to be large. No card, no border around the
 * whole thing - the surface belongs to the visual, not to the text.
 */
export function FeatureBlock({
  id,
  label,
  headline,
  lead,
  points,
  visual,
  layout = "stacked",
  flip = false,
}: FeatureBlockProps) {
  return (
    <section className={styles.block} id={id} data-layout={layout} data-flip={flip ? "true" : undefined}>
      <div className={styles.text}>
        <p className="label">{label}</p>
        <h2 className="headline">{headline}</h2>
        <p className="lead">{lead}</p>

        {points && (
          <dl className={styles.points}>
            {points.map((point) => (
              <div key={point.term}>
                <dt>{point.term}</dt>
                <dd>{point.detail}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className={styles.visual}>{visual}</div>
    </section>
  );
}
