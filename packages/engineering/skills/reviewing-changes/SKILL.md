---
name: reviewing-changes
description: >-
  Review changes from a fixed point on separate intent and repository-standard
  axes, then synthesize findings without editing.
---

# Reviewing changes

Review from an explicit fixed point: a commit, merge base, or supplied diff.
State that point before reading the change. Do not review a moving worktree.

Discover the actual specification and intent sources first: request, accepted
plan, issue, contract, tests, or nearby docs. Discover repository engineering
standards next: local instructions, package contract, architecture docs, and
required checks. Cite the source used for each material finding.

Run two separate review axes:

- **Spec and intent:** Does the change satisfy the requested behavior, scope,
  boundaries, and acceptance criteria?
- **Repository engineering standards:** Does it fit package boundaries, APIs,
  security, lifecycle, testing, documentation, and release rules?

Use independent fresh review lanes when they are available. Keep their
observations separate until synthesis. Distinguish hard violations (a stated
requirement, broken behavior, or required check) from judgment calls (a
reasonable alternative or maintainability preference). Ignore checks fully
enforced by tooling; report only what the tooling does not already guarantee.

Synthesize all material findings without hiding either axis. Order findings by
risk and include file, location, evidence, and a concrete consequence. State
what was checked and what was unavailable. This is a read-only review: make no
edits, commits, or fixes unless the request explicitly authorizes them.
