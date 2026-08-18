import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { InMemorySnapshotStore } from "../src/hashline/index.ts";
import { detailsFor, restoreState } from "../src/state.ts";

import type { Clipboard } from "../src/hashline/index.ts";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

function context(entries: readonly unknown[]): ExtensionContext {
  return { sessionManager: { getBranch: () => entries } } as unknown as ExtensionContext;
}

function toolEntry(details: unknown): unknown {
  return {
    type: "message",
    id: "result",
    parentId: null,
    timestamp: "2026-01-01T00:00:00.000Z",
    message: {
      role: "toolResult",
      toolName: "read",
      toolCallId: "call",
      content: [],
      details,
      isError: false,
    },
  };
}

describe("Hashline session state", () => {
  it("restores only matching active-branch snapshots and bounded named registers", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-state-"));
    const path = join(directory, "fixture.txt");
    await writeFile(path, "one\ntwo\n");
    try {
      const source = new InMemorySnapshotStore();
      const clipboard: Clipboard = { named: new Map([["clip", ["two"]]]) };
      const tag = source.record(path, "one\ntwo\n", [1, 2]);
      const details = detailsFor(source, clipboard, [path]);
      expect(details.hashline.snapshots[0]).toMatchObject({ path, tag, seen: [1, 2] });
      expect(JSON.stringify(details.hashline.snapshots)).not.toContain("one\\ntwo");
      const restored = new InMemorySnapshotStore();
      const target: Clipboard = {};
      await restoreState(context([toolEntry(details)]), restored, target);
      expect(restored.head(path)?.hash).toBe(tag);
      expect(target.named?.get("clip")).toEqual(["two"]);

      const fullText = new InMemorySnapshotStore();
      fullText.record(path, "one\ntwo\n");
      const unrestricted = new InMemorySnapshotStore();
      await restoreState(context([toolEntry(detailsFor(fullText, {}, [path]))]), unrestricted, {});
      expect(unrestricted.head(path)?.seenLines).toBeUndefined();

      await writeFile(path, "changed\n");
      const stale = new InMemorySnapshotStore();
      await restoreState(
        context([
          toolEntry(details),
          {
            type: "message",
            message: { role: "toolResult", details: { hashline: { schema: "bad" } } },
          },
        ]),
        stale,
        {},
      );
      expect(stale.head(path)).toBeNull();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("lets a newest valid empty register map clear older registers", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-hashline-state-"));
    const path = join(directory, "fixture.txt");
    await writeFile(path, "one\n");
    try {
      const source = new InMemorySnapshotStore();
      source.record(path, "one\n", [1]);
      const older = detailsFor(source, { named: new Map([["clip", ["one"]]]) }, [path]);
      const newest = detailsFor(source, {}, [path]);
      const clipboard: Clipboard = { named: new Map([["stale", ["value"]]]) };
      await restoreState(
        context([toolEntry(older), toolEntry(newest)]),
        new InMemorySnapshotStore(),
        clipboard,
      );
      expect(clipboard.named).toEqual(new Map());
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("caps serialized metadata across snapshots, provenance, registers, and JSON bytes", () => {
    expect.hasAssertions();
    const source = new InMemorySnapshotStore({ maxPaths: 30, maxTotalBytes: 1024 * 1024 });
    const paths = Array.from({ length: 30 }, (_, index) => `/tmp/hashline-${String(index)}.txt`);
    for (const path of paths)
      source.record(
        path,
        "x\n",
        Array.from({ length: 2000 }, (_, index) => index + 1),
      );
    const named = new Map(
      Array.from({ length: 20 }, (_, index) => [`register-${String(index)}`, ["x".repeat(4096)]]),
    );
    const details = detailsFor(source, { named }, paths);
    expect(details.hashline.snapshots.length).toBeLessThanOrEqual(20);
    expect(
      details.hashline.snapshots.reduce(
        (total, snapshot) => total + (snapshot.seen?.length ?? 0),
        0,
      ),
    ).toBeLessThanOrEqual(2000);
    expect(Object.keys(details.hashline.registers).length).toBeLessThanOrEqual(10);
    expect(Buffer.byteLength(JSON.stringify(details), "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(JSON.stringify(details)).not.toContain('"x\\n"');
  });

  it("ignores malformed and oversized active-branch details", async () => {
    expect.hasAssertions();
    const snapshots = new InMemorySnapshotStore();
    const clipboard: Clipboard = {};
    const oversized = {
      hashline: {
        schema: "pi-hashline",
        version: 1,
        snapshots: Array.from({ length: 31 }, () => ({})),
        registers: {},
      },
    };
    await restoreState(
      context([
        toolEntry(oversized),
        { type: "message", message: { role: "toolResult", details: {} } },
      ]),
      snapshots,
      clipboard,
    );
    expect(snapshots.findByHash("0000")).toEqual([]);
    expect(clipboard.named).toBeUndefined();
  });
});
