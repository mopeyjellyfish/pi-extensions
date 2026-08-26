import { describe, expect, it } from "vitest";

import {
  MAX_CLEANUP_WORKTREES,
  cleanupPreview,
  formatCleanupPreview,
  locallyEligibleBranches,
  revalidationReason,
} from "../src/cleanup.ts";

import type { WorktrunkList, WorktrunkWorktree } from "../src/worktrunk.ts";

function tree(
  branch: string,
  path: string,
  options: Partial<WorktrunkWorktree> = {},
): WorktrunkWorktree {
  return {
    branch,
    clean: true,
    current: false,
    head: `${branch}-head`,
    main: false,
    path,
    ...options,
  };
}

function list(worktrees: readonly WorktrunkWorktree[]): WorktrunkList {
  return {
    forge: {
      headRepository: "owner/repo",
      host: "github.com",
      name: "repo",
      owner: "owner",
      provider: "github",
      repository: "owner/repo",
    },
    mainPath: "/repo",
    worktrees,
  };
}

describe("cleanupPreview", () => {
  it("classifies the complete safe set with open-review and protected-state precedence", () => {
    expect.hasAssertions();
    const preview = cleanupPreview(
      list([
        tree("main", "/repo", { current: true, main: true }),
        tree("merged", "/merged"),
        tree("closed", "/closed"),
        tree("open", "/open", { integrationState: "integrated", openReview: "open" }),
        tree("integrated", "/integrated", {
          integrationReason: "patch_id_match",
          integrationState: "integrated",
          openReview: "none",
        }),
        tree("empty", "/empty", { integrationState: "empty", openReview: "none" }),
        tree("dirty", "/dirty", { clean: false }),
        tree("locked", "/locked", { locked: true }),
        tree("operation", "/operation", { operation: "rebase" }),
        tree("routed", "/routed"),
      ]),
      [
        { branch: "merged", number: 1, state: "MERGED" },
        { branch: "closed", number: 2, state: "CLOSED" },
        { branch: "open", number: 3, state: "OPEN" },
      ],
      "available",
      "/routed",
    );

    expect(preview.candidates).toEqual([
      {
        branch: "closed",
        head: "closed-head",
        path: "/closed",
        pullRequest: 2,
        reason: "github_closed",
      },
      { branch: "empty", head: "empty-head", path: "/empty", reason: "worktrunk_empty" },
      {
        branch: "integrated",
        head: "integrated-head",
        path: "/integrated",
        reason: "worktrunk_integrated",
      },
      {
        branch: "merged",
        head: "merged-head",
        path: "/merged",
        pullRequest: 1,
        reason: "github_merged",
      },
    ]);
    expect(preview.skipped.map(({ branch, reason }) => [branch, reason])).toEqual([
      ["dirty", "dirty"],
      ["locked", "locked"],
      ["open", "open_review"],
      ["operation", "operation"],
      ["main", "main"],
      ["routed", "active_route"],
    ]);
    expect(preview.fingerprint).toMatch(/^[a-f0-9]{64}$/u);
    expect(formatCleanupPreview(preview)).toContain("Fingerprint:");
  });

  it("uses exact stable facts for fingerprints and fails closed on unknown review evidence", () => {
    expect.hasAssertions();
    const worktrees = [
      tree("main", "/repo", { current: true, main: true }),
      tree("feature", "/feature", {
        integrationState: "integrated",
        openReview: "unknown",
      }),
    ];
    const unknown = cleanupPreview(list(worktrees), [], "unavailable");
    expect(unknown.candidates).toEqual([]);
    expect(unknown.skipped.find(({ branch }) => branch === "feature")?.reason).toBe(
      "insufficient_evidence",
    );

    const known = cleanupPreview(
      list(worktrees),
      [{ branch: "feature", number: 4, state: "MERGED" }],
      "available",
    );
    const main = worktrees[0];
    if (main === undefined) throw new Error("main fixture is missing");
    const moved = cleanupPreview(
      list([main, tree("feature", "/moved")]),
      [{ branch: "feature", number: 4, state: "MERGED" }],
      "available",
    );
    expect(known.fingerprint).not.toBe(moved.fingerprint);
  });

  it("withholds approval when the complete preview exceeds cleanup bounds", () => {
    expect.hasAssertions();
    const worktrees = [
      tree("main", "/repo", { current: true, main: true }),
      ...Array.from({ length: MAX_CLEANUP_WORKTREES }, (_, index) =>
        tree(`feature-${String(index)}`, `/feature-${String(index)}`, {
          integrationState: "empty",
          openReview: "none",
        }),
      ),
    ];
    const preview = cleanupPreview(list(worktrees), [], "not_github");
    expect(preview).toMatchObject({
      candidateCount: MAX_CLEANUP_WORKTREES,
      candidates: [],
      overflow: true,
      skipped: [],
      skippedCount: 1,
    });
    expect(preview.fingerprint).toBeUndefined();
  });

  it("does not expose oversized exact fields through overflow details", () => {
    expect.hasAssertions();
    const preview = cleanupPreview(
      list([
        tree("main", "/repo", { current: true, main: true }),
        tree("large", `/${"x".repeat(60_000)}`, {
          integrationState: "empty",
          openReview: "none",
        }),
      ]),
      [],
      "not_github",
    );
    expect(preview).toMatchObject({
      candidateCount: 1,
      candidates: [],
      overflow: true,
      skipped: [],
      skippedCount: 1,
    });
    expect(Buffer.byteLength(JSON.stringify(preview))).toBeLessThan(1000);
  });

  it("skips a clean branch without terminal or Worktrunk integration evidence", () => {
    expect.hasAssertions();
    const preview = cleanupPreview(
      list([
        tree("main", "/repo", { main: true }),
        tree("plain", "/plain", { openReview: "none" }),
      ]),
      [],
      "available",
    );
    expect(preview.candidates).toEqual([]);
    expect(preview.skipped.find(({ branch }) => branch === "plain")?.reason).toBe(
      "insufficient_evidence",
    );
  });

  it("limits terminal-history fallback to locally eligible branches", () => {
    expect.hasAssertions();
    expect(
      locallyEligibleBranches(
        list([
          tree("main", "/repo", { main: true }),
          tree("current", "/current", { current: true }),
          tree("dirty", "/dirty", { clean: false }),
          tree("locked", "/locked", { locked: true }),
          tree("prunable", "/prunable", { prunable: true }),
          tree("detached", "/detached", { detached: true }),
          tree("mismatch", "/mismatch", { branchMismatch: true }),
          tree("routed", "/routed"),
          { clean: true, current: false, main: false, path: "/unborn" },
          tree("eligible", "/eligible"),
        ]),
        "/routed",
      ),
    ).toEqual(["eligible"]);
  });

  it("revalidates exact local state without requiring another remote review lookup", () => {
    expect.hasAssertions();
    const candidate = {
      branch: "feature",
      head: "feature-head",
      path: "/feature",
      reason: "github_closed" as const,
    };
    expect(
      revalidationReason(candidate, list([tree("feature", "/feature")]), undefined),
    ).toBeUndefined();
    expect(
      revalidationReason(
        candidate,
        list([tree("feature", "/feature", { operation: "merge" })]),
        undefined,
      ),
    ).toBe("operation");
    expect(
      revalidationReason(
        candidate,
        list([tree("feature", "/feature", { head: "changed" })]),
        undefined,
      ),
    ).toBe("insufficient_evidence");
  });
});
