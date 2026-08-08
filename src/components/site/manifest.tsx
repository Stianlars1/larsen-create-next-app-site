import styles from "./manifest.module.css";

/** The thirty minutes the CLI removes, itemised. */
const REPLACED = [
  { before: "Delete the demo page and its CSS", after: "A welcome page that demonstrates the tokens" },
  { before: "Copy spacing values from the last project", after: "Eight steps on a 4px base, decided" },
  { before: "Pick colours, then pick them again for dark", after: "Both modes generated from one HEX" },
  { before: "Remember which easing curve you settled on", after: "Four curves, named for what moves" },
  { before: "Rewrite AGENTS.md from memory", after: "Written, and matching the palette you chose" },
  { before: "Add Tailwind, then fight it", after: "Vanilla CSS custom properties" },
];

export function Manifest() {
  return (
    <section className="section" id="why">
      <div className="page">
        <p className="label">Why</p>
        <h2 className="headline">Every project started with the same thirty minutes</h2>
        <p className="lead">
          Not hard work. Just the same work, slightly worse each time, because it was being
          re-derived from memory.
        </p>

        <ul className={styles.list}>
          {REPLACED.map((item) => (
            <li key={item.before}>
              <span className={styles.before}>{item.before}</span>
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
              <span className={styles.after}>{item.after}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
