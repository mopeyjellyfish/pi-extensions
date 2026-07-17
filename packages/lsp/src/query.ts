import { isAbsolute, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { truncateHead } from "@earendil-works/pi-coding-agent";

import type {
  CallHierarchyIncomingCall,
  CallHierarchyItem,
  CallHierarchyOutgoingCall,
  DocumentSymbol,
  Hover,
  Location,
  LocationLink,
  MarkupContent,
  Position,
  SymbolInformation,
  TypeHierarchyItem,
  WorkspaceSymbol,
} from "vscode-languageserver-protocol";

const MAX_QUERY_ITEMS = 100;
export const QUERY_ITEM_LIMIT = 200;
const MAX_QUERY_BYTES = 16 * 1024;
const MAX_HOVER_BYTES = 8192;
const MAX_SYMBOL_DEPTH = 12;

export type LspQueryOperation =
  | "callHierarchyIncoming"
  | "callHierarchyOutgoing"
  | "declaration"
  | "definition"
  | "documentSymbols"
  | "hover"
  | "implementation"
  | "references"
  | "typeDefinition"
  | "typeHierarchySubtypes"
  | "typeHierarchySupertypes"
  | "workspaceSymbols";

export interface LspQueryRequest {
  readonly column?: number;
  readonly includeDeclaration?: boolean;
  readonly line?: number;
  readonly operation: LspQueryOperation;
  readonly path?: string;
  readonly query?: string;
}

interface LegacyMarkedString {
  readonly language: string;
  readonly value: string;
}

export interface LspQueryItem {
  readonly column?: number;
  readonly containerName?: string;
  readonly endColumn?: number;
  readonly endLine?: number;
  readonly kind: string;
  readonly line?: number;
  readonly name?: string;
  readonly path?: string;
}

export interface LspQueryOutcome {
  readonly hover?: string;
  readonly items: readonly LspQueryItem[];
  readonly operation: LspQueryOperation;
  readonly omitted: number;
  readonly serverNames: readonly string[];
}

const SYMBOL_KINDS = [
  "unknown",
  "file",
  "module",
  "namespace",
  "package",
  "class",
  "method",
  "property",
  "field",
  "constructor",
  "enum",
  "interface",
  "function",
  "variable",
  "constant",
  "string",
  "number",
  "boolean",
  "array",
  "object",
  "key",
  "null",
  "enumMember",
  "struct",
  "event",
  "operator",
  "typeParameter",
] as const;

export function queryMethod(operation: LspQueryOperation): string {
  const methods: Record<LspQueryOperation, string> = {
    callHierarchyIncoming: "textDocument/prepareCallHierarchy",
    callHierarchyOutgoing: "textDocument/prepareCallHierarchy",
    declaration: "textDocument/declaration",
    definition: "textDocument/definition",
    documentSymbols: "textDocument/documentSymbol",
    hover: "textDocument/hover",
    implementation: "textDocument/implementation",
    references: "textDocument/references",
    typeDefinition: "textDocument/typeDefinition",
    typeHierarchySubtypes: "textDocument/prepareTypeHierarchy",
    typeHierarchySupertypes: "textDocument/prepareTypeHierarchy",
    workspaceSymbols: "workspace/symbol",
  };
  return methods[operation];
}

export function queryNeedsPosition(operation: LspQueryOperation): boolean {
  return !["documentSymbols", "workspaceSymbols"].includes(operation);
}

export function toLspPosition(text: string, line: number, column: number): Position {
  if (!Number.isInteger(line) || line < 1) throw new Error("LSP query line must be at least 1.");
  if (!Number.isInteger(column) || column < 1) {
    throw new Error("LSP query column must be at least 1.");
  }
  const lines = text.split("\n");
  const selected = lines[line - 1];
  if (selected === undefined) throw new Error("LSP query line is past the end of the file.");
  const content = selected.endsWith("\r") ? selected.slice(0, -1) : selected;
  if (column - 1 > content.length) {
    throw new Error("LSP query column is past the end of the line in UTF-16 code units.");
  }
  return { character: column - 1, line: line - 1 };
}

function symbolKind(kind: number): string {
  return SYMBOL_KINDS[kind] ?? `kind-${String(kind)}`;
}

function pathFromUri(uri: string): string {
  try {
    const url = new URL(uri);
    return url.protocol === "file:" ? fileURLToPath(url) : uri;
  } catch {
    return uri;
  }
}

function locationItem(location: Location | LocationLink, kind: string): LspQueryItem {
  if ("targetUri" in location) {
    return {
      column: location.targetSelectionRange.start.character + 1,
      endColumn: location.targetSelectionRange.end.character + 1,
      endLine: location.targetSelectionRange.end.line + 1,
      kind,
      line: location.targetSelectionRange.start.line + 1,
      path: pathFromUri(location.targetUri),
    };
  }
  return {
    column: location.range.start.character + 1,
    endColumn: location.range.end.character + 1,
    endLine: location.range.end.line + 1,
    kind,
    line: location.range.start.line + 1,
    path: pathFromUri(location.uri),
  };
}

export function normalizeLocations(
  value: Location | readonly Location[] | readonly LocationLink[] | null,
  kind: string,
): readonly LspQueryItem[] {
  if (value === null) return [];
  if (Array.isArray(value)) {
    return (value as readonly (Location | LocationLink)[])
      .slice(0, QUERY_ITEM_LIMIT)
      .map((location) => locationItem(location, kind));
  }
  return [locationItem(value as Location | LocationLink, kind)];
}

function collectDocumentSymbols(
  symbols: readonly DocumentSymbol[],
  items: LspQueryItem[],
  depth: number,
  containerName?: string,
): void {
  if (depth > MAX_SYMBOL_DEPTH || items.length >= QUERY_ITEM_LIMIT) return;
  for (const symbol of symbols) {
    if (items.length >= QUERY_ITEM_LIMIT) return;
    items.push({
      column: symbol.selectionRange.start.character + 1,
      ...(containerName === undefined ? {} : { containerName }),
      endColumn: symbol.range.end.character + 1,
      endLine: symbol.range.end.line + 1,
      kind: symbolKind(symbol.kind),
      line: symbol.selectionRange.start.line + 1,
      name: symbol.name,
    });
    if (symbol.children) collectDocumentSymbols(symbol.children, items, depth + 1, symbol.name);
  }
}

export function normalizeDocumentSymbols(
  value: readonly DocumentSymbol[] | readonly SymbolInformation[] | null,
  path: string,
): readonly LspQueryItem[] {
  if (value === null || value.length === 0) return [];
  const first = value[0];
  if (first !== undefined && "selectionRange" in first) {
    const items: LspQueryItem[] = [];
    collectDocumentSymbols(value as readonly DocumentSymbol[], items, 0);
    return items.map((item) => ({ ...item, path }));
  }
  return (value as readonly SymbolInformation[]).slice(0, QUERY_ITEM_LIMIT).map((symbol) => ({
    column: symbol.location.range.start.character + 1,
    ...(symbol.containerName === undefined ? {} : { containerName: symbol.containerName }),
    endColumn: symbol.location.range.end.character + 1,
    endLine: symbol.location.range.end.line + 1,
    kind: symbolKind(symbol.kind),
    line: symbol.location.range.start.line + 1,
    name: symbol.name,
    path: pathFromUri(symbol.location.uri),
  }));
}

function hierarchyItem(
  item: CallHierarchyItem | TypeHierarchyItem,
  relation: string,
): LspQueryItem {
  return {
    column: item.selectionRange.start.character + 1,
    ...(item.detail ? { containerName: item.detail } : {}),
    endColumn: item.selectionRange.end.character + 1,
    endLine: item.selectionRange.end.line + 1,
    kind: `${relation}:${symbolKind(item.kind)}`,
    line: item.selectionRange.start.line + 1,
    name: item.name,
    path: pathFromUri(item.uri),
  };
}

export function normalizeIncomingCalls(
  value: readonly CallHierarchyIncomingCall[] | null,
): readonly LspQueryItem[] {
  return (value ?? [])
    .slice(0, QUERY_ITEM_LIMIT)
    .map((call) => hierarchyItem(call.from, "incomingCall"));
}

export function normalizeOutgoingCalls(
  value: readonly CallHierarchyOutgoingCall[] | null,
): readonly LspQueryItem[] {
  return (value ?? [])
    .slice(0, QUERY_ITEM_LIMIT)
    .map((call) => hierarchyItem(call.to, "outgoingCall"));
}

export function normalizeTypeHierarchy(
  value: readonly TypeHierarchyItem[] | null,
  relation: "subtype" | "supertype",
): readonly LspQueryItem[] {
  return (value ?? []).slice(0, QUERY_ITEM_LIMIT).map((item) => hierarchyItem(item, relation));
}

export function normalizeWorkspaceSymbols(
  value: readonly (SymbolInformation | WorkspaceSymbol)[] | null,
): readonly LspQueryItem[] {
  if (value === null) return [];
  return value.slice(0, QUERY_ITEM_LIMIT).map((symbol) => {
    const location = symbol.location;
    if (!("range" in location)) {
      return {
        ...(symbol.containerName === undefined ? {} : { containerName: symbol.containerName }),
        kind: symbolKind(symbol.kind),
        name: symbol.name,
        path: pathFromUri(location.uri),
      };
    }
    return {
      column: location.range.start.character + 1,
      ...(symbol.containerName === undefined ? {} : { containerName: symbol.containerName }),
      endColumn: location.range.end.character + 1,
      endLine: location.range.end.line + 1,
      kind: symbolKind(symbol.kind),
      line: location.range.start.line + 1,
      name: symbol.name,
      path: pathFromUri(location.uri),
    };
  });
}

function markedStringText(value: LegacyMarkedString | string): string {
  return typeof value === "string" ? value : `\`\`\`${value.language}\n${value.value}\n\`\`\``;
}

function markupText(value: MarkupContent): string {
  return value.value;
}

export function normalizeHover(value: Hover | null): string | undefined {
  if (value === null) return undefined;
  const contents = value.contents;
  const text = Array.isArray(contents)
    ? contents.map((item) => markedStringText(item)).join("\n\n")
    : typeof contents === "string" || "language" in contents
      ? markedStringText(contents)
      : markupText(contents);
  let safeText = "";
  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? 0;
    safeText += codePoint < 32 && character !== "\n" && character !== "\t" ? " " : character;
  }
  const sanitized = safeText.trim();
  if (!sanitized) return undefined;
  return truncateHead(sanitized, { maxBytes: MAX_HOVER_BYTES, maxLines: 120 }).content;
}

function displayPath(cwd: string, path: string): string {
  if (!isAbsolute(path)) return path;
  const shown = relative(cwd, path);
  return shown.startsWith("..") ? path : shown || ".";
}

export function renderQueryOutcome(cwd: string, outcome: LspQueryOutcome): string {
  const lines = [`LSP ${outcome.operation} via ${outcome.serverNames.join(", ") || "no server"}:`];
  if (outcome.hover) lines.push(outcome.hover);
  const visible = outcome.items.slice(0, MAX_QUERY_ITEMS);
  for (const item of visible) {
    const location =
      item.path === undefined
        ? ""
        : `${displayPath(cwd, item.path)}${item.line === undefined ? "" : `:${String(item.line)}:${String(item.column ?? 1)}`}`;
    const symbol = [
      item.kind,
      item.name,
      item.containerName ? `in ${item.containerName}` : undefined,
    ]
      .filter((part): part is string => part !== undefined)
      .join(" ");
    lines.push([location, symbol].filter(Boolean).join(" — "));
  }
  const omitted = outcome.omitted + Math.max(0, outcome.items.length - visible.length);
  if (omitted > 0)
    lines.push(`… ${String(omitted)} additional result${omitted === 1 ? "" : "s"} omitted`);
  if (outcome.hover === undefined && visible.length === 0) lines.push("No results.");
  return truncateHead(lines.join("\n"), { maxBytes: MAX_QUERY_BYTES, maxLines: 160 }).content;
}
