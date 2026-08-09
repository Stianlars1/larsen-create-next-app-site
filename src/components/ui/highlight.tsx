import { FileCode, FileText, Folder } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./highlight.module.css";

/**
 * A highlighter for the three grammars this page actually shows.
 *
 * Shiki and Prism are the obvious answer and the wrong one here: a hundred
 * kilobytes of tokenizer for one command, one generated stylesheet and one
 * file tree. These regexes cover exactly what is on the page and nothing else.
 *
 * The output is React nodes, never a string of HTML - the theme.css listing is
 * generated from a HEX the visitor types, so innerHTML would be a real
 * injection path rather than a theoretical one.
 */

export type HighlightLanguage = "shell" | "css" | "tree";

type Rule = { kind: string; pattern: string };
type Token = { kind: string; text: string };

/* ------------------------------------------------------------------ *
 * The scanner
 * ------------------------------------------------------------------ */

/**
 * One alternation per grammar, each branch a named group so the winning rule
 * is known from the match itself.
 */
function compile(rules: Rule[]): RegExp {
  return new RegExp(rules.map((rule) => `(?<${rule.kind}>${rule.pattern})`).join("|"), "gm");
}

/**
 * Every character is emitted exactly once, in order: the gap before a match,
 * then the match itself, then whatever is left after the last one. Losing or
 * reordering text is not a bug this can have - a rule that fails to match
 * leaves its characters in a plain token instead.
 */
function scan(source: string, grammar: RegExp): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;

  for (const match of source.matchAll(grammar)) {
    if (match.index > cursor) {
      tokens.push({ kind: "plain", text: source.slice(cursor, match.index) });
    }
    const kind = Object.keys(match.groups ?? {}).find((name) => match.groups?.[name] !== undefined);
    tokens.push({ kind: kind ?? "plain", text: match[0] });
    cursor = match.index + match[0].length;
  }

  if (cursor < source.length) {
    tokens.push({ kind: "plain", text: source.slice(cursor) });
  }

  return tokens;
}

/* ------------------------------------------------------------------ *
 * shell
 * ------------------------------------------------------------------ */

const SHELL = compile([
  { kind: "prompt", pattern: "^[ \\t]*\\$" },
  { kind: "continuation", pattern: "\\\\$" },
  { kind: "flag", pattern: "--?[A-Za-z][\\w-]*" },
  { kind: "pkg", pattern: "@[\\w.-]+\\/[\\w.-]+" },
  { kind: "word", pattern: "[^\\s\\\\]+" },
]);

const SHELL_BINARIES = new Set(["npx", "npm", "pnpm", "yarn", "bun", "bunx", "node", "cd", "git"]);

/**
 * A bare word means nothing on its own - `npm` is the command in one position
 * and the answer to `--pm` in another. Only the token before it can tell them
 * apart, so the split happens here rather than in the regex.
 */
function labelShellWords(tokens: Token[]): Token[] {
  let previous = "";

  return tokens.map((token) => {
    if (token.kind === "plain" || token.kind === "continuation") return token;

    if (token.kind !== "word") {
      previous = token.kind;
      return token;
    }

    const kind =
      previous === "flag" ? "value" : SHELL_BINARIES.has(token.text) ? "binary" : "arg";
    previous = kind;
    return { kind, text: token.text };
  });
}

/* ------------------------------------------------------------------ *
 * css
 * ------------------------------------------------------------------ */

const CSS = compile([
  { kind: "comment", pattern: "\\/\\*[\\s\\S]*?\\*\\/" },
  { kind: "atrule", pattern: "@[A-Za-z-]+" },
  // A selector is whatever sits on a line in front of its opening brace
  { kind: "selector", pattern: "^[ \\t]*[.#\\[:A-Za-z][^{}\\n]*(?=\\{)" },
  { kind: "prop", pattern: "--[A-Za-z0-9-]+" },
  { kind: "func", pattern: "\\b(?:hsl|hsla|rgb|rgba|oklch|oklab|lch|lab|color-mix|var)(?=\\()" },
  { kind: "hex", pattern: "#[0-9A-Fa-f]{3,8}\\b" },
  { kind: "number", pattern: "-?\\d*\\.?\\d+%?" },
]);

/* ------------------------------------------------------------------ *
 * tree
 * ------------------------------------------------------------------ */

const TREE = compile([
  { kind: "branch", pattern: "^[\\s─│┌┬├┤└┴]+" },
  { kind: "dir", pattern: "[\\w.@-]+(?:\\/[\\w.@-]+)*\\/" },
  { kind: "file", pattern: "[\\w.@-]+\\.(?:tsx?|jsx?|mjs|cjs|css|md|json|svg|ya?ml|toml)\\b" },
  // Two spaces or more after an entry start the description column
  { kind: "desc", pattern: "\\s{2,}\\S[^\\n]*$" },
]);

/**
 * The tree is read a line at a time: the box drawing is only meaningful at the
 * start of one, and a description only after an entry on the same one.
 */
function scanTree(source: string): Token[] {
  const tokens: Token[] = [];

  source.split("\n").forEach((line, index) => {
    if (index > 0) tokens.push({ kind: "plain", text: "\n" });
    tokens.push(...scan(line, TREE));
  });

  return tokens;
}

function tokenize(code: string, language: HighlightLanguage): Token[] {
  if (language === "shell") return labelShellWords(scan(code, SHELL));
  if (language === "css") return scan(code, CSS);
  return scanTree(code);
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

function fileIcon(name: string) {
  return name.endsWith(".md") ? FileText : FileCode;
}

function toNodes(tokens: Token[]): ReactNode[] {
  return tokens.map((token, index) => {
    if (token.kind === "plain") return token.text;

    if (token.kind === "dir") {
      return (
        <span key={index} className={styles.dir}>
          <Folder className={styles.icon} />
          {token.text}
        </span>
      );
    }

    if (token.kind === "file") {
      const Icon = fileIcon(token.text);
      return (
        <span key={index} className={styles.file}>
          <Icon className={`${styles.icon} ${styles.fileIcon}`} />
          {token.text}
        </span>
      );
    }

    return (
      <span key={index} className={styles[token.kind]}>
        {token.text}
      </span>
    );
  });
}

/*
 * The terminal re-renders on a timer and the palette demo regenerates
 * theme.css on every keystroke, so the finished nodes are kept rather than the
 * tokens - a repeat render then costs a map lookup. React elements are
 * immutable, so handing the same array back is safe. The cap is there because
 * every new HEX is a new key.
 */
const CACHE = new Map<string, ReactNode[]>();
const CACHE_LIMIT = 32;

function nodesFor(code: string, language: HighlightLanguage): ReactNode[] {
  const key = `${language}|${code}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const nodes = toNodes(tokenize(code, language));
  CACHE.set(key, nodes);

  if (CACHE.size > CACHE_LIMIT) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }

  return nodes;
}

type HighlightProps = {
  code: string;
  /** Omit it and the code renders as plain monospace, unchanged. */
  language?: HighlightLanguage;
};

/*
 * One root element rather than a fragment. Loose token spans each become their
 * own flex item wherever the caller is a flex container - the hero terminal's
 * command line is one - which spaces the tokens apart and drops the whitespace
 * between them, since a whitespace-only anonymous flex item is not rendered.
 */
export function Highlight({ code, language }: HighlightProps) {
  return (
    <span className={styles.root}>{language ? nodesFor(code, language) : code}</span>
  );
}
