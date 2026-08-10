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
          Subtle is the CLI default and needs no flag. Strong adds more seed hue to the gray ramp
          and to the tokens built on it - foreground, muted, card, popover, border and the sidebar
          surfaces. The accent scale, background, primary and ring stay where they are, unless the
          seed is pure black or pure white, which has no hue of its own and takes its accent scale
          from the same tinted neutral. Expect a small shift: the largest single-channel difference
          measured across the generator is 4 of 255, and dark mode moves least.
        </p>
      </div>
    </details>
  );
}
