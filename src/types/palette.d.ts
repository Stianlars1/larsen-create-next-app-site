declare module "@larsen-utvikling/create-next-app/palette/index.js" {
  export function generateThemePreview(
    options: import("../lib/palette").PaletteOptions,
  ): import("../lib/palette").GeneratedTheme;
  export function supportedFormats(preset: string): string[];
}

declare module "@larsen-utvikling/create-next-app/palette/seeds.js" {
  export const PREDEFINED_COLOURS: readonly { name: string; hex: string }[];
}
