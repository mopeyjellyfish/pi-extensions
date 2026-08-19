import { basename } from "node:path";

import { getLanguageFromPath, highlightCode, type Theme } from "@earendil-works/pi-coding-agent";
import { Text, type Component } from "@earendil-works/pi-tui";

interface HashlineRenderSection {
  readonly path: string;
  readonly preview: string;
  readonly warnings: readonly string[];
}

interface HashlineRenderResult {
  readonly content: readonly { readonly text?: string; readonly type: string }[];
  readonly details?: unknown;
}

interface PreviewRow {
  readonly content: string;
  readonly language: string | undefined;
  readonly prefix: string;
}

const NUMBERED_ROW = /^(?<prefix>[1-9]\d*:)(?<content>.*)$/u;
const FENCE_OPEN = /^\s*(?<marker>`{3,}|~{3,})\s*(?<info>[^\s`]*)/u;
const COLLAPSED_PREVIEW_LINES = 12;
const COLLAPSED_PREVIEW_EDGE_LINES = 5;

function resultText(result: HashlineRenderResult): string {
  return result.content
    .filter((entry) => entry.type === "text")
    .map((entry) => entry.text ?? "")
    .join("\n");
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function callPath(input: unknown): string | undefined {
  if (!isRecord(input) || typeof input["input"] !== "string") return undefined;
  const header = input["input"].split("\n", 1)[0] ?? "";
  const match = /^\[(?<path>.+)#[0-9A-F]{4}\]$/u.exec(header);
  const path = match?.groups?.["path"];
  return path === undefined ? undefined : basename(path);
}

function previewForDisplay(preview: string, expanded: boolean): string {
  const lines = preview.split("\n");
  if (expanded || lines.length <= COLLAPSED_PREVIEW_LINES) return preview;
  return [
    ...lines.slice(0, COLLAPSED_PREVIEW_EDGE_LINES),
    "… expand for full preview",
    ...lines.slice(-COLLAPSED_PREVIEW_EDGE_LINES),
  ].join("\n");
}

function closesFence(content: string, marker: string, minimumLength: number): boolean {
  const candidate = content.trim();
  return candidate.length >= minimumLength && candidate === marker.repeat(candidate.length);
}

function sectionsFromDetails(details: unknown): HashlineRenderSection[] {
  if (!isRecord(details) || !Array.isArray(details["hashlineSections"])) return [];
  const sections: HashlineRenderSection[] = [];
  for (const value of details["hashlineSections"]) {
    if (!isRecord(value)) continue;
    const { path, preview, warnings } = value;
    if (
      typeof path !== "string" ||
      typeof preview !== "string" ||
      !Array.isArray(warnings) ||
      warnings.some((warning) => typeof warning !== "string")
    )
      continue;
    sections.push({ path, preview, warnings });
  }
  return sections;
}

function fenceLanguage(info: string): string | undefined {
  if (info.length === 0) return undefined;
  return getLanguageFromPath(`snippet.${info}`) ?? info;
}

function unnumberedLanguage(line: string, fileLanguage: string | undefined): string | undefined {
  if (line.startsWith("…")) return undefined;
  return fileLanguage;
}

function previewRows(preview: string, path: string): PreviewRow[] {
  const fileLanguage = getLanguageFromPath(path);
  const markdown = fileLanguage === "markdown";
  let fenced: { language: string | undefined; marker: string; minimumLength: number } | undefined;
  return preview.split("\n").map((line) => {
    const match = NUMBERED_ROW.exec(line);
    if (match?.groups === undefined) {
      const language = unnumberedLanguage(line, fileLanguage);
      return { content: line, language, prefix: "" };
    }
    const content = match.groups["content"] ?? "";
    const prefix = match.groups["prefix"] ?? "";
    if (!markdown) return { content, language: fileLanguage, prefix };
    if (fenced !== undefined && closesFence(content, fenced.marker, fenced.minimumLength)) {
      fenced = undefined;
      return { content, language: "markdown", prefix };
    }
    if (fenced === undefined) {
      const opening = FENCE_OPEN.exec(content);
      if (opening?.groups !== undefined) {
        const marker = opening.groups["marker"] ?? "```";
        fenced = {
          language: fenceLanguage(opening.groups["info"] ?? ""),
          marker: marker.charAt(0),
          minimumLength: marker.length,
        };
        return { content, language: "markdown", prefix };
      }
    }
    return { content, language: fenced?.language ?? "markdown", prefix };
  });
}

function highlightedPreview(
  section: HashlineRenderSection,
  theme: Theme,
  expanded: boolean,
): string {
  const rows = previewRows(previewForDisplay(section.preview, expanded), section.path);
  const rendered: string[] = [];
  for (let start = 0; start < rows.length;) {
    const language = rows[start]?.language;
    let end = start + 1;
    while (end < rows.length && rows[end]?.language === language) end++;
    const run = rows.slice(start, end);
    const highlighted = highlightCode(run.map((row) => row.content).join("\n"), language);
    for (let index = 0; index < run.length; index++) {
      const row = run[index];
      if (row === undefined) continue;
      rendered.push(theme.fg("dim", row.prefix) + (highlighted[index] ?? row.content));
    }
    start = end;
  }
  return rendered.join("\n");
}

export function renderHashlineCall(input: unknown, theme: Theme): Component {
  const path = callPath(input);
  const suffix = path === undefined ? " …" : ` ${path}`;
  return new Text(theme.fg("toolTitle", theme.bold("edit")) + theme.fg("muted", suffix), 0, 0);
}

export function renderHashlineResult(
  result: HashlineRenderResult,
  options: { readonly expanded: boolean; readonly isPartial: boolean },
  theme: Theme,
  isError: boolean,
): Component {
  if (options.isPartial) return new Text(theme.fg("warning", "Applying Hashline edit…"), 0, 0);
  if (isError) return new Text(theme.fg("error", resultText(result)), 0, 0);

  const sections = sectionsFromDetails(result.details);
  if (sections.length === 0) return new Text(theme.fg("toolOutput", resultText(result)), 0, 0);
  const rendered = sections.map((section) => {
    const warnings = section.warnings.map((warning) => theme.fg("warning", `warning: ${warning}`));
    return [
      theme.fg("muted", basename(section.path)),
      ...warnings,
      highlightedPreview(section, theme, options.expanded),
    ]
      .filter((line) => line.length > 0)
      .join("\n");
  });
  return new Text(rendered.join("\n\n"), 0, 0);
}
