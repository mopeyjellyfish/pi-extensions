import { isAbsolute, relative } from "node:path";

import { truncateHead } from "@earendil-works/pi-coding-agent";

import type { FileDiagnostics } from "./manager.ts";
import type { Diagnostic } from "vscode-languageserver-protocol";

const MAX_VALIDATION_DIAGNOSTICS = 200;
const MAX_VALIDATION_FILES = 64;
const MAX_VALIDATION_BYTES = 20 * 1024;

export type ValidationScope = "document" | "workspace";
export type ValidationSeverity = "all" | "error" | "warning";

export interface ValidationRequest {
  readonly paths?: readonly string[];
  readonly scope: ValidationScope;
  readonly severity: ValidationSeverity;
}

export interface ValidationOutcome {
  readonly diagnostics: readonly FileDiagnostics[];
  readonly omitted: number;
  readonly scope: ValidationScope;
  readonly serverNames: readonly string[];
}

function includesSeverity(diagnostic: Diagnostic, severity: ValidationSeverity): boolean {
  if (severity === "all") return true;
  if (severity === "error") return diagnostic.severity === 1;
  return diagnostic.severity === 1 || diagnostic.severity === 2;
}

export function buildValidationOutcome(
  scope: ValidationScope,
  severity: ValidationSeverity,
  serverNames: readonly string[],
  groups: readonly FileDiagnostics[],
): ValidationOutcome {
  const diagnostics: FileDiagnostics[] = [];
  const seen = new Set<string>();
  let count = 0;
  let omitted = 0;
  for (const group of groups) {
    const accepted: Diagnostic[] = [];
    for (const diagnostic of group.diagnostics) {
      if (!includesSeverity(diagnostic, severity)) continue;
      const key = JSON.stringify([
        group.path,
        diagnostic.range,
        diagnostic.severity,
        diagnostic.code,
        diagnostic.source,
        diagnostic.message,
      ]);
      if (seen.has(key)) continue;
      seen.add(key);
      if (count >= MAX_VALIDATION_DIAGNOSTICS) {
        omitted += 1;
        continue;
      }
      accepted.push(diagnostic);
      count += 1;
    }
    if (accepted.length === 0) continue;
    if (diagnostics.length >= MAX_VALIDATION_FILES) {
      omitted += accepted.length;
      continue;
    }
    diagnostics.push({ diagnostics: accepted, path: group.path });
  }
  return {
    diagnostics,
    omitted,
    scope,
    serverNames: [...new Set(serverNames)],
  };
}

function displayPath(cwd: string, path: string): string {
  if (!isAbsolute(path)) return path;
  const shown = relative(cwd, path);
  return shown.startsWith("..") ? path : shown || ".";
}

function diagnosticLine(path: string, diagnostic: Diagnostic): string {
  const severity =
    diagnostic.severity === 1 ? "error" : diagnostic.severity === 2 ? "warning" : "info";
  const code = diagnostic.code === undefined ? "" : ` ${String(diagnostic.code)}`;
  const source = diagnostic.source
    ? `${diagnostic.source}${code}: `
    : code
      ? `${code.trim()}: `
      : "";
  const message = diagnostic.message.replaceAll(/\s+/gu, " ").trim();
  return `${path}:${String(diagnostic.range.start.line + 1)}:${String(diagnostic.range.start.character + 1)} ${severity} ${source}${message}`;
}

export function renderValidationOutcome(cwd: string, outcome: ValidationOutcome): string {
  const lines = [
    `LSP ${outcome.scope} validation via ${outcome.serverNames.join(", ") || "no server"}:`,
  ];
  for (const group of outcome.diagnostics) {
    const path = displayPath(cwd, group.path);
    for (const diagnostic of group.diagnostics) lines.push(diagnosticLine(path, diagnostic));
  }
  if (outcome.omitted > 0) {
    lines.push(
      `… ${String(outcome.omitted)} additional diagnostic${outcome.omitted === 1 ? "" : "s"} omitted`,
    );
  }
  if (outcome.diagnostics.length === 0) lines.push("No matching diagnostics.");
  return truncateHead(lines.join("\n"), { maxBytes: MAX_VALIDATION_BYTES, maxLines: 240 }).content;
}
