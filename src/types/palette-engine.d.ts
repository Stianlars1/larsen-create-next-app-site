/**
 * The CLI ships plain JavaScript with JSDoc types, not declaration files.
 * This describes the slice of its palette API the site uses.
 */
declare module "@larsen-utvikling/create-next-app/palette/index.js" {
  export function generateThemeCss(options: {
    hex: string;
    darkHex?: string;
    preset?: string;
    format?: string;
    scheme?: string;
    overrides?: Record<string, string>;
    darkOverrides?: Record<string, string>;
    append?: string;
  }): string;

  export function isValidHex(hex: string): boolean;
  export function normalizeHex(hex: string): string;
  export function usageIdioms(format: string): { idiom: string; alphaIdiom: string };
  export function tokenRoles(
    preset: string,
    format: string,
  ): Record<string, { name: string; expr: string }>;

  export const PRESETS: Record<string, string>;
  export const FORMATS: Record<string, string>;
  export const SCHEMES: string[];
  export const DEFAULT_THEME: {
    hex: string;
    darkHex: string;
    preset: string;
    format: string;
    scheme: string;
  };
}
