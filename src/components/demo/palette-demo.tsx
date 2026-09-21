"use client";

import { useMemo, useRef } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { CopyCommandButton } from "@/components/ui/copy-command-button";
import { HexField } from "@/components/ui/hex-field";
import { NeutralTintDisclosure } from "@/components/ui/neutral-tint-disclosure";
import { usePaletteSession } from "@/components/theme/palette-session";
import {
  FORMATS,
  formatsFor,
  PREDEFINED_COLOURS,
  PRESETS,
  buildCommand,
  changedScaleSteps,
  formatChangedScaleSteps,
  isValidHex,
  tintfulUrl,
  type Format,
  type Preset,
  type TokenMap,
} from "@/lib/palette";
import styles from "./palette-demo.module.css";

/** The roles worth showing large - the rest live in the scales below them. */
const ROLE_TOKENS = {
  shadcn: [
    "background",
    "foreground",
    "primary",
    "primary-foreground",
    "muted",
    "border",
  ],
  radix: [
    "color-background",
    "gray-12",
    "accent-9",
    "accent-contrast",
    "gray-2",
    "gray-6",
  ],
  canonical: [
    "cpe-canvas",
    "cpe-canvas-foreground",
    "cpe-action-primary-solid",
    "cpe-action-primary-foreground",
    "cpe-surface",
    "cpe-border-decorative",
  ],
};

export function PaletteDemo() {
  const { options, theme, baseline, busy, failed, error, updatePalette } =
    usePaletteSession();
  const { hex, preset, format, neutralTint } = options;
  const colourPicker = useRef<HTMLDetailsElement | null>(null);

  const valid = isValidHex(hex);
  const harmonyUrl = tintfulUrl(hex);
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
      accent: changedScaleSteps(
        baseline.ramps[mode],
        theme.ramps[mode],
        "accent",
      ),
      gray: changedScaleSteps(baseline.ramps[mode], theme.ramps[mode], "gray"),
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
                  style={{
                    background: currentColour?.hex ?? (valid ? hex : undefined),
                  }}
                />
                {currentColour?.name ?? "Custom"}
              </span>
            </summary>
            <div
              className={styles.colourGrid}
              role="group"
              aria-label="Seed presets"
            >
              {PREDEFINED_COLOURS.map((colour) => (
                <button
                  key={colour.name}
                  type="button"
                  data-active={
                    colour.hex.toLowerCase() === hex.toLowerCase()
                      ? "true"
                      : undefined
                  }
                  aria-pressed={colour.hex.toLowerCase() === hex.toLowerCase()}
                  onClick={() => {
                    onHexChange(colour.hex);
                    colourPicker.current?.removeAttribute("open");
                  }}
                >
                  <span
                    className={styles.colourPickerDot}
                    style={{ background: colour.hex }}
                  />
                  {colour.name}
                </button>
              ))}
            </div>
            <p className={styles.colourSource}>
              Named seed colours run through Tintful just like your input.
              Generation and export quality are checked before an output is
              offered.
            </p>
          </details>
          {harmonyUrl && (
            <a
              className={styles.harmonyLink}
              href={harmonyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Explore Tintful
            </a>
          )}
          <p className={styles.fieldHint}>
            One seed creates light and dark palettes. Tintful solves the colour
            roles and checks the exported result.
          </p>
        </div>

        <NeutralTintDisclosure
          value={neutralTint}
          onChange={onNeutralTintChange}
        />

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
                disabled={
                  !formatsFor(preset).some((f) => f.value === option.value)
                }
                onClick={() => onFormatChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.output} data-busy={busy ? "true" : undefined}>
        {(busy || failed || !valid) && (
          <p role="status">
            Showing the last passing preview while the current selection is
            checked.
          </p>
        )}
        <div className={styles.previews}>
          <ThemePane
            label="Light"
            tokens={theme.light}
            ramps={theme.ramps.light}
            preset={theme.options.preset}
            format={theme.options.format}
            changes={changes?.light}
          />
          <ThemePane
            label="Dark"
            tokens={theme.dark}
            ramps={theme.ramps.dark}
            preset={theme.options.preset}
            format={theme.options.format}
            changes={changes?.dark}
          />
        </div>

        <div className={styles.commandRow}>
          {command && !busy && !failed ? (
            <>
              <code>{command}</code>
              <CopyCommandButton command={command} />
            </>
          ) : (
            <p className={styles.commandUnavailable} role="status">
              Choose a supported combination and wait for a passing export to
              copy its command.
            </p>
          )}
        </div>

        {!busy && !failed && valid && (
          <div className={styles.downloads}>
            {theme.artifacts.map((artifact) => (
              <button
                key={artifact.fileName}
                type="button"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([artifact.text], {
                      type: "text/plain;charset=utf-8",
                    }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = artifact.fileName;
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Download {artifact.fileName}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(theme.manifest, null, 2) + "\n"], {
                    type: "application/json",
                  }),
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = "theme.manifest.json";
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Download manifest
            </button>
            <p>
              Keep the CSS, audit and manifest together. Audits verify the
              original exported bytes.
            </p>
          </div>
        )}
        {!busy && !failed && valid && (
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
        )}

        {failed && (
          <p className={styles.error} role="status">
            {error ??
              "Tintful could not generate this selection. Choose another seed or format."}
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
  ramps,
  preset,
  format,
  changes,
}: {
  label: string;
  tokens: TokenMap;
  ramps: TokenMap;
  preset: Preset;
  format: Format;
  /** Present only while Strong is selected: what it moved against Subtle. */
  changes?: { accent: string[]; gray: string[] };
}) {
  const wrap = (value: string) =>
    format === "hsl-values" ? `hsl(${value})` : value;
  const scales = [
    {
      label: "Accent",
      tokens: Array.from(
        { length: 12 },
        (_, i) => `cpe-ramp-brand-primary-${i + 1}`,
      ),
      changed: changes?.accent,
    },
    {
      label: "Gray",
      tokens: Array.from({ length: 12 }, (_, i) => `cpe-ramp-neutral-${i + 1}`),
      changed: changes?.gray,
    },
  ];

  const [background, foreground] = ROLE_TOKENS[preset];
  return (
    <div className={styles.pane}>
      <span className={styles.paneLabel}>{label}</span>

      <div
        className={styles.paneSurface}
        style={
          tokens[background]
            ? {
                background: wrap(tokens[background]),
                color: wrap(tokens[foreground] ?? tokens[background]),
              }
            : undefined
        }
      >
        <div className={styles.roles}>
          {ROLE_TOKENS[preset].map((token) => (
            <div key={token} className={styles.role}>
              <span
                className={styles.roleChip}
                style={
                  tokens[token]
                    ? { background: wrap(tokens[token]) }
                    : undefined
                }
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
                  <span className={styles.changeSummary} aria-live="polite">
                    <span
                      className={styles.changeCount}
                      data-none={
                        scale.changed.length === 0 ? "true" : undefined
                      }
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
              <div
                className={styles.scale}
                aria-label={`${label} ${scale.label} scale`}
              >
                {scale.tokens.map((token) => {
                  const changed = scale.changed?.includes(token);
                  const value = ramps[token] ?? "not emitted";
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
                      style={
                        ramps[token]
                          ? { background: wrap(ramps[token]) }
                          : undefined
                      }
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
