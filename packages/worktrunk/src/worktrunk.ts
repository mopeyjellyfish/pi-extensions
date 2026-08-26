import { isAbsolute, resolve } from "node:path";

import { truncateTail } from "@earendil-works/pi-coding-agent";

const WORKTRUNK_DISCOVERY_TIMEOUT_MS = 30_000;
const WORKTRUNK_MUTATION_TIMEOUT_MS = 5 * 60_000;
const MINIMUM_WORKTRUNK_VERSION = "0.67.0";

const ERROR_OUTPUT_BYTES = 4000;
const ERROR_OUTPUT_LINES = 100;

interface WorktrunkExecution {
  readonly code: number;
  readonly killed: boolean;
  readonly stderr: string;
  readonly stdout: string;
}

interface WorktrunkRunOptions {
  readonly cwd: string;
  readonly signal: AbortSignal | undefined;
  readonly timeout: number;
}

type WorktrunkRunner = (
  arguments_: readonly string[],
  options: WorktrunkRunOptions,
) => Promise<WorktrunkExecution>;

export type WorktrunkOpenReview = "open" | "none" | "unknown";
export type WorktrunkOperation = "merge" | "rebase";
export type WorktrunkIntegrationState = "empty" | "integrated";

export interface WorktrunkForge {
  readonly headRepository: string;
  readonly host: string;
  readonly name: string;
  readonly owner: string;
  readonly provider: string;
  readonly repository: string;
}

export interface WorktrunkWorktree {
  readonly branch?: string;
  readonly branchMismatch?: boolean;
  readonly clean: boolean;
  readonly current: boolean;
  readonly detached?: boolean;
  readonly head?: string;
  readonly integrationReason?: string;
  readonly integrationState?: WorktrunkIntegrationState;
  readonly locked?: boolean;
  readonly main: boolean;
  readonly openReview?: WorktrunkOpenReview;
  readonly operation?: WorktrunkOperation;
  readonly path: string;
  readonly prunable?: boolean;
}

export interface WorktrunkList {
  readonly forge?: WorktrunkForge;
  readonly mainPath: string;
  readonly worktrees: readonly WorktrunkWorktree[];
}

export interface WorktrunkSelection {
  readonly existing?: boolean;
  readonly mainPath: string;
  readonly worktree: WorktrunkWorktree;
}

class WorktrunkError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "WorktrunkError";
  }
}

interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(value: unknown, description: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new WorktrunkError(`Worktrunk returned schema-2 JSON with a missing ${description}.`);
  }
  return value;
}

function optionalString(value: unknown, description: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requiredString(value, description);
}

function requiredBoolean(value: unknown, description: string): boolean {
  if (typeof value !== "boolean") {
    throw new WorktrunkError(`Worktrunk returned schema-2 JSON with a missing ${description}.`);
  }
  return value;
}

function requiredHead(value: unknown, description: string): string {
  if (!isRecord(value)) {
    throw new WorktrunkError(`Worktrunk returned schema-2 JSON with a missing ${description}.`);
  }
  return requiredString(value["sha"], `${description}.sha`);
}

function optionalHead(value: unknown, description: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requiredHead(value, description);
}

function cleanWorktree(value: unknown, description: string): boolean {
  if (value === null) {
    return false;
  }
  if (!isRecord(value)) {
    throw new WorktrunkError(`Worktrunk returned schema-2 JSON with a missing ${description}.`);
  }
  const flags = ["staged", "modified", "untracked", "renamed", "deleted", "conflicted"] as const;
  const changes = flags.map((flag) => requiredBoolean(value[flag], `${description}.${flag}`));
  return changes.every((changed) => !changed);
}

function parseVersion(output: string): Version | undefined {
  const match = /(?:^|\s)v?(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?(?:\s|$)/u.exec(output);
  if (match?.[1] === undefined || match[2] === undefined || match[3] === undefined) {
    return undefined;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function atLeastMinimum(version: Version): boolean {
  if (version.major !== 0) {
    return version.major > 0;
  }
  if (version.minor !== 67) {
    return version.minor > 67;
  }
  return version.patch >= 0;
}

function boundedOutput(rawOutput: string): string {
  let safeOutput = "";
  for (const character of rawOutput) {
    const codePoint = character.codePointAt(0) ?? 0;
    safeOutput +=
      (codePoint < 32 && codePoint !== 9 && codePoint !== 10 && codePoint !== 13) ||
      codePoint === 127
        ? "�"
        : character;
  }
  const truncated = truncateTail(safeOutput, {
    maxBytes: ERROR_OUTPUT_BYTES,
    maxLines: ERROR_OUTPUT_LINES,
  });
  return `${truncated.content.trim()}${
    truncated.truncated ? "\n[Worktrunk error output truncated.]" : ""
  }`;
}

function commandFailure(command: string, result: WorktrunkExecution): WorktrunkError {
  const rawOutput = [result.stderr, result.stdout].find((value) => value.trim() !== "")?.trim();
  const output = rawOutput === undefined ? undefined : boundedOutput(rawOutput);
  if (rawOutput !== undefined && /\b(?:approval|approve|unapproved)\b/iu.test(rawOutput)) {
    return new WorktrunkError(
      `Worktrunk blocked ${command} because a configured hook requires human approval. Review and approve it directly with \`wt\`. Do not retry with --yes.${
        output === undefined ? "" : `\n${output}`
      }`,
    );
  }
  return new WorktrunkError(
    output === undefined
      ? `Worktrunk command \`${command}\` failed with exit code ${String(result.code)}.`
      : `Worktrunk command \`${command}\` failed: ${output}`,
  );
}

const WORKTRUNK_STRUCTURED_OUTPUT_BYTES = 5 * 1024 * 1024;

interface ParseListOptions {
  readonly cleanupFacts?: boolean;
  readonly remoteReviews?: boolean;
}

function optionalBoolean(value: unknown, description: string): boolean | undefined {
  if (value === undefined) return undefined;
  return requiredBoolean(value, description);
}

function optionalStateObject(value: unknown, description: string): boolean {
  if (value === undefined) return false;
  if (!isRecord(value)) {
    throw new WorktrunkError(`Worktrunk returned schema-2 JSON with an invalid ${description}.`);
  }
  return true;
}

function optionalOperation(value: unknown, description: string): WorktrunkOperation | undefined {
  if (value === undefined) return undefined;
  if (value !== "merge" && value !== "rebase") {
    throw new WorktrunkError(`Worktrunk returned schema-2 JSON with an invalid ${description}.`);
  }
  return value;
}

function cleanupText(value: string, description: string): string {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint < 32 || codePoint === 127) {
      throw new WorktrunkError(
        `Worktrunk returned schema-2 JSON with control characters in ${description}.`,
      );
    }
  }
  return value;
}

function parseForge(value: unknown): WorktrunkForge | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    throw new WorktrunkError("Worktrunk returned schema-2 JSON with an invalid repo.forge.");
  }
  const host = cleanupText(requiredString(value["host"], "repo.forge.host"), "repo.forge.host");
  const name = cleanupText(requiredString(value["name"], "repo.forge.name"), "repo.forge.name");
  const owner = cleanupText(requiredString(value["owner"], "repo.forge.owner"), "repo.forge.owner");
  const provider = cleanupText(
    requiredString(value["provider"], "repo.forge.provider"),
    "repo.forge.provider",
  );
  const headRepository = `${owner}/${name}`;
  return {
    headRepository,
    host,
    name,
    owner,
    provider,
    repository: host === "github.com" ? headRepository : `${host}/${headRepository}`,
  };
}

function parseOpenReview(
  value: unknown,
  collected: boolean,
  description: string,
): WorktrunkOpenReview {
  if (!collected || value === null) return "unknown";
  if (value === undefined) return "none";
  if (!isRecord(value)) {
    throw new WorktrunkError(`Worktrunk returned schema-2 JSON with an invalid ${description}.`);
  }
  const number = value["number"];
  const url = value["url"];
  if (!Number.isSafeInteger(number) || (number as number) <= 0 || typeof url !== "string") {
    throw new WorktrunkError(`Worktrunk returned schema-2 JSON with an invalid ${description}.`);
  }
  cleanupText(url, `${description}.url`);
  return "open";
}

function normalizeCleanupText(
  value: string | undefined,
  cleanupFacts: boolean,
  description: string,
): string | undefined {
  if (value === undefined || !cleanupFacts) return value;
  return cleanupText(value, description);
}

function parseIntegrationReason(item: Record<string, unknown>, index: number): string | undefined {
  const defaultBranch = isRecord(item["default_branch"]) ? item["default_branch"] : undefined;
  if (defaultBranch === undefined || !isRecord(defaultBranch["integration"])) return undefined;
  return optionalString(
    defaultBranch["integration"]["reason"],
    `items[${String(index)}].default_branch.integration.reason`,
  );
}

function parseIntegrationState(
  item: Record<string, unknown>,
): WorktrunkIntegrationState | undefined {
  const display = isRecord(item["display"]) ? item["display"] : undefined;
  const state = display?.["state"];
  return state === "empty" || state === "integrated" ? state : undefined;
}

function addCleanupFacts(
  item: Record<string, unknown>,
  worktree: Record<string, unknown>,
  index: number,
  result: WorktrunkWorktree,
  options: ParseListOptions,
  ciCollected: boolean,
): WorktrunkWorktree {
  const integrationReason = parseIntegrationReason(item, index);
  const integrationState = parseIntegrationState(item);
  const operation = optionalOperation(
    worktree["operation"],
    `items[${String(index)}].worktree.operation`,
  );
  return {
    ...result,
    branchMismatch:
      optionalBoolean(
        worktree["branch_mismatch"],
        `items[${String(index)}].worktree.branch_mismatch`,
      ) ?? false,
    detached:
      optionalBoolean(worktree["detached"], `items[${String(index)}].worktree.detached`) ?? false,
    ...(integrationReason === undefined ? {} : { integrationReason }),
    ...(integrationState === undefined ? {} : { integrationState }),
    locked: optionalStateObject(worktree["locked"], `items[${String(index)}].worktree.locked`),
    openReview:
      options.remoteReviews === true
        ? parseOpenReview(item["pr"], ciCollected, `items[${String(index)}].pr`)
        : "unknown",
    ...(operation === undefined ? {} : { operation }),
    prunable: optionalStateObject(
      worktree["prunable"],
      `items[${String(index)}].worktree.prunable`,
    ),
  };
}

function parseWorktreeItem(
  value: unknown,
  index: number,
  options: ParseListOptions,
  ciCollected: boolean,
  paths: Set<string>,
): WorktrunkWorktree {
  if (!isRecord(value) || !isRecord(value["worktree"])) {
    throw new WorktrunkError(
      `Worktrunk returned schema-2 JSON with an invalid worktree item at index ${String(index)}.`,
    );
  }
  const worktree = value["worktree"];
  const rawPath = requiredString(worktree["path"], `items[${String(index)}].worktree.path`);
  const path =
    options.cleanupFacts === true
      ? cleanupText(rawPath, `items[${String(index)}].worktree.path`)
      : rawPath;
  if (!isAbsolute(path)) {
    throw new WorktrunkError(
      `Worktrunk returned a non-absolute worktree path at index ${String(index)}.`,
    );
  }
  const canonicalPath = resolve(path);
  if (paths.has(canonicalPath)) {
    throw new WorktrunkError("Worktrunk returned duplicate worktree paths.");
  }
  paths.add(canonicalPath);

  const branch = normalizeCleanupText(
    optionalString(value["branch"], `items[${String(index)}].branch`),
    options.cleanupFacts === true,
    `items[${String(index)}].branch`,
  );
  const head = normalizeCleanupText(
    optionalHead(value["head"], `items[${String(index)}].head`),
    options.cleanupFacts === true,
    `items[${String(index)}].head.sha`,
  );
  const result: WorktrunkWorktree = {
    ...(branch === undefined ? {} : { branch }),
    clean: cleanWorktree(worktree["changes"], `items[${String(index)}].worktree.changes`),
    current: requiredBoolean(worktree["current"], `items[${String(index)}].worktree.current`),
    ...(head === undefined ? {} : { head }),
    main: requiredBoolean(worktree["main"], `items[${String(index)}].worktree.main`),
    path: canonicalPath,
  };
  return options.cleanupFacts === true
    ? addCleanupFacts(value, worktree, index, result, options, ciCollected)
    : result;
}

interface ListDocument {
  readonly collected?: Record<string, unknown>;
  readonly items: readonly unknown[];
  readonly repo?: Record<string, unknown>;
}

function decodeListDocument(output: string): ListDocument {
  if (Buffer.byteLength(output) > WORKTRUNK_STRUCTURED_OUTPUT_BYTES) {
    throw new WorktrunkError("Worktrunk list output exceeded the 5 MB structured-output limit.");
  }
  let value: unknown;
  try {
    value = JSON.parse(output) as unknown;
  } catch {
    throw new WorktrunkError(
      "Worktrunk returned malformed JSON; expected schema 2 from `wt list`.",
    );
  }
  if (!isRecord(value) || value["schema"] !== 2 || !Array.isArray(value["items"])) {
    throw new WorktrunkError("Worktrunk returned an unsupported list schema; expected schema 2.");
  }
  return {
    ...(isRecord(value["collected"]) ? { collected: value["collected"] } : {}),
    items: value["items"],
    ...(isRecord(value["repo"]) ? { repo: value["repo"] } : {}),
  };
}

function collectedCi(document: ListDocument, options: ParseListOptions): boolean {
  if (options.remoteReviews !== true || document.collected === undefined) return false;
  return optionalBoolean(document.collected["ci"], "collected.ci") ?? false;
}

function parseList(output: string, options: ParseListOptions = {}): WorktrunkList {
  const document = decodeListDocument(output);
  const paths = new Set<string>();
  const worktrees = document.items.map((item, index) =>
    parseWorktreeItem(item, index, options, collectedCi(document, options), paths),
  );
  const main = worktrees.filter((worktree) => worktree.main);
  if (main.length !== 1 || main[0] === undefined) {
    throw new WorktrunkError("Worktrunk schema-2 JSON must contain exactly one main worktree.");
  }
  const forge = options.cleanupFacts === true ? parseForge(document.repo?.["forge"]) : undefined;
  return { ...(forge === undefined ? {} : { forge }), mainPath: main[0].path, worktrees };
}

function parseSwitchResult(output: string): { readonly action?: string; readonly path: string } {
  let document: unknown;
  try {
    document = JSON.parse(output) as unknown;
  } catch {
    throw new WorktrunkError("Worktrunk returned malformed JSON; expected a `wt switch` result.");
  }
  if (!isRecord(document)) {
    throw new WorktrunkError("Worktrunk returned an invalid `wt switch` result.");
  }
  const path = requiredString(document["path"], "switch.path");
  if (!isAbsolute(path)) {
    throw new WorktrunkError("Worktrunk returned a non-absolute path from `wt switch`.");
  }
  const action = optionalString(document["action"], "switch.action");
  return { ...(action === undefined ? {} : { action }), path: resolve(path) };
}

function assertRemovedPath(output: string, expectedPath: string): void {
  let document: unknown;
  try {
    document = JSON.parse(output) as unknown;
  } catch {
    throw new WorktrunkError("Worktrunk returned malformed JSON; expected a `wt remove` result.");
  }
  if (!Array.isArray(document) || document.length !== 1 || !isRecord(document[0])) {
    throw new WorktrunkError("Worktrunk returned an invalid `wt remove` result.");
  }
  const removed = document[0];
  if (removed["kind"] !== "worktree" || removed["branch_deleted"] !== false) {
    throw new WorktrunkError(
      "Worktrunk did not confirm a branch-preserving worktree removal; routing was not changed.",
    );
  }
  const path = requiredString(removed["path"], "remove.path");
  if (!isAbsolute(path) || resolve(path) !== resolve(expectedPath)) {
    throw new WorktrunkError("Worktrunk removed a path other than the confirmed worktree.");
  }
}

export class WorktrunkClient {
  readonly #run: WorktrunkRunner;
  #compatible = false;

  public constructor(run: WorktrunkRunner) {
    this.#run = run;
  }

  public async list(cwd: string, signal: AbortSignal | undefined): Promise<WorktrunkList> {
    return this.listWithArguments(
      ["--config-set", "list.json-schema=2", "list", "--format=json"],
      cwd,
      signal,
      WORKTRUNK_DISCOVERY_TIMEOUT_MS,
    );
  }

  public async listLocal(cwd: string, signal: AbortSignal | undefined): Promise<WorktrunkList> {
    return this.listWithArguments(
      ["--config-set", "list.json-schema=2", "list", "--format=json"],
      cwd,
      signal,
      WORKTRUNK_DISCOVERY_TIMEOUT_MS,
      { cleanupFacts: true },
    );
  }

  public async listFull(cwd: string, signal: AbortSignal | undefined): Promise<WorktrunkList> {
    return this.listWithArguments(
      [
        "--config-set",
        "list.json-schema=2",
        "--config-set",
        "list.summary=false",
        "list",
        "--full",
        "--format=json",
      ],
      cwd,
      signal,
      2 * 60_000,
      { cleanupFacts: true, remoteReviews: true },
    );
  }

  private async listWithArguments(
    arguments_: readonly string[],
    cwd: string,
    signal: AbortSignal | undefined,
    timeout: number,
    parseOptions?: ParseListOptions,
  ): Promise<WorktrunkList> {
    await this.ensureCompatible(cwd, signal);
    const result = await this.#run(arguments_, { cwd, signal, timeout });
    if (signal?.aborted === true || result.killed) {
      throw new WorktrunkError("Worktrunk list was cancelled.");
    }
    if (result.code !== 0) throw commandFailure("wt list", result);
    return parseList(result.stdout, parseOptions);
  }

  public async create(
    branch: string,
    base: string | undefined,
    cwd: string,
    signal: AbortSignal | undefined,
  ): Promise<WorktrunkSelection> {
    const list = await this.list(cwd, signal);
    const existing = list.worktrees.filter(
      (worktree) => !worktree.main && worktree.branch === branch,
    );
    if (existing.length > 1) {
      throw new WorktrunkError("Worktrunk returned multiple linked worktrees for the branch.");
    }
    if (existing[0] !== undefined) {
      return {
        ...(await this.switch(["switch", "--no-cd", "--format=json", branch], cwd, signal, {
          branch,
          mainPath: list.mainPath,
          path: existing[0].path,
        })),
        existing: true,
      };
    }
    return this.switch(
      [
        "switch",
        "--create",
        ...(base === undefined ? [] : ["--base", base]),
        "--no-cd",
        "--format=json",
        branch,
      ],
      cwd,
      signal,
    );
  }

  public async activate(
    identifier: string,
    cwd: string,
    signal: AbortSignal | undefined,
  ): Promise<WorktrunkSelection> {
    return this.switch(["switch", "--no-cd", "--format=json", identifier], cwd, signal);
  }

  public async remove(
    identifier: string,
    expectedPath: string,
    cwd: string,
    signal: AbortSignal | undefined,
  ): Promise<void> {
    await this.ensureCompatible(cwd, signal);
    const result = await this.#run(
      [
        "--yes",
        "remove",
        "--no-delete-branch",
        "--no-hooks",
        "--foreground",
        "--format=json",
        identifier,
      ],
      { cwd, signal, timeout: WORKTRUNK_MUTATION_TIMEOUT_MS },
    );
    if (signal?.aborted === true || result.killed) {
      throw new WorktrunkError("Worktrunk removal was cancelled.");
    }
    if (result.code !== 0) {
      throw commandFailure("wt remove", result);
    }
    assertRemovedPath(result.stdout, expectedPath);
  }

  private async switch(
    arguments_: readonly string[],
    cwd: string,
    signal: AbortSignal | undefined,
    expectedExisting?: {
      readonly branch: string;
      readonly mainPath: string;
      readonly path: string;
    },
  ): Promise<WorktrunkSelection> {
    await this.ensureCompatible(cwd, signal);
    const result = await this.#run(arguments_, {
      cwd,
      signal,
      timeout: WORKTRUNK_MUTATION_TIMEOUT_MS,
    });
    if (signal?.aborted === true || result.killed) {
      throw new WorktrunkError("Worktrunk switch was cancelled.");
    }
    if (result.code !== 0) {
      throw commandFailure("wt switch", result);
    }
    const switched = parseSwitchResult(result.stdout);
    if (
      expectedExisting !== undefined &&
      (switched.action !== "existing" || switched.path !== expectedExisting.path)
    ) {
      throw new WorktrunkError("Worktrunk did not attach to the expected existing worktree.");
    }
    // The mutation is complete; confirmation keeps its own bounded command timeout.
    const list = await this.list(cwd, undefined);
    const current = list.worktrees.find((worktree) => worktree.path === switched.path);
    if (
      current === undefined ||
      current.main ||
      (expectedExisting !== undefined &&
        (list.mainPath !== expectedExisting.mainPath || current.branch !== expectedExisting.branch))
    ) {
      throw new WorktrunkError(
        "Worktrunk switch returned a path that was not confirmed as a linked worktree.",
      );
    }
    return { mainPath: list.mainPath, worktree: current };
  }

  private async ensureCompatible(cwd: string, signal: AbortSignal | undefined): Promise<void> {
    if (this.#compatible) {
      return;
    }
    let result: WorktrunkExecution;
    try {
      result = await this.#run(["--version"], {
        cwd,
        signal,
        timeout: WORKTRUNK_DISCOVERY_TIMEOUT_MS,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/\bENOENT\b|not found/iu.test(message)) {
        throw new WorktrunkError(
          "Worktrunk (`wt`) is required on PATH. Install Worktrunk version 0.67.0 or newer.",
        );
      }
      throw new WorktrunkError(`Worktrunk discovery could not start: ${boundedOutput(message)}`);
    }
    if (signal?.aborted === true || result.killed) {
      throw new WorktrunkError("Worktrunk discovery was cancelled.");
    }
    if (result.code !== 0) {
      throw new WorktrunkError(
        "Worktrunk (`wt`) is required on PATH. Install Worktrunk version 0.67.0 or newer.",
      );
    }
    const version = parseVersion(result.stdout);
    if (version === undefined || !atLeastMinimum(version)) {
      const received = boundedOutput(result.stdout);
      throw new WorktrunkError(
        `Worktrunk ${MINIMUM_WORKTRUNK_VERSION} or newer is required; received ${received || "an unrecognized version"}.`,
      );
    }
    this.#compatible = true;
  }
}
