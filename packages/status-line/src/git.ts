export type GitState = "clean" | "modified" | "conflicted";

export interface GitStatusDetails {
  readonly ahead: number;
  readonly behind: number;
  readonly changed: number;
  readonly conflicts: number;
  readonly staged: number;
}

export interface ParsedGitStatus extends GitStatusDetails {
  readonly branch?: string;
  readonly head?: string;
  readonly state: GitState;
  readonly upstream?: string;
}

interface MutableGitStatus {
  ahead: number;
  behind: number;
  branch?: string;
  changed: number;
  conflicts: number;
  head?: string;
  staged: number;
  upstream?: string;
}

const CONFLICT_CODES = new Set(["AA", "AU", "DD", "DU", "UA", "UD", "UU"]);
const SHORT_HEAD_LENGTH = 7;

function branchHeader(line: string, status: MutableGitStatus): boolean {
  if (!line.startsWith("# branch.")) return false;
  const separator = line.indexOf(" ", 2);
  if (separator === -1) return true;
  const key = line.slice(2, separator);
  const value = line.slice(separator + 1).trim();
  switch (key) {
    case "branch.oid":
      if (value !== "(initial)" && value !== "") status.head = value.slice(0, SHORT_HEAD_LENGTH);
      break;
    case "branch.head":
      if (value !== "(detached)" && value !== "") status.branch = value;
      break;
    case "branch.upstream":
      if (value !== "") status.upstream = value;
      break;
    case "branch.ab": {
      const divergence = /^\+(\d+) -(\d+)$/u.exec(value);
      if (divergence !== null) {
        status.ahead = Number(divergence[1] ?? 0);
        status.behind = Number(divergence[2] ?? 0);
      }
      break;
    }
  }
  return true;
}

function changedCode(line: string): string | undefined {
  if (!line.startsWith("1 ") && !line.startsWith("2 ")) return undefined;
  const code = line.slice(2, 4);
  return code.length === 2 ? code : undefined;
}

function fileStatus(line: string, status: MutableGitStatus): void {
  if (line.startsWith("u ")) {
    status.conflicts += 1;
    return;
  }
  const code = changedCode(line);
  if (code === undefined) return;
  if (CONFLICT_CODES.has(code)) {
    status.conflicts += 1;
    return;
  }
  if (!code.startsWith(".")) status.staged += 1;
  if (!code.endsWith(".")) status.changed += 1;
}

export function parseGitStatus(output: string): ParsedGitStatus {
  const status: MutableGitStatus = {
    ahead: 0,
    behind: 0,
    changed: 0,
    conflicts: 0,
    staged: 0,
  };
  for (const line of output.split("\n")) {
    if (!branchHeader(line, status)) fileStatus(line, status);
  }
  const state: GitState =
    status.conflicts > 0
      ? "conflicted"
      : status.staged > 0 || status.changed > 0
        ? "modified"
        : "clean";
  return { ...status, state };
}
