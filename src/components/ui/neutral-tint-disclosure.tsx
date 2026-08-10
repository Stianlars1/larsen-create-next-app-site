"use client";

import { NEUTRAL_TINTS, type NeutralTint } from "@/lib/palette";
import styles from "./neutral-tint-disclosure.module.css";

type NeutralTintDisclosureProps = {
  value: NeutralTint;
  onChange: (value: NeutralTint) => void;
  wide?: boolean;
};

export function NeutralTintDisclosure({
  value,
  onChange,
  wide = false,
}: NeutralTintDisclosureProps) {
  const selected = NEUTRAL_TINTS.find((option) => option.value === value);

  return (
    <details className={styles.control} data-wide={wide ? "true" : undefined}>
      <summary>
        <span className={styles.label}>Neutral tint</span>
        <span className={styles.value}>{selected?.label}</span>
      </summary>
      <div className={styles.body}>
        <div className={styles.options} role="group" aria-label="Neutral tint">
          {NEUTRAL_TINTS.map((option) => (
            <button
              key={option.value}
              type="button"
              data-active={value === option.value ? "true" : undefined}
              aria-pressed={value === option.value}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p>
          Subtle is the CLI default and needs no flag. Strong adds more seed hue to the grays.
          Accent colours stay unchanged, except for #000000, #010101, #FEFEFE and #FFFFFF.
        </p>
      </div>
    </details>
  );
}
