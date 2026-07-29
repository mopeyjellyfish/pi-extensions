# Workspace routing

Before feature work, read repository instructions and bounded Git/Worktrunk
facts. Worktrunk alone lists, creates, activates, or removes worktrees. The
helper only validates an active route or explicitly supplied Worktrunk paths.

For resume without a brief, call Worktrunk status and then list. Inspect an
active linked path first; resume it when valid, otherwise inspect the linked
paths from the list with `inspect-candidates`. Use Worktrunk's complete schema-2
list when its Pi result is truncated. Candidate inspection is read-only and
returns three arrays:

- `valid`: zero resumes none, one activates directly, and several require one
  human choice before activation;
- `stale`: recorded branch or base facts disagree with bounded Git facts, so
  report and do not adopt it; and
- `invalid`: malformed JSON, artifacts, hashes, paths, fields, bounds, or state
  invariants, so report and do not adopt it.

Ask for a brief only when all arrays are empty. Stale or invalid candidates need
repair, not a replacement brief. After a selection, Worktrunk activates the
recorded branch and the helper verifies the routed feature again.

A dirty checkout, unknown base, branch collision, or mismatch between the
expected and current Git top-level, branch, or base requires one structured
routing decision. Until a new-feature route is verified, write nothing.
