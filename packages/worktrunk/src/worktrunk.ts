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

export interface WorktrunkWorktree {
  readonly branch?: string;
  readonly clean: boolean;
  readonly current: boolean;
  readonly head?: string;
  readonly main: boolean;
  readonly path: string;
}

export interface WorktrunkList {
  readonly mainPath: string;
  readonly worktrees: readonly WorktrunkWorktree[];
}

export interface WorktrunkSelection {
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

function parseList(output: string): WorktrunkList {
  let document: unknown;
  try {
    document = JSON.parse(output) as unknown;
  } catch {
    throw new WorktrunkError(
      "Worktrunk returned malformed JSON; expected schema 2 from `wt list`.",
    );
  }
  if (!isRecord(document) || document["schema"] !== 2 || !Array.isArray(document["items"])) {
    throw new WorktrunkError("Worktrunk returned an unsupported list schema; expected schema 2.");
  }

  const paths = new Set<string>();
  const worktrees = document["items"].map((item, index): WorktrunkWorktree => {
    if (!isRecord(item) || !isRecord(item["worktree"])) {
      throw new WorktrunkError(
        `Worktrunk returned schema-2 JSON with an invalid worktree item at index ${String(index)}.`,
      );
    }
    const worktree = item["worktree"];
    const path = requiredString(worktree["path"], `items[${String(index)}].worktree.path`);
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
    const branch = optionalString(item["branch"], `items[${String(index)}].branch`);
    const head = optionalHead(item["head"], `items[${String(index)}].head`);
    return {
      ...(branch === undefined ? {} : { branch }),
      clean: cleanWorktree(worktree["changes"], `items[${String(index)}].worktree.changes`),
      current: requiredBoolean(worktree["current"], `items[${String(index)}].worktree.current`),
      ...(head === undefined ? {} : { head }),
      main: requiredBoolean(worktree["main"], `items[${String(index)}].worktree.main`),
      path: canonicalPath,
    };
  });
  const main = worktrees.filter((worktree) => worktree.main);
  if (main.length !== 1 || main[0] === undefined) {
    throw new WorktrunkError("Worktrunk schema-2 JSON must contain exactly one main worktree.");
  }
  return { mainPath: main[0].path, worktrees };
}

function parseSwitchPath(output: string): string {
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
  return resolve(path);
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
    await this.ensureCompatible(cwd, signal);
    const result = await this.#run(
      ["--config-set", "list.json-schema=2", "list", "--format=json"],
      { cwd, signal, timeout: WORKTRUNK_DISCOVERY_TIMEOUT_MS },
    );
    if (signal?.aborted === true || result.killed) {
      throw new WorktrunkError("Worktrunk list was cancelled.");
    }
    if (result.code !== 0) {
      throw commandFailure("wt list", result);
    }
    return parseList(result.stdout);
  }

  public async create(
    branch: string,
    base: string | undefined,
    cwd: string,
    signal: AbortSignal | undefined,
  ): Promise<WorktrunkSelection> {
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
    const path = parseSwitchPath(result.stdout);
    const list = await this.list(cwd, signal);
    const current = list.worktrees.find((worktree) => worktree.path === path);
    if (current === undefined || current.main) {
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
