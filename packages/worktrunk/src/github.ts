export type GithubEvidenceState = "available" | "partial" | "unavailable" | "not_github";

export interface GithubForge {
  readonly headRepository: string;
  readonly host: string;
  readonly name: string;
  readonly owner: string;
  readonly provider: string;
  readonly repository: string;
}

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

interface RunOptions {
  readonly cwd: string;
  readonly signal: AbortSignal | undefined;
  readonly timeout: number;
}

type Runner = (arguments_: readonly string[], options: RunOptions) => Promise<Execution>;

export const GITHUB_HISTORY_LIMIT = 10_000;
export const GITHUB_BRANCH_HISTORY_LIMIT = 100;
export const GITHUB_FALLBACK_LIMIT = 20;
export const GITHUB_PREVIEW_TIMEOUT_MS = 2 * 60_000;
export const GITHUB_OUTPUT_BYTES = 5 * 1024 * 1024;

const JSON_FIELDS = "headRefName,headRepository,number,state,url";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeText(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint < 32 || codePoint === 127) return false;
  }
  return true;
}

const INVALID_PULL_REQUEST = Symbol("invalid-pull-request");

function parsePullRequest(
  value: unknown,
  forge: GithubForge,
): TerminalPullRequest | typeof INVALID_PULL_REQUEST | undefined {
  if (!isRecord(value)) return INVALID_PULL_REQUEST;
  const branch = value["headRefName"];
  const headRepository = value["headRepository"];
  const number = value["number"];
  const state = value["state"];
  const url = value["url"];
  if (
    !safeText(branch) ||
    !Number.isSafeInteger(number) ||
    (number as number) <= 0 ||
    (state !== "OPEN" && state !== "CLOSED" && state !== "MERGED") ||
    !safeText(url)
  ) {
    return INVALID_PULL_REQUEST;
  }
  if (!isRecord(headRepository) || !safeText(headRepository["nameWithOwner"])) {
    return undefined;
  }
  return headRepository["nameWithOwner"] === forge.headRepository
    ? { branch, number: number as number, state }
    : undefined;
}

interface ParsedHistory {
  readonly pullRequests: readonly TerminalPullRequest[];
  readonly rowCount: number;
}

function parsePullRequests(output: string, forge: GithubForge): ParsedHistory | undefined {
  if (Buffer.byteLength(output) > GITHUB_OUTPUT_BYTES) return undefined;
  let document: unknown;
  try {
    document = JSON.parse(output) as unknown;
  } catch {
    return undefined;
  }
  if (!Array.isArray(document)) return undefined;

  const pullRequests: TerminalPullRequest[] = [];
  for (const value of document) {
    const pullRequest = parsePullRequest(value, forge);
    if (pullRequest === INVALID_PULL_REQUEST) return undefined;
    if (pullRequest !== undefined) pullRequests.push(pullRequest);
  }
  return { pullRequests, rowCount: document.length };
}

function queryArguments(forge: GithubForge, limit: number, branch?: string): readonly string[] {
  return [
    "pr",
    "list",
    "--repo",
    forge.repository,
    "--state",
    "all",
    ...(branch === undefined ? [] : ["--head", branch]),
    "--limit",
    String(limit),
    "--json",
    JSON_FIELDS,
  ];
}

function deduplicate(pullRequests: readonly TerminalPullRequest[]): readonly TerminalPullRequest[] {
  const found = new Map<string, TerminalPullRequest>();
  for (const pullRequest of pullRequests) {
    found.set(`${pullRequest.branch}\u{0}${String(pullRequest.number)}`, pullRequest);
  }
  return [...found.values()];
}

function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

interface HistoryResult {
  readonly state: GithubEvidenceState;
  readonly pullRequests: readonly TerminalPullRequest[];
}

async function executeQuery(
  run: Runner,
  arguments_: readonly string[],
  cwd: string,
  forge: GithubForge,
  signal: AbortSignal | undefined,
  timeout: number,
): Promise<ParsedHistory | undefined> {
  try {
    const execution = await run(arguments_, { cwd, signal, timeout });
    if (isAborted(signal) || execution.killed || execution.code !== 0) return undefined;
    return parsePullRequests(execution.stdout, forge);
  } catch {
    return undefined;
  }
}

function compareBranches(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function completeCandidateHistory(
  run: Runner,
  cwd: string,
  forge: GithubForge,
  candidateBranches: readonly string[],
  initial: readonly TerminalPullRequest[],
  startedAt: number,
  signal: AbortSignal | undefined,
): Promise<HistoryResult> {
  const pullRequests = [...initial];
  const matchedBranches = new Set(pullRequests.map((pullRequest) => pullRequest.branch));
  const unresolved = [...new Set(candidateBranches)]
    .filter((branch) => !matchedBranches.has(branch))
    .sort(compareBranches);
  let partial = unresolved.length > GITHUB_FALLBACK_LIMIT;

  for (const branch of unresolved.slice(0, GITHUB_FALLBACK_LIMIT)) {
    const remaining = GITHUB_PREVIEW_TIMEOUT_MS - (Date.now() - startedAt);
    if (remaining <= 0 || isAborted(signal)) {
      partial = true;
      break;
    }
    const fallback = await executeQuery(
      run,
      queryArguments(forge, GITHUB_BRANCH_HISTORY_LIMIT + 1, branch),
      cwd,
      forge,
      signal,
      remaining,
    );
    if (fallback === undefined) {
      partial = true;
      continue;
    }
    if (fallback.rowCount > GITHUB_BRANCH_HISTORY_LIMIT) partial = true;
    pullRequests.push(
      ...fallback.pullRequests
        .filter((pullRequest) => pullRequest.branch === branch)
        .slice(0, GITHUB_BRANCH_HISTORY_LIMIT),
    );
  }

  return {
    state: partial ? "partial" : "available",
    pullRequests: deduplicate(pullRequests),
  };
}

/** Optional GitHub history adapter. Failures deliberately become unavailable evidence. */
export class GithubClient {
  readonly #run: Runner;

  public constructor(run: Runner) {
    this.#run = run;
  }

  public async history(
    cwd: string,
    forge: GithubForge | undefined,
    candidateBranches: readonly string[],
    signal?: AbortSignal,
  ): Promise<HistoryResult> {
    if (forge?.provider !== "github") return { state: "not_github", pullRequests: [] };
    if (isAborted(signal)) return { state: "unavailable", pullRequests: [] };

    const startedAt = Date.now();
    const initial = await executeQuery(
      this.#run,
      queryArguments(forge, GITHUB_HISTORY_LIMIT + 1),
      cwd,
      forge,
      signal,
      GITHUB_PREVIEW_TIMEOUT_MS,
    );
    if (initial === undefined) return { state: "unavailable", pullRequests: [] };

    const candidateSet = new Set(candidateBranches);
    const relevantInitial = initial.pullRequests
      .slice(0, GITHUB_HISTORY_LIMIT)
      .filter((pullRequest) => candidateSet.has(pullRequest.branch));
    if (initial.rowCount <= GITHUB_HISTORY_LIMIT) {
      return { state: "available", pullRequests: relevantInitial };
    }
    return completeCandidateHistory(
      this.#run,
      cwd,
      forge,
      candidateBranches,
      relevantInitial,
      startedAt,
      signal,
    );
  }
}
