import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
        actual.content.some((entry) => entry.type === "text" && /\[.+#[0-9A-F]{4}\]/u.test(entry.text ?? "")),
      ).toBe(false);
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
      `${Array.from({ length: 2_001 }, (_, index) => `line-${String(index + 1)}`).join("\n")}\n`,
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
      expect(output.split("\n")).toHaveLength(2_000);
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
});
