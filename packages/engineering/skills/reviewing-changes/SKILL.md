---
name: reviewing-changes
description: >-
  Review changes from a fixed point on separate intent and repository-standard
  axes, then synthesize findings without editing.
---

# Reviewing changes

Review from an explicit fixed point: a commit, merge base, or supplied diff.
State that point before reading the change. Do not review a moving worktree.

Read the supplied diff first. Then read only the intent and repository sources
needed to judge that diff: the accepted pitch and plan, changed contracts,
nearby tests, and applicable instructions. Do not inventory unrelated parts of
the repository. Cite the source used for each material finding.

Run two separate review axes:

- **Spec and intent:** Does the change satisfy the requested behavior, scope,
  boundaries, and acceptance criteria?
- **Repository engineering standards:** Does it fit package boundaries, APIs,
  security, lifecycle, testing, documentation, and release rules?

Use one reviewer for both axes in one single pass. Do not fan out unless the
human requests a separate material risk review. Distinguish hard violations (a
stated requirement, broken behavior, or required check) from judgment calls (a
reasonable alternative or maintainability preference). Ignore checks fully
enforced by tooling. Do not rerun focused tests or lint when current evidence is
available and credible. Run a missing check only when its result is necessary to
judge a material finding.

Synthesize only material findings. Order them by risk and include file,
location, evidence, and a concrete consequence. State what was checked and what
was unavailable, then stop. This is a read-only review: make no edits, commits,
or fixes unless the request explicitly authorizes them.
