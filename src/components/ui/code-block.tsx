import styles from "./code-block.module.css";
import { CopyCommandButton, type CopyTracking } from "./copy-command-button";
import { Highlight, type HighlightLanguage } from "./highlight";

type BaseCodeBlockProps = {
  code: string;
  /** Shown in the block's header - a filename or a language. */
  label?: string;
  /** Caps the height and scrolls, for long generated output. */
  scroll?: boolean;
  /** Adds syntax colour. Omit it and the code stays plain monospace. */
  language?: HighlightLanguage;
};

type CodeBlockProps =
  | (BaseCodeBlockProps & { copyable?: false; copyTracking?: never })
  | (BaseCodeBlockProps & { copyable: true; copyTracking: CopyTracking });

export function CodeBlock(props: CodeBlockProps) {
  const { code, label, scroll = false, language } = props;
  return (
    <div className={styles.block} data-scroll={scroll ? "true" : undefined}>
      {(label || props.copyable) && (
        <header className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {props.copyable && <CopyCommandButton command={code} tracking={props.copyTracking} />}
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
