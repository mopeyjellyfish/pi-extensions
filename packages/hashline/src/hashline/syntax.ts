/** Strict Web Tree-sitter syntax adapter for Hashline structural proof. */
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { extname } from "node:path";

import { getWasmPath } from "tree-sitter-wasm";
import { Language, type Node, Parser, type Tree } from "web-tree-sitter";

import type { BlockResolver, BlockSpan } from "./types.ts";

type GrammarName =
  | "bash"
  | "css"
  | "go"
  | "html"
  | "javascript"
  | "json"
  | "markdown"
  | "python"
  | "rust"
  | "tsx"
  | "typescript"
  | "yaml";

const require = createRequire(import.meta.url);

const grammarNames: readonly GrammarName[] = [
  "html",
  "javascript",
  "tsx",
  "typescript",
  "css",
  "bash",
  "go",
  "rust",
  "python",
  "json",
  "markdown",
  "yaml",
];
let grammars: ReadonlyMap<GrammarName, Language> | undefined;
let initialization: Promise<void> | undefined;

/**
 * Load the Tree-sitter runtime and Hashline grammars once before synchronous
 * parser-backed operations. Failed attempts are not retained, so callers may
 * deliberately retry after repairing an external WASM-load problem.
 */
async function loadSyntax(): Promise<void> {
  try {
    await Parser.init({
      locateFile: () => require.resolve("web-tree-sitter/web-tree-sitter.wasm"),
    });
    const loaded = await Promise.all(
      grammarNames.map(async (name) => [name, await Language.load(getWasmPath(name))] as const),
    );
    grammars = new Map<GrammarName, Language>(loaded);
  } catch (error) {
    initialization = undefined;
    throw new Error(
      `Hashline syntax initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

export function initializeSyntax(): Promise<void> {
  if (grammars !== undefined) return Promise.resolve();
  initialization ??= loadSyntax();
  return initialization;
}

function initializedGrammars(): ReadonlyMap<GrammarName, Language> {
  if (grammars === undefined)
    throw new Error(
      "Hashline syntax is not initialized; await initializeSyntax() before parser-backed operations.",
    );
  return grammars;
}

const extensions: Readonly<Record<string, GrammarName>> = {
  ".bash": "bash",
  ".bats": "bash",
  ".cgi": "bash",
  ".command": "bash",
  ".css": "css",
  ".cjs": "javascript",
  ".cts": "typescript",
  ".env": "bash",
  ".fcgi": "bash",
  ".go": "go",
  ".htm": "html",
  ".html": "html",
  ".js": "javascript",
  ".json": "json",
  ".jsx": "tsx",
  ".ksh": "bash",
  ".md": "markdown",
  ".mjs": "javascript",
  ".mts": "typescript",
  ".py": "python",
  ".rs": "rust",
  ".sh": "bash",
  ".tmux": "bash",
  ".tool": "bash",
  ".ts": "typescript",
  ".tsx": "tsx",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".zsh": "bash",
};

function grammarForPath(path: string): Language | null {
  const name = extensions[extname(path).toLowerCase()];
  return name === undefined ? null : (initializedGrammars().get(name) ?? null);
}

function firstContentColumn(text: string, row: number): number | null {
  const lines = text.split("\n");
  if (row >= lines.length) return null;
  const line = lines[row];
  if (line === undefined) return null;
  const match = /[^\t ]/u.exec(line);
  return match === null ? null : match.index;
}

function isNode(node: Node | null): node is Node {
  return node !== null;
}

function contentEndLine(node: Node): number {
  const { row, column } = node.endPosition;
  return column === 0 && row > 0 ? row : row + 1;
}

const CACHE_CAPACITY = 256;
const blockCache = new Map<string, BlockSpan | null>();
const boundaryCache = new Map<string, readonly number[]>();
const cleanCache = new Map<string, boolean>();

function cacheKey(path: string, text: string, startLine?: number, endLine?: number): string {
  const digest = createHash("sha256").update(text, "utf8").digest("hex");
  return `${path}\u{0}${digest}\u{0}${String(startLine)}\u{0}${String(endLine)}`;
}

function cache<Value>(entries: Map<string, Value>, key: string, value: Value): Value {
  entries.delete(key);
  entries.set(key, value);
  if (entries.size > CACHE_CAPACITY) {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
  return value;
}

/** Create a tree without applying whole-file validity policy. */
function parse(path: string, text: string): { readonly root: Node; readonly tree: Tree } | null {
  const language = grammarForPath(path);
  if (language === null) return null;
  const parser = new Parser();
  try {
    parser.setLanguage(language);
    const tree: Tree | null = parser.parse(text);
    return tree === null ? null : { root: tree.rootNode, tree };
  } finally {
    parser.delete();
  }
}

/** Resolve the outermost named node that begins at a line's first content byte. */
export const resolveTreeSitterBlock: BlockResolver = ({ path, text, line }) => {
  if (line < 1 || text.length === 0) return null;
  const key = cacheKey(path, text, line);
  const existing = blockCache.get(key);
  if (existing !== undefined || blockCache.has(key)) return existing ?? null;
  const row = line - 1;
  const column = firstContentColumn(text, row);
  if (column === null) return cache(blockCache, key, null);
  const parsed = parse(path, text);
  if (parsed === null) return cache(blockCache, key, null);
  try {
    const { root } = parsed;
    const leaf = root.descendantForPosition({ row, column }, { row, column: column + 1 });
    if (!isNode(leaf) || leaf.startPosition.row !== row) return cache(blockCache, key, null);
    let node = leaf;
    let parent = node.parent;
    while (parent !== null && parent.id !== root.id && parent.startPosition.row === row) {
      node = parent;
      parent = node.parent;
    }
    if (node.hasError) return cache(blockCache, key, null);
    return cache(blockCache, key, { start: node.startPosition.row + 1, end: contentEndLine(node) });
  } finally {
    parsed.tree.delete();
  }
};

/** Return named-node boundary rows that straddle the visible window endpoints. */
export function enclosingBoundaries(
  lines: readonly string[],
  path: string,
  startLine: number,
  endLine: number,
): readonly number[] {
  const text = lines.join("\n");
  const key = cacheKey(path, text, startLine, endLine);
  const existing = boundaryCache.get(key);
  if (existing !== undefined) return existing;
  const parsed = parse(path, text);
  if (parsed === null) return cache(boundaryCache, key, []);
  try {
    if (parsed.root.hasError) return cache(boundaryCache, key, []);
    const boundaries = new Set<number>();
    const visit = (node: Node): void => {
      if (node.isNamed && node.parent !== null) {
        const start = node.startPosition.row + 1;
        const end = contentEndLine(node);
        if (end > start) {
          if (start >= startLine && start <= endLine && (end < startLine || end > endLine)) {
            boundaries.add(end);
          } else if (end >= startLine && end <= endLine && (start < startLine || start > endLine)) {
            boundaries.add(start);
          }
        }
      }
      for (const child of node.children) visit(child);
    };
    visit(parsed.root);
    return cache(
      boundaryCache,
      key,
      [...boundaries].sort((left, right) => left - right),
    );
  } finally {
    parsed.tree.delete();
  }
}

export function parsesCleanly(path: string | undefined, text: string): boolean {
  if (path === undefined) return false;
  const key = cacheKey(path, text);
  const existing = cleanCache.get(key);
  if (existing !== undefined) return existing;
  const parsed = parse(path, text);
  if (parsed === null) return cache(cleanCache, key, false);
  try {
    return cache(cleanCache, key, !parsed.root.hasError);
  } finally {
    parsed.tree.delete();
  }
}
