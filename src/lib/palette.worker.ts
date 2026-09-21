import { generateThemePreview } from "@larsen-utvikling/create-next-app/palette/index.js";
import type { PaletteOptions } from "./palette";
self.onmessage = ({
  data,
}: MessageEvent<{ id: number; options: PaletteOptions }>) => {
  try {
    self.postMessage({
      id: data.id,
      result: generateThemePreview(data.options),
    });
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
