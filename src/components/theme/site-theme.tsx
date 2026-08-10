"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { generate, type NeutralTint, type TokenMap } from "@/lib/palette";

/**
 * Lets the palette demo re-theme the entire page from the HEX somebody typed.
 *
 * The page keeps the package's baked strong theme.css unchanged. The server
 * adds the demo's subtle default as one generated override before first paint,
 * and this provider stays inert until a real interaction changes the selection.
 * Only then does the browser load the engine and rewrite that override.
 */

/** The exact selection baked into theme.css. Only this pair removes the
 *  override, so #4DA0FF with subtle still renders its distinct gray ramp. */
const BAKED_SELECTION = { hex: "#4da0ff", neutralTint: "strong" } as const;

/**
 * --brand-blue and its two variants are the page's own tokens: theme.css
 * defines them by hand and a generated palette never emits them. Thirty-eight
 * declarations across fourteen stylesheets read --brand-blue, so a custom seed
 * has to bring its own or the page keeps a blue accent sitting on a red theme.
 *
 * The accent is split by role rather than mapped to one step, because one step
 * cannot serve both. accent-11 carries --brand-blue, which paints text and
 * focus rings: it is the scale's readable-on-dark step, measuring 9.0:1 to
 * 10.8:1 across the five demo seeds. accent-9 carries --brand-solid, which
 * paints fills, borders and the two gradient washes: it is literally the colour
 * the visitor typed, and nothing has to be read through it.
 *
 * Step 9 is what the baked --brand-blue already is (212 100% 65% is #4DA0FF's
 * dark accent-9), which is why the two are the same value until somebody
 * generates a palette. It cannot hold the text role for an arbitrary seed
 * though - its lightness tracks the seed, measuring 3.5:1 for #7C3AED against
 * 19.9:1 for white.
 *
 * -soft and -subtle take steps 5 and 3, which is where the baked pair already
 * sits: 213 52% 25% against accent-5's 211 81% 25%, and 213 50% 16% against
 * accent-3's 212 66% 16%.
 */
const BRAND_TOKENS: Record<string, string> = {
  "brand-blue": "accent-11",
  "brand-solid": "accent-9",
  "brand-blue-soft": "accent-5",
  "brand-blue-subtle": "accent-3",
};

/**
 * The colour fade, at universal specificity on purpose: anything that declares
 * its own transition - buttons, the demo's swatches, the skill rows - outranks
 * `*` and keeps it, so a theme change never clobbers a running animation. Only
 * the properties that carry theme colour are listed; `all` here would put every
 * element on the page under a transition.
 *
 * prefers-reduced-motion is deliberately not branched on. motion.css defines
 * reduced motion as losing movement, not feedback, and keeps colour and opacity
 * changes; this transition moves nothing.
 */
const SHIFT_RULE = `*, *::before, *::after {
  transition-property: color, background-color, border-color, fill;
  transition-duration: var(--duration-slow);
  transition-timing-function: var(--ease-soft);
}`;

/**
 * How long to leave the fade rule in place before rewriting the sheet without
 * it. Read from the token rather than hardcoded: motion.css is a verbatim copy
 * of what the package ships, so --duration-slow can change on the next sync,
 * and a guard band shorter than the fade would cancel it mid-flight.
 */
function shiftMs(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--duration-slow")
    .trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 400;
  // Browsers serialise this as seconds ("0.24s"), the stylesheet writes it as
  // milliseconds. Both have to end up in milliseconds here.
  const ms = raw.endsWith("ms") ? value : value * 1000;
  return ms + 160;
}

export type SiteThemeSelection = {
  hex: string;
  neutralTint: NeutralTint;
};

export type SiteTheme = {
  /** null while the page is showing the exact theme baked into theme.css. */
  selection: SiteThemeSelection | null;
  /** Ignores anything that is not a six-digit HEX, so callers can forward raw input. */
  setSelection: (selection: SiteThemeSelection | null) => void;
};

/** A no-op default rather than a thrown error: the palette demo has to keep
 *  working on its own if the provider is ever unmounted. */
const SiteThemeContext = createContext<SiteTheme>({ selection: null, setSelection: () => {} });

export function useSiteTheme(): SiteTheme {
  return useContext(SiteThemeContext);
}

type SiteThemeProviderProps = {
  children: ReactNode;
  initialSelection: SiteThemeSelection;
  initialTokens: TokenMap;
};

function selectionKey(selection: SiteThemeSelection | null): string {
  return selection
    ? `${selection.hex.trim().toLowerCase()}|${selection.neutralTint}`
    : "baked";
}

export function SiteThemeProvider({
  children,
  initialSelection,
  initialTokens,
}: SiteThemeProviderProps) {
  const [selection, setSelectionState] = useState<SiteThemeSelection | null>(initialSelection);
  const sheet = useRef<HTMLStyleElement | null>(null);
  const settle = useRef<number | undefined>(undefined);
  const appliedSelection = useRef(selectionKey(initialSelection));

  /**
   * One stylesheet, rewritten whole. Specificity is why it beats theme.css -
   * :root[data-site-theme] outranks the [data-theme="dark"] block it has to
   * override - and a single parse per change costs less than ninety
   * setProperty calls. Inline styles on <html> would win outright but would
   * clobber anything else that ever writes there.
   */
  const apply = useCallback((tokens: TokenMap | null) => {
    const style = (sheet.current ??= document.head.appendChild(document.createElement("style")));
    window.clearTimeout(settle.current);

    style.textContent = tokens ? `${SHIFT_RULE}\n${rootBlock(tokens)}` : SHIFT_RULE;
    if (tokens) document.documentElement.setAttribute("data-site-theme", "custom");
    else document.documentElement.removeAttribute("data-site-theme");

    settle.current = window.setTimeout(() => {
      if (sheet.current) sheet.current.textContent = tokens ? rootBlock(tokens) : "";
    }, shiftMs());
  }, []);

  const setSelection = useCallback((next: SiteThemeSelection | null) => {
    if (next === null) {
      setSelectionState(null);
      return;
    }
    /*
     * Six digits only, deliberately stricter than the demo's own isValidHex,
     * which also accepts the 3-digit shorthand. The first three characters of
     * any 6-digit HEX are themselves a valid shorthand, so accepting those
     * would re-theme the whole page to a wrong colour mid-typing: "#22C55E"
     * would flash "#2222CC" before settling on green.
     */
    if (!/^#?[0-9a-f]{6}$/i.test(next.hex.trim())) return;
    const normalized = (
      next.hex.trim().startsWith("#") ? next.hex.trim() : `#${next.hex.trim()}`
    ).toLowerCase();
    setSelectionState(
      normalized === BAKED_SELECTION.hex && next.neutralTint === BAKED_SELECTION.neutralTint
        ? null
        : { hex: normalized, neutralTint: next.neutralTint },
    );
  }, []);

  useEffect(() => {
    const nextKey = selectionKey(selection);
    if (nextKey === appliedSelection.current) return;
    appliedSelection.current = nextKey;

    if (selection === null) {
      if (sheet.current) apply(null);
      return;
    }

    let cancelled = false;

    /**
     * Always hsl-values, whatever format the demo happens to be previewing:
     * every rule on the page composes with hsl(var(--token) / alpha), which
     * needs a bare triplet. Always shadcn, because theme.css is a shadcn sheet
     * and the other presets emit different token names. The site runs
     * data-theme="dark", so only the dark block is used.
     */
    generate({
      hex: selection.hex,
      preset: "shadcn",
      format: "hsl-values",
      neutralTint: selection.neutralTint,
    })
      .then((theme) => {
        if (!cancelled) apply(theme.dark);
      })
      .catch(() => {
        // The demo already reports a failed engine load. The page keeps the
        // theme it shipped with rather than half-applying another one.
      });

    return () => {
      cancelled = true;
    };
  }, [selection, apply]);

  useEffect(
    () => () => {
      window.clearTimeout(settle.current);
    },
    [],
  );

  const value = useMemo(
    () => ({ selection, setSelection }),
    [selection, setSelection],
  );

  return (
    <>
      <style ref={sheet}>{rootBlock(initialTokens)}</style>
      <SiteThemeContext.Provider value={value}>{children}</SiteThemeContext.Provider>
    </>
  );
}

/** The generated dark tokens plus the three the page defines itself. */
function rootBlock(tokens: TokenMap): string {
  const declarations = Object.entries(tokens).map(([name, value]) => `  --${name}: ${value};`);

  for (const [token, step] of Object.entries(BRAND_TOKENS)) {
    if (tokens[step]) declarations.push(`  --${token}: ${tokens[step]};`);
  }

  return `:root[data-site-theme="custom"] {\n${declarations.join("\n")}\n}`;
}
