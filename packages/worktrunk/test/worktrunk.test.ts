import { describe, expect, it, vi } from "vitest";

import { WorktrunkClient } from "../src/worktrunk.ts";

const MAIN_PATH = "/projects/example";
const FEATURE_PATH = "/projects/example-feature";
const PRUNABLE_PATH = "/projects/example-prunable";

function listDocument(): string {
  return JSON.stringify({
    schema: 2,
    repo: { default_branch: "main" },
    items: [
      {
        branch: "main",
        head: { sha: "1111111111111111111111111111111111111111" },
        worktree: {
          changes: {
            conflicted: false,
            deleted: false,
            modified: false,
            renamed: false,
            staged: false,
            untracked: false,
          },
          current: true,
          main: true,
          path: MAIN_PATH,
        },
      },
      {
        branch: "feature/adapter",
        head: { sha: "2222222222222222222222222222222222222222" },
        worktree: {
          changes: {
            conflicted: false,
            deleted: false,
            modified: false,
            renamed: false,
            staged: false,
            untracked: false,
          },
          current: false,
          main: false,
          path: FEATURE_PATH,
        },
      },
    ],
  });
}

function schema2(items: readonly Record<string, unknown>[]): string {
  return JSON.stringify({ items, schema: 2 });
}

function worktreeItem(
  path: string,
  options: {
    readonly branch?: string | null;
    readonly branchMismatch?: boolean;
    readonly changes?: Record<string, unknown>;
    readonly changesValue?: unknown;
    readonly current?: boolean;
    readonly head?: Record<string, unknown> | null;
    readonly main?: boolean;
  } = {},
): Record<string, unknown> {
  return {
    branch: options.branch === undefined ? "feature/adapter" : options.branch,
    head:
      options.head === undefined
        ? { sha: "2222222222222222222222222222222222222222" }
        : options.head,
    worktree: {
      branch_mismatch: options.branchMismatch ?? false,
      changes:
        options.changesValue === undefined
          ? {
              conflicted: false,
              deleted: false,
              modified: false,
              renamed: false,
              staged: false,
              untracked: false,
              ...options.changes,
            }
          : options.changesValue,
      current: options.current ?? false,
      main: options.main ?? false,
      path,
    },
  };
}

function runnerWith(
  ...results: { code: number; killed: boolean; stderr: string; stdout: string }[]
) {
  const run = vi.fn();
  for (const result of results) {
    run.mockResolvedValueOnce(result);
  }
  return run;
}

describe("WorktrunkClient", () => {
  it("reads normalized schema-2 worktrees through explicit, cancellable argv", async () => {
    expect.hasAssertions();
    const signal = new AbortController().signal;
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" })
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: listDocument() });
    const client = new WorktrunkClient(run);

    await expect(client.list(MAIN_PATH, signal)).resolves.toEqual({
      mainPath: MAIN_PATH,
      worktrees: [
        {
          branch: "main",
          clean: true,
          current: true,
          head: "1111111111111111111111111111111111111111",
          main: true,
          path: MAIN_PATH,
        },
        {
          branch: "feature/adapter",
          clean: true,
          current: false,
          head: "2222222222222222222222222222222222222222",
          main: false,
          path: FEATURE_PATH,
        },
      ],
    });
    expect(run).toHaveBeenNthCalledWith(1, ["--version"], {
      cwd: MAIN_PATH,
      signal,
      timeout: 30_000,
    });
    expect(run).toHaveBeenNthCalledWith(
      2,
      ["--config-set", "list.json-schema=2", "list", "--format=json"],
      { cwd: MAIN_PATH, signal, timeout: 30_000 },
    );
  });

  it("keeps prunable worktrees with unknown changes listable and fails their clean state closed", async () => {
    expect.hasAssertions();
    const document = schema2([
      worktreeItem(MAIN_PATH, { branch: "main", current: true, main: true }),
      worktreeItem(PRUNABLE_PATH, { changesValue: null }),
    ]);
    const client = new WorktrunkClient(
      runnerWith(
        { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
        { code: 0, killed: false, stderr: "", stdout: document },
      ),
    );

    await expect(client.list(MAIN_PATH, undefined)).resolves.toEqual({
      mainPath: MAIN_PATH,
      worktrees: [
        {
          branch: "main",
          clean: true,
          current: true,
          head: "2222222222222222222222222222222222222222",
          main: true,
          path: MAIN_PATH,
        },
        {
          branch: "feature/adapter",
          clean: false,
          current: false,
          head: "2222222222222222222222222222222222222222",
          main: false,
          path: PRUNABLE_PATH,
        },
      ],
    });
  });

  it("activates an externally created linked worktree despite unrelated prunable entries", async () => {
    expect.hasAssertions();
    const confirmation = schema2([
      worktreeItem(MAIN_PATH, { branch: "main", current: true, main: true }),
      worktreeItem(FEATURE_PATH, { branch: "feat/dice-load", branchMismatch: true }),
      worktreeItem(PRUNABLE_PATH, { changesValue: null }),
    ]);
    const client = new WorktrunkClient(
      runnerWith(
        { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
        {
          code: 0,
          killed: false,
          stderr: "",
          stdout: JSON.stringify({ path: FEATURE_PATH }),
        },
        { code: 0, killed: false, stderr: "", stdout: confirmation },
      ),
    );

    await expect(client.activate("feat/dice-load", MAIN_PATH, undefined)).resolves.toEqual({
      mainPath: MAIN_PATH,
      worktree: {
        branch: "feat/dice-load",
        clean: true,
        current: false,
        head: "2222222222222222222222222222222222222222",
        main: false,
        path: FEATURE_PATH,
      },
    });
  });

  it("keeps detached or unborn linked worktrees listable without inventing branch state", async () => {
    expect.hasAssertions();
    const detachedPath = "/projects/example-detached";
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" })
      .mockResolvedValueOnce({
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({
          schema: 2,
          items: [
            {
              branch: "main",
              head: { sha: "1111111111111111111111111111111111111111" },
              worktree: {
                changes: {
                  conflicted: false,
                  deleted: false,
                  modified: false,
                  renamed: false,
                  staged: false,
                  untracked: false,
                },
                current: true,
                main: true,
                path: MAIN_PATH,
              },
            },
            {
              branch: null,
              head: null,
              worktree: {
                changes: {
                  conflicted: false,
                  deleted: false,
                  modified: false,
                  renamed: false,
                  staged: false,
                  untracked: false,
                },
                current: false,
                main: false,
                path: detachedPath,
              },
            },
          ],
        }),
      });
    const client = new WorktrunkClient(run);

    await expect(client.list(MAIN_PATH, undefined)).resolves.toEqual({
      mainPath: MAIN_PATH,
      worktrees: [
        {
          branch: "main",
          clean: true,
          current: true,
          head: "1111111111111111111111111111111111111111",
          main: true,
          path: MAIN_PATH,
        },
        { clean: true, current: false, main: false, path: detachedPath },
      ],
    });
  });

  it("refuses unavailable, cancelled, malformed, and too-old Worktrunk discovery", async () => {
    expect.hasAssertions();
    await expect(
      new WorktrunkClient(
        runnerWith({ code: 127, killed: false, stderr: "not found", stdout: "" }),
      ).list(MAIN_PATH, undefined),
    ).rejects.toThrow("required on PATH");
    await expect(
      new WorktrunkClient(vi.fn(() => Promise.reject(new Error("spawn wt ENOENT")))).list(
        MAIN_PATH,
        undefined,
      ),
    ).rejects.toThrow("required on PATH");
    await expect(
      new WorktrunkClient(
        runnerWith({ code: 0, killed: true, stderr: "", stdout: "wt 0.67.0\n" }),
      ).list(MAIN_PATH, undefined),
    ).rejects.toThrow("discovery was cancelled");
    await expect(
      new WorktrunkClient(
        runnerWith({ code: 0, killed: false, stderr: "", stdout: "wt 0.66.9\n" }),
      ).list(MAIN_PATH, undefined),
    ).rejects.toThrow("0.67.0 or newer");
    await expect(
      new WorktrunkClient(
        runnerWith({ code: 0, killed: false, stderr: "", stdout: "unknown\n" }),
      ).list(MAIN_PATH, undefined),
    ).rejects.toThrow("received unknown");

    const mainOnly = schema2([
      worktreeItem(MAIN_PATH, { branch: "main", current: true, main: true }),
    ]);
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.68.0\n" },
          { code: 0, killed: false, stderr: "", stdout: mainOnly },
        ),
      ).list(MAIN_PATH, undefined),
    ).resolves.toMatchObject({ mainPath: MAIN_PATH });
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 1.0.0\n" },
          { code: 0, killed: false, stderr: "", stdout: mainOnly },
        ),
      ).list(MAIN_PATH, undefined),
    ).resolves.toMatchObject({ mainPath: MAIN_PATH });

    let longVersionFailure: unknown;
    try {
      await new WorktrunkClient(
        runnerWith({
          code: 0,
          killed: false,
          stderr: "",
          stdout: `unrecognized ${"x".repeat(12_000)}`,
        }),
      ).list(MAIN_PATH, undefined);
    } catch (error) {
      longVersionFailure = error;
    }
    expect(longVersionFailure).toBeInstanceOf(Error);
    expect((longVersionFailure as Error).message.length).toBeLessThan(4500);
  });

  it("rejects malformed, legacy, and unsafe schema-2 list payloads instead of guessing", async () => {
    expect.hasAssertions();
    const duplicatePath = schema2([
      worktreeItem(MAIN_PATH, { branch: "main", current: true, main: true }),
      worktreeItem(MAIN_PATH),
    ]);
    const missingMain = schema2([worktreeItem(FEATURE_PATH)]);
    const relativePath = schema2([
      worktreeItem("relative-path", { branch: "main", current: true, main: true }),
    ]);
    const invalidHead = schema2([
      worktreeItem(MAIN_PATH, {
        branch: "main",
        current: true,
        head: "not-an-object" as never,
        main: true,
      }),
    ]);
    const invalidChanges = schema2([
      worktreeItem(MAIN_PATH, {
        branch: "main",
        changes: { modified: "yes" },
        current: true,
        main: true,
      }),
    ]);
    const missingChanges = schema2([
      {
        branch: "main",
        head: { sha: "2222222222222222222222222222222222222222" },
        worktree: { current: true, main: true, path: MAIN_PATH },
      },
    ]);
    const invalidDirtyChanges = schema2([
      worktreeItem(MAIN_PATH, {
        branch: "main",
        changes: { modified: "yes", staged: true },
        current: true,
        main: true,
      }),
    ]);
    const malformedChanges = schema2([
      worktreeItem(MAIN_PATH, {
        branch: "main",
        changesValue: "unknown",
        current: true,
        main: true,
      }),
    ]);
    const missingChangesFlag = schema2([
      worktreeItem(MAIN_PATH, {
        branch: "main",
        changesValue: { modified: false },
        current: true,
        main: true,
      }),
    ]);
    const cases: readonly (readonly [string, string])[] = [
      ["{", "malformed JSON"],
      [JSON.stringify({ schema: 1, items: [] }), "unsupported list schema"],
      [JSON.stringify({ schema: 2, items: [{}] }), "invalid worktree item"],
      [relativePath, "non-absolute"],
      [duplicatePath, "duplicate worktree path"],
      [missingMain, "exactly one main"],
      [invalidHead, "missing items[0].head"],
      [missingChanges, "missing items[0].worktree.changes"],
      [malformedChanges, "missing items[0].worktree.changes"],
      [missingChangesFlag, "changes.staged"],
      [invalidChanges, "changes.modified"],
      [invalidDirtyChanges, "changes.modified"],
    ];

    for (const [stdout, message] of cases) {
      await expect(
        new WorktrunkClient(
          runnerWith(
            { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
            { code: 0, killed: false, stderr: "", stdout },
          ),
        ).list(MAIN_PATH, undefined),
      ).rejects.toThrow(message);
    }
  });

  it("creates through Worktrunk and only exposes the path after a fresh list confirms it", async () => {
    expect.hasAssertions();
    const signal = new AbortController().signal;
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" })
      .mockResolvedValueOnce({
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({
          action: "created",
          branch: "feature/adapter",
          created_branch: true,
          path: FEATURE_PATH,
        }),
      })
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: listDocument() });
    const client = new WorktrunkClient(run);

    await expect(
      client.create("feature/adapter", "origin/main", MAIN_PATH, signal),
    ).resolves.toEqual({
      mainPath: MAIN_PATH,
      worktree: {
        branch: "feature/adapter",
        clean: true,
        current: false,
        head: "2222222222222222222222222222222222222222",
        main: false,
        path: FEATURE_PATH,
      },
    });
    expect(run).toHaveBeenNthCalledWith(
      2,
      [
        "switch",
        "--create",
        "--base",
        "origin/main",
        "--no-cd",
        "--format=json",
        "feature/adapter",
      ],
      { cwd: MAIN_PATH, signal, timeout: 300_000 },
    );
    expect(run).toHaveBeenNthCalledWith(
      3,
      ["--config-set", "list.json-schema=2", "list", "--format=json"],
      { cwd: MAIN_PATH, signal, timeout: 30_000 },
    );
    expect(run.mock.calls.flat().join(" ")).not.toContain("--yes");
  });

  it("keeps hook approval human-owned and bounds failed switch output", async () => {
    expect.hasAssertions();
    const output = `approval required for configured hook\n${"x".repeat(12_000)}`;
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" })
      .mockResolvedValueOnce({ code: 1, killed: false, stderr: output, stdout: "" });
    const client = new WorktrunkClient(run);

    let failure: unknown;
    try {
      await client.activate("feature/adapter", MAIN_PATH, undefined);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain("Do not retry with --yes");
    expect((failure as Error).message.length).toBeLessThan(4500);
  });

  it("contains cancellation, generic process failures, malformed switch output, and unconfirmed paths", async () => {
    expect.hasAssertions();
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
          { code: 0, killed: true, stderr: "", stdout: "" },
        ),
      ).list(MAIN_PATH, undefined),
    ).rejects.toThrow("list was cancelled");
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
          { code: 2, killed: false, stderr: "", stdout: "" },
        ),
      ).list(MAIN_PATH, undefined),
    ).rejects.toThrow("exit code 2");
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
          { code: 0, killed: true, stderr: "", stdout: "" },
        ),
      ).activate("feature/adapter", MAIN_PATH, undefined),
    ).rejects.toThrow("switch was cancelled");
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
          { code: 3, killed: false, stderr: "plain switch failure", stdout: "" },
        ),
      ).activate("feature/adapter", MAIN_PATH, undefined),
    ).rejects.toThrow("plain switch failure");
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
          { code: 0, killed: false, stderr: "", stdout: "{" },
        ),
      ).activate("feature/adapter", MAIN_PATH, undefined),
    ).rejects.toThrow("malformed JSON");
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
          { code: 0, killed: false, stderr: "", stdout: JSON.stringify({ path: MAIN_PATH }) },
          { code: 0, killed: false, stderr: "", stdout: listDocument() },
        ),
      ).activate("feature/adapter", MAIN_PATH, undefined),
    ).rejects.toThrow("not confirmed as a linked worktree");
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
          { code: 0, killed: true, stderr: "", stdout: "" },
        ),
      ).remove("feature/adapter", FEATURE_PATH, MAIN_PATH, undefined),
    ).rejects.toThrow("removal was cancelled");
    await expect(
      new WorktrunkClient(
        runnerWith(
          { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
          { code: 4, killed: false, stderr: "", stdout: "" },
        ),
      ).remove("feature/adapter", FEATURE_PATH, MAIN_PATH, undefined),
    ).rejects.toThrow("exit code 4");
  });

  it("removes only through Worktrunk's branch-preserving, no-hook foreground flow", async () => {
    expect.hasAssertions();
    const run = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" })
      .mockResolvedValueOnce({
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify([
          {
            branch: "feature/adapter",
            branch_deleted: false,
            kind: "worktree",
            path: FEATURE_PATH,
          },
        ]),
      });
    const client = new WorktrunkClient(run);

    await expect(
      client.remove("feature/adapter", FEATURE_PATH, MAIN_PATH, undefined),
    ).resolves.toBe(undefined);
    expect(run).toHaveBeenNthCalledWith(
      2,
      [
        "--yes",
        "remove",
        "--no-delete-branch",
        "--no-hooks",
        "--foreground",
        "--format=json",
        "feature/adapter",
      ],
      { cwd: MAIN_PATH, signal: undefined, timeout: 300_000 },
    );
    expect(run.mock.calls.flat().join(" ")).not.toContain("--force");
  });

  it("rejects malformed or branch-deleting removal confirmations", async () => {
    expect.hasAssertions();
    const cases: readonly (readonly [string, string])[] = [
      ["{", "malformed JSON"],
      [JSON.stringify([]), "invalid `wt remove` result"],
      [
        JSON.stringify([{ branch_deleted: true, kind: "worktree", path: FEATURE_PATH }]),
        "branch-preserving",
      ],
      [
        JSON.stringify([{ branch_deleted: false, kind: "worktree", path: MAIN_PATH }]),
        "other than the confirmed worktree",
      ],
    ];
    for (const [stdout, message] of cases) {
      await expect(
        new WorktrunkClient(
          runnerWith(
            { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
            { code: 0, killed: false, stderr: "", stdout },
          ),
        ).remove("feature/adapter", FEATURE_PATH, MAIN_PATH, undefined),
      ).rejects.toThrow(message);
    }
  });
});
