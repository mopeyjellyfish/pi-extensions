import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  createReadToolDefinition,
  createWriteToolDefinition,
  generateDiffString,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  defineTool,
  withFileMutationQueue,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import {
  formatHashlineHeader,
  formatNumberedLine,
  normalizeToLF,
  buildCompactDiffPreview,
  InMemorySnapshotStore,
  initializeSyntax,
  NodeFilesystem,
  type Clipboard,
  type PreflightWriteOptions,
  Patch,
  Patcher,
  resolveTreeSitterBlock,
  stripBom,
} from "./hashline/index.ts";
import { detailsFor, restoreState, type HashlineToolDetails } from "./state.ts";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const editParameters = Type.Object(
  { input: Type.String({ description: "Hashline patch input headed by [PATH#TAG]." }) },
  { additionalProperties: false },
);

function absolutePath(path: string, cwd: string): string {
  return resolve(cwd, path.replace(/^@/u, ""));
}

/** Pi accepts cwd-relative and absolute paths; this adapter canonicalizes both for snapshot keys. */
class PiFilesystem extends NodeFilesystem {
  readonly root: string;
  private readonly signal: AbortSignal | undefined;
  private commitStarted = false;

  constructor(root: string, signal: AbortSignal | undefined) {
    super();
    this.root = root;
    this.signal = signal;
  }

  private assertNotAborted(): void {
    if (this.signal?.aborted) throw new Error("Operation aborted before filesystem mutation.");
  }

  /** The first irreversible mutation is cancellable; a started batch reports landed truth. */
  private beginCommit(): void {
    if (this.commitStarted) return;
    this.assertNotAborted();
    this.commitStarted = true;
  }

  private path(path: string): string {
    return absolutePath(path, this.root);
  }

  override readText(path: string): Promise<string> {
    this.assertNotAborted();
    return super.readText(this.path(path));
  }

  override readBinary(path: string): Promise<Uint8Array> {
    this.assertNotAborted();
    return super.readBinary(this.path(path));
  }

  override async preflightWrite(path: string, options?: PreflightWriteOptions): Promise<void> {
    this.assertNotAborted();
    await super.preflightWrite(this.path(path), options);
  }

  override writeText(path: string, content: string) {
    this.beginCommit();
    return super.writeText(this.path(path), content);
  }

  override delete(path: string): Promise<void> {
    this.beginCommit();
    return super.delete(this.path(path));
  }

  override move(from: string, to: string, content?: string): Promise<void> {
    this.beginCommit();
    return super.move(this.path(from), this.path(to), content);
  }

  override exists(path: string): Promise<boolean> {
    this.assertNotAborted();
    return super.exists(this.path(path));
  }

  override canonicalPath(path: string): string {
    return super.canonicalPath(this.path(path));
  }

  override allowTagPathRecovery(authoredPath: string, resolvedPath: string): boolean {
    return super.allowTagPathRecovery(this.path(authoredPath), this.path(resolvedPath));
  }
}

function compareCodePoints(left: string, right: string): number {
  return Number(left > right) - Number(left < right);
}

const OUTPUT_TRUNCATION = "[Hashline output truncated at Pi's 2,000-line/50-KB limit.]";

function boundedToolText(text: string): string {
  const output: string[] = [];
  let bytes = 0;
  for (const line of text.split("\n")) {
    const separator = output.length === 0 ? "" : "\n";
    const nextBytes = Buffer.byteLength(`${separator}${line}`, "utf8");
    if (output.length + 1 > DEFAULT_MAX_LINES || bytes + nextBytes > DEFAULT_MAX_BYTES) {
      const markerBytes = Buffer.byteLength(
        `${output.length === 0 ? "" : "\n"}${OUTPUT_TRUNCATION}`,
        "utf8",
      );
      while (
        output.length > 0 &&
        (output.length + 1 > DEFAULT_MAX_LINES || bytes + markerBytes > DEFAULT_MAX_BYTES)
      ) {
        const removed = output.pop() ?? "";
        bytes -= Buffer.byteLength(`${output.length === 0 ? "" : "\n"}${removed}`, "utf8");
      }
      return [...output, OUTPUT_TRUNCATION].join("\n");
    }
    output.push(line);
    bytes += nextBytes;
  }
  return text;
}

function withMutationQueues<T>(paths: readonly string[], callback: () => Promise<T>): Promise<T> {
  if (paths.length === 0) return callback();
  const path = paths[0];
  if (path === undefined) return callback();
  return withFileMutationQueue(path, () => withMutationQueues(paths.slice(1), callback));
}

function boundedAnchoredText(
  path: string,
  tag: string,
  text: string,
  offset: number | undefined,
  limit: number | undefined,
): { readonly seenLines: readonly number[]; readonly text: string } {
  const lines = text.split("\n");
  const finalLine: string | undefined = lines.at(-1);
  if (finalLine === "") lines.pop();
  const start = Math.max(0, (offset ?? 1) - 1);
  const selected = lines.slice(start, limit === undefined ? undefined : start + limit);
  const output = [formatHashlineHeader(path, tag)];
  const seenLines: number[] = [];
  let bytes = Buffer.byteLength(output[0] ?? "", "utf8");
  for (let index = 0; index < selected.length && index < DEFAULT_MAX_LINES - 1; index++) {
    const row = formatNumberedLine(start + index + 1, selected[index] ?? "");
    const rowBytes = Buffer.byteLength(`\n${row}`, "utf8");
    if (bytes + rowBytes > DEFAULT_MAX_BYTES) break;
    output.push(row);
    seenLines.push(start + index + 1);
    bytes += rowBytes;
  }
  return { seenLines, text: output.join("\n") };
}

function isBuiltInImageResult(result: {
  readonly content: readonly { readonly text?: string; readonly type: string }[];
}): boolean {
  return result.content.some(
    (entry) => entry.type === "image" || entry.text?.startsWith("Read image file [") === true,
  );
}

export * from "./hashline/index.ts";

export default function hashlineExtension(pi: ExtensionAPI): void {
  const snapshots = new InMemorySnapshotStore();
  const clipboard: Clipboard = {};

  pi.on("session_start", async (event, ctx) => {
    if (event.reason === "new") {
      snapshots.clear();
      clipboard.named?.clear();
      return;
    }
    await restoreState(ctx, snapshots, clipboard);
  });
  pi.on("session_shutdown", () => {
    snapshots.clear();
    clipboard.named?.clear();
  });

  pi.registerTool(
    defineTool({
      ...createReadToolDefinition(process.cwd()),
      async execute(id, input, signal, update, ctx) {
        const path = new PiFilesystem(ctx.cwd, signal).canonicalPath(input.path);
        return withFileMutationQueue(path, async () => {
          const builtIn = createReadToolDefinition(ctx.cwd);
          const result = await builtIn.execute(id, input, signal, update, ctx);
          if (isBuiltInImageResult(result)) return result;
          if (signal?.aborted) throw new Error("Operation aborted");
          const raw = await readFile(path, "utf8");
          if (signal?.aborted) throw new Error("Operation aborted");
          const normalized = normalizeToLF(stripBom(raw).text);
          const tag = snapshots.record(path, normalized);
          const anchored = boundedAnchoredText(path, tag, normalized, input.offset, input.limit);
          snapshots.recordSeenLines(path, tag, anchored.seenLines);
          return {
            content: [{ type: "text" as const, text: anchored.text }],
            details: { ...result.details, ...detailsFor(snapshots, clipboard, [path]) },
          };
        });
      },
    }),
  );

  const { renderResult: builtInWriteRenderer, ...builtInWrite } = createWriteToolDefinition(
    process.cwd(),
  );
  pi.registerTool(
    defineTool<typeof builtInWrite.parameters, HashlineToolDetails>({
      ...builtInWrite,
      ...(builtInWriteRenderer === undefined
        ? {}
        : {
            renderResult(result, options, theme, context) {
              return builtInWriteRenderer(
                { ...result, details: undefined },
                options,
                theme,
                context,
              );
            },
          }),
      async execute(_id, { path, content }, signal, _update, ctx) {
        const absolute = new PiFilesystem(ctx.cwd, signal).canonicalPath(path);
        return withFileMutationQueue(absolute, async () => {
          if (signal?.aborted) throw new Error("Operation aborted");
          await mkdir(dirname(absolute), { recursive: true });
          if (signal?.aborted) throw new Error("Operation aborted");
          await writeFile(absolute, content, "utf8");
          const normalized = normalizeToLF(stripBom(content).text);
          snapshots.record(absolute, normalized);
          return {
            content: [
              {
                type: "text",
                text: `Successfully wrote ${String(content.length)} bytes to ${path}`,
              },
            ],
            details: detailsFor(snapshots, clipboard, [absolute]),
          };
        });
      },
    }),
  );

  pi.registerTool(
    defineTool({
      name: "edit",
      label: "edit",
      description: "Apply a Hashline patch to an observed file using its [PATH#TAG] anchor.",
      executionMode: "sequential",
      promptSnippet: "Apply an anchored Hashline edit to an existing file",
      promptGuidelines: [
        "Use edit only with a [PATH#TAG] returned by read; use write for new files.",
      ],
      parameters: editParameters,
      async execute(_id, { input }, signal, _update, ctx) {
        const patch = Patch.parse(input, { cwd: ctx.cwd });
        const filesystem = new PiFilesystem(ctx.cwd, signal);
        const sourcePaths = patch.sections.map((section) => filesystem.canonicalPath(section.path));
        const moveDestinations = patch.sections.flatMap((section) => {
          const fileOp = section.fileOp;
          return fileOp?.kind === "move" ? [filesystem.canonicalPath(fileOp.dest)] : [];
        });
        const paths = [...new Set([...sourcePaths, ...moveDestinations])].sort(compareCodePoints);
        if (paths.length !== sourcePaths.length + moveDestinations.length)
          throw new Error(
            "Hashline patch cannot contain duplicate or conflicting canonical mutation targets.",
          );
        if (signal?.aborted) throw new Error("Operation aborted");
        await initializeSyntax();
        return withMutationQueues(paths, async () => {
          if (signal?.aborted) throw new Error("Operation aborted");
          const result = await new Patcher({
            blockResolver: resolveTreeSitterBlock,
            fs: filesystem,
            snapshots,
            clipboard,
          }).apply(patch);
          const preview = result.sections
            .map(
              (section) =>
                buildCompactDiffPreview(generateDiffString(section.before, section.after).diff)
                  .preview,
            )
            .join("\n");
          const warnings = result.sections.flatMap((section) =>
            section.warnings.map((warning) => `warning: ${warning}`),
          );
          const headers = result.sections.map((section) => section.header).join(" ");
          const content = boundedToolText(
            [`Applied Hashline edit. ${headers}`, ...warnings, preview].join("\n"),
          );
          const boundedPreview = boundedToolText([...warnings, preview].join("\n"));
          const firstChangedSection = result.sections.find(
            (section) => section.firstChangedLine !== undefined,
          );
          return {
            content: [{ type: "text" as const, text: content }],
            details: {
              diff: boundedPreview,
              patch: input,
              hashlineSections: result.sections.map((section) => ({
                header: section.header,
                path: section.path,
                warnings: section.warnings,
              })),
              ...detailsFor(
                snapshots,
                clipboard,
                result.sections.map((section) => filesystem.canonicalPath(section.path)),
              ),
              ...(firstChangedSection?.firstChangedLine === undefined
                ? {}
                : { firstChangedLine: firstChangedSection.firstChangedLine }),
            },
          };
        });
      },
    }),
  );
}
