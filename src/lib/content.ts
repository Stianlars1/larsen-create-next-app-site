/**
 * Single source of truth for everything the package does.
 *
 * The page renders from this file, so a capability cannot be shipped in the
 * CLI and quietly missing from the site. When the CLI gains a prompt, a flag
 * or a token, it gets added here first.
 */

export const PACKAGE_NAME = "@larsen-utvikling/create-next-app";
export const PACKAGE_VERSION = "0.5.1";
export const PACKAGE_EXEC = `npx --yes ${PACKAGE_NAME}@${PACKAGE_VERSION}`;
export const REPO_URL = "https://github.com/Stianlars1/larsen-create-next-app";
export const NPM_URL = "https://www.npmjs.com/package/@larsen-utvikling/create-next-app";
export const SKILLS_URL = "https://github.com/Stianlars1/larsen-skills";
export const EMIL_SKILLS_URL = "https://github.com/emilkowalski/skills";
export const KREHEL_SKILLS_URL = "https://github.com/jakubkrehel/skills";
export const TRANSITIONS_SKILL_URL =
  "https://github.com/Jakubantalik/transitions.dev/tree/main/skills/transitions-dev";
export const TRANSITIONS_TERMS_URL = "https://transitions.dev/terms.html";
export const AUTHOR_URL = "https://www.larsenutvikling.no";

export const INSTALL_COMMAND = `${PACKAGE_EXEC} my-app`;

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
    why: "Becomes both the folder and the name in package.json. Checked against this package's own rule - lowercase letters, digits, '.', '_', '-', max 214 characters - and refuses a directory that already has files in it.",
  },
  {
    id: "palette",
    question: "Generate a custom 12-step palette from a single HEX?",
    choices: [
      { label: "No", hint: "ship the Larsen Utvikling theme", isDefault: true },
      { label: "Yes", hint: "generate from your brand color" },
    ],
    flag: "--hex <color> · --default-palette for the default",
    why: "Say no and you get a considered black-and-white theme with a blue accent. Say yes and four follow-up questions shape the palette.",
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
          { label: "shadcn/ui", hint: "approved semantic token names + Larsen scales", isDefault: true },
          { label: "Radix Themes custom-palette tokens", hint: "57 override names + 26 Larsen tokens" },
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
      {
        id: "neutral-tint",
        question: "Choose neutral tint",
        choices: [
          { label: "Subtle", hint: "the standard gray ramp (recommended)", isDefault: true },
          { label: "Strong", hint: "more seed hue in the grays; chromatic accent scale unchanged" },
        ],
        flag: "--neutral-tint subtle | strong",
        why: "How much of your colour bleeds into the neutrals. It moves the gray ramp and what is built on it. Chromatic accent scales stay unchanged; #000000, #010101, #FEFEFE and #FFFFFF are hueless exceptions whose accent scales also move. Subtle needs no flag.",
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
    id: "skills",
    question: "Install agent skills for AI agents (UI, motion, accessibility, transitions)?",
    choices: [
      { label: "Yes", isDefault: true },
      { label: "No" },
    ],
    flag: "--skills recommended | all | a,comma,list  ·  --no-skills",
    why: "Groups requested skills by their authors' repositories, installs each source independently, then verifies every requested SKILL.md on disk - only skills that actually landed are documented in the project.",
    followUps: [
      {
        id: "skills-which",
        question: "Which skills?",
        choices: [
          { label: "Recommended", hint: "motion-craft, interface-craft, interface-review, ui-primitive-picker", isDefault: true },
          { label: "All Larsen Skills", hint: "9 skills" },
          { label: "Let me pick", hint: "space to toggle, enter to confirm" },
        ],
        flag: "--skills recommended | all | a,comma,list",
        why: "Recommended and All keep their Larsen-only meanings. Let me pick also offers Jakub Antalik's transitions-dev as a direct third-party opt-in.",
      },
    ],
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
  { flag: "-d, --defaults", description: "Skip every prompt and take the defaults - installs no skills" },
  { flag: "--default-palette", description: "Answer No to a custom palette and ship the default theme" },
  { flag: "--hex <color>", description: "Palette seed, with or without the #. Implies a custom palette" },
  { flag: "--preset <name>", description: "shadcn | radix | css-variables" },
  { flag: "--format <name>", description: "hex | rgb | hsl | hsl-values | oklab | oklch" },
  { flag: "--neutral-tint <name>", description: "subtle | strong - affects the gray ramp, defaults to subtle" },
  { flag: "--linter <name>", description: "eslint | biome | none" },
  { flag: "--pm <name>", description: "npm | pnpm | yarn | bun" },
  { flag: "--skills <list>", description: "recommended | all Larsen | comma-separated skill names" },
  { flag: "--no-skills", description: "Skip agent skill installs" },
  { flag: "--git / --no-git", description: "Initialize a git repository, or skip it" },
  { flag: "--install / --no-install", description: "Install dependencies, or skip it" },
  { flag: "--cna-version <spec>", description: "Select the create-next-app version spec instead of latest" },
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
      { group: "Status", detail: "success, danger, warning, info - each with foreground, muted, muted-foreground and border variants" },
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
    detail: "When create-next-app writes an AGENTS.md of framework guidance, it is kept under this name instead of overwritten - and never invented when upstream ships none.",
  },
  {
    file: "README.md",
    role: "Getting started, with a post-scaffold checklist",
    detail: "Commands for your package manager, the folder map, and the things only you can do - favicon, metadata, OG image.",
  },
];

/* ------------------------------------------------------------------ *
 * Agent skills
 * ------------------------------------------------------------------ */

export type AgentSkill = {
  name: string;
  blurb: string;
  source: "larsen" | "third-party";
  recommended?: boolean;
};

export const LARSEN_SKILLS: AgentSkill[] = [
  { name: "motion-craft", blurb: "Durations, curves, reduced motion", recommended: true, source: "larsen" },
  { name: "interface-craft", blurb: "Layout, hierarchy, spacing, type", recommended: true, source: "larsen" },
  { name: "interface-review", blurb: "Review a screen against the rules", recommended: true, source: "larsen" },
  { name: "ui-primitive-picker", blurb: "The right primitive for a pattern", recommended: true, source: "larsen" },
  { name: "motion-vocabulary", blurb: "Name an effect you can describe", source: "larsen" },
  { name: "liquid-interface", blurb: "Glass and refraction effects", source: "larsen" },
  { name: "prototype-lab", blurb: "Throwaway interaction prototypes", source: "larsen" },
  { name: "reverse-engineer-motion", blurb: "Rebuild motion from a video", source: "larsen" },
  { name: "animated-logo-cycle", blurb: "Animated brand marks", source: "larsen" },
];

export const THIRD_PARTY_SKILLS: AgentSkill[] = [
  {
    name: "transitions-dev",
    blurb: "UI transition library by Jakub Antalik",
    source: "third-party",
  },
];

export const SKILLS = [...LARSEN_SKILLS, ...THIRD_PARTY_SKILLS];

/* ------------------------------------------------------------------ *
 * What lands on disk
 * ------------------------------------------------------------------ */

export const PROJECT_TREE = `my-app/
├── AGENTS.md          project rules for agents
├── CLAUDE.md          → @AGENTS.md
├── DESIGN.md          token reference
├── NEXTJS.md          Next.js agent guide, preserved
├── README.md          getting started + checklist
├── .agents/skills/    agent skills, when you opt in
├── public/
│   └── larsen-utvikling/   logo SVGs, light + dark
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
