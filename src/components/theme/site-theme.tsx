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
import {
  generate,
  normalizeHex,
  type NeutralTint,
  type TokenMap,
} from "@/lib/palette";

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
  /** Ignores invalid HEX, so callers can forward raw input. */
  setSelection: (selection: SiteThemeSelection | null) => void;
};

/** A no-op default rather than a thrown error: the palette demo has to keep
 *  working on its own if the provider is ever unmounted. */
const SiteThemeContext = createContext<SiteTheme>({
  selection: null,
  setSelection: () => {},
});

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
  const [selection, setSelectionState] = useState<SiteThemeSelection | null>(
    initialSelection,
  );
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
    const style = (sheet.current ??= document.head.appendChild(
      document.createElement("style"),
    ));
    window.clearTimeout(settle.current);

    style.textContent = tokens
      ? `${SHIFT_RULE}\n${rootBlock(tokens)}`
      : SHIFT_RULE;
    if (tokens)
      document.documentElement.setAttribute("data-site-theme", "custom");
    else document.documentElement.removeAttribute("data-site-theme");

    settle.current = window.setTimeout(() => {
      if (sheet.current)
        sheet.current.textContent = tokens ? rootBlock(tokens) : "";
    }, shiftMs());
  }, []);

  const setSelection = useCallback((next: SiteThemeSelection | null) => {
    if (next === null) {
      setSelectionState(null);
      return;
    }
    const normalized = normalizeHex(next.hex);
    if (!normalized) return;
    setSelectionState({ hex: normalized, neutralTint: next.neutralTint });
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
      <SiteThemeContext.Provider value={value}>
        {children}
      </SiteThemeContext.Provider>
    </>
  );
}

/** The generated dark tokens plus the three the page defines itself. */
function rootBlock(tokens: TokenMap): string {
  const declarations = Object.entries(tokens).map(
    ([name, value]) => `  --${name}: ${value};`,
  );

  return `:root[data-site-theme="custom"] {\n${declarations.join("\n")}\n}`;
}
