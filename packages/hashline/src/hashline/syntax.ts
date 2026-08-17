/** Node-compatible ast-grep syntax adapter for Hashline structural proof. */
import { createHash } from "node:crypto";

import { Lang, parse } from "@ast-grep/napi";

function languageForPath(path: string): Lang | null {
  if (/\.(?:ts|mts|cts)$/u.test(path)) return Lang.TypeScript;
  if (/\.(?:tsx|jsx)$/u.test(path)) return Lang.Tsx;
  if (/\.(?:js|mjs|cjs)$/u.test(path)) return Lang.JavaScript;
  if (/\.html?$/u.test(path)) return Lang.Html;
  if (/\.css$/u.test(path)) return Lang.Css;
  return null;
}

function cacheKey(path: string, text: string, startLine?: number, endLine?: number): string {
  const digest = createHash("sha256").update(text, "utf8").digest("hex");
  return `${digest}:${path}:${String(startLine)}:${String(endLine)}`;
}

const parseCache = new Map<string, boolean>();
const boundaryCache = new Map<string, readonly number[]>();
const CACHE_MAX = 256;

function cache<Value>(map: Map<string, Value>, key: string, value: Value): Value {
  if (map.size >= CACHE_MAX) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
  map.set(key, value);
  return value;
}

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
  const language = languageForPath(path);
  if (language === null) return cache(boundaryCache, key, []);
  try {
    parse(language, text);
    // ast-grep proves parseability here. Full enclosing-node lowering is added
    // with the block-operation slice; returning no boundaries keeps repair
    // fail-closed until then.
    return cache(boundaryCache, key, []);
  } catch {
    return cache(boundaryCache, key, []);
  }
}

export function parsesCleanly(path: string | undefined, text: string): boolean {
  if (path === undefined) return false;
  const key = cacheKey(path, text);
  const existing = parseCache.get(key);
  if (existing !== undefined) return existing;
  const language = languageForPath(path);
  if (language === null) return cache(parseCache, key, false);
  try {
    parse(language, text);
    return cache(parseCache, key, true);
  } catch {
    return cache(parseCache, key, false);
  }
}
