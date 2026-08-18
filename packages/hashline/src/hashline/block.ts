/**
 * Expand deferred block edits into concrete inserts, cuts, pastes, and deletes.
 *
 * The parser cannot expand a block edit until file text and language are
 * available. This transform resolves each anchored span, then emits the same
 * low-level edits as the corresponding concrete operation. After it runs, no
 * `block` edits remain, so {@link applyEdits} and recovery see concrete edits.
 */
import { STRUCTURAL_CLOSER_RE } from "./apply.ts";
import {
  BLOCK_RESOLVER_UNAVAILABLE,
  type BlockDiagnosticSuggestions,
  type BlockOp,
  blockSingleLineMessage,
  blockUnresolvedMessage,
  insertAfterBlockCloserLoweredWarning,
  insertAfterBlockUnresolvedLoweredWarning,
  pasteAfterBlockCloserLoweredWarning,
  pasteAfterBlockUnresolvedLoweredWarning,
} from "./messages.ts";

import type { BlockResolution, BlockResolver, BlockSpan, Edit } from "./types.ts";

/** Maximum nearby lines inspected only after a block anchor has already failed. */
const BLOCK_SUGGESTION_SCAN_LIMIT = 64;

function resolveDiagnosticBlock(
  resolver: BlockResolver,
  path: string,
  text: string,
  line: number,
): BlockSpan | null {
  try {
    return resolver({ path, text, line });
  } catch {
    // Suggestions are best-effort and must never hide the authoritative anchor error.
    return null;
  }
}

function findNextBlock(
  anchorLine: number,
  lines: readonly string[],
  path: string,
  text: string,
  resolver: BlockResolver,
): BlockSpan | null {
  const lastLine = Math.min(lines.length, anchorLine + BLOCK_SUGGESTION_SCAN_LIMIT);
  for (let line = anchorLine + 1; line <= lastLine; line++) {
    if (lines[line - 1]?.trim().length === 0) continue;
    const span = resolveDiagnosticBlock(resolver, path, text, line);
    if (span?.start === line && span.end > line) return span;
  }
  return null;
}

function findEnclosingBlock(
  anchorLine: number,
  lines: readonly string[],
  path: string,
  text: string,
  resolver: BlockResolver,
): BlockSpan | null {
  const firstLine = Math.max(1, anchorLine - BLOCK_SUGGESTION_SCAN_LIMIT);
  for (let line = anchorLine - 1; line >= firstLine; line--) {
    if (lines[line - 1]?.trim().length === 0) continue;
    const span = resolveDiagnosticBlock(resolver, path, text, line);
    if (span?.start === line && span.end >= anchorLine && span.end > line) return span;
  }
  return null;
}

/** Optional knobs for {@link resolveBlockEdits}. */
export interface ResolveBlockEditsOptions {
  /**
   * How to handle a replace/cut block edit that cannot be resolved. `"throw"`
   * (default) raises a block error; `"drop"` skips it for streaming previews.
   * Unresolvable after-block edits lower to their plain after-line form.
   */
  onUnresolved?: "throw" | "drop";
  /**
   * Invoked once per successfully resolved block edit, in patch order, with
   * the anchor line and the concrete span it resolved to. Lets the host echo
   * the resolution back to the caller. Never fired for dropped/unresolvable
   * edits.
   */
  onResolved?: (resolution: BlockResolution) => void;
  /**
   * Invoked once per diagnostic produced while resolving — currently the
   * `insert_after_block N:` lowerings (closer anchor or unresolvable block).
   * Hosts should surface these on the apply result's `warnings`.
   */
  onWarning?: (message: string) => void;
}

/** True when at least one edit is an unresolved deferred block edit. */
export function hasBlockEdit(edits: readonly Edit[]): boolean {
  return edits.some((edit) => edit.kind === "block");
}

/**
 * Resolve every deferred block edit in `edits` against `text` (parsed as the
 * language inferred from `path`). Non-block edits pass through untouched.
 * Returns a fresh edit list with no `block` variants. The fast path returns the
 * input unchanged when there is nothing to resolve.
 *
 * Synthesized inserts/deletes carry sequential `index` values for readability
 * only — {@link applyEdits} re-derives every edit's index from array order, so
 * the passthrough edits keeping their original indices is harmless.
 */
function reindexEdits(edits: readonly Edit[]): Edit[] {
  return edits.map((edit, index) => ({ ...edit, index }));
}

function lowerAfterBlock(
  edit: Extract<Edit, { kind: "block" }>,
  op: Extract<BlockOp, "insert_after" | "paste_after">,
  text: string,
  onWarning: ResolveBlockEditsOptions["onWarning"],
): Edit[] {
  // `insert_after_block N:` never fails the patch — lower it to plain
  // `insert after N:` with a warning. A closer means N is the end of a block;
  // otherwise unsupported syntax degrades to an exact after-line insertion.
  const isCloser = STRUCTURAL_CLOSER_RE.test(text.split("\n")[edit.anchor.line - 1] ?? "");
  if (op === "paste_after") {
    onWarning?.(
      isCloser
        ? pasteAfterBlockCloserLoweredWarning(edit.anchor.line)
        : pasteAfterBlockUnresolvedLoweredWarning(edit.anchor.line),
    );
    return [
      {
        kind: "paste",
        at: { kind: "gap", cursor: { kind: "after_anchor", anchor: { line: edit.anchor.line } } },
        ...(edit.register === undefined ? {} : { register: edit.register }),
        lineNum: edit.lineNum,
        index: 0,
      },
    ];
  }
  onWarning?.(
    isCloser
      ? insertAfterBlockCloserLoweredWarning(edit.anchor.line)
      : insertAfterBlockUnresolvedLoweredWarning(edit.anchor.line),
  );
  return edit.payloads.map((payload) => ({
    kind: "insert" as const,
    cursor: { kind: "after_anchor" as const, anchor: { line: edit.anchor.line } },
    text: payload,
    lineNum: edit.lineNum,
    index: 0,
  }));
}

function resolveUnresolvedBlock(
  edit: Extract<Edit, { kind: "block" }>,
  op: BlockOp,
  text: string,
  path: string,
  resolver: BlockResolver | undefined,
  options: ResolveBlockEditsOptions,
): Edit[] {
  if (op === "insert_after" || op === "paste_after")
    return lowerAfterBlock(edit, op, text, options.onWarning);
  if ((options.onUnresolved ?? "throw") === "drop") return [];
  if (resolver === undefined)
    throw new Error(`line ${String(edit.lineNum)}: ${BLOCK_RESOLVER_UNAVAILABLE}`);
  const lines = text.split("\n");
  const nextBlock =
    lines[edit.anchor.line - 1]?.trim().length === 0
      ? findNextBlock(edit.anchor.line, lines, path, text, resolver)
      : null;
  const enclosingBlock =
    nextBlock === null ? findEnclosingBlock(edit.anchor.line, lines, path, text, resolver) : null;
  const suggestions: BlockDiagnosticSuggestions = {
    ...(nextBlock === null ? {} : { nextBlock }),
    ...(enclosingBlock === null ? {} : { enclosingBlock }),
  };
  throw new Error(
    `line ${String(edit.lineNum)}: ${blockUnresolvedMessage(edit.anchor.line, op, lines, suggestions, edit.register)}`,
  );
}

function resolvedBlockEdits(
  edit: Extract<Edit, { kind: "block" }>,
  op: BlockOp,
  span: BlockSpan,
): Edit[] {
  // After-block inserts carry blockStart so landing correction can move a body
  // that claims the block's depth back across trailing closer rows.
  if (op === "paste_after")
    return [
      {
        kind: "paste",
        at: { kind: "gap", cursor: { kind: "after_anchor", anchor: { line: span.end } } },
        ...(edit.register === undefined ? {} : { register: edit.register }),
        lineNum: edit.lineNum,
        index: 0,
        blockStart: span.start,
      },
    ];
  if (op === "insert_after")
    return edit.payloads.map((text) => ({
      kind: "insert" as const,
      cursor: { kind: "after_anchor" as const, anchor: { line: span.end } },
      text,
      lineNum: edit.lineNum,
      index: 0,
      blockStart: span.start,
    }));
  const range = { start: { line: span.start }, end: { line: span.end } };
  if (op === "cut")
    return [
      {
        kind: "cut",
        range,
        ...(edit.register === undefined ? {} : { register: edit.register }),
        lineNum: edit.lineNum,
        index: 0,
      },
      ...Array.from({ length: span.end - span.start + 1 }, (_, offset) => ({
        kind: "delete" as const,
        anchor: { line: span.start + offset },
        lineNum: edit.lineNum,
        index: 0,
      })),
    ];
  // Register-backed block replacement expands to a span paste.
  if (edit.register !== undefined)
    return [
      {
        kind: "paste",
        at: { kind: "span", range },
        register: edit.register,
        lineNum: edit.lineNum,
        index: 0,
      },
    ];
  // Body-backed replacement inserts before the span then deletes every row.
  return [
    ...edit.payloads.map((text) => ({
      kind: "insert" as const,
      cursor: { kind: "before_anchor" as const, anchor: { line: span.start } },
      text,
      lineNum: edit.lineNum,
      index: 0,
      mode: "replacement" as const,
    })),
    ...Array.from({ length: span.end - span.start + 1 }, (_, offset) => ({
      kind: "delete" as const,
      anchor: { line: span.start + offset },
      lineNum: edit.lineNum,
      index: 0,
    })),
  ];
}

function resolveOneBlockEdit(
  edit: Extract<Edit, { kind: "block" }>,
  text: string,
  path: string,
  resolver: BlockResolver | undefined,
  options: ResolveBlockEditsOptions,
): Edit[] {
  const op: BlockOp = edit.mode ?? "replace";
  const span = resolver?.({ path, text, line: edit.anchor.line }) ?? null;
  if (span === null) return resolveUnresolvedBlock(edit, op, text, path, resolver, options);
  if (span.start === span.end) {
    // A one-line resolution is a bare statement, not an opening line. Reject
    // the common mis-anchor rather than landing a body in the wrong scope.
    if ((options.onUnresolved ?? "throw") === "drop") return [];
    const enclosing =
      resolver === undefined
        ? null
        : findEnclosingBlock(edit.anchor.line, text.split("\n"), path, text, resolver);
    throw new Error(
      `line ${String(edit.lineNum)}: ${blockSingleLineMessage(edit.anchor.line, op, enclosing ?? undefined)}`,
    );
  }
  options.onResolved?.({ anchorLine: edit.anchor.line, start: span.start, end: span.end, op });
  return resolvedBlockEdits(edit, op, span);
}

export function resolveBlockEdits(
  edits: readonly Edit[],
  text: string,
  path: string,
  resolver: BlockResolver | undefined,
  options: ResolveBlockEditsOptions = {},
): readonly Edit[] {
  if (!hasBlockEdit(edits)) return edits;
  const resolved = edits.flatMap((edit) =>
    edit.kind === "block" ? resolveOneBlockEdit(edit, text, path, resolver, options) : [edit],
  );
  return reindexEdits(resolved);
}
