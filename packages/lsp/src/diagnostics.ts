import { diffLines } from "diff";

import type { Diagnostic } from "vscode-languageserver-protocol";

const MAX_DIAGNOSTICS = 8;
const MAX_OUTPUT_BYTES = 2048;
const MAX_MESSAGE_CHARS = 180;
const MAX_CODE_CHARS = 64;
const MAX_SOURCE_CHARS = 64;

function buildLineMap(before: string, after: string): ReadonlyMap<number, number> {
  const mapping = new Map<number, number>();
  let beforeLine = 0;
  let afterLine = 0;
  for (const change of diffLines(before, after)) {
    const count = change.count;
    if (change.added) {
      afterLine += count;
    } else if (change.removed) {
      beforeLine += count;
    } else {
      for (let index = 0; index < count; index += 1) {
        mapping.set(beforeLine + index, afterLine + index);
      }
      beforeLine += count;
      afterLine += count;
    }
  }
  return mapping;
}

function shiftedDiagnostic(
  diagnostic: Diagnostic,
  lineMap: ReadonlyMap<number, number>,
): Diagnostic | undefined {
  const startLine = lineMap.get(diagnostic.range.start.line);
  const endLine = lineMap.get(diagnostic.range.end.line);
  if (startLine === undefined || endLine === undefined) return undefined;
  return {
    ...diagnostic,
    range: {
      end: { ...diagnostic.range.end, line: endLine },
      start: { ...diagnostic.range.start, line: startLine },
    },
  };
}

function diagnosticKey(diagnostic: Diagnostic): string {
  return JSON.stringify([
    diagnostic.severity ?? null,
    diagnostic.code ?? null,
    diagnostic.source ?? null,
    diagnostic.message,
    diagnostic.range.start.line,
    diagnostic.range.start.character,
    diagnostic.range.end.line,
    diagnostic.range.end.character,
  ]);
}

export function introducedDiagnostics(
  before: readonly Diagnostic[],
  after: readonly Diagnostic[],
  beforeText?: string,
  afterText?: string,
): Diagnostic[] {
  const lineMap =
    beforeText === undefined || afterText === undefined
      ? undefined
      : buildLineMap(beforeText, afterText);
  const counts = new Map<string, number>();
  for (const diagnostic of before) {
    const shifted = lineMap === undefined ? diagnostic : shiftedDiagnostic(diagnostic, lineMap);
    if (shifted === undefined) continue;
    const key = diagnosticKey(shifted);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const introduced: Diagnostic[] = [];
  for (const diagnostic of after) {
    const key = diagnosticKey(diagnostic);
    const count = counts.get(key) ?? 0;
    if (count === 0) {
      introduced.push(diagnostic);
    } else {
      counts.set(key, count - 1);
    }
  }
  return introduced;
}

function sanitize(value: unknown, maxChars: number): string {
  const text = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
  let withoutControls = "";
  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (
      codePoint === 9 ||
      codePoint === 10 ||
      codePoint === 13 ||
      (codePoint >= 32 && codePoint !== 127)
    ) {
      withoutControls += character;
    }
  }
  return withoutControls.replaceAll(/\s+/g, " ").trim().slice(0, maxChars);
}

function severityRank(diagnostic: Diagnostic): number {
  return diagnostic.severity ?? 5;
}

function bounded(text: string, maxBytes: number): string {
  if (Buffer.byteLength(text, "utf8") <= maxBytes) return text;
  let end = Math.min(text.length, maxBytes);
  while (end > 0 && Buffer.byteLength(text.slice(0, end), "utf8") > maxBytes) end -= 1;
  return text.slice(0, end);
}

export function renderDiagnostics(diagnostics: readonly Diagnostic[]): string {
  const errors = diagnostics
    .filter((diagnostic) => diagnostic.severity === undefined || diagnostic.severity === 1)
    .slice()
    .sort(
      (left, right) =>
        severityRank(left) - severityRank(right) ||
        left.range.start.line - right.range.start.line ||
        left.range.start.character - right.range.start.character,
    );
  if (errors.length === 0) return "";
  const visible = errors.slice(0, MAX_DIAGNOSTICS);
  const lines = visible.map((diagnostic) => {
    const location = `${String(diagnostic.range.start.line + 1)}:${String(diagnostic.range.start.character + 1)}`;
    const code = sanitize(diagnostic.code, MAX_CODE_CHARS);
    const source = sanitize(diagnostic.source, MAX_SOURCE_CHARS);
    const message = sanitize(diagnostic.message, MAX_MESSAGE_CHARS);
    const metadata = [code, source ? `[${source}]` : ""].filter(Boolean).join(" ");
    return `${location}${metadata ? ` ${metadata}` : ""} ${message}`;
  });
  if (errors.length > visible.length) {
    lines.push(`… ${String(errors.length - visible.length)} more errors`);
  }
  return bounded(`LSP: ${String(errors.length)} new errors\n${lines.join("\n")}`, MAX_OUTPUT_BYTES);
}
