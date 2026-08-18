import { describe, expect, it } from "vitest";

import {
  computeFileHash,
  describeAnchorExamples,
  formatCutHeader,
  formatGapLocator,
  formatHashlineHeader,
  formatInsertHeader,
  formatNumberedLine,
  formatNumberedLines,
  formatRegister,
  formatReplaceHeader,
  splitAddressableFileLines,
} from "../src/hashline/format.ts";
import { Patch } from "../src/hashline/input.ts";
import * as messages from "../src/hashline/messages.ts";
import {
  MismatchError,
  formatFullAnchorRequirement,
  parseTag,
  validateLineRef,
} from "../src/hashline/mismatch.ts";
import { InMemorySnapshotStore, SnapshotStore } from "../src/hashline/snapshots.ts";

describe("Hashline format public output", () => {
  it("formats headers, all cursor positions, paths, numbering, and normalized tags", () => {
    expect.hasAssertions();
    expect(formatReplaceHeader(2, 4)).toBe("PUT 2.=4:");
    expect(formatCutHeader(2)).toBe("CUT 2.=2");
    expect(formatCutHeader(2, 4)).toBe("CUT 2.=4");
    expect([
      formatGapLocator({ kind: "before_anchor", anchor: { line: 4 } }),
      formatGapLocator({ kind: "after_anchor", anchor: { line: 4 } }),
      formatGapLocator({ kind: "bof" }),
      formatGapLocator({ kind: "eof" }),
    ]).toEqual(["<4", ">4", "<1", ">$"]);
    expect(formatInsertHeader({ kind: "eof" })).toBe("PUT >$:");
    expect(formatRegister("saved")).toBe("@saved");
    expect(formatHashlineHeader("dir/a.ts", "BEEF")).toBe("[dir/a.ts#BEEF]");
    expect(formatNumberedLine(7, "text: literal")).toBe("7:text: literal");
    expect(formatNumberedLines("one\ntwo", 9)).toBe("9:one\n10:two");
    expect(splitAddressableFileLines("one\ntwo\n")).toEqual(["one", "two"]);
    expect(splitAddressableFileLines("one\n\n")).toEqual(["one", ""]);
    expect(splitAddressableFileLines("")).toEqual([""]);
    expect(computeFileHash("a  \r\nb\t\n")).toBe(computeFileHash("a\nb\n"));
    expect(describeAnchorExamples()).toBe('"160", "42", "7"');
    expect(describeAnchorExamples("L160")).toBe('"L160", "L162", "7"');
  });
});

describe("Hashline mismatch diagnostics", () => {
  it("extracts decorated references and rejects invalid or out-of-range forms", () => {
    expect.hasAssertions();
    for (const [input, line] of [
      ["42", 42],
      [" *42: body", 42],
      [">+ 7: text", 7],
    ] as const)
      expect(parseTag(input)).toEqual({ line });
    expect(formatFullAnchorRequirement()).not.toContain("Received");
    expect(formatFullAnchorRequirement("bad")).toContain('Received "bad".');
    expect(() => parseTag("0")).toThrow("Line number must be >= 1");
    expect(() => parseTag("4x")).toThrow("Invalid line reference");
    expect(() => {
      validateLineRef({ line: 0 }, ["one"]);
    }).toThrow("file has 1 lines");
    expect(() => {
      validateLineRef({ line: 2 }, ["one"]);
    }).toThrow("Line 2 does not exist");
    expect(() => {
      validateLineRef({ line: 1 }, ["one"]);
    }).not.toThrow();
  });

  it("uses defaults when optional mismatch context is absent", () => {
    expect.hasAssertions();
    const mismatch = new MismatchError({
      expectedFileHash: "AAAA",
      actualFileHash: "BBBB",
      fileLines: ["one"],
    });
    expect(mismatch.anchorLines).toEqual([]);
    expect(mismatch.hashRecognized).toBe(true);
    expect(mismatch.message).toContain("file changed between read and edit");
    expect(mismatch.message).not.toContain("\n\n");
  });

  it("renders recognized and unrecognized mismatches with stable anchored context", () => {
    expect.hasAssertions();
    const details = {
      path: "a.ts",
      expectedFileHash: "AAAA",
      actualFileHash: "BBBB",
      fileLines: ["one", "two", "three", "four", "five"],
      anchorLines: [3],
    };
    const recognized = new MismatchError(details);
    expect(recognized.name).toBe("MismatchError");
    expect(recognized.displayMessage).toBe(recognized.message);
    expect(recognized.message).toContain("file changed between read and edit");
    expect(recognized.message).toContain("*3:three");
    const unknown = new MismatchError({
      ...details,
      anchorLines: [99],
      hashRecognized: false,
    });
    expect(unknown.message).toContain("hash #AAAA is not from this session");
    expect(unknown.message).not.toContain("\n\n");
  });
});

describe("Hashline section public contracts", () => {
  it("reports anchored edits and collects anchors across parsed edit kinds", () => {
    expect.hasAssertions();
    const anchored = Patch.parseSingle("[a.ts#AAAA]\nCUT 2-3");
    expect(anchored.hasAnchorScopedEdit).toBe(true);
    expect(anchored.collectAnchorLines()).toEqual([2, 3]);
    const unanchored = Patch.parseSingle("[a.ts#AAAA]\nPUT >$:\n+tail");
    expect(unanchored.hasAnchorScopedEdit).toBe(false);
    expect(unanchored.collectAnchorLines()).toEqual([]);
  });

  it("recovers a noisy hashless header while preserving an absolute path outside cwd", () => {
    expect.hasAssertions();
    const section = Patch.parseSingle("[Update File: /outside/a.ts]\nPUT >$:\n+tail", {
      cwd: "/workspace",
    });
    expect(section.path).toBe("/outside/a.ts");
    expect(section.fileHash).toBeUndefined();
    expect(section.diff).toBe("PUT >$:\n+tail");
  });

  it("rejects conflicting tags when coalescing repeated path sections", () => {
    expect.hasAssertions();
    expect(() => Patch.parse("[a.ts#AAAA]\nPUT >$:\n+x\n[a.ts#BBBB]\nPUT >$:\n+y")).toThrow(
      "Conflicting hashline snapshot tags",
    );
  });
});

describe("Hashline message variants", () => {
  it("formats context, range, block, boundary, clipboard, and recovery guidance", () => {
    expect.hasAssertions();
    expect(
      messages.formatAnchoredContext([2, 7, 99], ["a", "b", "c", "d", "e", "f", "g", "h", "i"]),
    ).toEqual([" 1:a", "*2:b", " 3:c", " 4:d", " 5:e", " 6:f", "*7:g", " 8:h", " 9:i"]);
    expect(messages.formatAnchoredContext([], ["a"])).toEqual([]);
    expect(
      messages.invalidAbsoluteRangeMessage(8, 5, 2, "replace", { start: 5, end: 9 }, "saved"),
    ).toContain("PUT 5.=6 @saved");
    expect(messages.invalidAbsoluteRangeMessage(8, 5, Number.MAX_SAFE_INTEGER, "cut")).toContain(
      "For one line use `CUT 5`",
    );
    expect(messages.repeatedSnapshotRowMessage(3)).toContain("PUT 3.=M:");
    expect(messages.literalOpRowWarning(2, "CUT 1")).toContain("+CUT 1");
    expect(
      messages.blockUnresolvedMessage(
        2,
        "cut",
        ["", "", "function f() {", "}", ""],
        { nextBlock: { start: 3, end: 4 }, enclosingBlock: { start: 1, end: 4 } },
        "x",
      ),
    ).toContain("Retry `CUT 3* @x`");
    expect(messages.blockUnresolvedMessage(2, "replace", ["one", "two"])).toContain("PUT 2.=M:");
    expect(messages.insertAfterBlockCloserLoweredWarning(4)).toContain("PUT >4*:");
    expect(messages.insertAfterBlockUnresolvedLoweredWarning(4)).toContain("could not resolve");
    expect(messages.pasteAfterBlockCloserLoweredWarning(4)).toContain("PUT >4*");
    expect(messages.pasteAfterBlockUnresolvedLoweredWarning(4)).toContain("plain `PUT >4`");
    expect(messages.ambiguousBoundaryEchoMessage(2, 4, "leading", 1)).toContain("just above");
    expect(messages.ambiguousBoundaryEchoMessage(2, 4, "trailing", 1)).toContain("just below");
    expect(messages.ambiguousBoundaryPlacementMessage(2, 4)).toContain("PUT 2.=4:");
    expect(messages.textualBoundaryEchoWarning(2, 1, 0)).toContain("1 leading");
    expect(messages.textualBoundaryEchoWarning(2, 0, 2)).toContain("2 trailing");
    expect(messages.boundaryVariantRepairWarning(2, 1, 1)).toContain("retained 1");
    expect(messages.boundaryVariantRepairWarning(2, 0, 0)).toContain("at line 2: .");
    expect(messages.editBrokeParseWarning(undefined)).not.toContain("near line");
    expect(messages.editBrokeParseWarning(3)).toContain("near line 3");
    expect(messages.emptyRegisterPasteWarning("missing", [])).not.toContain("Available");
    expect(messages.emptyRegisterPasteWarning("missing", ["kept"])).toContain("`@kept`");
    expect(messages.emptyRegisterSpanPasteMessage("missing", [])).toContain("would delete");
    expect(messages.emptyRegisterSpanPasteMessage("missing", ["kept"])).toContain(
      "Available registers",
    );
    expect(messages.ambiguousAnonymousPasteMessage(["1", "4"])).toContain("2 unlabeled");
    expect(messages.afterInsertLandingShiftWarning(2, 5, 1)).toContain("1 closing line");
    expect(messages.afterInsertLandingShiftWarning(2, 5, 2)).toContain("2 closing lines");
    expect(messages.blockInsertLandingShiftWarning(2, 5, 4)).toContain("PUT >2*:");
    expect(messages.writeDriftWarning("a.ts")).toContain("a.ts:");
    expect(messages.missingSnapshotTagMessage("a.ts")).toContain("[a.ts#tag]");
    expect(messages.pathRecoveredFromTagMessage("a.ts", "src/a.ts", "BEEF")).toContain("#BEEF");
  });

  it("formats unseen reveal options and every block operation form", () => {
    expect.hasAssertions();
    const base = messages.unseenLinesMessage("a.ts", [4, 2, 3, 7], "BEEF");
    expect(base).toContain("lines 2-4, 7");
    expect(base).toContain("a.ts:2-4,7");
    const revealed = messages.unseenLinesMessage("a.ts", [2], "BEEF", {
      lines: [{ line: 2, text: "two" }],
      truncated: false,
    });
    expect(revealed).toContain("  2:two");
    expect(revealed).toContain("straight retry now succeeds");
    expect(
      messages.unseenLinesMessage("a.ts", [2, 3], "BEEF", {
        lines: [{ line: 2, text: "two" }],
        truncated: true,
      }),
    ).toContain("inline preview cap");
    for (const op of ["replace", "insert_after", "cut", "paste_after"] as const)
      expect(messages.blockSingleLineMessage(4, op, { start: 1, end: 7 })).toContain(
        "nearest enclosing",
      );
  });
});

describe("Hashline snapshot public storage", () => {
  it("recovers, merges, relocates, and evicts bounded path histories", () => {
    expect.hasAssertions();
    const store = new InMemorySnapshotStore({
      maxPaths: 2,
      maxVersionsPerPath: 2,
      maxTotalBytes: 20,
    });
    const first = store.record("a", "one\n", [1]);
    store.recordSeenLines("a", first, [2]);
    expect(store.byContent("a", "one\n")?.seenLines).toEqual(new Set([1, 2]));
    const second = store.record("a", "two\n");
    store.record("b", "three\n");
    expect(store.byHash("a", first)?.text).toBe("one\n");
    expect(store.byHash("a", second)?.text).toBe("two\n");
    store.relocate("a", "b");
    expect(store.head("a")).toBeNull();
    expect(store.head("b")?.path).toBe("b");
    expect(store.findByHash(second).map((item) => item.path)).toEqual(["b"]);
    store.invalidate("b");
    expect(store.findByHash(second)).toEqual([]);
    store.clear();
  });

  it("keeps hot paths, evicts old paths by total text size, and exposes base defaults", () => {
    expect.hasAssertions();
    const store = new InMemorySnapshotStore({ maxPaths: 2, maxTotalBytes: 8 });
    store.record("a", "aa");
    store.record("b", "bb");
    expect(store.head("a")?.text).toBe("aa");
    store.record("c", "cccccc");
    expect(store.head("b")).toBeNull();
    expect(store.head("a")).toBeNull();
    expect(store.head("c")?.text).toBe("cccccc");
    class EmptyStore extends SnapshotStore {
      head() {
        return null;
      }
      byHash() {
        return null;
      }
      byContent() {
        return null;
      }
      record() {
        return "AAAA";
      }
      recordSeenLines() {
        void 0;
      }
      invalidate() {
        void 0;
      }
      relocate() {
        void 0;
      }
      clear() {
        void 0;
      }
    }
    expect(new EmptyStore().findByHash("AAAA")).toEqual([]);
  });
});
