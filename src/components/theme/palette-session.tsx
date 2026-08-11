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
import { useSiteTheme } from "@/components/theme/site-theme";
import {
  generate,
  isValidHex,
  type GeneratedTheme,
  type PaletteOptions,
} from "@/lib/palette";

type PaletteUpdateOptions = {
  /** Text and native colour inputs settle before the engine runs. */
  delay?: number;
  /** Every explicit palette edit opts the command builder into a custom palette. */
  activate?: boolean;
};

type PaletteSession = {
  options: PaletteOptions;
  theme: GeneratedTheme;
  baseline: GeneratedTheme | null;
  busy: boolean;
  failed: boolean;
  customPaletteActive: boolean;
  setCustomPaletteActive: (active: boolean) => void;
  updatePalette: (
    patch: Partial<PaletteOptions>,
    updateOptions?: PaletteUpdateOptions,
  ) => void;
};

const PaletteSessionContext = createContext<PaletteSession | null>(null);

export function usePaletteSession(): PaletteSession {
  const session = useContext(PaletteSessionContext);
  if (!session) throw new Error("usePaletteSession must be used inside PaletteSessionProvider.");
  return session;
}

type PaletteSessionProviderProps = {
  children: ReactNode;
  initialOptions: PaletteOptions;
  initialTheme: GeneratedTheme;
};

/**
 * One palette session for the whole page.
 *
 * The demo and command builder are far apart in the document, but they are two
 * views of the same choice. Generation therefore belongs here rather than in
 * either view. Raw, partial HEX text is shared immediately; the last complete
 * palette remains visible until the shared value becomes valid again.
 */
export function PaletteSessionProvider({
  children,
  initialOptions,
  initialTheme,
}: PaletteSessionProviderProps) {
  const { setSelection } = useSiteTheme();
  const [options, setOptions] = useState<PaletteOptions>(initialOptions);
  const [theme, setTheme] = useState<GeneratedTheme>(initialTheme);
  const [baseline, setBaseline] = useState<GeneratedTheme | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [customPaletteActive, setCustomPaletteActive] = useState(false);

  const current = useRef(initialOptions);
  const debounce = useRef<number | undefined>(undefined);
  const requestId = useRef(0);

  const updatePalette = useCallback(
    (
      patch: Partial<PaletteOptions>,
      { delay = 0, activate = true }: PaletteUpdateOptions = {},
    ) => {
      const next = { ...current.current, ...patch };
      current.current = next;
      setOptions(next);
      if (activate) setCustomPaletteActive(true);

      window.clearTimeout(debounce.current);
      const id = ++requestId.current;
      setFailed(false);

      if (!isValidHex(next.hex)) {
        setBusy(false);
        return;
      }

      setBusy(true);
      debounce.current = window.setTimeout(() => {
        // The site theme and both palette views change from the same accepted
        // selection. SiteThemeProvider keeps owning its fixed shadcn/hsl-values
        // stylesheet because page chrome must not depend on preview format.
        setSelection({ hex: next.hex, neutralTint: next.neutralTint });

        const work: Promise<[GeneratedTheme, GeneratedTheme | null]> =
          next.neutralTint === "strong"
            ? Promise.all([generate(next), generate({ ...next, neutralTint: "subtle" })])
            : generate(next).then((generated) => [generated, null]);

        work
          .then(([generated, subtle]) => {
            if (id !== requestId.current) return;
            setTheme(generated);
            setBaseline(subtle);
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
    [setSelection],
  );

  useEffect(
    () => () => {
      window.clearTimeout(debounce.current);
      requestId.current += 1;
    },
    [],
  );

  const value = useMemo(
    () => ({
      options,
      theme,
      baseline,
      busy,
      failed,
      customPaletteActive,
      setCustomPaletteActive,
      updatePalette,
    }),
    [options, theme, baseline, busy, failed, customPaletteActive, updatePalette],
  );

  return <PaletteSessionContext.Provider value={value}>{children}</PaletteSessionContext.Provider>;
}
