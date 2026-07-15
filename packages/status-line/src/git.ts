export type GitState = "clean" | "modified" | "conflicted";

export interface ParsedGitStatus {
  readonly branch?: string;
  readonly state: GitState;
}

const CONFLICT_CODES = new Set(["AA", "AU", "DD", "DU", "UA", "UD", "UU"]);

function branchFromHeader(header: string): string | undefined {
  const value = header.slice(3).trim();
  if (value === "HEAD (no branch)" || value.startsWith("HEAD ")) return undefined;
  const withoutPrefix = value.replace(/^(?:Initial commit|No commits yet) on /u, "");
  const branch = withoutPrefix.split("...", 1)[0]?.trim();
  return branch === undefined || branch === "" ? undefined : branch;
}

export function parseGitStatus(output: string): ParsedGitStatus {
  let branch: string | undefined;
  let state: GitState = "clean";

  for (const line of output.split("\n")) {
    if (line.startsWith("## ")) {
      branch = branchFromHeader(line);
      continue;
    }
    if (line.length < 2 || line.startsWith("??")) continue;
    const code = line.slice(0, 2);
    if (CONFLICT_CODES.has(code)) {
      state = "conflicted";
    } else if (state === "clean") {
      state = "modified";
    }
  }

  return {
    ...(branch === undefined ? {} : { branch }),
    state,
  };
}
