import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createReadToolDefinition } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";

import hashlineExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface Tool {
  readonly name: string;
  execute(
    id: string,
    input: Record<string, unknown>,
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<{
    readonly content: readonly {
      readonly data?: string;
      readonly mimeType?: string;
      readonly text?: string;
      readonly type: string;
    }[];
    readonly details?: unknown;
  }>;
}

function register(): Map<string, Tool> {
  const tools = new Map<string, Tool>();
  hashlineExtension({
    registerTool: (tool: Tool) => tools.set(tool.name, tool),
  } as unknown as ExtensionAPI);
  return tools;
}

function tagFrom(output: string): string {
  const tag = /\[.+#([0-9A-F]{4})\]/u.exec(output)?.[1];
  if (tag === undefined) throw new Error("Hashline read did not return an anchor tag.");
  return tag;
}

async function readTag(read: Tool, file: string, cwd: string): Promise<string> {
  const result = await read.execute("read", { path: file }, undefined, undefined, context(cwd));
  return tagFrom(result.content[0]?.text ?? "");
}

function context(cwd: string): ExtensionContext {
  return {
    cwd,
    hasUI: false,
    mode: "print",
    sessionManager: { getBranch: () => [] },
    ui: {},
  } as unknown as ExtensionContext;
}

describe("Hashline extension", () => {
  it("reads an anchor then applies one tagged range replacement", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "fixture.txt");
    await writeFile(file, "alpha\nbeta\ngamma\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      expect(read).toBeDefined();
      expect(edit).toBeDefined();
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");

      const observed = await read.execute(
        "read",
        { path: file },
        undefined,
        undefined,
        context(directory),
      );
      const output = observed.content[0]?.text ?? "";
      const tag = /\[.+#([0-9A-F]{4})\]/u.exec(output)?.[1];
      expect(tag).toBeDefined();
      await edit.execute(
        "edit",
        { input: `[${file}#${tag ?? ""}]\nPUT 2.=2:\n+BETA` },
        undefined,
        undefined,
        context(directory),
      );
      await expect(readFile(file, "utf8")).resolves.toBe("alpha\nBETA\ngamma\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("accepts @-prefixed cwd-relative read paths", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    await writeFile(join(directory, "fixture.txt"), "one\n");
    try {
      const read = register().get("read");
      if (read === undefined) throw new Error("Hashline read tool was not registered.");
      const result = await read.execute(
        "read",
        { path: "@fixture.txt" },
        undefined,
        undefined,
        context(directory),
      );
      expect(result.content[0]?.text).toContain("1:one");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects duplicate canonical targets and a late-invalid section before writing either file", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const first = join(directory, "first.ts");
    const second = join(directory, "second.ts");
    await writeFile(first, "one\n");
    await writeFile(second, "two\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const firstTag = await readTag(read, first, directory);
      const secondTag = await readTag(read, second, directory);
      await expect(
        edit.execute(
          "edit",
          {
            input: `[first.ts#${firstTag}]\nPUT 1-1:\n+ONE\n[./first.ts#${firstTag}]\nPUT 1-1:\n+ONE`,
          },
          undefined,
          undefined,
          context(directory),
        ),
      ).rejects.toThrow(/duplicate|same file|section/i);
      await expect(readFile(first, "utf8")).resolves.toBe("one\n");
      await expect(
        edit.execute(
          "edit",
          {
            input: `[first.ts#${firstTag}]\nPUT 1-1:\n+ONE\n[second.ts#${secondTag === "FFFF" ? "0000" : "FFFF"}]\nPUT 1-1:\n+TWO`,
          },
          undefined,
          undefined,
          context(directory),
        ),
      ).rejects.toThrow(/tag|hash|session|mismatch/i);
      await expect(readFile(first, "utf8")).resolves.toBe("one\n");
      await expect(readFile(second, "utf8")).resolves.toBe("two\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("moves named-register content across sections and roots move and removal under cwd", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const source = join(directory, "source.ts");
    const target = join(directory, "target.ts");
    const moved = join(directory, "moved.ts");
    await writeFile(source, "keep\nmove\n");
    await writeFile(target, "target\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const sourceTag = await readTag(read, source, directory);
      const targetTag = await readTag(read, target, directory);
      const applied = await edit.execute(
        "edit",
        {
          input: `[source.ts#${sourceTag}]\nCUT 2 @moved\n[target.ts#${targetTag}]\nPUT >$ @moved`,
        },
        undefined,
        undefined,
        context(directory),
      );
      await expect(readFile(source, "utf8")).resolves.toBe("keep\n");
      await expect(readFile(target, "utf8")).resolves.toBe("target\nmove\n");
      const targetFreshTag = await readTag(read, target, directory);
      await edit.execute(
        "edit",
        { input: `[target.ts#${targetFreshTag}]\nMV moved.ts` },
        undefined,
        undefined,
        context(directory),
      );
      await expect(readFile(moved, "utf8")).resolves.toBe("target\nmove\n");
      const movedTag = await readTag(read, moved, directory);
      await edit.execute(
        "edit",
        { input: `[moved.ts#${movedTag}]\nREM` },
        undefined,
        undefined,
        context(directory),
      );
      await expect(readFile(moved, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
      expect(applied.content[0]?.text).toContain("Applied Hashline edit.");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects duplicate sections addressed through symlink aliases", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const target = join(directory, "target.txt");
    const alias = join(directory, "alias.txt");
    await writeFile(target, "before\n");
    await symlink(target, alias);
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const targetTag = await readTag(read, target, directory);
      const aliasTag = await readTag(read, alias, directory);
      await expect(
        edit.execute(
          "edit",
          {
            input:
              `[target.txt#${targetTag}]\nPUT 1.=1:\n+first\n` +
              `[alias.txt#${aliasTag}]\nPUT 1.=1:\n+second`,
          },
          undefined,
          undefined,
          context(directory),
        ),
      ).rejects.toThrow(/duplicate|conflicting canonical/i);
      await expect(readFile(target, "utf8")).resolves.toBe("before\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects move destinations that conflict with another section before either write", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const source = join(directory, "source.txt");
    const destination = join(directory, "destination.txt");
    await writeFile(source, "source\n");
    await writeFile(destination, "destination\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const sourceTag = await readTag(read, source, directory);
      const destinationTag = await readTag(read, destination, directory);

      await expect(
        edit.execute(
          "edit",
          {
            input:
              `[source.txt#${sourceTag}]\nMV destination.txt\n` +
              `[destination.txt#${destinationTag}]\nPUT 1.=1:\n+changed`,
          },
          undefined,
          undefined,
          context(directory),
        ),
      ).rejects.toThrow(/duplicate|same canonical|same file/i);
      await expect(readFile(source, "utf8")).resolves.toBe("source\n");
      await expect(readFile(destination, "utf8")).resolves.toBe("destination\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("renders every warning and truncates multi-file edit output at Pi limits", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "fixture.txt");
    await writeFile(file, "one\ntwo\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const tag = await readTag(read, file, directory);
      const replacement = Array.from({ length: 2100 }, (_, index) => `+row-${String(index)}`).join(
        "\n",
      );
      const result = await edit.execute(
        "edit",
        { input: `[fixture.txt#${tag}]\nCUT 1:\nPUT 2.=2:\n${replacement}` },
        undefined,
        undefined,
        context(directory),
      );
      const output = result.content[0]?.text ?? "";
      expect(output).toContain("warning:");
      expect(output).toContain("…");
      expect(output).not.toContain("truncated");
      expect(output.split("\n").length).toBeLessThanOrEqual(2000);
      expect(Buffer.byteLength(output, "utf8")).toBeLessThanOrEqual(50_000);
      const details = result.details as { readonly diff?: string };
      expect(details.diff).toContain("…");
      expect(details.diff).not.toContain("truncated");
      expect(details.diff?.split("\n").length).toBeLessThanOrEqual(2000);
      expect(Buffer.byteLength(details.diff ?? "", "utf8")).toBeLessThanOrEqual(50_000);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("adds a truncation marker after removing preview rows that leave no room for it", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const files = [join(directory, "many-a.txt"), join(directory, "many-b.txt")];
    const source = `${Array.from({ length: 1999 }, (_, index) => `old-${String(index + 1)}`).join("\n")}\n`;
    await Promise.all(files.map((file) => writeFile(file, source)));
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const tags = await Promise.all(files.map((file) => readTag(read, file, directory)));
      const input = Array.from(
        { length: 1000 },
        (_, index) => `PUT ${String(index * 2 + 1)}:\n+new-${String(index + 1)}`,
      ).join("\n");
      const result = await edit.execute(
        "edit",
        {
          input: files.map((file, index) => `[${file}#${tags[index] ?? ""}]\n${input}`).join("\n"),
        },
        undefined,
        undefined,
        context(directory),
      );
      const text = result.content[0]?.text ?? "";
      expect(text).toContain("Hashline output truncated");
      expect(text.split("\n").length).toBeLessThanOrEqual(2000);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("delegates a supported image processing fallback unchanged without minting an anchor", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "pixel.png");
    await writeFile(
      file,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL5JwAAAABJRU5ErkJggg==",
        "base64",
      ),
    );
    try {
      const read = register().get("read");
      if (read === undefined) throw new Error("Hashline read tool was not registered.");
      const ctx = context(directory);
      const expected = await createReadToolDefinition(directory).execute(
        "image",
        { path: file },
        undefined,
        undefined,
        ctx,
      );
      const actual = await read.execute("image", { path: file }, undefined, undefined, ctx);

      expect(expected.content).toEqual([
        {
          text: "Read image file [image/png]\n[Image omitted: could not be resized below the inline image size limit.]",
          type: "text",
        },
      ]);
      expect(actual).toEqual(expected);
      expect(
        actual.content.some(
          (entry) => entry.type === "text" && /\[.+#[0-9A-F]{4}\]/u.test(entry.text ?? ""),
        ),
      ).toBe(false);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("aborts after the built-in text read before minting a Hashline anchor", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "fixture.txt");
    await writeFile(file, "one\n");
    try {
      const read = register().get("read");
      if (read === undefined) throw new Error("Hashline read tool was not registered.");
      const outcomes = await Promise.all(
        Array.from({ length: 8 }, async (_, abortAfter) => {
          let checks = 0;
          const afterBuiltIn = {
            get aborted(): boolean {
              // The built-in reader's cancellation checks are an external
              // boundary. Sweep the transition point to prove the adapter
              // checks again before it records an anchor.
              return checks++ >= abortAfter;
            },
            addEventListener: () => {
              void checks;
            },
            removeEventListener: () => {
              void checks;
            },
          } as unknown as AbortSignal;
          try {
            await read.execute("read", { path: file }, afterBuiltIn, undefined, context(directory));
            return "completed";
          } catch (error) {
            return error instanceof Error ? error.message : String(error);
          }
        }),
      );
      expect(outcomes).toContain("Operation aborted");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("anchors empty, offset-limited, and byte-limited text reads without authorizing omitted rows", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const empty = join(directory, "empty.txt");
    const rows = join(directory, "rows.txt");
    const wide = join(directory, "wide.txt");
    try {
      await writeFile(empty, "");
      await writeFile(rows, "one\ntwo\nthree");
      await writeFile(wide, `${Array.from({ length: 30 }, () => "x".repeat(2000)).join("\n")}\n`);
      const read = register().get("read");
      if (read === undefined) throw new Error("Hashline read tool was not registered.");
      const ctx = context(directory);
      const emptyResult = await read.execute("read", { path: empty }, undefined, undefined, ctx);
      expect(emptyResult.content[0]?.text).toMatch(/\[.+#[0-9A-F]{4}\]/u);
      const offset = await read.execute(
        "read",
        { path: rows, offset: 2, limit: 1 },
        undefined,
        undefined,
        ctx,
      );
      expect(offset.content[0]?.text).toMatch(/\n2:two$/u);
      const byteLimited = await read.execute("read", { path: wide }, undefined, undefined, ctx);
      expect(byteLimited.content[0]?.text).toMatch(/\n1:x/u);
      expect(byteLimited.content[0]?.text).not.toContain("\n30:");
      let abortChecks = 0;
      const afterBuiltInAbort = {
        get aborted(): boolean {
          return abortChecks++ > 0;
        },
        addEventListener: () => {
          void abortChecks;
        },
        removeEventListener: () => {
          void abortChecks;
        },
      } as unknown as AbortSignal;
      await expect(
        read.execute("read", { path: rows }, afterBuiltInAbort, undefined, ctx),
      ).rejects.toThrow(/aborted/i);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("bounds aggregate multi-file edit output without changing per-file writes", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const paths = Array.from({ length: 16 }, (_, index) =>
      join(directory, `fixture-${String(index)}.txt`),
    );
    const before = `${Array.from({ length: 100 }, (_, index) => `old-${String(index)}`).join("\n")}\n`;
    const replacement = Array.from({ length: 100 }, (_, index) => `+new-${String(index)}`).join(
      "\n",
    );
    try {
      await Promise.all(paths.map((path) => writeFile(path, before)));
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const sections = await Promise.all(
        paths.map(async (path) => {
          const tag = await readTag(read, path, directory);
          return `[${path}#${tag}]\nPUT 1.=100:\n${replacement}`;
        }),
      );
      const result = await edit.execute(
        "edit",
        { input: sections.join("\n") },
        undefined,
        undefined,
        context(directory),
      );
      const output = result.content[0]?.text ?? "";
      expect(output.split("\n").length).toBeLessThanOrEqual(2000);
      expect(Buffer.byteLength(output, "utf8")).toBeLessThanOrEqual(50_000);
      await expect(readFile(paths[0] ?? "", "utf8")).resolves.toContain("new-99\n");
      await expect(readFile(paths.at(-1) ?? "", "utf8")).resolves.toContain("new-99\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("does not authorize anchors omitted by the read output limit", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "large.txt");
    await writeFile(
      file,
      `${Array.from({ length: 2001 }, (_, index) => `line-${String(index + 1)}`).join("\n")}\n`,
    );
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const observed = await read.execute(
        "read",
        { path: file },
        undefined,
        undefined,
        context(directory),
      );
      const output = observed.content[0]?.text ?? "";
      const tag = /\[.+#([0-9A-F]{4})\]/u.exec(output)?.[1];
      expect(output.split("\n")).toHaveLength(2000);
      await expect(
        edit.execute(
          "edit",
          { input: `[${file}#${tag ?? ""}]\nPUT 2001.=2001:\n+changed` },
          undefined,
          undefined,
          context(directory),
        ),
      ).rejects.toThrow(/re-read|seen|display/i);
      await expect(readFile(file, "utf8")).resolves.toContain("line-2001\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("serializes concurrent reversed multi-file edits without queue-order deadlock", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const a = join(directory, "a.ts");
    const b = join(directory, "b.ts");
    await writeFile(a, "a\n");
    await writeFile(b, "b\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const aTag = await readTag(read, a, directory);
      const bTag = await readTag(read, b, directory);
      const forward = `[a.ts#${aTag}]\nPUT 1-1:\n+A\n[b.ts#${bTag}]\nPUT 1-1:\n+B`;
      const reverse = `[b.ts#${bTag}]\nPUT 1-1:\n+B\n[a.ts#${aTag}]\nPUT 1-1:\n+A`;
      const settled = await Promise.race([
        Promise.allSettled([
          edit.execute("edit", { input: forward }, undefined, undefined, context(directory)),
          edit.execute("edit", { input: reverse }, undefined, undefined, context(directory)),
        ]),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("queue deadlock"));
          }, 1000);
        }),
      ]);
      expect(settled.some((result) => result.status === "fulfilled")).toBe(true);
      await expect(readFile(a, "utf8")).resolves.toBe("A\n");
      await expect(readFile(b, "utf8")).resolves.toBe("B\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("returns fresh headers and compact multi-file edit details", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const a = join(directory, "a.ts");
    const b = join(directory, "b.ts");
    await writeFile(a, "a\n");
    await writeFile(b, "b\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const aTag = await readTag(read, a, directory);
      const bTag = await readTag(read, b, directory);
      const result = await edit.execute(
        "edit",
        { input: `[a.ts#${aTag}]\nPUT 1-1:\n+A\n[b.ts#${bTag}]\nPUT 1-1:\n+B` },
        undefined,
        undefined,
        context(directory),
      );
      const text = result.content[0]?.text ?? "";
      expect(text).toMatch(/\[a\.ts#[0-9A-F]{4}\]/u);
      expect(text).toMatch(/\[b\.ts#[0-9A-F]{4}\]/u);
      const details = result.details as { readonly diff: string; readonly patch: string };
      expect(details.diff).toContain("1:A");
      expect(details.diff).toContain("1:B");
      expect(details.diff).not.toContain("+1 A");
      expect(Buffer.byteLength(details.diff, "utf8")).toBeLessThan(4096);
      expect(Buffer.byteLength(text, "utf8")).toBeLessThan(4096);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("renders a padded Pi diff as a compact post-edit preview", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "fixture.txt");
    const before = `${Array.from({ length: 12 }, (_, index) => `line${String(index + 1)}`).join("\n")}\n`;
    await writeFile(file, before);
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const tag = await readTag(read, file, directory);
      const result = await edit.execute(
        "edit",
        { input: `[fixture.txt#${tag}]\nPUT 3.=3:\n+LINE3` },
        undefined,
        undefined,
        context(directory),
      );
      const details = result.details as { readonly diff: string };
      expect(details.diff).toContain("3:LINE3");
      expect(details.diff).not.toContain("- 3 ");
      expect(details.diff).not.toContain("+ 3 ");
      expect(details.diff.split("\n").every((line) => line === "…" || /^\d+:/u.test(line))).toBe(
        true,
      );
      await expect(readFile(file, "utf8")).resolves.toContain("LINE3\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("does not mutate when the edit signal is aborted before commit", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "fixture.txt");
    await writeFile(file, "alpha\nbeta\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const tag = await readTag(read, file, directory);
      const controller = new AbortController();
      controller.abort();
      await expect(
        edit.execute(
          "edit",
          { input: `[fixture.txt#${tag}]\nPUT 2.=2:\n+BETA` },
          controller.signal,
          undefined,
          context(directory),
        ),
      ).rejects.toThrow(/aborted/i);
      await expect(readFile(file, "utf8")).resolves.toBe("alpha\nbeta\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("finishes a prepared multi-file commit after aborting during its first write", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const first = join(directory, "first.txt");
    const second = join(directory, "second.txt");
    await writeFile(first, "one\n");
    await writeFile(second, "two\n");
    const signal = {
      get aborted(): boolean {
        return readFileSync(first, "utf8") === "ONE\n";
      },
    } as AbortSignal;
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const firstTag = await readTag(read, first, directory);
      const secondTag = await readTag(read, second, directory);

      await expect(
        edit.execute(
          "edit",
          {
            input: `[first.txt#${firstTag}]\nPUT 1.=1:\n+ONE\n[second.txt#${secondTag}]\nPUT 1.=1:\n+TWO`,
          },
          signal,
          undefined,
          context(directory),
        ),
      ).resolves.toMatchObject({
        details: { hashlineSections: [{ path: "first.txt" }, { path: "second.txt" }] },
      });
      await expect(readFile(first, "utf8")).resolves.toBe("ONE\n");
      await expect(readFile(second, "utf8")).resolves.toBe("TWO\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("preserves BOM and CRLF through the public edit tool", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "fixture.txt");
    await writeFile(file, "\u{FEFF}alpha\r\nbeta\r\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const tag = await readTag(read, file, directory);
      await edit.execute(
        "edit",
        { input: `[fixture.txt#${tag}]\nPUT 2.=2:\n+BETA` },
        undefined,
        undefined,
        context(directory),
      );
      await expect(readFile(file, "utf8")).resolves.toBe("\u{FEFF}alpha\r\nBETA\r\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("does not write for an unknown tag", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const file = join(directory, "fixture.txt");
    await writeFile(file, "alpha\nbeta\n");
    try {
      const edit = register().get("edit");
      if (edit === undefined) throw new Error("Hashline edit tool was not registered.");
      await expect(
        edit.execute(
          "edit",
          { input: `[${file}#FFFF]\nPUT 2.=2:\n+BETA` },
          undefined,
          undefined,
          context(directory),
        ),
      ).rejects.toThrow(/not from this session|mismatch|tag/i);
      await expect(readFile(file, "utf8")).resolves.toBe("alpha\nbeta\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("recovers a cwd-relative path from a read tag and bounds a single oversized edit result", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-"));
    const nested = join(directory, "nested");
    const file = join(nested, "fixture.txt");
    await mkdir(nested);
    await writeFile(file, "before\nsecond\n");
    try {
      const tools = register();
      const read = tools.get("read");
      const edit = tools.get("edit");
      if (read === undefined || edit === undefined)
        throw new Error("Hashline tools were not registered.");
      const tag = await readTag(read, file, directory);
      const liveSignal = new AbortController().signal;
      await expect(
        read.execute("read", { path: file }, liveSignal, undefined, context(directory)),
      ).resolves.toMatchObject({ content: [{ type: "text" }] });
      const oversized = "x".repeat(60_000);
      const result = await edit.execute(
        "edit",
        { input: `[fixture.txt#${tag}]\nCUT 1\nPUT 2.=2:\n+${oversized}` },
        undefined,
        undefined,
        context(directory),
      );
      const output = result.content[0]?.text ?? "";
      expect(output).toContain("Hashline output truncated");
      expect(Buffer.byteLength(output, "utf8")).toBeLessThanOrEqual(50_000);
      await expect(readFile(file, "utf8")).resolves.toBe(`${oversized}\n`);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
