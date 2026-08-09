import { FeatureBlock } from "@/components/layout/feature-block";
import { PaletteDemo } from "@/components/demo/palette-demo";
import { TokenSpecimen } from "@/components/surfaces/token-specimen";
import { MotionSurface, SkillsSurface, ThemeSurface } from "@/components/surfaces/misc";
import { CodeBlock } from "@/components/ui/code-block";
import { generate } from "@/lib/palette";
import { FLAGS, PROJECT_TREE, SKILLS_URL } from "@/lib/content";
import styles from "./sections.module.css";

const DEFAULT_SEED = "#4DA0FF";

/* ------------------------------------------------------------------ *
 * Colour - the palette demo, as one block among several
 * ------------------------------------------------------------------ */

export async function ColourSection() {
  // Generated on the server at build, so the page paints a real palette
  // before the engine has been fetched at all.
  const initialTheme = await generate({
    hex: DEFAULT_SEED,
    preset: "shadcn",
    format: "hsl-values",
    scheme: "analogous",
  });

  return (
    <div className="page">
      <FeatureBlock
        id="colour"
        label="Colour"
        headline="One HEX in. A whole theme out."
        lead="The generator that runs during install runs here too, imported from the published package - so what you make is byte-for-byte what npx writes."
        visual={<PaletteDemo initialTheme={initialTheme} initialHex={DEFAULT_SEED} />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dark mode
 * ------------------------------------------------------------------ */

export function ThemeSection() {
  return (
    <div className="page">
      <FeatureBlock
        label="Dark mode"
        headline="Both modes, zero JavaScript"
        lead="Follows the OS, with an attribute for a manual override. No provider, no flash, no hydration cost."
        layout="side"
        points={[
          { term: "Auto", detail: "prefers-color-scheme, straight from the stylesheet" },
          { term: "Manual", detail: 'data-theme="light | dark" on <html> wins over it' },
          { term: "Contrast", detail: "checked in the test suite before every release" },
        ]}
        visual={<ThemeSurface />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tokens
 * ------------------------------------------------------------------ */

export function TokensSection() {
  return (
    <div className="page">
      <FeatureBlock
        id="tokens"
        label="The design system"
        headline="Five files. You have read all of them."
        lead="Small enough to hold in your head, complete enough that you are not inventing spacing values on day three."
        visual={<TokenSpecimen />}
        points={[
          { term: "core.css", detail: "Spacing, widths, radii, type, layering" },
          { term: "theme.css", detail: "Colour for both modes, generated for your seed" },
          { term: "motion.css", detail: "Durations, curves, and the reduced-motion contract" },
          { term: "base.css", detail: "A reset, deliberately colour-free" },
          { term: "index.css", detail: "The single import your globals.css needs" },
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Motion
 * ------------------------------------------------------------------ */

export function MotionSection() {
  return (
    <div className="page">
      <FeatureBlock
        id="motion"
        label="Motion"
        headline="Durations named for what moves"
        lead="Most starters ship no motion layer, so every project invents its own curves. These are the values larsenutvikling.no already runs."
        layout="side"
        flip
        points={[
          {
            term: "Under 300ms",
            detail:
              "For anything answering a click or a hover - a 180ms menu reads as more responsive than a 400ms one",
          },
          { term: "Four curves", detail: "In one file, so near-identical beziers cannot drift apart" },
          { term: "Reduced motion", detail: "Distance and scale collapse; transitions keep running" },
        ]}
        visual={<MotionSurface />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Skills
 * ------------------------------------------------------------------ */

export function SkillsSection() {
  return (
    <div className="page">
      <FeatureBlock
        id="skills"
        label="Agent skills"
        headline="Nine skills, installed into the project"
        lead="Optional, and never installed on an unattended --defaults run. Each requested skill is verified on disk in .agents/skills/ - the project docs list only what actually landed."
        visual={<SkillsSurface />}
        points={[
          { term: "Recommended four", detail: "motion, interface, review and primitives - the ones that pair with the design system" },
          { term: "Browse them", detail: "github.com/Stianlars1/larsen-skills" },
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Unattended
 * ------------------------------------------------------------------ */

export function CliSection() {
  return (
    <div className="page">
      <FeatureBlock
        id="cli"
        label="Unattended"
        headline="It runs in CI, or tells you why it cannot"
        lead="Without a terminal the CLI fails immediately and names the flag that answers the question, instead of hanging on a prompt nobody can see."
        visual={
          <div className={styles.cliVisual}>
            <CodeBlock
              label="Everything default"
              copyable
              language="shell"
              code={"npx @larsen-utvikling/create-next-app my-app --defaults"}
            />
            <CodeBlock
              label="Your colour, your tools"
              copyable
              language="shell"
              code={
                "npx @larsen-utvikling/create-next-app my-app \\\n  --hex 22C55E --preset shadcn \\\n  --pm pnpm --linter biome \\\n  --skills recommended"
              }
            />
          </div>
        }
      />

      <table className={styles.flags}>
        <caption className="label">Every flag</caption>
        <tbody>
          {FLAGS.map((flag) => (
            <tr key={flag.flag}>
              <th scope="row">
                <code>{flag.flag}</code>
              </th>
              <td>{flag.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * What lands on disk
 * ------------------------------------------------------------------ */

export function TreeSection() {
  return (
    <div className="page">
      <FeatureBlock
        id="tree"
        label="On disk"
        headline="What the first commit contains"
        lead="Nothing to clean up first. The demo page is replaced, the unused assets are gone, and git is initialised with the finished project."
        layout="side"
        visual={<CodeBlock label="my-app" code={PROJECT_TREE} language="tree" />}
        points={[
          { term: "Next.js", detail: "Resolved at scaffold time, so the version is never stale" },
          { term: "Import alias", detail: "@/* - the same default Next.js uses" },
          { term: "NEXTJS.md", detail: "Next.js's own agent guide, preserved rather than overwritten" },
          { term: "README", detail: "Carries a checklist of the things only you can do" },
        ]}
      />
      <p className={styles.footnote}>
        Skills live in <code>.agents/skills/</code> - see{" "}
        <a href={SKILLS_URL}>the collection</a>.
      </p>
    </div>
  );
}
