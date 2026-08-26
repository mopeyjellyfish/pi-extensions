import { describe, expect, it } from "vitest";

import { cleanupPreview } from "../src/cleanup.ts";

describe("cleanupPreview", () => {
  it("classifies every linked worktree without mutation and fingerprints exact candidates", () => {
    const preview = cleanupPreview({ mainPath: "/repo", repository: "owner/repo", worktrees: [
      { branch: "main", clean: true, current: true, main: true, path: "/repo" },
      { branch: "merged", clean: true, current: false, head: "a", main: false, path: "/merged" },
      { branch: "closed", clean: true, current: false, head: "b", main: false, path: "/closed" },
      { branch: "open", clean: true, current: false, head: "c", main: false, path: "/open" },
      { branch: "dirty", clean: false, current: false, head: "d", main: false, path: "/dirty" },
    ] }, [
      { branch: "merged", number: 1, state: "MERGED" },
      { branch: "closed", number: 2, state: "CLOSED" },
      { branch: "open", number: 3, state: "OPEN" },
    ], "available");
    expect(preview.candidates).toEqual([
      { branch: "closed", head: "b", path: "/closed", pullRequest: 2, reason: "github_closed" },
      { branch: "merged", head: "a", path: "/merged", pullRequest: 1, reason: "github_merged" },
    ]);
    expect(preview.skipped.map((item) => item.reason)).toEqual(["dirty", "open_review", "main"]);
    expect(preview.fingerprint).toMatch(/^[a-f0-9]{64}$/u);
  });
});
