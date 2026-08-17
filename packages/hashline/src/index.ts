import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createReadToolDefinition,
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
  NodeFilesystem,
  Patch,
  Patcher,
  InMemorySnapshotStore,
  stripBom,
} from "./hashline/index.ts";

import type { ExtensionAPI, ReadToolDetails } from "@earendil-works/pi-coding-agent";

const editParameters = Type.Object(
  { input: Type.String({ description: "Hashline patch input headed by [PATH#TAG]." }) },
  { additionalProperties: false },
);

function absolutePath(path: string, cwd: string): string {
  return resolve(cwd, path.startsWith("@") ? path.slice(1) : path);
}

function boundedAnchoredText(
  path: string,
  tag: string,
  text: string,
  offset: number | undefined,
  limit: number | undefined,
): { readonly seenLines: readonly number[]; readonly text: string } {
  const lines = text.split("\n");
  if (lines.length > 1 && lines.at(-1) === "") lines.pop();
  const start = Math.max(0, (offset ?? 1) - 1);
  const selected = lines.slice(start, limit === undefined ? undefined : start + limit);
  const output = [formatHashlineHeader(path, tag)];
  const seenLines: number[] = [];
  let bytes = Buffer.byteLength(output[0], "utf8");
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

function isBuiltInImageResult(
  result: { readonly content: readonly { readonly text?: string; readonly type: string }[] },
): boolean {
  return result.content.some(
    (entry) => entry.type === "image" || entry.text?.startsWith("Read image file [") === true,
  );
}

export * from "./hashline/index.ts";

export default function hashlineExtension(pi: ExtensionAPI): void {
  const snapshots = new InMemorySnapshotStore();
  const filesystem = new NodeFilesystem();

  pi.registerTool(
    defineTool({
      ...createReadToolDefinition(process.cwd()),
      async execute(id, input, signal, update, ctx) {
        const builtIn = createReadToolDefinition(ctx.cwd);
        const result = await builtIn.execute(id, input, signal, update, ctx);
        if (isBuiltInImageResult(result)) return result;
        if (signal?.aborted) throw new Error("Operation aborted");
        const path = absolutePath(input.path, ctx.cwd);
        const raw = await readFile(path, "utf8");
        if (signal?.aborted) throw new Error("Operation aborted");
        const normalized = normalizeToLF(stripBom(raw).text);
        const tag = snapshots.record(path, normalized);
        const anchored = boundedAnchoredText(path, tag, normalized, input.offset, input.limit);
        snapshots.recordSeenLines(path, tag, anchored.seenLines);
        return {
          content: [{ type: "text" as const, text: anchored.text }],
          details: result.details as ReadToolDetails | undefined,
        };
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
        const patch = Patch.parse(input);
        if (patch.sections.length !== 1)
          throw new Error("Slice 001 accepts one Hashline file section.");
        const path = absolutePath(patch.sections[0]?.path ?? "", ctx.cwd);
        return withFileMutationQueue(path, async () => {
          if (signal?.aborted) throw new Error("Operation aborted");
          const result = await new Patcher({ fs: filesystem, snapshots }).apply(patch);
          if (signal?.aborted) throw new Error("Operation aborted");
          const section = result.sections[0];
          if (section === undefined) throw new Error("Hashline patch did not produce a section.");
          return {
            content: [{ type: "text" as const, text: `Applied Hashline edit. ${section.header}` }],
            details: { diff: "", patch: input, firstChangedLine: section.firstChangedLine },
          };
        });
      },
    }),
  );
}
