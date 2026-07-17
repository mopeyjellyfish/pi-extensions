import { describe, expect, it } from "vitest";

import { parseGitStatus } from "../src/git.ts";

describe("git status parsing", () => {
  it("extracts branch identity, divergence, and staged or unstaged changes", () => {
    expect.hasAssertions();
    expect(
      parseGitStatus(
        "# branch.oid 0123456789abcdef\n# branch.head main\n# branch.upstream origin/main\n# branch.ab +2 -1\n",
      ),
    ).toEqual({
      ahead: 2,
      behind: 1,
      branch: "main",
      changed: 0,
      conflicts: 0,
      head: "0123456",
      staged: 0,
      state: "clean",
      upstream: "origin/main",
    });
    expect(
      parseGitStatus(
        "# branch.oid abcdef0123456789\n# branch.head feat/status\n# branch.upstream origin/feat/status\n# branch.ab +3 -0\n1 M. N... 100644 100644 100644 a a staged.ts\n1 .M N... 100644 100644 100644 b b changed.ts\n",
      ),
    ).toEqual({
      ahead: 3,
      behind: 0,
      branch: "feat/status",
      changed: 1,
      conflicts: 0,
      head: "abcdef0",
      staged: 1,
      state: "modified",
      upstream: "origin/feat/status",
    });
  });

  it("handles detached, unborn, conflicted, malformed, and untracked status", () => {
    expect.hasAssertions();
    expect(
      parseGitStatus(
        "# branch.oid fedcba9876543210\n# branch.head (detached)\n# branch.ab invalid\nu UU N... 100644 100644 100644 100644 a b c conflicted.ts\n? new-file.ts\n",
      ),
    ).toEqual({
      ahead: 0,
      behind: 0,
      branch: undefined,
      changed: 0,
      conflicts: 1,
      head: "fedcba9",
      staged: 0,
      state: "conflicted",
    });
    expect(parseGitStatus("# branch.oid (initial)\n# branch.head main\n? new-file.ts\n")).toEqual({
      ahead: 0,
      behind: 0,
      branch: "main",
      changed: 0,
      conflicts: 0,
      staged: 0,
      state: "clean",
    });
  });
});
