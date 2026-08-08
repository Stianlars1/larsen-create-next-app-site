import { CopyCommandButton } from "@/components/ui/copy-command-button";
import { INSTALL_COMMAND, NPM_URL, REPO_URL } from "@/lib/content";
import styles from "./hero.module.css";

/** Fetched at build and revalidated hourly, so the claim stays honest. */
async function getNextVersion(): Promise<string | null> {
  try {
    const res = await fetch("https://registry.npmjs.org/next/latest", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

export async function Hero() {
  const nextVersion = await getNextVersion();

  return (
    <header className={styles.hero}>
      <div className={`page ${styles.inner}`}>
        <p className={styles.eyebrow}>@larsen-utvikling/create-next-app</p>

        <h1 className={styles.title}>
          A Next.js starter with a <em>real</em> design system
        </h1>

        <p className={styles.lead}>
          One command scaffolds the newest Next.js, then replaces the blank slate with
          spacing, type, color and motion tokens, docs your coding agent actually reads,
          and a colour palette generated from a single HEX. No Tailwind. No CSS framework.
        </p>

        <div className={styles.commandRow}>
          <code className={styles.command}>
            <span className={styles.prompt} aria-hidden="true">
              $
            </span>
            {INSTALL_COMMAND}
          </code>
          <CopyCommandButton command={INSTALL_COMMAND} />
        </div>

        <ul className={styles.facts}>
          <li>
            <strong>{nextVersion ? `Next.js ${nextVersion}` : "Newest Next.js"}</strong>
            <span>{nextVersion ? "fetched at scaffold time, not pinned" : "resolved when you run it"}</span>
          </li>
          <li>
            <strong>24 tokens</strong>
            <span>spacing, type, motion - before a single colour</span>
          </li>
          <li>
            <strong>0 kB of JS</strong>
            <span>for light and dark mode</span>
          </li>
        </ul>

        <nav className={styles.links} aria-label="Project links">
          <a href={REPO_URL}>GitHub</a>
          <a href={NPM_URL}>npm</a>
          <a href="#features">What you get</a>
        </nav>
      </div>
    </header>
  );
}
