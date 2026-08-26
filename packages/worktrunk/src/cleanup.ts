import { createHash } from "node:crypto";

import { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES } from "@earendil-works/pi-coding-agent";

import type { GithubEvidenceState, TerminalPullRequest } from "./github.ts";
import type { WorktrunkList, WorktrunkWorktree } from "./worktrunk.ts";

export const MAX_CLEANUP_WORKTREES = 100;

export type CandidateReason =
  "github_merged" | "github_closed" | "worktrunk_integrated" | "worktrunk_empty";

export type SkippedReason =
  | "main"
  | "current"
  | "active_route"
  | "dirty"
  | "operation"
  | "locked"
  | "prunable"
  | "detached"
  | "branch_mismatch"
  | "unborn"
  | "open_review"
  | "insufficient_evidence";

export interface CleanupCandidate {
  readonly branch: string;
  readonly head: string;
  readonly path: string;
  readonly reason: CandidateReason;
  readonly pullRequest?: number;
}

export interface CleanupSkipped {
  readonly branch?: string;
  readonly path: string;
  readonly reason: SkippedReason;
}

export interface CleanupPreview {
  readonly candidateCount?: number;
  readonly candidates: readonly CleanupCandidate[];
  readonly fingerprint?: string;
  readonly githubEvidence: GithubEvidenceState;
  readonly overflow?: boolean;
  readonly skipped: readonly CleanupSkipped[];
  readonly skippedCount?: number;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function terminal(
  branch: string,
  pullRequests: readonly TerminalPullRequest[],
): TerminalPullRequest | undefined {
  const matched = pullRequests.filter((pullRequest) => pullRequest.branch === branch);
  return (
    matched.find((pullRequest) => pullRequest.state === "OPEN") ??
    matched.find((pullRequest) => pullRequest.state === "MERGED") ??
    matched.find((pullRequest) => pullRequest.state === "CLOSED")
  );
}

function localCandidateReason(worktree: WorktrunkWorktree): CandidateReason | undefined {
  if (worktree.integrationState === "empty") return "worktrunk_empty";
  if (worktree.integrationState === "integrated") return "worktrunk_integrated";
  return undefined;
}

function localProtectionReason(
  worktree: WorktrunkWorktree,
  activePath: string | undefined,
): SkippedReason | undefined {
  if (worktree.main) return "main";
  if (worktree.current) return "current";
  if (worktree.path === activePath) return "active_route";
  if (!worktree.clean) return "dirty";
  if (worktree.operation !== undefined) return "operation";
  if (worktree.locked === true) return "locked";
  if (worktree.prunable === true) return "prunable";
  if (worktree.detached === true) return "detached";
  if (worktree.branchMismatch === true) return "branch_mismatch";
  if (worktree.branch === undefined || worktree.head === undefined) return "unborn";
  return undefined;
}

function remoteProtectionReason(
  worktree: WorktrunkWorktree,
  pullRequest: TerminalPullRequest | undefined,
  githubEvidence: GithubEvidenceState,
): SkippedReason | undefined {
  if (worktree.openReview === "open" || pullRequest?.state === "OPEN") return "open_review";
  if (worktree.openReview === "unknown" && githubEvidence !== "available") {
    return "insufficient_evidence";
  }
  return undefined;
}

type ClassifiedWorktree =
  { readonly candidate: CleanupCandidate } | { readonly skipped: CleanupSkipped };

function classifyWorktree(
  worktree: WorktrunkWorktree,
  pullRequests: readonly TerminalPullRequest[],
  githubEvidence: GithubEvidenceState,
  activePath: string | undefined,
): ClassifiedWorktree {
  const protectedReason = localProtectionReason(worktree, activePath);
  if (protectedReason !== undefined) {
    return {
      skipped: {
        ...(worktree.branch === undefined ? {} : { branch: worktree.branch }),
        path: worktree.path,
        reason: protectedReason,
      },
    };
  }

  const { branch, head } = worktree;
  if (branch === undefined || head === undefined) {
    return { skipped: { path: worktree.path, reason: "unborn" } };
  }
  const pullRequest = terminal(branch, pullRequests);
  const remoteReason = remoteProtectionReason(worktree, pullRequest, githubEvidence);
  if (remoteReason !== undefined) {
    return { skipped: { branch, path: worktree.path, reason: remoteReason } };
  }

  const reason =
    pullRequest?.state === "MERGED"
      ? "github_merged"
      : pullRequest?.state === "CLOSED"
        ? "github_closed"
        : localCandidateReason(worktree);
  if (reason === undefined) {
    return { skipped: { branch, path: worktree.path, reason: "insufficient_evidence" } };
  }
  return {
    candidate: {
      branch,
      head,
      path: worktree.path,
      ...(pullRequest === undefined ? {} : { pullRequest: pullRequest.number }),
      reason,
    },
  };
}

function canonicalFingerprint(
  list: WorktrunkList,
  candidates: readonly CleanupCandidate[],
): string {
  const canonical = JSON.stringify({
    candidates,
    forge: list.forge,
    mainPath: list.mainPath,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function formatCleanupPreview(preview: CleanupPreview): string {
  if (preview.overflow === true) {
    return `Cleanup preview exceeded safe output or worktree bounds. Candidates: ${String(
      preview.candidateCount ?? preview.candidates.length,
    )}. Skipped: ${String(
      preview.skippedCount ?? preview.skipped.length,
    )}. No cleanup fingerprint is available.`;
  }

  const candidates = preview.candidates.map(
    (candidate) =>
      `${candidate.branch} ${candidate.head} — ${candidate.path} [${candidate.reason}${
        candidate.pullRequest === undefined ? "" : ` #${String(candidate.pullRequest)}`
      }]`,
  );
  const skipped = preview.skipped.map(
    (worktree) => `${worktree.branch ?? "[unborn]"} — ${worktree.path} [${worktree.reason}]`,
  );
  return `Cleanup candidates (${String(candidates.length)}):\n${
    candidates.join("\n") || "none"
  }\nSkipped (${String(skipped.length)}):\n${skipped.join("\n") || "none"}\nGitHub evidence: ${
    preview.githubEvidence
  }\nFingerprint: ${preview.fingerprint ?? "unavailable"}`;
}

function overflowPreview(preview: CleanupPreview): CleanupPreview {
  return {
    candidateCount: preview.candidates.length,
    candidates: [],
    githubEvidence: preview.githubEvidence,
    overflow: true,
    skipped: [],
    skippedCount: preview.skipped.length,
  };
}

export function cleanupPreview(
  list: WorktrunkList,
  pullRequests: readonly TerminalPullRequest[],
  githubEvidence: GithubEvidenceState,
  activePath?: string,
): CleanupPreview {
  const candidates: CleanupCandidate[] = [];
  const skipped: CleanupSkipped[] = [];

  for (const worktree of [...list.worktrees].sort((left, right) =>
    compareText(left.path, right.path),
  )) {
    const classified = classifyWorktree(worktree, pullRequests, githubEvidence, activePath);
    if ("candidate" in classified) candidates.push(classified.candidate);
    else skipped.push(classified.skipped);
  }

  const base: CleanupPreview = { candidates, githubEvidence, skipped };
  if (list.worktrees.length > MAX_CLEANUP_WORKTREES) {
    return overflowPreview(base);
  }

  const preview: CleanupPreview = {
    ...base,
    fingerprint: canonicalFingerprint(list, candidates),
  };
  const rendered = formatCleanupPreview(preview);
  if (
    Buffer.byteLength(rendered) > DEFAULT_MAX_BYTES ||
    rendered.split("\n").length > DEFAULT_MAX_LINES
  ) {
    return overflowPreview(base);
  }
  return preview;
}

export function revalidationReason(
  candidate: CleanupCandidate,
  list: WorktrunkList,
  activePath?: string,
): SkippedReason | undefined {
  const worktree = list.worktrees.find((item) => item.path === candidate.path);
  if (worktree?.branch !== candidate.branch || worktree.head !== candidate.head) {
    return "insufficient_evidence";
  }
  return localProtectionReason(worktree, activePath);
}
