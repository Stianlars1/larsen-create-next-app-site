/**
 * Single source of truth for everything the package does.
 *
 * The page renders from this file, so a capability cannot be shipped in the
 * CLI and quietly missing from the site. When the CLI gains a prompt, a flag
 * or a token, it gets added here first.
 */

export const PACKAGE_NAME = "@larsen-utvikling/create-next-app";
export const REPO_URL = "https://github.com/Stianlars1/larsen-create-next-app";
export const NPM_URL = "https://www.npmjs.com/package/@larsen-utvikling/create-next-app";
export const SKILLS_URL = "https://github.com/Stianlars1/larsen-skills";
export const AUTHOR_URL = "https://www.larsenutvikling.no";

export const INSTALL_COMMAND = `npx ${PACKAGE_NAME} my-app`;

/* ------------------------------------------------------------------ *
 * The interactive flow - every prompt, in the order the CLI asks them
 * ------------------------------------------------------------------ */

export type PromptChoice = {
  label: string;
  hint?: string;
  /** Marks the value used when you press enter through the flow. */
  isDefault?: boolean;
};

export type PromptStep = {
  id: string;
  /** Exactly as the CLI phrases it. */
  question: string;
  choices: PromptChoice[];
  /** The flag that answers this prompt without a terminal. */
  flag: string;
  /** One line on why the question exists at all. */
  why: string;
  /** Follow-up questions, only asked when this answer opens them. */
  followUps?: PromptStep[];
};

export const PROMPT_STEPS: PromptStep[] = [
  {
    id: "name",
    question: "What is your app named?",
    choices: [{ label: "my-app", hint: "lowercase, digits, . _ -", isDefault: true }],
    flag: "pass the name as an argument",
    why: "Becomes both the folder and the name in package.json, so it is checked for the characters those allow - and refuses a directory that already has files in it.",
  },
  {
    id: "palette",
    question: "Generate a custom 12-step palette from a single HEX?",
    choices: [
      { label: "No", hint: "ship the Larsen Utvikling theme", isDefault: true },
      { label: "Yes", hint: "generate from your brand color" },
    ],
    flag: "--hex <color> · omit it for the default theme",
    why: "Say no and you get a considered black-and-white theme with a blue accent. Say yes and three follow-up questions shape the whole palette.",
    followUps: [
      {
        id: "hex",
        question: "Enter your HEX color",
        choices: [{ label: "#4DA0FF", hint: "with or without the #" }],
        flag: "--hex 4DA0FF",
        why: "One color in. A 12-step accent scale, a 12-step gray scale, semantic colors and both modes out.",
      },
      {
        id: "preset",
        question: "Choose framework/style",
        choices: [
          { label: "shadcn/ui", hint: "semantic tokens + scales", isDefault: true },
          { label: "Radix Colors", hint: "accent + gray scales" },
          { label: "CSS Variables", hint: "accent + gray scales" },
        ],
        flag: "--preset shadcn | radix | css-variables",
        why: "Decides which token names exist - and the generated docs and starter CSS are rewritten to match.",
      },
      {
        id: "format",
        question: "Choose color format",
        choices: [
          { label: "HSL Values", hint: "212 100% 65%", isDefault: true },
          { label: "HEX" },
          { label: "RGB" },
          { label: "HSL" },
          { label: "OKLAB" },
          { label: "OKLCH" },
        ],
        flag: "--format hsl-values | hex | rgb | hsl | oklab | oklch",
        why: "HSL values keep alpha composition available. Any other format and the docs switch to the color-mix idiom instead.",
      },
    ],
  },
  {
    id: "linter",
    question: "Which linter?",
    choices: [
      { label: "ESLint", isDefault: true },
      { label: "Biome" },
      { label: "None" },
    ],
    flag: "--linter eslint | biome | none",
    why: "Passed straight through to create-next-app, so you get its official configuration for whichever you pick.",
  },
  {
    id: "skills",
    question: "Install Larsen Skills for AI agents?",
    choices: [
      { label: "Recommended", hint: "motion, interface, review, primitives", isDefault: true },
      { label: "All", hint: "9 skills" },
      { label: "Let me pick", hint: "multi-select" },
      { label: "No" },
    ],
    flag: "--skills recommended | all | a,comma,list  ·  --no-skills",
    why: "Installs into .agents/skills/ and symlinks each agent's own directory, so Claude Code, Codex, Cursor and Copilot all see them.",
  },
  {
    id: "pm",
    question: "Which package manager?",
    choices: [
      { label: "npm", isDefault: true },
      { label: "pnpm" },
      { label: "yarn" },
      { label: "bun" },
    ],
    flag: "--pm npm | pnpm | yarn | bun",
    why: "Runs the install and rewrites the generated README so every command shown is the one you actually type.",
  },
  {
    id: "git",
    question: "Initialize a git repository?",
    choices: [
      { label: "Yes", hint: "init, add, first commit", isDefault: true },
      { label: "No" },
    ],
    flag: "--no-git",
    why: "Commits everything after the overlay, so your first commit is the finished project rather than a bare template.",
  },
  {
    id: "install",
    question: "Install dependencies?",
    choices: [
      { label: "Yes", isDefault: true },
      { label: "No" },
    ],
    flag: "--no-install",
    why: "A missing package manager never fails the scaffold - you get the finished app and the command to finish it yourself.",
  },
];

/* ------------------------------------------------------------------ *
 * Flags - the whole non-interactive surface
 * ------------------------------------------------------------------ */

export const FLAGS: { flag: string; description: string }[] = [
  { flag: "-d, --defaults", description: "Skip every prompt and take the defaults" },
  { flag: "--hex <color>", description: "Palette seed, with or without the #. Implies a custom palette" },
  { flag: "--preset <name>", description: "shadcn | radix | css-variables" },
  { flag: "--format <name>", description: "hex | rgb | hsl | hsl-values | oklab | oklch" },
  { flag: "--scheme <name>", description: "analogous | monochromatic | complementary | triadic" },
  { flag: "--linter <name>", description: "eslint | biome | none" },
  { flag: "--skills <list>", description: "recommended | all | comma-separated skill names" },
  { flag: "--no-skills", description: "Skip the skills install" },
  { flag: "--pm <name>", description: "npm | pnpm | yarn | bun" },
  { flag: "--no-git", description: "Skip git init" },
  { flag: "--no-install", description: "Skip the dependency install" },
  { flag: "--cna-version <spec>", description: "Pin create-next-app instead of taking the newest" },
  { flag: "-v, --version", description: "Print the version" },
  { flag: "-h, --help", description: "Show help" },
];

/* ------------------------------------------------------------------ *
 * The design system - every file and what is inside it
 * ------------------------------------------------------------------ */

export const DESIGN_SYSTEM_FILES = [
  {
    file: "index.css",
    role: "The single entry point. Your globals.css imports this one line and nothing else.",
    tokens: [],
  },
  {
    file: "core.css",
    role: "Structure: everything that is not color and not motion.",
    tokens: [
      { group: "Spacing", detail: "8 steps on a 4px base - 4, 8, 12, 16, 24, 32, 48, 64px, in rem" },
      { group: "Widths", detail: "--width-prose 65ch, --width-content 48rem, --width-wide 80rem" },
      { group: "Radii", detail: "sm 4px, md 8px, lg 16px, full pill" },
      { group: "Type", detail: "unitless leading (1.1 / 1.4 / 1.5) and tracking (-0.025em / 0 / 0.05em)" },
      { group: "Layering", detail: "dropdown 100, sticky 200, overlay 300, modal 400, toast 500" },
    ],
  },
  {
    file: "theme.css",
    role: "Color, generated for your seed. Light and dark, plus the document defaults.",
    tokens: [
      { group: "Semantic", detail: "background, foreground, primary, secondary, muted, accent, border, input, ring" },
      { group: "Scales", detail: "--accent-1..12 and --gray-1..12" },
      { group: "Status", detail: "success, danger, warning, info - each with foreground, muted and border variants" },
      { group: "Harmony", detail: "analogous and complementary, derived from your seed" },
    ],
  },
  {
    file: "motion.css",
    role: "Durations, curves and gesture values - plus the reduced-motion contract.",
    tokens: [
      { group: "Durations", detail: "press 140ms, fast 160ms, ui 200ms, slow 240ms, enter 300ms" },
      { group: "Curves", detail: "ease-out, ease-in-out, ease-drawer, ease-soft" },
      { group: "Gesture", detail: "press scales, enter scale/distance/blur, stagger delays" },
    ],
  },
  {
    file: "base.css",
    role: "A modern reset. Deliberately color-free, so it works with every palette you pick.",
    tokens: [],
  },
];

/* ------------------------------------------------------------------ *
 * Docs written into every project
 * ------------------------------------------------------------------ */

export const DOC_FILES = [
  {
    file: "AGENTS.md",
    role: "The project rules every coding agent reads",
    detail: "Never Tailwind, the token idiom for your chosen palette, the motion rules, and the writing conventions.",
  },
  {
    file: "CLAUDE.md",
    role: "A one-line pointer",
    detail: "Contains @AGENTS.md and nothing else, so there is one set of rules rather than two that drift.",
  },
  {
    file: "DESIGN.md",
    role: "The token reference",
    detail: "Every scale, the semantic role of each token for your preset, and the exact usage idiom for your format.",
  },
  {
    file: "NEXTJS.md",
    role: "Next.js's own agent guide, preserved",
    detail: "create-next-app writes an AGENTS.md of framework guidance - it is kept under a new name instead of overwritten.",
  },
  {
    file: "README.md",
    role: "Getting started, with a post-scaffold checklist",
    detail: "Commands for your package manager, the folder map, and the things only you can do - favicon, metadata, OG image.",
  },
];

/* ------------------------------------------------------------------ *
 * Larsen Skills
 * ------------------------------------------------------------------ */

export const SKILLS = [
  { name: "motion-craft", blurb: "Durations, curves, reduced motion", recommended: true },
  { name: "interface-craft", blurb: "Layout, hierarchy, spacing, type", recommended: true },
  { name: "interface-review", blurb: "Review a screen against the rules", recommended: true },
  { name: "ui-primitive-picker", blurb: "The right primitive for a pattern", recommended: true },
  { name: "motion-vocabulary", blurb: "Name an effect you can describe" },
  { name: "liquid-interface", blurb: "Glass and refraction effects" },
  { name: "prototype-lab", blurb: "Throwaway interaction prototypes" },
  { name: "reverse-engineer-motion", blurb: "Rebuild motion from a video" },
  { name: "animated-logo-cycle", blurb: "Animated brand marks" },
];

/* ------------------------------------------------------------------ *
 * What lands on disk
 * ------------------------------------------------------------------ */

export const PROJECT_TREE = `my-app/
├── AGENTS.md          project rules for agents
├── CLAUDE.md          → @AGENTS.md
├── DESIGN.md          token reference
├── NEXTJS.md          Next.js agent guide, preserved
├── README.md          getting started + checklist
├── .agents/skills/    installed Larsen Skills
├── public/
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css    one import line
    │   ├── page.tsx       welcome page, yours to replace
    │   └── page.css
    └── lib/design-system/
        ├── index.css
        ├── core.css       spacing · widths · radii · type · z
        ├── theme.css      color, light + dark
        ├── motion.css     durations · curves · reduced motion
        └── base.css       reset`;
