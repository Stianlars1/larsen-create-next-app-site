import { BentoCard } from "./bento-card";
import {
  DocsVisual,
  MotionVisual,
  NoTailwindVisual,
  PaletteVisual,
  SkillsVisual,
  SpacingVisual,
  TerminalVisual,
  ThemeVisual,
} from "./visuals";
import styles from "./bento-grid.module.css";

const CARDS = [
  {
    title: "One command, every answer has a flag",
    description:
      "Seven prompts, each with a sensible default and a flag that answers it. Run it interactively or unattended in CI.",
    visual: <TerminalVisual />,
    span: "wide" as const,
    href: "#flow",
  },
  {
    title: "A palette from one HEX",
    description:
      "A 12-step accent scale, a 12-step gray scale, semantic colours and both modes - generated from your brand colour at install time.",
    visual: <PaletteVisual />,
    href: "#colour",
  },
  {
    title: "Dark mode without JavaScript",
    description:
      "Follows the OS automatically, with a data-theme attribute for a manual override. No provider, no flash, no hydration.",
    visual: <ThemeVisual />,
    href: "#colour",
  },
  {
    title: "Spacing you can hold in your head",
    description:
      "Eight steps on a 4px base, plus widths, radii, type and layering. The whole structural layer is one small file.",
    visual: <SpacingVisual />,
    href: "#tokens",
  },
  {
    title: "Motion with a reduced-motion contract",
    description:
      "Durations named for what moves, four curves in one place, and reduced motion that keeps feedback while dropping movement.",
    visual: <MotionVisual />,
    span: "wide" as const,
    href: "#motion",
  },
  {
    title: "Docs your agent actually reads",
    description:
      "AGENTS.md with the project rules, CLAUDE.md pointing at it, DESIGN.md with the token reference, and Next.js's own guide preserved.",
    visual: <DocsVisual />,
    href: "#docs",
  },
  {
    title: "Agent skills, installed for you",
    description:
      "Nine skills covering motion, interface craft and accessibility - written into .agents/skills/ where every agent finds them.",
    visual: <SkillsVisual />,
    href: "#skills",
  },
  {
    title: "Never Tailwind",
    description:
      "Not a preference you configure. The scaffolder passes --no-tailwind and the design system replaces what a utility framework would have done.",
    visual: <NoTailwindVisual />,
    href: "#tokens",
  },
];

export function BentoGrid() {
  return (
    <section className="section" id="features">
      <div className="page">
        <p className="eyebrow">What you get</p>
        <h2 className="sectionTitle">Everything below is in the box</h2>
        <p className="sectionLead">
          No starter kit to assemble afterwards. The first commit is a finished project.
        </p>

        <div className={styles.grid}>
          {CARDS.map((card, index) => (
            <BentoCard key={card.title} {...card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
