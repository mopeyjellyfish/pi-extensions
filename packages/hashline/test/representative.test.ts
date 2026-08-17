import { describe, expect, it } from "vitest";

import {
  computeFileHash,
  InMemoryFilesystem,
  InMemorySnapshotStore,
  Patch,
  Patcher,
} from "../src/hashline/index.ts";

describe("ported Hashline representative behavior", () => {
  it("parses and applies a tagged inclusive range", async () => {
    expect.hasAssertions();
    const path = "fixture.txt";
    const source = "one\ntwo\nthree\n";
    const filesystem = new InMemoryFilesystem([[path, source]]);
    const snapshots = new InMemorySnapshotStore();
    const tag = snapshots.record(path, source, [1, 2, 3]);

    await new Patcher({ fs: filesystem, snapshots }).apply(
      Patch.parse(`[${path}#${tag}]\nPUT 2.=2:\n+TWO`),
    );

    expect(filesystem.get(path)).toBe("one\nTWO\nthree\n");
  });

  it("keeps distinct retained snapshots when their short tags collide", () => {
    expect.hasAssertions();
    const store = new InMemorySnapshotStore();
    const path = "fixture.txt";
    let first = "";
    let second = "";
    const tags = new Map<string, string>();
    for (let index = 0; index < 100_000 && second === ""; index++) {
      const text = `line ${String(index)}\n`;
      const tag = computeFileHash(text);
      const previous = tags.get(tag);
      if (previous === undefined) tags.set(tag, text);
      else if (previous !== text) {
        first = previous;
        second = text;
      }
    }
    expect(second).not.toBe("");
    const firstTag = store.record(path, first, [1]);
    const secondTag = store.record(path, second, [1]);
    expect(firstTag).toBe(secondTag);
    expect(store.head(path)?.text).toBe(second);
    expect(store.byHash(path, firstTag)?.text).toBe(second);
  });
});
