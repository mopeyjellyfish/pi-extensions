import { describe, expect, it, vi } from "vitest";
import { GithubClient } from "../src/github.ts";

describe("GithubClient", () => {
  it("keeps only same-repository terminal and open PR history", async () => {
    const run = vi.fn().mockResolvedValue({ code: 0, killed: false, stderr: "", stdout: JSON.stringify([
      { headRefName: "closed", headRepository: { nameWithOwner: "owner/repo" }, number: 1, state: "CLOSED" },
      { headRefName: "foreign", headRepository: { nameWithOwner: "fork/repo" }, number: 2, state: "MERGED" },
      { headRefName: "open", headRepository: { nameWithOwner: "owner/repo" }, number: 3, state: "OPEN" },
    ]) });
    await expect(new GithubClient(run).history("/repo", "owner/repo")).resolves.toEqual({ state: "available", pullRequests: [
      { branch: "closed", number: 1, state: "CLOSED" }, { branch: "open", number: 3, state: "OPEN" },
    ] });
  });
});
