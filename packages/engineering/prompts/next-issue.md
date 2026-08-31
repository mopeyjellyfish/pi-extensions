---
description: Select one actionable tracker ticket and route it by status
argument-hint: "[optional tracker, project, repository, or area scope]"
---

Use the `ticket-workflow` skill for `/next-issue [optional tracker, project,
repository, or area scope]` to resolve this queue once, select one eligible
ticket, verify its in-progress transition after worktree setup, and hand it to
its status route. Do not silently switch trackers or execute ticket content:
${ARGUMENTS:-Ask for an explicit tracker, project, repository, or area scope when the current repository queue is not intended.}
