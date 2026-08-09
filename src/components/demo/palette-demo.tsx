"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { CopyCommandButton } from "@/components/ui/copy-command-button";
import { HexField } from "@/components/ui/hex-field";
import { useSiteTheme } from "@/components/theme/site-theme";
import {
  FORMATS,
  PRESETS,
  buildCommand,
  generate,
  isValidHex,
  type Format,
  type GeneratedTheme,
  type Preset,
  type TokenMap,
} from "@/lib/palette";
import styles from "./palette-demo.module.css";

const SEEDS = ["#4DA0FF", "#22C55E", "#E11D48", "#7C3AED", "#F59E0B"];

/** The roles worth showing large - the rest live in the scales below them. */
const ROLE_TOKENS = ["background", "foreground", "primary", "accent-9", "muted", "border"];

type PaletteDemoProps = {
  /** Generated on the server at build time, so the engine never loads until
   *  somebody actually reaches for it. */
  initialTheme: GeneratedTheme;
  initialHex: string;
};

export function PaletteDemo({ initialTheme, initialHex }: PaletteDemoProps) {
  const [hex, setHex] = useState(initialHex);
  const [preset, setPreset] = useState<Preset>("shadcn");
  const [format, setFormat] = useState<Format>("hsl-values");
  const [theme, setTheme] = useState<GeneratedTheme>(initialTheme);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  /** Pushes the seed up so the rest of the page adopts the same theme. */
  const { setSeed } = useSiteTheme();

  const debounce = useRef<number | undefined>(undefined);
  const seedDebounce = useRef<number | undefined>(undefined);
  const requestId = useRef(0);

  const valid = isValidHex(hex);
  const command = useMemo(
    () => buildCommand({ hex, preset, format, scheme: "analogous" }),
    [hex, preset, format],
  );

  /**
   * Generation runs from the interaction that asked for it rather than from a
   * render effect, so a stale render can never kick off work of its own.
   */
  const regenerate = useCallback(
    (next: { hex: string; preset: Preset; format: Format }, delay: number) => {
      if (!isValidHex(next.hex)) return;
      window.clearTimeout(debounce.current);
      setBusy(true);
      const id = ++requestId.current;
      debounce.current = window.setTimeout(() => {
        generate({ ...next, scheme: "analogous" })
          .then((result) => {
            if (id !== requestId.current) return;
            setTheme(result);
            setBusy(false);
            setFailed(false);
          })
          .catch(() => {
            if (id !== requestId.current) return;
            setBusy(false);
            setFailed(true);
          });
      }, delay);
    },
    [],
  );

  /*
   * The page re-theme is debounced alongside the preview, not ahead of it.
   * Dragging inside the colour picker emits continuously, and every accepted
   * value here regenerates a palette and rewrites a stylesheet that carries a
   * universal transition rule - measured at 14ms of style recalc apiece, which
   * took the page from 120fps to 66fps when it ran on every emission.
   */
  const onHexChange = (value: string) => {
    setHex(value);
    window.clearTimeout(seedDebounce.current);
    seedDebounce.current = window.setTimeout(() => setSeed(value), 200);
    regenerate({ hex: value, preset, format }, 200);
  };

  const onPresetChange = (value: Preset) => {
    setPreset(value);
    regenerate({ hex, preset: value, format }, 0);
  };

  const onFormatChange = (value: Format) => {
    setFormat(value);
    regenerate({ hex, preset, format: value }, 0);
  };

  return (
    <div className={styles.demo}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <HexField
            id="palette-hex"
            label="Your brand colour"
            value={hex}
            onChange={onHexChange}
            invalid={!valid}
            describedBy={!valid ? "palette-hex-error" : undefined}
            surface="card"
          />
          {!valid && (
            <p className={styles.error} id="palette-hex-error">
              Enter a valid HEX colour, with or without the #
            </p>
          )}
          <div className={styles.seeds}>
            {SEEDS.map((seed) => (
              <button
                key={seed}
                type="button"
                className={styles.seed}
                style={{ background: seed }}
                data-active={seed.toLowerCase() === hex.toLowerCase() ? "true" : undefined}
                onClick={() => onHexChange(seed)}
                aria-label={`Use ${seed}`}
              />
            ))}
          </div>
        </div>

        <fieldset className={styles.field}>
          <legend className={styles.fieldLabel}>Framework / style</legend>
          <div className={styles.segmented}>
            {PRESETS.map((option) => (
              <button
                key={option.value}
                type="button"
                data-active={preset === option.value ? "true" : undefined}
                aria-pressed={preset === option.value}
                onClick={() => onPresetChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.field}>
          <legend className={styles.fieldLabel}>Colour format</legend>
          <div className={styles.segmented}>
            {FORMATS.map((option) => (
              <button
                key={option.value}
                type="button"
                data-active={format === option.value ? "true" : undefined}
                aria-pressed={format === option.value}
                onClick={() => onFormatChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.output} data-busy={busy ? "true" : undefined}>
        <div className={styles.previews}>
          <ThemePane label="Light" tokens={theme.light} format={format} />
          <ThemePane label="Dark" tokens={theme.dark} format={format} />
        </div>

        <div className={styles.commandRow}>
          <code>{command}</code>
          <CopyCommandButton command={command} />
        </div>

        <details className={styles.details}>
          <summary>Show the generated theme.css</summary>
          <div className={styles.detailsBody}>
            <CodeBlock
              code={theme.css}
              label="src/lib/design-system/theme.css"
              copyable
              scroll
              language="css"
            />
          </div>
        </details>

        {failed && (
          <p className={styles.error} role="status">
            The generator could not load. The CLI still works - copy the command above.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * One mode's tokens. Colours are set as inline values on the pane and its
 * swatches, so a regeneration is a style change rather than fifty animations.
 */
function ThemePane({
  label,
  tokens,
  format,
}: {
  label: string;
  tokens: TokenMap;
  format: Format;
}) {
  const wrap = (value: string) => (format === "hsl-values" ? `hsl(${value})` : value);
  const scale = Array.from({ length: 12 }, (_, i) => `accent-${i + 1}`);

  return (
    <div className={styles.pane}>
      <span className={styles.paneLabel}>{label}</span>

      <div
        className={styles.paneSurface}
        style={
          tokens.background
            ? {
                background: wrap(tokens.background),
                color: wrap(tokens.foreground ?? tokens.background),
              }
            : undefined
        }
      >
        <div className={styles.roles}>
          {ROLE_TOKENS.map((token) => (
            <div key={token} className={styles.role}>
              <span
                className={styles.roleChip}
                style={tokens[token] ? { background: wrap(tokens[token]) } : undefined}
              />
              <code>--{token}</code>
            </div>
          ))}
        </div>

        <div className={styles.scale}>
          {scale.map((token) => (
            <span
              key={token}
              className={styles.scaleStep}
              style={tokens[token] ? { background: wrap(tokens[token]) } : undefined}
              title={`--${token}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
