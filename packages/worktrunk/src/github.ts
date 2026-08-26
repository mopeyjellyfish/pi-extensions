export type GithubEvidenceState = "available" | "partial" | "unavailable" | "not_github";

export interface TerminalPullRequest {
  readonly branch: string;
  readonly number: number;
  readonly state: "CLOSED" | "MERGED" | "OPEN";
}

interface Execution {
  readonly code: number;
  readonly killed: boolean;
  readonly stderr: string;
  readonly stdout: string;
}

type Runner = (arguments_: readonly string[], options: { cwd: string; signal?: AbortSignal; timeout: number }) => Promise<Execution>;

const MAX_BYTES = 5 * 1024 * 1024;

function records(value: unknown): readonly Record<string, unknown>[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: Record<string, unknown>[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return undefined;
    result.push(item as Record<string, unknown>);
  }
  return result;
}

/** Optional GitHub history adapter. Failures deliberately become unavailable evidence. */
export class GithubClient {
  private readonly run: Runner;

  public constructor(run: Runner) { this.run = run; }

  public async history(cwd: string, repository: string | undefined, signal?: AbortSignal): Promise<{ state: GithubEvidenceState; pullRequests: readonly TerminalPullRequest[] }> {
    if (repository === undefined) return { state: "not_github", pullRequests: [] };
    try {
      const result = await this.run(["pr", "list", "--repo", repository, "--state", "all", "--limit", "10001", "--json", "headRefName,headRepository,number,state,url"], { cwd, ...(signal === undefined ? {} : { signal }), timeout: 120_000 });
      if (signal?.aborted || result.killed || result.code !== 0 || Buffer.byteLength(result.stdout) > MAX_BYTES) return { state: "unavailable", pullRequests: [] };
      const rows = records(JSON.parse(result.stdout));
      if (rows === undefined) return { state: "unavailable", pullRequests: [] };
      const incomplete = rows.length > 10_000;
      const pullRequests: TerminalPullRequest[] = [];
      for (const row of rows.slice(0, 10_000)) {
        const branch = row["headRefName"];
        const number = row["number"];
        const state = row["state"];
        const headRepository = row["headRepository"];
        if (typeof branch !== "string" || typeof number !== "number" || (state !== "OPEN" && state !== "CLOSED" && state !== "MERGED") || typeof headRepository !== "object" || headRepository === null || (headRepository as Record<string, unknown>)["nameWithOwner"] !== repository) continue;
        pullRequests.push({ branch, number, state });
      }
      return { state: incomplete ? "partial" : "available", pullRequests };
    } catch {
      return { state: signal?.aborted ? "unavailable" : "unavailable", pullRequests: [] };
    }
  }
}
