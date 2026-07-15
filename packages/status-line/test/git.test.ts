import { describe, expect, it } from "vitest";

import { parseGitStatus } from "../src/git.ts";

describe("git status parsing", () => {
  it("extracts branches and classifies clean, modified, and conflicted states", () => {
    expect.hasAssertions();
    expect(parseGitStatus("## main...origin/main\n")).toEqual({ branch: "main", state: "clean" });
    expect(parseGitStatus("## feat/status...origin/feat/status [ahead 1]\n M file.ts\n")).toEqual({
      branch: "feat/status",
      state: "modified",
    });
    expect(parseGitStatus("## HEAD (no branch)\nUU conflicted.ts\n")).toEqual({
      branch: undefined,
      state: "conflicted",
    });
  });

  it("treats untracked-only work as the configured clean-colored state", () => {
    expect.hasAssertions();
    expect(parseGitStatus("## main\n?? new-file.ts\n")).toEqual({
      branch: "main",
      state: "clean",
    });
  });
});
