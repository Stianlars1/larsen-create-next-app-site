import styles from "./code-block.module.css";
import { CopyCommandButton } from "./copy-command-button";

type CodeBlockProps = {
  code: string;
  /** Shown in the block's header - a filename or a language. */
  label?: string;
  copyable?: boolean;
  /** Caps the height and scrolls, for long generated output. */
  scroll?: boolean;
};

export function CodeBlock({ code, label, copyable = false, scroll = false }: CodeBlockProps) {
  return (
    <div className={styles.block} data-scroll={scroll ? "true" : undefined}>
      {(label || copyable) && (
        <header className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {copyable && <CopyCommandButton command={code} />}
        </header>
      )}
      <pre className={styles.pre}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
