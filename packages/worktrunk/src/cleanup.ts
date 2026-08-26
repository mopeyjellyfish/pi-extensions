import { createHash } from "node:crypto";

import type { GithubEvidenceState, TerminalPullRequest } from "./github.ts";
import type { WorktrunkList, WorktrunkWorktree } from "./worktrunk.ts";

export const MAX_CLEANUP_WORKTREES = 100;
export type CandidateReason = "github_merged" | "github_closed" | "worktrunk_integrated" | "worktrunk_empty";
export type SkippedReason = "main" | "current" | "active_route" | "dirty" | "operation" | "locked" | "prunable" | "detached" | "branch_mismatch" | "unborn" | "open_review" | "insufficient_evidence";
export interface CleanupCandidate { readonly branch: string; readonly head: string; readonly path: string; readonly reason: CandidateReason; readonly pullRequest?: number; }
export interface CleanupSkipped { readonly branch?: string; readonly path: string; readonly reason: SkippedReason; }
export interface CleanupPreview { readonly candidates: readonly CleanupCandidate[]; readonly skipped: readonly CleanupSkipped[]; readonly githubEvidence: GithubEvidenceState; readonly fingerprint?: string; readonly overflow?: boolean; }

function terminal(branch: string, prs: readonly TerminalPullRequest[]): TerminalPullRequest | undefined {
  const matched = prs.filter((pr) => pr.branch === branch);
  if (matched.some((pr) => pr.state === "OPEN")) return { branch, number: 0, state: "OPEN" };
  return matched.find((pr) => pr.state === "MERGED") ?? matched.find((pr) => pr.state === "CLOSED");
}
function localReason(worktree: WorktrunkWorktree): CandidateReason | undefined {
  const reason = worktree.integrationReason?.toLowerCase();
  if (reason?.includes("empty")) return "worktrunk_empty";
  if (reason?.includes("integrat") || reason?.includes("merged")) return "worktrunk_integrated";
  return undefined;
}
function skipped(worktree: WorktrunkWorktree, activePath: string | undefined, prs: readonly TerminalPullRequest[]): SkippedReason | undefined {
  if (worktree.main) return "main";
  if (worktree.current) return "current";
  if (worktree.path === activePath) return "active_route";
  if (!worktree.clean) return "dirty";
  if (worktree.operation) return "operation";
  if (worktree.locked) return "locked";
  if (worktree.prunable) return "prunable";
  if (worktree.detached) return "detached";
  if (worktree.branchMismatch) return "branch_mismatch";
  if (worktree.branch === undefined || worktree.head === undefined) return "unborn";
  if (worktree.openReview || terminal(worktree.branch, prs)?.state === "OPEN") return "open_review";
  return undefined;
}

export function cleanupPreview(list: WorktrunkList, prs: readonly TerminalPullRequest[], githubEvidence: GithubEvidenceState, activePath?: string): CleanupPreview {
  const candidates: CleanupCandidate[] = [];
  const skippedItems: CleanupSkipped[] = [];
  for (const worktree of [...list.worktrees].sort((a, b) => a.path.localeCompare(b.path))) {
    const unsafe = skipped(worktree, activePath, prs);
    if (unsafe !== undefined) { skippedItems.push({ ...(worktree.branch === undefined ? {} : { branch: worktree.branch }), path: worktree.path, reason: unsafe }); continue; }
    const pr = terminal(worktree.branch!, prs);
    const reason: CandidateReason | undefined = pr?.state === "MERGED" ? "github_merged" : pr?.state === "CLOSED" ? "github_closed" : localReason(worktree);
    if (reason === undefined) skippedItems.push({ ...(worktree.branch === undefined ? {} : { branch: worktree.branch }), path: worktree.path, reason: "insufficient_evidence" });
    else candidates.push({ branch: worktree.branch!, head: worktree.head!, path: worktree.path, reason, ...(pr === undefined ? {} : { pullRequest: pr.number }) });
  }
  if (list.worktrees.length > MAX_CLEANUP_WORKTREES) return { candidates: [], skipped: skippedItems, githubEvidence, overflow: true };
  const canonical = JSON.stringify({ mainPath: list.mainPath, repository: list.repository, candidates });
  return { candidates, skipped: skippedItems, githubEvidence, fingerprint: createHash("sha256").update(canonical, "utf8").digest("hex") };
}

export function revalidationReason(candidate: CleanupCandidate, list: WorktrunkList, activePath?: string): SkippedReason | undefined {
  const item = list.worktrees.find((worktree) => worktree.path === candidate.path);
  if (item === undefined || item.branch !== candidate.branch || item.head !== candidate.head) return "insufficient_evidence";
  return skipped(item, activePath, []);
}
