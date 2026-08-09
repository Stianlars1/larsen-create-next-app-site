import styles from "./code-block.module.css";
import { CopyCommandButton } from "./copy-command-button";
import { Highlight, type HighlightLanguage } from "./highlight";

type CodeBlockProps = {
  code: string;
  /** Shown in the block's header - a filename or a language. */
  label?: string;
  copyable?: boolean;
  /** Caps the height and scrolls, for long generated output. */
  scroll?: boolean;
  /** Adds syntax colour. Omit it and the code stays plain monospace. */
  language?: HighlightLanguage;
};

export function CodeBlock({
  code,
  label,
  copyable = false,
  scroll = false,
  language,
}: CodeBlockProps) {
  return (
    <div className={styles.block} data-scroll={scroll ? "true" : undefined}>
      {(label || copyable) && (
        <header className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {copyable && <CopyCommandButton command={code} />}
        </header>
      )}
      <pre className={styles.pre}>
        <code>
          <Highlight code={code} language={language} />
        </code>
      </pre>
    </div>
  );
}
