import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  Filesystem,
  formatGapLocator,
  formatHashlineHeader,
  formatInsertHeader,
  formatNumberedLines,
  formatRegister,
  formatReplaceHeader,
  InMemoryFilesystem,
  isNotFound,
  isReadMetadataLine,
  MismatchError,
  NodeFilesystem,
  Patch,
  parseTag,
  splitAddressableFileLines,
  Tokenizer,
  streamHashLines,
  stripHashlinePrefixes,
  stripNewLinePrefixes,
  stripOneLeadingHashlinePrefix,
  validateLineRef,
} from "../src/hashline/index.ts";

async function collect(
  source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of streamHashLines(source, {
    maxChunkBytes: 8,
    maxChunkLines: 2,
    startLine: 3,
  }))
    chunks.push(chunk);
  return chunks;
}

describe("Hashline public primitives", () => {
  it("formats cursors, headers, registers, and addressable rows", () => {
    expect.hasAssertions();
    expect(formatReplaceHeader(2, 4)).toBe("PUT 2.=4:");
    expect(formatGapLocator({ kind: "bof" })).toBe("<1");
    expect(formatGapLocator({ kind: "eof" })).toBe(">$");
    expect(formatInsertHeader({ kind: "after_anchor", anchor: { line: 4 } })).toBe("PUT >4:");
    expect(formatRegister("saved")).toBe("@saved");
    expect(formatHashlineHeader("a.ts", "ABCD")).toBe("[a.ts#ABCD]");
    expect(splitAddressableFileLines("a\nb\n")).toEqual(["a", "b"]);
    expect(formatNumberedLines("a\nb", 4)).toBe("4:a\n5:b");
  });

  it("strips only recognized read and diff display prefixes", () => {
    expect.hasAssertions();
    expect(stripOneLeadingHashlinePrefix(">> + 12:body")).toBe("body");
    expect(stripNewLinePrefixes(["1:one", "2|two"])).toEqual(["one", "two"]);
    expect(stripNewLinePrefixes(["+one", "+two", "context"])).toEqual(["one", "two", "context"]);
    expect(stripNewLinePrefixes(["plain", "2:prefixed"])).toEqual(["plain", "2:prefixed"]);
    expect(stripHashlinePrefixes(["[a#ABCD]", "1:one", "2:two"])).toEqual(["one", "two"]);
    expect(stripHashlinePrefixes(["1:one", "plain"])).toEqual(["1:one", "plain"]);
    expect(isReadMetadataLine("[...3 ln elided; re-read needed ranges with read]")).toBe(true);
    expect(isReadMetadataLine("source text")).toBe(false);
  });

  it("streams split UTF-8, CRLF, empty, and Web readable sources into bounded rows", async () => {
    expect.hasAssertions();
    const encoder = new TextEncoder();
    const split = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("alpha\r"));
        controller.enqueue(encoder.encode("\nbeta\n"));
        controller.close();
      },
    });
    await expect(collect(split)).resolves.toEqual(["3:alpha", "4:beta"]);
    const empty = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    await expect(collect(empty)).resolves.toEqual(["3:"]);
  });

  it("reports malformed anchors and mismatch context without treating missing files as ordinary errors", async () => {
    expect.hasAssertions();
    expect(parseTag(" * 42:body")).toEqual({ line: 42 });
    expect(() => {
      parseTag("zero");
    }).toThrow(/Invalid line reference/);
    expect(() => {
      validateLineRef({ line: 3 }, ["one"]);
    }).toThrow(/does not exist/);
    const mismatch = new MismatchError({
      path: "a.ts",
      expectedFileHash: "AAAA",
      actualFileHash: "BBBB",
      fileLines: ["one", "two", "three"],
      anchorLines: [2],
      hashRecognized: false,
    });
    expect(mismatch.displayMessage).toContain("not from this session");

    const memory = new InMemoryFilesystem([["a", "one"]]);
    await expect(memory.readText("missing")).rejects.toSatisfy((error) => {
      expect(isNotFound(error)).toBe(true);
      return true;
    });
    await memory.move("a", "b");
    await expect(memory.readText("b")).resolves.toBe("one");
  });

  it("classifies streamed grammar rows and rejects malformed header and operation lookalikes", () => {
    expect.hasAssertions();
    const tokenizer = new Tokenizer();
    expect(tokenizer.feed("[one file.ts#a1b2]\r")).toEqual([]);
    expect(tokenizer.feed('\nPUT 2.. @saved:\n+body\nMV "new file.ts"\n')).toEqual([
      { kind: "header", lineNum: 1, path: "one file.ts", fileHash: "A1B2" },
      {
        kind: "op-block",
        lineNum: 2,
        target: {
          kind: "replace",
          range: { start: { line: 2 }, end: { line: 2 } },
          register: "saved",
        },
        hadColon: true,
      },
      { kind: "payload-literal", lineNum: 3, text: "body" },
      {
        kind: "op-block",
        lineNum: 4,
        target: { kind: "move", dest: "new file.ts" },
        hadColon: false,
      },
    ]);
    expect(tokenizer.end()).toEqual([]);
    expect(() => tokenizer.feed("PUT 1:")).toThrow(/closed/i);
    tokenizer.reset();
    expect(tokenizer.tokenizeAll("[bad#ABCDE]\nPUT 0:\n+body")).toEqual([
      { kind: "raw", lineNum: 1, text: "[bad#ABCDE]" },
      { kind: "raw", lineNum: 2, text: "PUT 0:" },
      { kind: "payload-literal", lineNum: 3, text: "body" },
    ]);
  });

  it("recovers common apply-patch path noise but fails closed on malformed tagged paths", () => {
    expect.hasAssertions();
    expect(Patch.parse("[*** Update File:src/a.ts#bEEF]\nPUT 1:\n+next").sections[0]).toMatchObject(
      {
        path: "src/a.ts",
        fileHash: "BEEF",
      },
    );
    expect(Patch.parse("[Move to:new-folder/a.ts#CAFE]\nPUT >$:\n+tail").sections[0]).toMatchObject(
      {
        path: "new-folder/a.ts",
        fileHash: "CAFE",
      },
    );
    expect(() => Patch.parse("[src/a.ts#bad]\nPUT 1:\n+next")).toThrow(/Input header must be/i);
    expect(() => Patch.parse("@@ -1,1 +1,1 @@\n+next")).toThrow(/unified-diff hunk header/i);
  });

  it("uses the filesystem defaults and disk implementation at their public seams", async () => {
    expect.hasAssertions();
    class MinimalFilesystem extends Filesystem {
      readText(path: string): Promise<string> {
        void path;
        return Promise.resolve("");
      }
      writeText(path: string, content: string): Promise<{ text: string }> {
        void path;
        return Promise.resolve({ text: content });
      }
    }
    const minimal = new MinimalFilesystem();
    await expect(minimal.preflightWrite("a")).resolves.toBeUndefined();
    await expect(minimal.delete("a")).rejects.toThrow(/does not support delete/);
    await expect(minimal.move("a", "b")).rejects.toThrow(/does not support move/);
    await expect(minimal.exists("a")).resolves.toBe(true);

    const directory = await mkdtemp(join(tmpdir(), "hashline-fs-"));
    const path = join(directory, "a.txt");
    try {
      const disk = new NodeFilesystem();
      await writeFile(path, "one");
      await expect(disk.readBinary(path)).resolves.toBeInstanceOf(Uint8Array);
      await disk.move(path, join(directory, "b.txt"), "two");
      await expect(disk.readText(join(directory, "b.txt"))).resolves.toBe("two");
      await disk.delete(join(directory, "b.txt"));
      await expect(disk.exists(join(directory, "b.txt"))).resolves.toBe(false);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
