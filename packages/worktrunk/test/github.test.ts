import { describe, expect, it, vi } from "vitest";

import { GITHUB_HISTORY_LIMIT, GithubClient, type GithubForge } from "../src/github.ts";

const FORGE: GithubForge = {
  headRepository: "owner/repo",
  host: "github.com",
  name: "repo",
  owner: "owner",
  provider: "github",
  repository: "owner/repo",
};

function execution(stdout: string, options: { code?: number; killed?: boolean } = {}) {
  return {
    code: options.code ?? 0,
    killed: options.killed ?? false,
    stderr: "",
    stdout,
  };
}

function overflowHistory(): readonly Record<string, unknown>[] {
  return Array.from({ length: GITHUB_HISTORY_LIMIT + 1 }, (_, index) => ({
    headRefName: `old-${String(index)}`,
    headRepository: { nameWithOwner: "owner/repo" },
    number: index + 1,
    state: "MERGED",
    url: `https://github.com/owner/repo/pull/${String(index + 1)}`,
  }));
}

function pullRequest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    headRefName: "feature",
    headRepository: { nameWithOwner: "owner/repo" },
    number: 1,
    state: "OPEN",
    url: "https://github.com/owner/repo/pull/1",
    ...overrides,
  };
}

describe("GithubClient", () => {
  it("keeps strict same-repository history and sends bounded explicit argv", async () => {
    expect.hasAssertions();
    const run = vi.fn().mockResolvedValue(
      execution(
        JSON.stringify([
          {
            headRefName: "closed",
            headRepository: { nameWithOwner: "owner/repo" },
            number: 1,
            state: "CLOSED",
            url: "https://github.com/owner/repo/pull/1",
          },
          {
            headRefName: "foreign",
            headRepository: { nameWithOwner: "fork/repo" },
            number: 2,
            state: "MERGED",
            url: "https://github.com/owner/repo/pull/2",
          },
          {
            headRefName: "open",
            headRepository: { nameWithOwner: "owner/repo" },
            number: 3,
            state: "OPEN",
            url: "https://github.com/owner/repo/pull/3",
          },
        ]),
      ),
    );

    await expect(
      new GithubClient(run).history("/repo", FORGE, ["closed", "open"]),
    ).resolves.toEqual({
      state: "available",
      pullRequests: [
        { branch: "closed", number: 1, state: "CLOSED" },
        { branch: "open", number: 3, state: "OPEN" },
      ],
    });
    expect(run).toHaveBeenCalledWith(
      [
        "pr",
        "list",
        "--repo",
        "owner/repo",
        "--state",
        "all",
        "--limit",
        String(GITHUB_HISTORY_LIMIT + 1),
        "--json",
        "headRefName,headRepository,number,state,url",
      ],
      { cwd: "/repo", signal: undefined, timeout: 120_000 },
    );
  });

  it("uses a bounded branch fallback when repository history is incomplete", async () => {
    expect.hasAssertions();
    const overflow = overflowHistory();
    const run = vi
      .fn()
      .mockResolvedValueOnce(execution(JSON.stringify(overflow)))
      .mockResolvedValueOnce(
        execution(
          JSON.stringify([
            {
              headRefName: "current",
              headRepository: { nameWithOwner: "owner/repo" },
              number: 20_001,
              state: "CLOSED",
              url: "https://github.com/owner/repo/pull/20001",
            },
          ]),
        ),
      )
      .mockResolvedValueOnce(execution("[]"));

    const result = await new GithubClient(run).history("/repo", FORGE, ["z", "current", "old-0"]);
    expect(result).toEqual({
      state: "available",
      pullRequests: [
        { branch: "old-0", number: 1, state: "MERGED" },
        { branch: "current", number: 20_001, state: "CLOSED" },
      ],
    });
    expect(run).toHaveBeenNthCalledWith(
      2,
      [
        "pr",
        "list",
        "--repo",
        "owner/repo",
        "--state",
        "all",
        "--head",
        "current",
        "--limit",
        "101",
        "--json",
        "headRefName,headRepository,number,state,url",
      ],
      expect.objectContaining({ cwd: "/repo" }),
    );
  });

  it("reports partial evidence when an incomplete-history fallback fails", async () => {
    expect.hasAssertions();
    const run = vi
      .fn()
      .mockResolvedValueOnce(execution(JSON.stringify(overflowHistory())))
      .mockResolvedValueOnce(execution("[]", { code: 1 }));

    await expect(new GithubClient(run).history("/repo", FORGE, ["current"])).resolves.toEqual({
      state: "partial",
      pullRequests: [],
    });
  });

  it("fails optional evidence closed for malformed, oversized, failed, and cancelled output", async () => {
    expect.hasAssertions();
    const cases = [
      vi.fn().mockResolvedValue(execution("{")),
      vi.fn().mockResolvedValue(execution("{}")),
      vi.fn().mockResolvedValue(execution("[42]")),
      vi.fn().mockResolvedValue(execution(JSON.stringify([pullRequest({ headRefName: null })]))),
      vi.fn().mockResolvedValue(execution(JSON.stringify([pullRequest({ headRefName: "" })]))),
      vi
        .fn()
        .mockResolvedValue(
          execution(JSON.stringify([pullRequest({ headRefName: "feature\nunsafe" })])),
        ),
      vi.fn().mockResolvedValue(execution(JSON.stringify([pullRequest({ number: 0 })]))),
      vi.fn().mockResolvedValue(execution(JSON.stringify([pullRequest({ state: "UNKNOWN" })]))),
      vi.fn().mockResolvedValue(execution(JSON.stringify([pullRequest({ url: null })]))),
      vi.fn().mockResolvedValue(
        execution(
          JSON.stringify([
            {
              headRefName: "feature",
              headRepository: null,
              number: 1,
              state: "OPEN",
              url: "https://github.com/owner/repo/pull/1",
            },
          ]),
        ),
      ),
      vi.fn().mockResolvedValue(execution(`[]${"x".repeat(5 * 1024 * 1024)}`)),
      vi.fn().mockResolvedValue(execution("[]", { code: 1 })),
      vi.fn().mockResolvedValue(execution("[]", { killed: true })),
      vi.fn().mockRejectedValue(new Error("spawn gh ENOENT secret-token")),
    ];
    for (const run of cases) {
      await expect(new GithubClient(run).history("/repo", FORGE, ["feature"])).resolves.toEqual({
        state: "unavailable",
        pullRequests: [],
      });
    }

    const controller = new AbortController();
    controller.abort();
    const cancelled = vi.fn();
    await expect(
      new GithubClient(cancelled).history("/repo", FORGE, ["feature"], controller.signal),
    ).resolves.toEqual({ state: "unavailable", pullRequests: [] });
    expect(cancelled).not.toHaveBeenCalled();
  });

  it("does not invoke gh for a non-GitHub forge", async () => {
    expect.hasAssertions();
    const run = vi.fn();
    await expect(
      new GithubClient(run).history("/repo", { ...FORGE, provider: "gitlab" }, ["feature"]),
    ).resolves.toEqual({ state: "not_github", pullRequests: [] });
    expect(run).not.toHaveBeenCalled();
  });
});
