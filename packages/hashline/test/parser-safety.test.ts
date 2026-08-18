import { describe, expect, it } from "vitest";

import {
  InMemoryFilesystem,
  InMemorySnapshotStore,
  parsePatch,
  Patch,
  Patcher,
  splitHashlineLines,
  Tokenizer,
} from "../src/hashline/index.ts";

function taggedPatch(path: string, tag: string, body: string): Patch {
  return Patch.parse(`[${path}#${tag}]\n${body}`);
}

describe("Hashline public parsing edge cases", () => {
  it("classifies alternate locators, malformed headers, quoted moves, and split CRLF input", () => {
    expect.hasAssertions();
    const tokenizer = new Tokenizer();
    const cases = [
      ["PUT <1 @head:", { kind: "bof", register: "head" }],
      ["PUT >$:", { kind: "eof" }],
      ["PUT >7* @block:", { kind: "insert_after_block", anchor: { line: 7 }, register: "block" }],
      ["PUT 9* @replace", { kind: "block", anchor: { line: 9 }, register: "replace" }],
      ["CUT 4* @saved", { kind: "cut_block", anchor: { line: 4 }, register: "saved" }],
      ["MV 'a file with spaces.ts'", { kind: "move", dest: "a file with spaces.ts" }],
    ] as const;
    for (const [line, target] of cases) {
      expect(tokenizer.tokenize(line)).toMatchObject({ kind: "op-block", target });
    }
    for (const malformed of [
      "[a.ts#ABCDE]",
      "[a#part.ts#BEEF]",
      "PUT 4-5*:",
      "CUT 4-5*",
      "MV 'unterminated",
      "PUT >0:",
    ]) {
      expect(tokenizer.tokenize(malformed)).toMatchObject({ kind: "raw" });
    }
    expect(splitHashlineLines("")).toEqual([""]);
    expect(splitHashlineLines("one\r\ntwo\nthree\r")).toEqual(["one", "two", "three"]);
  });

  it("keeps parser diagnostics and recovery safeguards observable through parsePatch", () => {
    expect.hasAssertions();
    for (const [patch, message] of [
      ["PUT 1.=100001:\n+x", /maximum/i],
      ["*** Update File: a.ts", /apply_patch sentinel/i],
      ["@@ malformed @@", /bracketed hunk header/i],
      ["1 2", /bare range hunk header/i],
      ["1:\n1:again", /repeating a number/i],
      ["REM\n+body", /does not take body rows/i],
    ] as const) {
      expect(() => parsePatch(patch)).toThrow(message);
    }
    expect(parsePatch("# explanation\nPUT 1:\n+replacement").edits).toHaveLength(2);
    expect(parsePatch("CUT 1:").warnings).toContain(
      "Ignored a trailing `:` on bodyless `CUT`. Prefer `CUT N.=M` / `CUT N*` without a colon.",
    );
  });
});

describe("Hashline patcher preflight and write failures", () => {
  it("rejects duplicate/noop preflights and reports a partial multi-file write without hiding landed work", async () => {
    expect.hasAssertions();
    const snapshots = new InMemorySnapshotStore();
    const firstTag = snapshots.record("first.txt", "first\n");
    const secondTag = snapshots.record("second.txt", "second\n");
    class FailingFilesystem extends InMemoryFilesystem {
      override async writeText(path: string, text: string): Promise<{ text: string }> {
        if (path === "second.txt") throw new Error("disk full");
        return super.writeText(path, text);
      }
    }
    const fs = new FailingFilesystem([
      ["first.txt", "first\n"],
      ["second.txt", "second\n"],
    ]);
    const patcher = new Patcher({ fs, snapshots });
    await expect(
      patcher.preflight(
        Patch.parse(
          `[first.txt#${firstTag}]\nPUT 1:\n+FIRST\n[./first.txt#${firstTag}]\nPUT 1:\n+FIRST`,
        ),
      ),
    ).rejects.toThrow(/same file/i);
    await expect(
      patcher.apply(
        Patch.parse(
          `[first.txt#${firstTag}]\nPUT 1:\n+FIRST\n[second.txt#${secondTag}]\nPUT 1:\n+SECOND`,
        ),
      ),
    ).rejects.toThrow(/Failed to write second\.txt: disk full.*already written: first\.txt/i);
    expect(fs.get("first.txt")).toBe("FIRST\n");
    expect(fs.get("second.txt")).toBe("second\n");

    const stableTag = snapshots.record("first.txt", "FIRST\n");
    await expect(patcher.preflight(taggedPatch("first.txt", stableTag, "PUT >$"))).rejects.toThrow(
      /Nothing to paste/i,
    );
  });

  it("reports write failures at the first and last multi-section positions", async () => {
    expect.hasAssertions();
    const build = (failure: string) => {
      const snapshots = new InMemorySnapshotStore();
      const firstTag = snapshots.record("first.txt", "first\n");
      const secondTag = snapshots.record("second.txt", "second\n");
      class FailingFilesystem extends InMemoryFilesystem {
        override async writeText(path: string, text: string): Promise<{ text: string }> {
          if (path === failure) throw new Error("disk unavailable");
          return super.writeText(path, text);
        }
      }
      return {
        fs: new FailingFilesystem([
          ["first.txt", "first\n"],
          ["second.txt", "second\n"],
        ]),
        patch: Patch.parse(
          `[first.txt#${firstTag}]\nPUT 1:\n+FIRST\n[second.txt#${secondTag}]\nPUT 1:\n+SECOND`,
        ),
        snapshots,
      };
    };
    const first = build("first.txt");
    await expect(
      new Patcher({ fs: first.fs, snapshots: first.snapshots }).apply(first.patch),
    ).rejects.toThrow(/Failed to write first\.txt: disk unavailable.*not written: second\.txt/i);
    const last = build("second.txt");
    await expect(
      new Patcher({ fs: last.fs, snapshots: last.snapshots }).apply(last.patch),
    ).rejects.toThrow(
      /Failed to write second\.txt: disk unavailable.*already written: first\.txt/i,
    );
  });

  it("rejects a no-op section before any multi-file commit", async () => {
    expect.hasAssertions();
    const snapshots = new InMemorySnapshotStore();
    const sameTag = snapshots.record("same.txt", "same\n");
    const otherTag = snapshots.record("other.txt", "other\n");
    const fs = new InMemoryFilesystem([
      ["same.txt", "same\n"],
      ["other.txt", "other\n"],
    ]);
    await expect(
      new Patcher({ fs, snapshots }).apply(
        Patch.parse(
          `[same.txt#${sameTag}]\nPUT 1.=1:\n+same\n[other.txt#${otherTag}]\nPUT 1.=1:\n+OTHER`,
        ),
      ),
    ).rejects.toThrow(/no changes/i);
    expect(fs.get("other.txt")).toBe("other\n");
  });

  it("preserves a binary-detected BOM when text reads do not expose it", async () => {
    expect.hasAssertions();
    const snapshots = new InMemorySnapshotStore();
    const tag = snapshots.record("bom.txt", "before\n");
    class BinaryBomFilesystem extends InMemoryFilesystem {
      override readBinary(path: string): Promise<Uint8Array> {
        void path;
        return Promise.resolve(new Uint8Array([0xef, 0xbb, 0xbf, 0x62]));
      }
    }
    const fs = new BinaryBomFilesystem([["bom.txt", "before\n"]]);
    const result = await new Patcher({ fs, snapshots }).apply(
      taggedPatch("bom.txt", tag, "PUT 1.=1:\n+after"),
    );
    expect(result.sections[0]?.persisted).toBe("\u{FEFF}after\n");
    expect(fs.get("bom.txt")).toBe("\u{FEFF}after\n");
  });

  it("treats same-content patches as noops while rejecting a move onto its own canonical target", async () => {
    expect.hasAssertions();
    const snapshots = new InMemorySnapshotStore();
    const tag = snapshots.record("same.txt", "same\n");
    const fs = new InMemoryFilesystem([["same.txt", "same\n"]]);
    const patcher = new Patcher({ fs, snapshots, enforceSeenLines: false });
    const sameContent = taggedPatch("same.txt", tag, "PUT 1.=1:\n+same");
    await expect(patcher.preflight(sameContent)).rejects.toThrow(/no changes/i);
    await expect(patcher.apply(sameContent)).resolves.toMatchObject({
      sections: [{ op: "noop", after: "same\n" }],
    });
    await expect(patcher.apply(Patch.parse(`[same.txt#${tag}]\nMV same.txt`))).rejects.toThrow(
      /destination is the same/i,
    );
  });
});
