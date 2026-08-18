import { beforeAll, describe, expect, it } from "vitest";

import { applyEdits, Patch, parsePatch, initializeSyntax } from "../../src/hashline/index.ts";

beforeAll(async () => initializeSyntax());

function thrownError(action: () => unknown): Error {
  try {
    action();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  throw new Error("expected parser error");
}

function applyPatch(text: string, diff: string): string {
  return applyEdits(text, parsePatch(diff).edits).text;
}

const FILE = "a\nb\nc\nd\ne";

describe("hashline section headers", () => {
  it("accepts paths with spaces in anchored section headers", () => {
    expect.hasAssertions();
    const section = Patch.parseSingle("[dir with spaces/file.ts#1a2b]\nPUT 1-1:\n+after");

    expect(section.path).toBe("dir with spaces/file.ts");
    expect(section.fileHash).toBe("1A2B");
    expect(section.applyTo("before").text).toBe("after");
  });

  it("recovers apply_patch-contaminated headers whose paths contain spaces", () => {
    expect.hasAssertions();
    const section = Patch.parseSingle(
      "[*** Update File: dir with spaces/file.ts#1A2B]\nPUT 1-1:\n+after",
    );

    expect(section.path).toBe("dir with spaces/file.ts");
    expect(section.fileHash).toBe("1A2B");
    expect(section.applyTo("before").text).toBe("after");
  });

  it("rejects trailing junk after a snapshot tag", () => {
    expect.hasAssertions();
    expect(() => Patch.parse("[src/a.ts#1A2B copied from read]\nPUT 1-1:\n+after")).toThrow(
      /Input header must be/,
    );
    expect(() => Patch.parse("[src/a.ts#1A2B:812]\nPUT 1-1:\n+after")).toThrow(
      /Input header must be/,
    );
  });

  it("rejects trailing junk after a snapshot tag even with apply_patch noise", () => {
    expect.hasAssertions();
    expect(() =>
      Patch.parse("[Update File: src/a.ts#1A2B copied from read]\nPUT 1-1:\n+after"),
    ).toThrow(/Input header must be/);
    expect(() => Patch.parse("[Update File: src/a.ts#1A2B:812]\nPUT 1-1:\n+after")).toThrow(
      /Input header must be/,
    );
  });

  it("rejects malformed snapshot tags", () => {
    expect.hasAssertions();
    expect(() => Patch.parse("[src/a.ts#1A2]\nPUT 1-1:\n+after")).toThrow(/Input header must be/);
    expect(() => Patch.parse("[src/a.ts#1A2G]\nPUT 1-1:\n+after")).toThrow(/Input header must be/);
    expect(() => Patch.parse("[src/a.ts#1A2B5]\nPUT 1-1:\n+after")).toThrow(/Input header must be/);
  });

  it("rejects malformed snapshot tags even with apply_patch noise", () => {
    expect.hasAssertions();
    expect(() => Patch.parse("[Update File: src/a.ts#1A2G]\nPUT 1-1:\n+after")).toThrow(
      /Input header must be/,
    );
  });

  it("reports bracket syntax with a 4-hex example when the header is missing", () => {
    expect.hasAssertions();
    const message = thrownError(() => Patch.parse("CUT 38-40")).message;
    expect(message).toContain('input must begin with "[PATH#HASH]"');
    expect(message).toContain('Example: "[src/foo.ts#1A2B]"');
    expect(message).not.toContain("#0A3");
  });
});

describe("hashline core — verb header forms", () => {
  it("rejects a bare single-number hunk header with verb guidance", () => {
    expect.hasAssertions();
    expect(() => parsePatch("2\n+B")).toThrow(/hunk headers need a verb/);
  });

  it("rejects a bare numeric range with verb guidance", () => {
    expect.hasAssertions();
    expect(() => parsePatch("2 3\n+X")).toThrow(/Hunk headers need a verb/);
  });

  it("accepts canonical dot-equals replace/cut and gap forms", () => {
    expect.hasAssertions();
    expect(applyPatch(FILE, "PUT 2.=3:\n+X")).toBe("a\nX\nd\ne");
    expect(applyPatch(FILE, "CUT 2.=3")).toBe("a\nd\ne");
    expect(applyPatch(FILE, "PUT <2:\n+X")).toBe("a\nX\nb\nc\nd\ne");
    expect(applyPatch(FILE, "PUT >2:\n+X")).toBe("a\nb\nX\nc\nd\ne");
    expect(applyPatch(FILE, "PUT <1:\n+X")).toBe("X\na\nb\nc\nd\ne");
    expect(applyPatch(FILE, "PUT >$:\n+X")).toBe("a\nb\nc\nd\ne\nX");
  });

  it("leniently accepts single-number replace and cut shorthand", () => {
    expect.hasAssertions();
    expect(applyPatch(FILE, "PUT 2:\n+X")).toBe("a\nX\nc\nd\ne");
    expect(applyPatch(FILE, "CUT 2")).toBe("a\nc\nd\ne");
  });

  it("recovers a dangling range separator as a single-line range", () => {
    expect.hasAssertions();
    expect(applyPatch(FILE, "PUT 2.=:\n+X")).toBe("a\nX\nc\nd\ne");
    expect(applyPatch(FILE, "PUT 2-:\n+X")).toBe("a\nX\nc\nd\ne");
    expect(applyPatch(FILE, "CUT 2.=")).toBe("a\nc\nd\ne");
  });

  it("still rejects a dangling separator followed by junk", () => {
    expect.hasAssertions();
    expect(() => parsePatch("PUT 2.= junk:\n+X")).toThrow();
  });

  it("recovers top-level numbered snapshot rows as single-line replacements", () => {
    expect.hasAssertions();
    for (const separator of [":", "|"]) {
      const result = parsePatch(`2${separator}B\n4${separator}D`);
      expect(applyEdits(FILE, result.edits).text).toBe("a\nB\nc\nD\ne");
      expect(result.warnings.some((w) => /snapshot row.*single-line `PUT N\.=N:`/i.test(w))).toBe(
        true,
      );
    }
  });
  // The xutf incident: a body written as consecutive lines under one number
  // (`4:` four times). Each row lowers to `PUT 4.=4:`, so the same-range
  // coalescer kept only the last — silently replacing the block opener with
  // `}` and dropping the rest. Recovery cannot read this; reject it.
  it("rejects repeated snapshot-row line numbers instead of keeping only the last", () => {
    expect.hasAssertions();
    expect(() => parsePatch("2:B\n4:first\n4:second")).toThrow(/name line 4/);
    expect(() => parsePatch("2:B\n4:first\n4:second")).toThrow(/keep only the last row/);
  });
  // The xutf `native.rs` incident: `+CUT 1266.=1277` inside a `PUT` body is a
  // literal row by spec, so it was inserted into the Rust file as text. That
  // reading is correct, but it must be named — the agent that hit this filed a
  // bug against the tool instead of repairing the line it had just planted.
  it("warns when a body row is itself a hunk header written with the payload prefix", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT >1:\n+inserted();\n+CUT 1266.=1277");
    expect(applyEdits(FILE, result.edits).text).toBe("a\ninserted();\nCUT 1266.=1277\nb\nc\nd\ne");
    expect(result.warnings.some((w) => w.includes("is itself a valid hunk header"))).toBe(true);
  });

  it("recovers a bare range header as an implicit PUT", () => {
    expect.hasAssertions();
    const result = parsePatch("2.=3:\n+X");
    expect(applyEdits(FILE, result.edits).text).toBe("a\nX\nd\ne");
    expect(result.warnings.some((w) => w.includes("bare `N.=M:` header"))).toBe(true);
  });

  it("ignores copied read elisions instead of writing them", () => {
    expect.hasAssertions();
    const result = parsePatch(
      [
        "1:a",
        "2-3:  omitted() { … }",
        "4:d",
        "[…2ln elided; re-read needed ranges with a.ts:2-3]",
      ].join("\n"),
    );
    expect(applyEdits(FILE, result.edits).text).toBe(FILE);
    expect(result.warnings.some((w) => w.includes("Ignored copied read-output elision"))).toBe(
      true,
    );
  });

  it("accepts a harmless trailing colon on bodyless CUT", () => {
    expect.hasAssertions();
    const result = parsePatch("CUT 2-3:");
    expect(applyEdits(FILE, result.edits).text).toBe("a\nd\ne");
    expect(result.warnings.some((w) => w.includes("Ignored a trailing `:`"))).toBe(true);
  });

  it("keeps the final hunk when numbered context targets the same exact line", () => {
    expect.hasAssertions();
    const result = parsePatch("2:b\nPUT 2:\n+B");
    expect(applyEdits(FILE, result.edits).text).toBe("a\nB\nc\nd\ne");
    expect(result.warnings.some((w) => w.includes("kept only the last"))).toBe(true);
  });

  it("lets a CUT supersede a placeholder PUT over the same exact range", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-3:\n+// moved block removed\nCUT 2-3 @block");
    expect(result.edits.some((edit) => edit.lineNum === 1)).toBe(false);
    expect(result.edits.some((edit) => edit.kind === "cut" && edit.register === "block")).toBe(
      true,
    );
  });

  it("rejects missing colon on body-bearing insert headers", () => {
    expect.hasAssertions();
    expect(() => parsePatch("PUT < 2\n+X")).toThrow(/`PUT` without `:` is clipboard-backed/);
    expect(() => parsePatch("PUT <1\n+X")).toThrow(/`PUT` without `:` is clipboard-backed/);
  });
});

describe("hashline body contracts", () => {
  it("auto-pipes a bare body row while warning", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-2:\n  hello");
    expect(applyEdits(FILE, result.edits).text).toBe("a\n  hello\nc\nd\ne");
    expect(result.warnings.some((w) => w.includes("Auto-prefixed bare body row"))).toBe(true);
  });

  it("strips read-output line number prefixes from auto-piped bare body rows", () => {
    expect.hasAssertions();
    for (const separator of [":", "|"]) {
      const result = parsePatch(`PUT 2-2:\n2${separator}hello`);
      expect(applyEdits(FILE, result.edits).text).toBe("a\nhello\nc\nd\ne");
      expect(result.warnings.some((w) => w.includes("Auto-prefixed bare body row"))).toBe(true);
    }
  });
  it("preserves `+N:` literal payloads without stripping", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-2:\n+3:keep");
    expect(applyEdits(FILE, result.edits).text).toBe("a\n3:keep\nc\nd\ne");
    expect(result.warnings.some((w) => w.includes("Auto-prefixed"))).toBe(false);
  });
  it("strips only one N: prefix from bare body rows (preserves nested digits:colon)", () => {
    expect.hasAssertions();
    // "2:42:hello" → should yield "42:hello", NOT "hello" (recursive would over-strip)
    const result = parsePatch("PUT 2-2:\n2:42:hello");
    expect(applyEdits(FILE, result.edits).text).toBe("a\n42:hello\nc\nd\ne");
  });

  it("strips N: prefixes only when every bare body row carries one", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-3:\n2:foo\n3:bar");
    expect(applyEdits(FILE, result.edits).text).toBe("a\nfoo\nbar\nd\ne");
  });

  it("leaves bare body rows untouched when only some carry an N: prefix", () => {
    expect.hasAssertions();
    // "3:keep" looks like a snapshot prefix but "plain" does not, so the body
    // is genuine content (not a pasted snapshot) — strip nothing.
    const result = parsePatch("PUT 2-3:\n3:keep\nplain");
    expect(applyEdits(FILE, result.edits).text).toBe("a\n3:keep\nplain\nd\ne");
  });

  it("keeps interior blank rows in a bare replace body", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-3:\nfoo\n\nbar");
    expect(applyEdits(FILE, result.edits).text).toBe("a\nfoo\n\nbar\nd\ne");
  });

  it("drops trailing blank rows between a bare body and the next hunk", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-2:\nfoo\n\nPUT 4-4:\nbaz");
    expect(applyEdits(FILE, result.edits).text).toBe("a\nfoo\nc\nbaz\ne");
  });

  it("skips blank rows when checking N: prefix uniformity", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-3:\n2:foo\n\n3:bar");
    expect(applyEdits(FILE, result.edits).text).toBe("a\nfoo\n\nbar\nd\ne");
  });

  it("leaves numeric-keyed literal bodies untouched (dict/YAML shape)", () => {
    expect.hasAssertions();
    const result = parsePatch('PUT 2-3:\n1: "one",\n2: "two",');
    expect(applyEdits(FILE, result.edits).text).toBe('a\n1: "one",\n2: "two",\nd\ne');
  });

  it("rejects ambiguous standalone `-` body rows with Markdown bullet guidance", () => {
    expect.hasAssertions();
    expect(() => parsePatch("PUT 2-2:\n-old")).toThrow(
      /Markdown bullets or other literal `-` lines.*`\+- item`/,
    );
  });
  it("auto-pipes a fully bare Markdown bullet body with a warning", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-2:\n- item\n  - nested");
    expect(applyEdits(FILE, result.edits).text).toBe("a\n- item\n  - nested\nc\nd\ne");
    expect(result.warnings.some((w) => w.includes("bullet row"))).toBe(true);
  });

  it("auto-pipes a bare bullet row next to explicit `+- item` siblings", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2-2:\n+### Fixed\n+- one\n- two");
    expect(applyEdits(FILE, result.edits).text).toBe("a\n### Fixed\n- one\n- two\nc\nd\ne");
    expect(result.warnings.some((w) => w.includes("bullet row"))).toBe(true);
  });

  it("still rejects non-bullet bare `-` rows even in a fully bare body", () => {
    expect.hasAssertions();
    expect(() => parsePatch("PUT 2-2:\n-old()")).toThrow(/`-` rows are not valid/);
  });

  it("still rejects bullet-shaped `-` rows beside a plain `+new` row (diff paste)", () => {
    expect.hasAssertions();
    expect(() => parsePatch("PUT 2-2:\n- x\n+new()")).toThrow(/`-` rows are not valid/);
  });

  it("allows literal Markdown bullets and plus-prefixed text when prefixed with `+`", () => {
    expect.hasAssertions();
    expect(applyPatch(FILE, "PUT 2-2:\n+- item\n+  - nested\n++plus")).toBe(
      "a\n- item\n  - nested\n+plus\nc\nd\ne",
    );
  });

  it("treats an empty replace as deletion and still rejects an empty insert", () => {
    expect.hasAssertions();
    expect(applyPatch(FILE, "PUT 2-2:")).toBe("a\nc\nd\ne");
    expect(() => parsePatch("PUT >$:")).toThrow(/promises body rows/);
  });

  it("rejects cut with a body", () => {
    expect.hasAssertions();
    expect(() => parsePatch("CUT 2\n+X")).toThrow(/takes no body rows/);
  });
});

describe("hashline — apply_patch / unified-diff contamination", () => {
  it("rejects apply_patch sentinels as contamination", () => {
    expect.hasAssertions();
    expect(() => parsePatch("*** Update File: a.ts\nPUT 2-2:\n+X")).toThrow(/apply_patch sentinel/);
    expect(() => parsePatch("*** Add File: a.ts\nPUT 2-2:\n+X")).toThrow(/apply_patch sentinel/);
  });

  it("rejects unified-diff hunk headers as contamination", () => {
    expect.hasAssertions();
    expect(() => parsePatch("@@ -1,3 +1,3 @@\nPUT 2-2:\n+X")).toThrow(/unified-diff hunk header/);
  });

  it("discards unified-diff old rows when explicit new rows follow", () => {
    expect.hasAssertions();
    const result = parsePatch("PUT 2:\n-b\n+B");
    expect(applyEdits(FILE, result.edits).text).toBe("a\nB\nc\nd\ne");
    expect(result.warnings.some((w) => w.includes("Ignored unified-diff `-old`"))).toBe(true);
  });

  it("treats top-level `+TEXT` as an orphan literal payload", () => {
    expect.hasAssertions();
    expect(() => parsePatch("+const X = 1;\nPUT 2-2:")).toThrow(
      /payload line has no preceding hunk header/,
    );
  });
});

describe("hashline apply — duplicate boundary payloads", () => {
  it("keeps replacement boundary echoes literal unless balance repair applies", () => {
    expect.hasAssertions();
    const text = ["// one", "// two", "old();"].join("\n");
    const diff = "PUT 3-3:\n+// one\n+// two\n+new();";
    expect(applyPatch(text, diff)).toBe(
      ["// one", "// two", "// one", "// two", "new();"].join("\n"),
    );
  });

  it("keeps pure-insert context echoes literal", () => {
    expect.hasAssertions();
    const text = ["aaa", "bbb", "ccc"].join("\n");
    const diff = "PUT >$:\n+bbb\n+ccc\n+NEW";
    expect(applyPatch(text, diff)).toBe("aaa\nbbb\nccc\nbbb\nccc\nNEW");
  });
});
