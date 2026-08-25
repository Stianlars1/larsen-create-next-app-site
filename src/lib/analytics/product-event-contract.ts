export const PRODUCT_EVENT_NAMES = [
  "palette_generator_used",
  "command_builder_used",
  "command_copied",
  "theme_css_copied",
  "npm_link_clicked",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type CommandBuilderControl =
  | "app_name"
  | "palette"
  | "seed_hex"
  | "preset"
  | "format"
  | "neutral_tint"
  | "linter"
  | "package_manager"
  | "skills"
  | "git"
  | "install"
  | "cna_version";

export type CommandCopySurface =
  | "hero"
  | "palette_demo"
  | "command_builder"
  | "cli_examples"
  | "footer";

export type ProductEvent =
  | {
      name: "palette_generator_used";
      data: {
        surface: "palette_demo" | "command_builder";
        preset: "shadcn" | "radix" | "css-variables";
        format: "hex" | "rgb" | "hsl" | "hsl-values" | "oklab" | "oklch";
        neutral_tint: "subtle" | "strong";
      };
    }
  | { name: "command_builder_used"; data: { control: CommandBuilderControl } }
  | { name: "command_copied"; data: { surface: CommandCopySurface } }
  | { name: "theme_css_copied"; data: { surface: "palette_demo" } }
  | { name: "npm_link_clicked"; data: { surface: "hero" | "footer" } };

const commandBuilderControls = new Set<CommandBuilderControl>([
  "app_name",
  "palette",
  "seed_hex",
  "preset",
  "format",
  "neutral_tint",
  "linter",
  "package_manager",
  "skills",
  "git",
  "install",
  "cna_version",
]);

const commandCopySurfaces = new Set<CommandCopySurface>([
  "hero",
  "palette_demo",
  "command_builder",
  "cli_examples",
  "footer",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

export function isProductEvent(value: unknown): value is ProductEvent {
  if (!isRecord(value) || typeof value.name !== "string" || !isRecord(value.data)) return false;

  switch (value.name) {
    case "palette_generator_used":
      return (
        hasOnlyKeys(value.data, ["surface", "preset", "format", "neutral_tint"]) &&
        (value.data.surface === "palette_demo" || value.data.surface === "command_builder") &&
        ["shadcn", "radix", "css-variables"].includes(String(value.data.preset)) &&
        ["hex", "rgb", "hsl", "hsl-values", "oklab", "oklch"].includes(
          String(value.data.format),
        ) &&
        ["subtle", "strong"].includes(String(value.data.neutral_tint))
      );
    case "command_builder_used":
      return (
        hasOnlyKeys(value.data, ["control"]) &&
        typeof value.data.control === "string" &&
        commandBuilderControls.has(value.data.control as CommandBuilderControl)
      );
    case "command_copied":
      return (
        hasOnlyKeys(value.data, ["surface"]) &&
        typeof value.data.surface === "string" &&
        commandCopySurfaces.has(value.data.surface as CommandCopySurface)
      );
    case "theme_css_copied":
      return hasOnlyKeys(value.data, ["surface"]) && value.data.surface === "palette_demo";
    case "npm_link_clicked":
      return (
        hasOnlyKeys(value.data, ["surface"]) &&
        (value.data.surface === "hero" || value.data.surface === "footer")
      );
    default:
      return false;
  }
}
