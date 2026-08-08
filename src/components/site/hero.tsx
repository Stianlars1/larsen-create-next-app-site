import { CopyCommandButton } from "@/components/ui/copy-command-button";
import { Terminal } from "@/components/surfaces/terminal";
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
        <div className={styles.text}>
          <h1 className={styles.title}>Start Next.js with the design system already in it</h1>

          <p className={styles.lead}>
            One command. Newest Next.js, colour generated from your brand HEX, motion tokens,
            and docs your agent reads. No Tailwind.
          </p>

          <div className={styles.actions}>
            <div className={styles.commandRow}>
              <code className={styles.command}>
                <span className={styles.dollar} aria-hidden="true">
                  $
                </span>
                {INSTALL_COMMAND}
              </code>
              <CopyCommandButton command={INSTALL_COMMAND} />
            </div>

            <nav className={styles.links} aria-label="Project links">
              <a href={REPO_URL}>GitHub</a>
              <a href={NPM_URL}>npm</a>
            </nav>
          </div>

          <p className={styles.version}>
            {nextVersion ? (
              <>
                Scaffolds Next.js <strong>{nextVersion}</strong> - resolved when you run it, never
                pinned
              </>
            ) : (
              <>Scaffolds the newest stable Next.js - resolved when you run it, never pinned</>
            )}
          </p>
        </div>

        <div className={styles.visual}>
          <Terminal />
        </div>
      </div>
    </header>
  );
}
