import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  Filesystem,
  hashlineParseText,
  InMemoryFilesystem,
  initializeSyntax,
  isNotFound,
  isReadMetadataLine,
  NodeFilesystem,
  NotFoundError,
  Patch,
  RECOVERY_EXTERNAL_WARNING,
  RECOVERY_LINE_REMAP_WARNING,
  Recovery,
  type Clipboard,
  InMemorySnapshotStore,
  resolveClipboardEdits,
  startClipboardBatch,
  forkClipboard,
  commitClipboard,
  validateClipboardSequence,
  streamHashLines,
  stripHashlinePrefixes,
  stripNewLinePrefixes,
  stripOneLeadingHashlinePrefix,
} from "../src/hashline/index.ts";

beforeAll(async () => initializeSyntax());

describe("Hashline filesystem public backends", () => {
  it("provides observable abstract defaults and in-memory file state", async () => {
    expect.hasAssertions();
    class ProbeFilesystem extends Filesystem {
      readText(path: string): Promise<string> {
        if (path === "missing") return Promise.reject(new NotFoundError(path));
        if (path === "broken") return Promise.reject(new Error("disk offline"));
        return Promise.resolve("present");
      }
      writeText(_path: string, content: string): Promise<{ text: string }> {
        return Promise.resolve({ text: content });
      }
    }
    const probe = new ProbeFilesystem();
    await expect(
      probe.preflightWrite("target", { fileOp: { kind: "rem" } }),
    ).resolves.toBeUndefined();
    expect(probe.canonicalPath("relative/file")).toBe("relative/file");
    expect(probe.allowTagPathRecovery("asked", "resolved")).toBe(true);
    await expect(probe.exists("present")).resolves.toBe(true);
    await expect(probe.exists("missing")).resolves.toBe(false);
    await expect(probe.exists("broken")).rejects.toThrow("disk offline");
    await expect(probe.delete("target")).rejects.toThrow("does not support delete: target");
    await expect(probe.move("from", "to", "replacement")).rejects.toThrow(
      "does not support move: from -> to",
    );

    const memory = new InMemoryFilesystem([["source", "original"]]);
    await expect(memory.readText("source")).resolves.toBe("original");
    await expect(memory.readText("missing")).rejects.toMatchObject({ code: "ENOENT" });
    await memory.writeText("written", "value");
    await memory.move("source", "renamed");
    await memory.move("written", "renamed-with-content", "replacement");
    await expect(memory.exists("source")).resolves.toBe(false);
    expect([...memory.entries()]).toEqual([
      ["renamed", "original"],
      ["renamed-with-content", "replacement"],
    ]);
    await memory.delete("renamed");
    await expect(memory.delete("renamed")).rejects.toBeInstanceOf(NotFoundError);
    memory.set("temporary", "text");
    expect(memory.get("temporary")).toBe("text");
    memory.clear();
    expect([...memory.entries()]).toEqual([]);
  });

  it("maps Node missing-file errors and preserves successful disk mutations", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "hashline-fs-coverage-"));
    const disk = new NodeFilesystem();
    const source = join(directory, "source.txt");
    const renamed = join(directory, "renamed.txt");
    const copied = join(directory, "copied.txt");
    const absent = join(directory, "absent.txt");
    try {
      await writeFile(source, "bytes\u{0}here");
      await expect(disk.readText(source)).resolves.toBe("bytes\u{0}here");
      await expect(disk.readBinary(source)).resolves.toSatisfy(
        (bytes: Uint8Array) => new TextDecoder().decode(bytes) === "bytes\u{0}here",
      );
      expect(disk.canonicalPath(".")).toBe(realpathSync.native(resolve(".")));
      const realParent = join(directory, "real-parent");
      const aliasParent = join(directory, "alias-parent");
      await mkdir(realParent);
      let symlinkAvailable = true;
      try {
        await symlink(realParent, aliasParent, "dir");
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "EPERM") throw error;
        symlinkAvailable = false;
      }
      const canonicalAliases = symlinkAvailable
        ? [
            disk.canonicalPath(join(aliasParent, "aliased.txt")),
            disk.canonicalPath(join(aliasParent, "destination.txt")),
          ]
        : [];
      const expectedAliases = symlinkAvailable
        ? [
            join(realpathSync.native(realParent), "aliased.txt"),
            join(realpathSync.native(realParent), "destination.txt"),
          ]
        : [];
      expect(canonicalAliases).toEqual(expectedAliases);
      await expect(disk.exists(source)).resolves.toBe(true);
      await expect(disk.exists(absent)).resolves.toBe(false);
      await expect(disk.readText(absent)).rejects.toSatisfy(isNotFound);
      await expect(disk.readBinary(absent)).rejects.toSatisfy(isNotFound);
      await expect(disk.delete(absent)).rejects.toSatisfy(isNotFound);
      await expect(disk.move(absent, renamed)).rejects.toSatisfy(isNotFound);

      await expect(disk.writeText(renamed, "first")).resolves.toEqual({ text: "first" });
      await disk.move(renamed, copied);
      await expect(disk.readText(copied)).resolves.toBe("first");
      await disk.move(copied, renamed, "serialized replacement");
      await expect(disk.readText(renamed)).resolves.toBe("serialized replacement");
      await expect(disk.exists(copied)).resolves.toBe(false);
      await disk.delete(renamed);
      await expect(disk.exists(renamed)).resolves.toBe(false);
      await expect(disk.readText(directory)).rejects.not.toSatisfy(isNotFound);
      await expect(disk.readBinary(directory)).rejects.not.toSatisfy(isNotFound);
      await expect(disk.move(source, join(source, "child"))).rejects.not.toSatisfy(isNotFound);
      await expect(disk.exists(join(source, "child"))).rejects.not.toSatisfy(isNotFound);
      await expect(disk.delete(directory)).rejects.not.toSatisfy(isNotFound);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("recognizes native ENOENT errors but not unrelated failures", () => {
    expect.hasAssertions();
    expect(isNotFound(new NotFoundError("gone"))).toBe(true);
    expect(isNotFound(Object.assign(new Error("gone"), { code: "ENOENT" }))).toBe(true);
    expect(isNotFound(Object.assign(new Error("denied"), { code: "EACCES" }))).toBe(false);
    expect(isNotFound({ code: "ENOENT" })).toBe(false);
    expect(isNotFound("ENOENT")).toBe(false);
  });
});

describe("Hashline input splitting public seam", () => {
  it("normalizes headers, fallback input, and streaming envelopes", () => {
    expect.hasAssertions();
    const cases = [
      {
        name: "quoted absolute path under cwd",
        input: '["/workspace/src/a.ts"#beef]\nPUT 1:\n+next',
        options: { cwd: "/workspace" },
        expected: { path: "src/a.ts", fileHash: "BEEF" },
      },
      {
        name: "absolute path outside cwd stays absolute",
        input: "[/other/a.ts#beef]\nPUT 1:\n+next",
        options: { cwd: "/workspace" },
        expected: { path: "/other/a.ts", fileHash: "BEEF" },
      },
      {
        name: "headerless recognized operation uses fallback path",
        input: "PUT >$:\n+tail",
        options: { path: "/workspace/new.ts", cwd: "/workspace" },
        expected: { path: "new.ts", fileHash: undefined },
      },
    ] as const;
    for (const testCase of cases) {
      const section = Patch.parseSingle(testCase.input, testCase.options);
      expect(section).toMatchObject(testCase.expected);
    }
    expect(
      Patch.parse("\u{FEFF}\n*** Begin Patch\n[a.ts#ABCD]\r\nPUT 1:\r\n+next\n*** End Patch")
        .sections,
    ).toHaveLength(1);
    expect(
      Patch.parse("[a.ts#ABCD]\nPUT 1:\n+next\n*** Abort\n[b.ts#BEEF]\nPUT 1:\n+ignored").sections,
    ).toHaveLength(1);
    expect(
      Patch.parse("[/workspace#ABCD]\nPUT >$:\n+tail", { cwd: "/workspace" }).sections[0]?.path,
    ).toBe(".");
    expect(() => Patch.parse("PUT >$:\n+tail", { path: " ".repeat(3) })).toThrow(
      /input must begin/i,
    );
    expect(() => Patch.parse("plain prose", { path: "a.ts" })).toThrow(/input must begin/i);
    expect(Patch.parse("[a.ts#ABCD]\n\n[b.ts#BEEF]\nPUT >$:\n+tail").sections).toMatchObject([
      { path: "b.ts", fileHash: "BEEF" },
    ]);
  });

  it("recovers known path noise and rejects malformed or conflicting headers", () => {
    expect.hasAssertions();
    for (const [header, expectedPath] of [
      ["[*** Update(File): src/a.ts#beef]", "src/a.ts"],
      ["[Add File: src/a.ts#beef]", "src/a.ts"],
      ["[Delete File: src/a.ts#beef]", "src/a.ts"],
      ["[Move to: src/a.ts#beef]", "src/a.ts"],
      ["[***src/a.ts#beef]", "src/a.ts"],
    ]) {
      if (header === undefined || expectedPath === undefined)
        throw new Error("expected a header and path pair");
      expect(Patch.parseSingle(`${header}\nPUT >$:\n+tail`).path).toBe(expectedPath);
    }
    for (const input of [
      "[]\nPUT 1:\n+x",
      "[a.ts#BAD]\nPUT 1:\n+x",
      "[a#b.ts#BEEF]\nPUT 1:\n+x",
      "@@ -1,1 +1,1 @@\n+x",
      "not a header\nPUT 1:\n+x",
    ]) {
      expect(() => Patch.parse(input)).toThrow();
    }
    expect(() => Patch.parse("[a.ts#ABCD]\nPUT 1:\n+x\n[a.ts#BEEF]\nPUT 2:\n+y")).toThrow(
      /Conflicting hashline snapshot tags/,
    );
  });

  it("merges sections without reordering clipboard operations and exposes parsed section state", () => {
    expect.hasAssertions();
    const merged = Patch.parse(
      "[a.ts#ABCD]\nPUT 1:\n+one\n[b.ts#BEEF]\nPUT 1:\n+two\n[a.ts#ABCD]\nPUT >$:\n+three",
    );
    expect(merged.sections.map((section) => section.path)).toEqual(["a.ts", "b.ts"]);
    expect(merged.sections[0]?.diff).toContain("+three");
    expect(merged.sections[0]?.collectAnchorLines()).toEqual([1]);
    expect(merged.sections[0]?.hasAnchorScopedEdit).toBe(true);
    expect(Patch.parseSingle("[new.ts]\nPUT >$:\n+tail").hasAnchorScopedEdit).toBe(false);
    expect(merged.sections[0]?.warnings).toEqual([]);
    expect(merged.sections[0]?.withPath("redirected.ts")).toMatchObject({
      path: "redirected.ts",
      fileHash: "ABCD",
    });
    const anchored = Patch.parseSingle("[a.ts#ABCD]\nCUT 2-3\nPUT <4:\n+x");
    expect(anchored.hasAnchorScopedEdit).toBe(true);
    expect(anchored.collectAnchorLines()).toEqual([2, 3, 4]);
    expect(Patch.parseSingle("[a.ts#ABCD]\nPUT 1:\n+next").applyPartialTo("old\n").text).toBe(
      "next\n",
    );
    expect(
      () =>
        Patch.parse("[a.ts#ABCD]\nCUT 1\n[b.ts#BEEF]\nPUT 1:\n+x\n[a.ts#ABCD]\nPUT >$").sections[0]
          ?.edits,
    ).toThrow(/interleaved/i);
    expect(() => Patch.parse("")).toThrow(/input must begin/i);
    expect(() => Patch.parseSingle("[a.ts#ABCD]\n")).toThrow(/did not produce/);
  });
});

describe("Hashline recovery public seam", () => {
  const path = "recovery.txt";
  const rows = (...lines: string[]) => `${lines.join("\n")}\n`;

  it("replays stale anchored inserts, cuts, and named pastes only through one unchanged mapping", () => {
    expect.hasAssertions();
    const cases = [
      {
        name: "insertion shifted by a newly inserted heading",
        before: rows("one", "two", "three"),
        current: rows("heading", "one", "two", "three"),
        patch: "PUT 2:\n+TWO",
        expected: rows("heading", "one", "TWO", "three"),
        warning: RECOVERY_LINE_REMAP_WARNING,
      },
      {
        name: "cut shifted by a removed leading line",
        before: rows("discard", "one", "two", "three"),
        current: rows("one", "two", "three"),
        patch: "CUT 2\nPUT >$",
        expected: rows("two", "three", "one"),
        warning: RECOVERY_LINE_REMAP_WARNING,
      },
      {
        name: "named paste replaces a stale span after an external trailer",
        before: rows("one", "two", "three"),
        current: rows("one", "two", "three", "trailer"),
        patch: "CUT 1 @kept\nPUT 2 @kept",
        expected: rows("one", "three", "trailer"),
        warning: RECOVERY_EXTERNAL_WARNING,
      },
    ] as const;
    for (const testCase of cases) {
      const store = new InMemorySnapshotStore();
      const hash = store.record(path, testCase.before);
      const result = new Recovery(store).tryRecover({
        path,
        currentText: testCase.current,
        fileHash: hash,
        edits: Patch.parseSingle(`[${path}#${hash}]\n${testCase.patch}`).edits,
      });
      expect(result?.text).toBe(testCase.expected);
      expect(result?.warnings).toContain(testCase.warning);
      expect(result?.firstChangedLine).toBeGreaterThan(0);
    }
  });

  it("fails closed for missing snapshots, changed interiors, inconsistent gaps, duplicate ambiguity, and replay errors", () => {
    expect.hasAssertions();
    const before = rows("start", "same", "target", "same", "end");
    const store = new InMemorySnapshotStore();
    const hash = store.record(path, before);
    const cases = [
      { current: before, hash: "DEAD", patch: "PUT 3:\n+model" },
      { current: rows("start", "same", "changed", "same", "end"), hash, patch: "PUT 3:\n+model" },
      { current: `${before}tail\n`, hash, patch: "PUT >2" },
    ] as const;
    for (const testCase of cases) {
      expect(
        new Recovery(store).tryRecover({
          path,
          currentText: testCase.current,
          fileHash: testCase.hash,
          edits: Patch.parseSingle(`[${path}#${testCase.hash}]\n${testCase.patch}`).edits,
        }),
      ).toBeNull();
    }
    const ambiguousStore = new InMemorySnapshotStore();
    const ambiguousHash = ambiguousStore.record(path, rows("start", "DUP", "mid", "DUP", "tail"));
    expect(
      new Recovery(ambiguousStore).tryRecover({
        path,
        currentText: rows("start", "mid", "DUP", "changed", "tail"),
        fileHash: ambiguousHash,
        edits: Patch.parseSingle(`[${path}#${ambiguousHash}]\nPUT 4:\n+model`).edits,
      }),
    ).toBeNull();
  });

  it("replays public low-level deletes and register span pastes while refusing unanchored cursors", () => {
    expect.hasAssertions();
    const before = rows("one", "two", "three");
    const current = rows("one", "two", "three", "trailer");
    const store = new InMemorySnapshotStore();
    const hash = store.record(path, before);
    const recover = (
      edits: Parameters<Recovery["tryRecover"]>[0]["edits"],
      clipboard?: Clipboard,
    ) => {
      return new Recovery(store).tryRecover({
        path,
        currentText: current,
        fileHash: hash,
        edits,
        ...(clipboard === undefined ? {} : { clipboard }),
      });
    };
    expect(recover([{ kind: "delete", anchor: { line: 2 }, lineNum: 1, index: 0 }])?.text).toBe(
      rows("one", "three", "trailer"),
    );
    expect(
      recover(
        [
          {
            kind: "paste",
            at: { kind: "span", range: { start: { line: 2 }, end: { line: 2 } } },
            register: "replacement",
            lineNum: 1,
            index: 0,
          },
        ],
        { named: new Map([["replacement", ["TWO"]]]) },
      )?.text,
    ).toBe(rows("one", "TWO", "three", "trailer"));
    expect(
      recover([{ kind: "insert", cursor: { kind: "eof" }, text: "tail", lineNum: 1, index: 0 }]),
    ).toBeNull();
    expect(
      recover([
        {
          kind: "insert",
          cursor: { kind: "before_anchor", anchor: { line: 2 } },
          text: "before two",
          blockStart: 1,
          lineNum: 1,
          index: 0,
        },
      ])?.text,
    ).toBe(rows("one", "before two", "two", "three", "trailer"));
    expect(
      recover(
        [
          {
            kind: "paste",
            at: { kind: "gap", cursor: { kind: "after_anchor", anchor: { line: 2 } } },
            register: "replacement",
            lineNum: 1,
            index: 0,
          },
        ],
        { named: new Map([["replacement", ["TWO"]]]) },
      )?.text,
    ).toBe(rows("one", "two", "TWO", "three", "trailer"));
    expect(
      recover([
        { kind: "block", anchor: { line: 2 }, payloads: ["replacement"], lineNum: 1, index: 0 },
      ]),
    ).toBeNull();
  });
});

describe("Hashline clipboard public seam", () => {
  const gap = (line: number) => ({
    kind: "gap" as const,
    cursor: { kind: "after_anchor" as const, anchor: { line } },
  });

  it("resolves anonymous and named captures in authored order, including replacement spans", () => {
    expect.hasAssertions();
    const clipboard: Clipboard = {};
    const edits = [
      {
        kind: "cut" as const,
        range: { start: { line: 1 }, end: { line: 2 } },
        lineNum: 1,
        index: 0,
      },
      { kind: "paste" as const, at: gap(3), lineNum: 2, index: 1 },
      {
        kind: "cut" as const,
        range: { start: { line: 3 }, end: { line: 3 } },
        register: "saved",
        lineNum: 3,
        index: 2,
      },
      {
        kind: "paste" as const,
        at: { kind: "span" as const, range: { start: { line: 2 }, end: { line: 2 } } },
        register: "saved",
        lineNum: 4,
        index: 3,
      },
    ];
    const resolved = resolveClipboardEdits(edits, ["a", "b", "c"], clipboard);
    expect(resolved.map((edit) => edit.kind)).toEqual(["insert", "insert", "insert", "delete"]);
    expect(resolved.filter((edit) => edit.kind === "insert").map((edit) => edit.text)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(clipboard.lines).toEqual(["a", "b"]);
    expect(clipboard.named?.get("saved")).toEqual(["c"]);
  });

  it("keeps named registers transactional across batches while anonymous state is local", () => {
    expect.hasAssertions();
    const persisted: Clipboard = { lines: ["old"], named: new Map([["shared", ["old named"]]]) };
    const batch = startClipboardBatch(persisted);
    expect(batch).toEqual({ named: new Map([["shared", ["old named"]]]) });
    const fork = forkClipboard(batch);
    resolveClipboardEdits(
      [
        {
          kind: "cut",
          range: { start: { line: 1 }, end: { line: 1 } },
          register: "shared",
          lineNum: 1,
          index: 0,
        },
      ],
      ["new named"],
      fork,
    );
    commitClipboard(fork, persisted);
    expect(persisted.named?.get("shared")).toEqual(["new named"]);
    expect(persisted.lines).toEqual(["old"]);
    commitClipboard({}, persisted);
    expect(persisted.named?.get("shared")).toEqual(["new named"]);
  });

  it("reports missing, ambiguous, invalid, and dropped paste paths without destructive edits", () => {
    expect.hasAssertions();
    const anonymousPaste = { kind: "paste" as const, at: gap(1), lineNum: 7, index: 0 };
    const spanPaste = {
      kind: "paste" as const,
      at: { kind: "span" as const, range: { start: { line: 4 }, end: { line: 4 } } },
      register: "missing",
      lineNum: 8,
      index: 1,
    };
    expect(() => resolveClipboardEdits([anonymousPaste], ["a"], {})).toThrow(/Nothing to paste/);
    expect(() => resolveClipboardEdits([spanPaste], ["a"], {})).toThrow(/empty.*delete/s);
    expect(() =>
      resolveClipboardEdits(
        [
          {
            ...anonymousPaste,
            at: { kind: "span", range: { start: { line: 2 }, end: { line: 2 } } },
          },
        ],
        ["a"],
        { lines: ["x"] },
      ),
    ).toThrow(/out of range/);
    const warnings: string[] = [];
    expect(
      resolveClipboardEdits(
        [spanPaste],
        ["a"],
        {},
        {
          onEmptyPaste: "drop",
          onWarning: (message) => {
            warnings.push(message);
          },
        },
      ),
    ).toEqual([]);
    expect(warnings).toEqual([]);
    expect(() => {
      validateClipboardSequence(
        [
          { kind: "cut", range: { start: { line: 1 }, end: { line: 1 } }, lineNum: 1, index: 0 },
          { kind: "cut", range: { start: { line: 2 }, end: { line: 2 } }, lineNum: 2, index: 1 },
          anonymousPaste,
        ],
        {},
      );
    }).toThrow(/unlabeled `CUT`s are pending/);
  });
});

describe("Hashline line stream public seam", () => {
  async function collect(
    source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
    options = {},
  ) {
    const chunks: string[] = [];
    for await (const chunk of streamHashLines(source, options)) chunks.push(chunk);
    return chunks;
  }

  it("formats strings-as-bytes across UTF-8 and CRLF boundaries with BOM and bounded chunks", async () => {
    expect.hasAssertions();
    const encoder = new TextEncoder();
    const bytes = encoder.encode("\u{FEFF}first\r\nemoji 😀\nlast");
    async function* split(): AsyncGenerator<Uint8Array> {
      await Promise.resolve();
      yield bytes.slice(0, 11);
      yield bytes.slice(11, 13);
      yield bytes.slice(13);
    }
    expect(await collect(split(), { startLine: 9, maxChunkLines: 1, maxChunkBytes: 40 })).toEqual([
      "9:first",
      "10:emoji 😀",
      "11:last",
    ]);
    expect(
      await collect(
        (async function* () {
          await Promise.resolve();
          yield encoder.encode("abcdef\n");
        })(),
        { maxChunkBytes: 3 },
      ),
    ).toEqual(["1:abcdef"]);
  });

  it("accepts Web streams and releases reader locks for normal, aborted, and malformed readers", async () => {
    expect.hasAssertions();
    const encoder = new TextEncoder();
    const web = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("a\nb\n"));
        controller.close();
      },
    });
    expect(await collect(web, { maxChunkLines: 2 })).toEqual(["1:a\n2:b"]);
    expect(web.locked).toBe(false);

    let released = false;
    const abort = {
      getReader: () => ({
        read: async () => {
          await Promise.resolve();
          throw new Error("aborted sentinel");
        },
        releaseLock: () => {
          released = true;
        },
      }),
    } as unknown as ReadableStream<Uint8Array>;
    await expect(collect(abort)).rejects.toThrow("aborted sentinel");
    expect(released).toBe(true);

    let malformedReleased = false;
    const malformed = {
      getReader: () => ({
        read: async () => {
          await Promise.resolve();
          return { done: false, value: {} };
        },
        releaseLock: () => {
          malformedReleased = true;
        },
      }),
    } as unknown as ReadableStream<Uint8Array>;
    await expect(collect(malformed)).rejects.toThrow();
    expect(malformedReleased).toBe(true);
    expect(
      await collect(
        (async function* () {
          if (await Promise.resolve(false)) yield new Uint8Array();
        })(),
      ),
    ).toEqual(["1:"]);
  });
});

describe("Hashline read-prefix normalization", () => {
  it("classifies every read metadata form and malformed near misses", () => {
    expect.hasAssertions();
    const cases = [
      ["[Showing lines 2-4 of 9; Use :L2]", true],
      ["[2 more lines in file; Use :L2]", true],
      ["[...3 ln elided; re-read needed ranges with read]", true],
      ["2-8: … elided source", true],
      ["...", true],
      ["0-8: …", false],
      ["2-8: source", false],
      ["[Showing lines 2-4 of 9]", false],
      ["… source", false],
    ] as const;
    for (const [line, expected] of cases) expect(isReadMetadataLine(line)).toBe(expected);
  });

  it("strips complete hashline, diff, and mixed prefix schemes without corrupting ordinary text", () => {
    expect.hasAssertions();
    const cases = [
      { input: [">>> + 1:one", ">>2|two"], output: ["one", "two"] },
      { input: ["+one", "+two", " context"], output: ["one", "two", " context"] },
      { input: ["+1:one", "+2:two", "plain"], output: ["one", "two", "plain"] },
      { input: ["one", "2:two"], output: ["one", "2:two"] },
      { input: ["++not-a-diff", "context"], output: ["++not-a-diff", "context"] },
      { input: [], output: [] },
    ];
    for (const testCase of cases)
      expect(stripNewLinePrefixes(testCase.input)).toEqual(testCase.output);
    expect(stripHashlinePrefixes(["[a.ts#ABCD]", "1:one", "2:2:literal"])).toEqual([
      "one",
      "literal",
    ]);
    expect(stripHashlinePrefixes(["[a.ts#ABCD]", "1:one", "plain"])).toEqual([
      "[a.ts#ABCD]",
      "1:one",
      "plain",
    ]);
    expect(stripOneLeadingHashlinePrefix("1:2:literal")).toBe("2:literal");
  });

  it("parses nullable, CRLF, trailing newline, and read-elision payloads", () => {
    expect.hasAssertions();
    expect(hashlineParseText(null)).toEqual([]);
    expect(hashlineParseText(undefined)).toEqual([]);
    expect(hashlineParseText("1:one\r\n2:two\n")).toEqual(["one", "two"]);
    expect(
      hashlineParseText([
        "[a.ts#ABCD]",
        "1:one",
        "[...3 ln elided; re-read needed ranges with read]",
        "2:two",
      ]),
    ).toEqual(["one", "two"]);
  });
});
