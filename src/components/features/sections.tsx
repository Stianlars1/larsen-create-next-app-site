import { FeatureSection } from "./feature-section";
import { PaletteDemo } from "@/components/demo/palette-demo";
import { CodeBlock } from "@/components/ui/code-block";
import { generate } from "@/lib/palette";
import {
  DESIGN_SYSTEM_FILES,
  DOC_FILES,
  FLAGS,
  PROJECT_TREE,
  SKILLS,
  SKILLS_URL,
} from "@/lib/content";
import styles from "./sections.module.css";

/* ------------------------------------------------------------------ *
 * Colour
 * ------------------------------------------------------------------ */

const DEFAULT_SEED = "#4DA0FF";

export async function ColourSection() {
  // Generated at build time so the page paints a real palette without
  // shipping the engine until a visitor changes something.
  const initialTheme = await generate({
    hex: DEFAULT_SEED,
    preset: "shadcn",
    format: "hsl-values",
    scheme: "analogous",
  });

  return (
    <FeatureSection
      id="colour"
      eyebrow="Colour"
      title="A whole theme from one HEX"
      lead="The same generator that runs during install runs here. Type a colour and you are looking at exactly what the CLI would write to theme.css - light, dark, and every scale in between."
    >
      <PaletteDemo initialTheme={initialTheme} initialHex={DEFAULT_SEED} />

      <div className={styles.notes}>
        <article>
          <h3>Both modes, no JavaScript</h3>
          <p>
            Dark follows <code>prefers-color-scheme</code>, and a{" "}
            <code>data-theme</code> attribute on <code>&lt;html&gt;</code> overrides it when
            someone wants to choose. No provider, no flash of the wrong theme, no hydration
            cost.
          </p>
        </article>
        <article>
          <h3>Contrast that survives dark mode</h3>
          <p>
            A near-black or near-white seed used to leave buttons and focus rings invisible
            in one of the two modes. Each mode is now generated from the seed that works in
            it, and a contrast check runs before every release.
          </p>
        </article>
        <article>
          <h3>Your choice defines the tokens</h3>
          <p>
            Pick a preset and format and the generated docs, the starter CSS and the usage
            idiom are all rewritten to match. There is no translation layer inventing names
            the generator never produced.
          </p>
        </article>
      </div>
    </FeatureSection>
  );
}

/* ------------------------------------------------------------------ *
 * Tokens
 * ------------------------------------------------------------------ */

export function TokensSection() {
  return (
    <FeatureSection
      id="tokens"
      eyebrow="The design system"
      title="Five files, and you have read all of them"
      lead="Small enough to hold in your head, complete enough that you are not inventing spacing values on day three."
      tinted
    >
      <div className={styles.files}>
        {DESIGN_SYSTEM_FILES.map((entry) => (
          <article key={entry.file} className={styles.file}>
            <h3>
              <code>{entry.file}</code>
            </h3>
            <p className={styles.fileRole}>{entry.role}</p>
            {entry.tokens.length > 0 && (
              <dl className={styles.tokenList}>
                {entry.tokens.map((token) => (
                  <div key={token.group}>
                    <dt>{token.group}</dt>
                    <dd>{token.detail}</dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        ))}
      </div>

      <div className={styles.split}>
        <div>
          <h3 className={styles.subhead}>Your globals.css stays one line</h3>
          <p className={styles.prose}>
            Everything is reachable through a single import, so the design system is one
            thing you can replace, version or delete - not thirty imports scattered across a
            codebase.
          </p>
        </div>
        <CodeBlock
          label="src/app/globals.css"
          code={'@import "../lib/design-system/index.css";'}
        />
      </div>
    </FeatureSection>
  );
}

/* ------------------------------------------------------------------ *
 * Motion
 * ------------------------------------------------------------------ */

const REDUCED_MOTION_CSS = `@media (prefers-reduced-motion: reduce) {
  :root {
    --enter-distance: 0px;
    --enter-blur: 0px;
    --enter-scale: 1;
    --press-scale: 1;
    --stagger-item: 0ms;
    --stagger-group: 0ms;
  }
}`;

export function MotionSection() {
  return (
    <FeatureSection
      id="motion"
      eyebrow="Motion"
      title="Durations named for what moves"
      lead="Most starters ship no motion layer, so every project invents its own curves. These values come from the motion-craft skill and are the ones larsenutvikling.no already runs."
    >
      <div className={styles.split}>
        <div>
          <h3 className={styles.subhead}>Reduced motion means gentler, not absent</h3>
          <p className={styles.prose}>
            The usual blanket rule kills every animation, including the spinners and progress
            indicators that people rely on. This collapses the distance, scale and stagger
            tokens instead: transitions keep running, movement stops. Continuous decoration
            opts out with <code>data-motion=&quot;decorative&quot;</code>.
          </p>
          <ul className={styles.bullets}>
            <li>UI motion stays under 300ms - a 180ms menu reads as more responsive than a 400ms one</li>
            <li>Four curves in one file, so five near-identical hand-typed beziers cannot drift apart</li>
            <li>Entrances never start from <code>scale(0)</code> - nothing in the world appears from nothing</li>
            <li>Hover motion is gated behind <code>(hover: hover)</code>, because touch fires hover on tap</li>
          </ul>
        </div>
        <CodeBlock label="src/lib/design-system/motion.css" code={REDUCED_MOTION_CSS} />
      </div>
    </FeatureSection>
  );
}

/* ------------------------------------------------------------------ *
 * Docs
 * ------------------------------------------------------------------ */

export function DocsSection() {
  return (
    <FeatureSection
      id="docs"
      eyebrow="Agent docs"
      title="The rules your agent reads before it writes"
      lead="An agent that does not know your conventions invents them. These files ship with every project so the first suggestion already matches the codebase."
      tinted
    >
      <div className={styles.docs}>
        {DOC_FILES.map((doc) => (
          <article key={doc.file} className={styles.doc}>
            <code className={styles.docName}>{doc.file}</code>
            <h3>{doc.role}</h3>
            <p>{doc.detail}</p>
          </article>
        ))}
      </div>

      <p className={styles.footnote}>
        AGENTS.md is the emerging standard - Codex, Cursor, Copilot and Gemini all read it.
        CLAUDE.md points at the same file rather than duplicating it, because two sets of
        rules always drift.
      </p>
    </FeatureSection>
  );
}

/* ------------------------------------------------------------------ *
 * Skills
 * ------------------------------------------------------------------ */

export function SkillsSection() {
  return (
    <FeatureSection
      id="skills"
      eyebrow="Agent skills"
      title="Nine skills, installed into the project"
      lead="Optional, and off by default when you run unattended. Say yes and they land in .agents/skills/ with symlinks into each agent's own directory - one install covers Claude Code, Codex, Cursor, Copilot and Gemini CLI."
    >
      <ul className={styles.skills}>
        {SKILLS.map((skill) => (
          <li key={skill.name} data-recommended={skill.recommended ? "true" : undefined}>
            <code>{skill.name}</code>
            <span>{skill.blurb}</span>
            {skill.recommended && <em>recommended</em>}
          </li>
        ))}
      </ul>

      <p className={styles.footnote}>
        The design system&apos;s motion values come from <code>motion-craft</code>, so the tokens
        and the guidance agree on the same numbers. Browse them at{" "}
        <a href={SKILLS_URL}>github.com/Stianlars1/larsen-skills</a>.
      </p>
    </FeatureSection>
  );
}

/* ------------------------------------------------------------------ *
 * CLI / CI
 * ------------------------------------------------------------------ */

export function CliSection() {
  return (
    <FeatureSection
      id="cli"
      eyebrow="Unattended"
      title="Every prompt has a flag"
      lead="Without a terminal the CLI fails immediately and names the flag that answers the question, instead of hanging on a prompt nobody can see."
      tinted
    >
      <div className={styles.split}>
        <table className={styles.flags}>
          <thead>
            <tr>
              <th scope="col">Flag</th>
              <th scope="col">What it does</th>
            </tr>
          </thead>
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

        <div className={styles.stack}>
          <CodeBlock
            label="Fully unattended"
            copyable
            code={"npx @larsen-utvikling/create-next-app my-app --defaults"}
          />
          <CodeBlock
            label="Your colour, your tools"
            copyable
            code={
              "npx @larsen-utvikling/create-next-app my-app \\\n  --hex 22C55E --preset shadcn \\\n  --pm pnpm --linter biome \\\n  --skills recommended"
            }
          />
          <p className={styles.prose}>
            A missing package manager never fails the scaffold - the app is finished either
            way and you get the command to install it yourself.
          </p>
        </div>
      </div>
    </FeatureSection>
  );
}

/* ------------------------------------------------------------------ *
 * What lands on disk
 * ------------------------------------------------------------------ */

export function TreeSection() {
  return (
    <FeatureSection
      id="tree"
      eyebrow="On disk"
      title="What the first commit contains"
      lead="Newest stable Next.js, TypeScript, App Router and a src directory - then everything the template adds on top."
    >
      <div className={styles.split}>
        <CodeBlock label="my-app" code={PROJECT_TREE} />
        <div className={styles.stack}>
          <h3 className={styles.subhead}>Nothing to clean up first</h3>
          <p className={styles.prose}>
            The default welcome page is replaced with one that demonstrates the tokens, the
            unused module CSS and branding assets are removed, and git is initialised with a
            single commit containing the finished project.
          </p>
          <ul className={styles.bullets}>
            <li>Next.js is resolved at scaffold time, so the version is never stale</li>
            <li>The import alias is <code>@/*</code>, matching Next.js&apos;s own default</li>
            <li>Next.js&apos;s generated agent guide is preserved rather than overwritten</li>
            <li>The README carries a checklist of the things only you can do</li>
          </ul>
        </div>
      </div>
    </FeatureSection>
  );
}
