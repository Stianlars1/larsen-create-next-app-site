import { CopyCommandButton } from "@/components/ui/copy-command-button";
import { AUTHOR_URL, INSTALL_COMMAND, NPM_URL, REPO_URL, SKILLS_URL } from "@/lib/content";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="page">
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Start the next one properly</h2>
          <div className={styles.commandRow}>
            <code>
              <span aria-hidden="true">$</span> {INSTALL_COMMAND}
            </code>
            <CopyCommandButton command={INSTALL_COMMAND} />
          </div>
        </div>

        <div className={styles.meta}>
          <nav aria-label="Footer">
            <a href={REPO_URL}>GitHub</a>
            <a href={NPM_URL}>npm</a>
            <a href={SKILLS_URL}>Larsen Skills</a>
            <a href="https://rampkit.app">rampkit</a>
          </nav>
          <p>
            MIT licensed. Built by <a href={AUTHOR_URL}>Stian Larsen - Larsen Utvikling</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
