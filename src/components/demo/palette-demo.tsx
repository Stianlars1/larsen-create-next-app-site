"use client";

import { useMemo, useRef } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { CopyCommandButton } from "@/components/ui/copy-command-button";
import { HexField } from "@/components/ui/hex-field";
import { NeutralTintDisclosure } from "@/components/ui/neutral-tint-disclosure";
import { usePaletteSession } from "@/components/theme/palette-session";
import {
  FORMATS,
  PREDEFINED_COLOURS,
  PRESETS,
  buildCommand,
  changedScaleSteps,
  formatChangedScaleSteps,
  isValidHex,
  rampkitHarmonyUrl,
  type Format,
  type Preset,
  type TokenMap,
} from "@/lib/palette";
import styles from "./palette-demo.module.css";

/** The roles worth showing large - the rest live in the scales below them. */
const ROLE_TOKENS = ["background", "foreground", "primary", "accent-9", "muted", "border"];

export function PaletteDemo() {
  const { options, theme, baseline, busy, failed, updatePalette } = usePaletteSession();
  const { hex, preset, format, neutralTint } = options;
  const colourPicker = useRef<HTMLDetailsElement | null>(null);

  const valid = isValidHex(hex);
  const harmonyUrl = rampkitHarmonyUrl(hex);
  const command = useMemo(
    () => buildCommand({ hex, preset, format, neutralTint }),
    [hex, preset, format, neutralTint],
  );
  const currentColour = PREDEFINED_COLOURS.find(
    (colour) => colour.hex.toLowerCase() === hex.trim().toLowerCase(),
  );

  /**
   * What the current tint actually moved, per mode and per scale. Both scales
   * are reported, including a zero, because the accent scale staying put is
   * the part of the contract that is hardest to believe from a swatch row.
   */
  const changes = useMemo(() => {
    if (!baseline) return null;
    const forMode = (mode: "light" | "dark") => ({
      accent: changedScaleSteps(baseline[mode], theme[mode], "accent"),
      gray: changedScaleSteps(baseline[mode], theme[mode], "gray"),
    });
    return { light: forMode("light"), dark: forMode("dark") };
  }, [baseline, theme]);

  const onHexChange = (value: string) => {
    updatePalette({ hex: value }, { delay: 200 });
  };

  const onPresetChange = (value: Preset) => {
    updatePalette({ preset: value });
  };

  const onFormatChange = (value: Format) => {
    updatePalette({ format: value });
  };

  const onNeutralTintChange = (value: typeof neutralTint) => {
    if (value === neutralTint) return;
    updatePalette({ neutralTint: value });
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
          <details className={styles.colourPicker} ref={colourPicker}>
            <summary>
              <span>Seed presets</span>
              <span className={styles.colourPickerValue}>
                <span
                  className={styles.colourPickerDot}
                  style={{ background: currentColour?.hex ?? (valid ? hex : undefined) }}
                />
                {currentColour?.name ?? "Custom"}
              </span>
            </summary>
            <div className={styles.colourGrid} role="group" aria-label="Seed presets">
              {PREDEFINED_COLOURS.map((colour) => (
                <button
                  key={colour.name}
                  type="button"
                  data-active={colour.hex.toLowerCase() === hex.toLowerCase() ? "true" : undefined}
                  aria-pressed={colour.hex.toLowerCase() === hex.toLowerCase()}
                  onClick={() => {
                    onHexChange(colour.hex);
                    colourPicker.current?.removeAttribute("open");
                  }}
                >
                  <span className={styles.colourPickerDot} style={{ background: colour.hex }} />
                  {colour.name}
                </button>
              ))}
            </div>
            <p className={styles.colourSource}>
              Named starting points, not presets. Each one is a plain HEX fed to this generator,
              and each clears its contrast checks in both modes.
            </p>
          </details>
          {harmonyUrl && (
            <a className={styles.harmonyLink} href={harmonyUrl} target="_blank" rel="noreferrer">
              Explore colour harmony in Rampkit
            </a>
          )}
          <p className={styles.fieldHint}>
            The seed is never rotated - this generator builds the accent scale from the colour you
            typed. Rampkit is where you rotate a seed and rebuild the palette around another hue.
          </p>
        </div>

        <NeutralTintDisclosure value={neutralTint} onChange={onNeutralTintChange} />

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
          <ThemePane label="Light" tokens={theme.light} format={format} changes={changes?.light} />
          <ThemePane label="Dark" tokens={theme.dark} format={format} changes={changes?.dark} />
        </div>

        <div className={styles.commandRow}>
          {command ? (
            <>
              <code>{command}</code>
              <CopyCommandButton command={command} />
            </>
          ) : (
            <p className={styles.commandUnavailable} role="status">
              Enter a valid HEX colour to build a copyable command.
            </p>
          )}
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
  changes,
}: {
  label: string;
  tokens: TokenMap;
  format: Format;
  /** Present only while Strong is selected: what it moved against Subtle. */
  changes?: { accent: string[]; gray: string[] };
}) {
  const wrap = (value: string) => (format === "hsl-values" ? `hsl(${value})` : value);
  const scales = [
    {
      label: "Accent",
      tokens: Array.from({ length: 12 }, (_, i) => `accent-${i + 1}`),
      changed: changes?.accent,
    },
    {
      label: "Gray",
      tokens: Array.from({ length: 12 }, (_, i) => `gray-${i + 1}`),
      changed: changes?.gray,
    },
  ];

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

        <div className={styles.scales}>
          {scales.map((scale) => (
            <div className={styles.scaleGroup} key={scale.label}>
              <span className={styles.scaleLabel}>
                <span>{scale.label}</span>
                {scale.changed !== undefined && (
                  <span
                    className={styles.changeSummary}
                    aria-live="polite"
                  >
                    <span
                      className={styles.changeCount}
                      data-none={scale.changed.length === 0 ? "true" : undefined}
                    >
                      {`${scale.changed.length}/12 changed`}
                    </span>
                    {scale.changed.length > 0 && (
                      <span className={styles.changedSteps}>
                        Outlined steps: {formatChangedScaleSteps(scale.changed)}
                      </span>
                    )}
                  </span>
                )}
              </span>
              <div className={styles.scale} aria-label={`${label} ${scale.label} scale`}>
                {scale.tokens.map((token) => {
                  const changed = scale.changed?.includes(token);
                  const value = tokens[token] ?? "not emitted";
                  const comparison =
                    scale.changed === undefined
                      ? ""
                      : changed
                        ? " Strong changed this swatch."
                        : " Strong did not change this swatch.";

                  return (
                    <span
                      key={token}
                      className={styles.scaleStep}
                      style={tokens[token] ? { background: wrap(tokens[token]) } : undefined}
                      data-changed={changed ? "true" : undefined}
                      title={`--${token}: ${value}`}
                      role="img"
                      aria-label={`${label} ${scale.label} swatch --${token}: ${value}.${comparison}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
