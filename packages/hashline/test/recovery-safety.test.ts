import { beforeAll, describe, expect, it } from "vitest";

import {
  InMemoryFilesystem,
  InMemorySnapshotStore,
  initializeSyntax,
  Patch,
  Patcher,
  RECOVERY_EXTERNAL_WARNING,
  Recovery,
} from "../src/hashline/index.ts";

const lines = (...rows: string[]) => `${rows.join("\n")}\n`;

beforeAll(async () => initializeSyntax());

describe("Hashline strict-coverage public seams", () => {
  it("preserves recoverable hashless noisy paths and fails closed on malformed tags", () => {
    expect.hasAssertions();
    expect(Patch.parseSingle("[*** Update: C:/work folder/a.ts]\nPUT >$:\n+tail").path).toBe(
      "C:/work folder/a.ts",
    );
    expect(() => Patch.parse("[Update: a.ts#not-a-tag]\nPUT >$:\n+tail")).toThrow(
      /Input header must be/i,
    );
    expect(() => Patch.parse("[unfinished header\nPUT >$:\n+tail")).toThrow(
      /Input header must be/i,
    );
    expect(Patch.parse("[a.ts#ABCD]\nPUT >$:\n+tail\n[b.ts#BEEF]\n").sections).toEqual([
      expect.objectContaining({ path: "a.ts" }),
    ]);
  });

  it("recovers a stale contiguous range but rejects a drifted interior", () => {
    expect.hasAssertions();
    const path = "recover.txt";
    const before = lines("start", "one", "two", "end");
    const store = new InMemorySnapshotStore();
    const tag = store.record(path, before);
    const recovery = new Recovery(store);
    const replacement = Patch.parseSingle(`[${path}#${tag}]\nPUT 2.=3:\n+ONE\n+TWO`).edits;
    const recovered = recovery.tryRecover({
      path,
      currentText: lines("heading", "start", "one", "two", "end"),
      fileHash: tag,
      edits: replacement,
    });
    expect(recovered?.text).toBe(lines("heading", "start", "ONE", "TWO", "end"));
    expect(recovered?.warnings).not.toContain(RECOVERY_EXTERNAL_WARNING);
    expect(
      recovery.tryRecover({
        path,
        currentText: lines("heading", "start", "one", "changed", "end"),
        fileHash: tag,
        edits: replacement,
      }),
    ).toBeNull();
    const edgeDelete = Patch.parseSingle(`[${path}#${tag}]\nCUT 4`).edits;
    expect(
      recovery.tryRecover({
        path,
        currentText: lines("start", "one", "two", "end", "external trailer"),
        fileHash: tag,
        edits: edgeDelete,
      })?.text,
    ).toBe(lines("start", "one", "two", "external trailer"));
  });

  it("replays stale cursor and span forms while refusing an unresolvable replay", () => {
    expect.hasAssertions();
    const path = "forms.txt";
    const before = lines("one", "two", "three");
    const store = new InMemorySnapshotStore();
    const tag = store.record(path, before);
    const currentText = lines("external", "one", "two", "three");
    const recovery = new Recovery(store);
    expect(
      recovery.tryRecover({
        path,
        currentText,
        fileHash: tag,
        edits: [
          {
            kind: "insert",
            cursor: { kind: "after_anchor", anchor: { line: 2 } },
            text: "after two",
            blockStart: 1,
            lineNum: 1,
            index: 0,
          },
        ],
      })?.text,
    ).toBe(lines("external", "one", "two", "after two", "three"));
    expect(
      recovery.tryRecover({
        path,
        currentText,
        fileHash: tag,
        edits: [{ kind: "block", anchor: { line: 2 }, payloads: ["x"], lineNum: 1, index: 0 }],
      }),
    ).toBeNull();
  });

  it("returns null rather than claiming an empty recovered paste changed the file", () => {
    expect.hasAssertions();
    const path = "empty-paste.txt";
    const before = lines("one", "two");
    const store = new InMemorySnapshotStore();
    const tag = store.record(path, before);
    const edits = Patch.parseSingle(`[${path}#${tag}]\nPUT >2 @missing`).edits;
    expect(
      new Recovery(store).tryRecover({
        path,
        currentText: lines("one", "two", "external"),
        fileHash: tag,
        edits,
        clipboard: { named: new Map() },
      }),
    ).toBeNull();
  });

  it("applies a stale head insert with an explicit drift warning", async () => {
    expect.hasAssertions();
    const fs = new InMemoryFilesystem([["head.txt", lines("live")]]);
    const snapshots = new InMemorySnapshotStore();
    const tag = snapshots.record("head.txt", lines("before"));
    const result = await new Patcher({ fs, snapshots }).apply(
      Patch.parse(`[head.txt#${tag}]\nPUT <1:\n+inserted`),
    );
    expect(result.sections[0]).toMatchObject({ after: lines("inserted", "live") });
    expect(result.sections[0]?.warnings.join(" ")).toMatch(/drift/i);
  });

  it("keeps named clipboard state only after a multi-file batch lands", async () => {
    expect.hasAssertions();
    const fs = new InMemoryFilesystem([
      ["source.txt", lines("keep", "move")],
      ["target.txt", lines("target")],
    ]);
    const snapshots = new InMemorySnapshotStore();
    const sourceTag = snapshots.record("source.txt", lines("keep", "move"));
    const targetTag = snapshots.record("target.txt", lines("target"));
    const clipboard = { named: new Map<string, string[]>() };
    const result = await new Patcher({ fs, snapshots, clipboard }).apply(
      Patch.parse(
        `[source.txt#${sourceTag}]\nCUT 2 @moved\n[target.txt#${targetTag}]\nPUT >$ @moved`,
      ),
    );
    expect(result.sections.map((section) => section.op)).toEqual(["update", "update"]);
    expect(fs.get("source.txt")).toBe(lines("keep"));
    expect(fs.get("target.txt")).toBe(lines("target", "move"));
    expect(clipboard.named.get("moved")).toEqual(["move"]);
  });

  it("accepts recovered headers through envelopes and preserves consecutive same-path order", () => {
    expect.hasAssertions();
    const patch = Patch.parse(
      "*** Begin Patch\n[*** Update File: a.ts#beef]\nPUT >$:\n+first\n[a.ts#BEEF]\nPUT >$:\n+second\n*** End Patch",
    );
    expect(patch.sections).toHaveLength(1);
    expect(patch.sections[0]?.path).toBe("a.ts");
    expect(patch.sections[0]?.edits).toHaveLength(2);
    expect(
      Patch.parse("[hashless.ts]\nPUT >$:\n+first\n[hashless.ts#ABCD]\nPUT >$:\n+second")
        .sections[0]?.fileHash,
    ).toBe("ABCD");
    expect(Patch.parseSingle("[a.ts#BEEF]\nMV ./next.ts").fileOp).toEqual({
      kind: "move",
      dest: "./next.ts",
    });
    expect(Patch.parseSingle("[a.ts#BEEF]\nPUT >$:\n+tail").applyTo("").warnings).toBeUndefined();
  });

  it("fails closed when stale recovery cannot map ranges, cursors, or offsets", () => {
    expect.hasAssertions();
    const path = "closed.txt";
    const before = lines("one", "two", "three", "four");
    const store = new InMemorySnapshotStore();
    const tag = store.record(path, before);
    const recovery = new Recovery(store);
    const changedInterior = Patch.parseSingle(`[${path}#${tag}]\nCUT 2-3`).edits;
    const inconsistentOffsets = Patch.parseSingle(
      `[${path}#${tag}]\nPUT 2:\n+TWO\nPUT 3:\n+THREE`,
    ).edits;
    expect(
      recovery.tryRecover({
        path,
        currentText: lines("one", "two", "changed", "four"),
        fileHash: tag,
        edits: changedInterior,
      }),
    ).toBeNull();
    expect(
      recovery.tryRecover({
        path,
        currentText: lines("prefix", "one", "two", "inserted", "three", "four"),
        fileHash: tag,
        edits: inconsistentOffsets,
      }),
    ).toBeNull();
    expect(
      recovery.tryRecover({
        path,
        currentText: lines("one", "three", "four"),
        fileHash: tag,
        edits: [
          {
            kind: "insert",
            cursor: { kind: "eof" },
            text: "tail",
            blockStart: 2,
            lineNum: 1,
            index: 0,
          },
        ],
      }),
    ).toBeNull();
    expect(
      recovery.tryRecover({
        path,
        currentText: lines("one", "three", "four"),
        fileHash: tag,
        edits: [
          {
            kind: "insert",
            cursor: { kind: "after_anchor", anchor: { line: 2 } },
            text: "after",
            lineNum: 1,
            index: 0,
          },
        ],
      }),
    ).toBeNull();
  });

  it("keeps Patcher failures actionable across parser, clipboard, and write boundaries", async () => {
    expect.hasAssertions();
    const fs = new InMemoryFilesystem([["one.txt", lines("one")]]);
    const snapshots = new InMemorySnapshotStore();
    const tag = snapshots.record("one.txt", lines("one"));
    await expect(
      new Patcher({ fs, snapshots }).apply(Patch.parse(`[one.txt#${tag}]\nPUT 2-1:\n+bad`)),
    ).rejects.toThrow(/Invalid absolute range/i);

    const clipboard = { named: new Map<string, string[]>() };
    await new Patcher({ fs, snapshots, clipboard }).apply(
      Patch.parse(`[one.txt#${tag}]\nCUT 1 @saved\nPUT >$ @saved`),
    );
    expect(clipboard.named.get("saved")).toEqual(["one"]);

    class StringFailingFilesystem extends InMemoryFilesystem {
      override writeText(): Promise<never> {
        // The adapter must preserve non-Error filesystem rejections for callers.
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- Test the public non-Error boundary.
        return Promise.reject("disk offline");
      }
    }
    const failing = new StringFailingFilesystem([
      ["first.txt", lines("first")],
      ["second.txt", lines("second")],
    ]);
    const failingSnapshots = new InMemorySnapshotStore();
    const firstTag = failingSnapshots.record("first.txt", lines("first"));
    const secondTag = failingSnapshots.record("second.txt", lines("second"));
    await expect(
      new Patcher({ fs: failing, snapshots: failingSnapshots }).apply(
        Patch.parse(
          `[first.txt#${firstTag}]\nPUT 1.=1:\n+FIRST\n[second.txt#${secondTag}]\nPUT 1.=1:\n+SECOND`,
        ),
      ),
    ).rejects.toThrow(/Failed to write first.txt: disk offline/);
  });
});
