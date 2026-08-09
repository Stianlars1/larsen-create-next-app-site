"use client";

import { useEffect, useRef, useState } from "react";
import { isValidHex } from "@/lib/palette";
import styles from "./hex-field.module.css";

/**
 * A HEX text field whose swatch is a real `<input type="color">`.
 *
 * Both controls carry the same colour, and the text one is never reformatted
 * while it is being typed - it is the picker that adapts, since it is the only
 * one of the two with a format it cannot bend on.
 */

/**
 * A native colour input emits `input` for every pointer move inside the OS
 * panel, and each one that reaches a caller re-themes the page and regenerates
 * a palette. So the picker itself stays live - it has to, or React would keep
 * restoring a value the pointer has already moved past - and it is the call
 * upwards that is capped: the first colour goes straight through, the released
 * one always lands, and in between at most one every PICKER_INTERVAL.
 *
 * A cap rather than a debounce, so the picker keeps feeling live while the
 * pointer drags. It is not sufficient on its own: in the palette demo only the
 * preview regeneration is debounced, while the whole-page re-theme runs for
 * every accepted value and rewrites a stylesheet carrying a universal
 * transition rule. Measured at one emission per 120ms that cost a median 14ms
 * of style recalc each and took the page from 120fps to 66fps, so the demo
 * debounces that call too. This cap only keeps the stream sane.
 */
const PICKER_INTERVAL = 120;

/** The control's own initial value in every browser, and never seen: the face
 *  stays transparent for as long as the text does not spell a colour. */
const DEFAULT_PICKER_VALUE = "#000000";

/** The control accepts `#rrggbb` and nothing else, so the shorthand is expanded
 *  and a missing # supplied - both of which isValidHex lets through. */
function toPickerValue(raw: string): string | null {
  if (!isValidHex(raw)) return null;
  const digits = raw.trim().replace(/^#/, "");
  const full = digits.length === 3 ? digits.replace(/./g, (digit) => digit + digit) : digits;
  return `#${full.toLowerCase()}`;
}

type HexFieldProps = {
  /** Ties the text input to the caller's own `<label htmlFor>`. */
  id: string;
  /** The visible label's words, reused to name the picker and the pair. */
  label: string;
  /** Exactly what was typed, partial and invalid values included. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  /** id of the caller's error paragraph, while it is showing one. */
  describedBy?: string;
  /**
   * Which background to paint, matched to the block the field sits in: `card`
   * is the opaque gray the demo's controls stand on, `raised` the translucent
   * lift of the builder's inset panel.
   */
  surface?: "card" | "raised";
};

export function HexField({
  id,
  label,
  value,
  onChange,
  invalid = false,
  describedBy,
  surface = "card",
}: HexFieldProps) {
  const colour = toPickerValue(value);

  /**
   * The picker holds its own copy of the colour. It follows the text whenever
   * the text spells a new one, keeps the last complete colour while a half
   * typed value sits there, and ignores the echo of what it last sent up -
   * during a drag the value coming back from above is always one emission
   * behind the pointer, and adopting it would drag the control backwards.
   */
  const [picked, setPicked] = useState(() => colour ?? DEFAULT_PICKER_VALUE);
  const [echo, setEcho] = useState<string | null>(null);
  if (colour && colour !== picked && colour !== echo) setPicked(colour);

  // Read at flush time rather than captured, so a colour held for up to
  // PICKER_INTERVAL cannot call a handler the caller has since replaced.
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });

  const queued = useRef<string | null>(null);
  const flush = useRef<number | undefined>(undefined);
  const sentAt = useRef(0);

  useEffect(() => () => window.clearTimeout(flush.current), []);

  function drop() {
    window.clearTimeout(flush.current);
    flush.current = undefined;
    queued.current = null;
  }

  function send(next: string) {
    setEcho(next);
    sentAt.current = Date.now();
    latest.current(next);
  }

  function fromPicker(next: string) {
    setPicked(next);

    const wait = PICKER_INTERVAL - (Date.now() - sentAt.current);
    if (wait <= 0) {
      drop();
      send(next);
      return;
    }

    queued.current = next;
    flush.current ??= window.setTimeout(() => {
      flush.current = undefined;
      const pending = queued.current;
      queued.current = null;
      if (pending !== null) send(pending);
    }, wait);
  }

  function fromText(next: string) {
    // A colour still in flight must never land on top of what is being typed.
    drop();
    setEcho(null);
    onChange(next);
  }

  return (
    <div
      className={styles.field}
      data-surface={surface}
      data-invalid={invalid ? "true" : undefined}
      role="group"
      aria-label={label}
    >
      <input
        type="color"
        className={styles.picker}
        value={picked}
        onChange={(event) => fromPicker(event.target.value)}
        // The face is painted here rather than left to the browser: the
        // stylesheet says what that buys and why the native swatch is blanked.
        style={{ background: colour ? picked : "transparent" }}
        aria-label={`${label}: open the colour picker`}
      />
      <input
        id={id}
        className={styles.text}
        value={value}
        onChange={(event) => fromText(event.target.value)}
        spellCheck={false}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
    </div>
  );
}
