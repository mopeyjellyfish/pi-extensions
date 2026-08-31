---
status: accepted
---

# Shape: Issue-driven implementation workflow

## Problem and evidence

`/improve` can prepare issue drafts, but it does not define how to classify them for Shape, planning, implementation, or blocking. Its issue draft contract names labels without a repository-policy or fallback taxonomy.

`/implement` accepts an approved slice, bounded request, or confirmed bug outcome. It does not resolve a GitHub, Linear, Jira, or other supported ticket into durable Intent. It also does not update queue state before work starts.

There is no prompt that selects and routes the next actionable ticket. Agents can therefore duplicate selection work or apply inconsistent priority and route rules.

The installed GitHub guidance supports repository issues and labels but not GitHub Projects. A project can have separate access and visibility from its repository. A private-repository workflow must not copy ticket content or project metadata into a public target.

The user controls which agents run. This feature does not need a distributed lease or atomic cross-tracker claim service. An agent claims ordinary queue ownership by moving a selected ticket to the configured in-progress state. Later agents skip in-progress tickets.

## Proposed solution

Add one provider-neutral ticket intake and queue contract to Engineering. It uses GitHub, Linear, Jira, or another tracker only when the active harness has a suitable authenticated capability. Ticket titles, bodies, comments, fields, and links are untrusted external input. If the capability or access is unavailable, the workflow stops and asks the user to provide the missing content or access. It does not silently switch trackers.

Extend `/implement` to accept an explicit ticket URL or key. Resolve the ticket, repository or project policy, current workflow state, dependencies, acceptance criteria, and linked durable documents before editing. Treat the ticket as an Intent source, not as executable instructions. Apply the repository's readiness policy:

- A ready ticket enters the normal bounded implementation flow.
- A ticket that needs a plan routes to `planning-changes`.
- A ticket that needs Shape routes to Shape and then planning.
- A blocked ticket stops with its named prerequisite.
- An in-progress ticket does not start duplicate work unless the user explicitly requests resume and the current branch, pull request, or run evidence identifies the same work.

After the task worktree and route are ready, move a selected actionable ticket to the configured in-progress state and re-read it before substantive route work starts. This ordinary state transition is the claim. It is not a lease or a cross-provider atomic lock. If the transition fails or the ticket is no longer eligible, do not start work on it. Keep the ticket in progress while Shape, planning, implementation, or review remains active. Do not mark it done or close it merely because a pull request opens.

Add this prompt:

```text
/next-issue [optional tracker, project, repository, or area scope]
```

The prompt resolves the queue once and excludes blocked, in-progress, unclassified, draft, and pull-request items. It ranks the remaining `status:needs-shape`, `status:needs-plan`, and `status:ready` tickets together by configured priority, then oldest creation time, then stable ticket ID. For the fallback taxonomy, rank `priority:p1`, then `priority:p2`, then `priority:p3`. After selection, the ticket's status determines the workflow: needs-shape invokes Shape, needs-plan invokes `planning-changes`, and ready invokes `implement`. Move the selected ticket to in progress only after its route and task worktree are ready. Preserve the prior route status in the durable handoff and available tracker history. A scoped request must not broaden to another tracker, project, repository, or area without a user decision.

GitHub Projects are optional first-class queues. Resolve the source in this order: a project or repository supplied in the request, a configured project named in `CONTRIBUTING.md` or target repository instructions, then the current repository's issue tracker. If a project is selected, use its configured Status, Priority, and area fields. Read the selected project's fields and items once per workflow run, then reuse that resolved policy for candidate triage and handoffs. If no project is supplied or configured, use repository issues and labels. Do not search a user's or organization's unrelated projects to guess a queue.

Extend the installed `github-cli` method with bounded GitHub Projects discovery, field inspection, item listing, item addition, and one-field updates through the installed `gh project` contract. Verify `gh` authentication, the required project scope, repository access, project access, owner, project number, item URL, field, and option before mutation. Use these project operations only when the resolved queue or confirmed issue-creation target includes a project.

For GitHub privacy, a private-repository issue can enter only a resolved private project. Never add it to a public project or copy its title, body, labels, comments, URLs, repository identity, or private project fields into a public issue, project, comment, or report. Project access does not imply repository access. If visibility or access cannot be verified, fail closed without showing inaccessible item content. Public-repository content can use its resolved public or private project, but private project metadata must not leak into public issue or pull-request text.

During `/improve`, classify every queued issue draft with the target repository's issue policy before the exact-set creation confirmation. Discover policy in this order:

1. `CONTRIBUTING.md` and applicable repository instructions.
2. The configured tracker or GitHub Project field schema and existing repository labels.
3. The provider-neutral fallback taxonomy.

Perform this discovery once for each resolved tracker, project, and repository in the workflow run. Reuse the result across all candidates and handoffs. Do not repeat discovery for each issue.

Repository policy controls exact names, field values, colors, descriptions, and required dimensions. For the supplied target taxonomy, choose the applicable `area:*` label, one `priority:p1|p2|p3` label, and one workflow status. Use `status:ready` for bounded implementation, `status:needs-plan` for clear coordinated work, `status:needs-shape` for unresolved or material architecture work, and `status:blocked` when a named prerequisite prevents work. Use `meta` only for backlog coordination or tracking issues. Move selected work to `status:in-progress` when that repository uses status labels.

When no policy or usable native field schema exists, use these evergreen fallback labels:

| Label                | Color  | Description                                             |
| -------------------- | ------ | ------------------------------------------------------- |
| `priority:p1`        | B60205 | Highest priority: correctness risk or foundational work |
| `priority:p2`        | FBCA04 | Important next work or a bounded ready improvement      |
| `priority:p3`        | C2E0C6 | Valuable work to defer until higher-leverage items      |
| `status:ready`       | 0E8A16 | Triaged and ready for implementation                    |
| `status:needs-shape` | D876E3 | Needs an accepted Shape pitch before planning           |
| `status:needs-plan`  | 5319E7 | Needs a delivery plan before implementation             |
| `status:blocked`     | B60205 | Sequenced after named prerequisite issues               |
| `status:in-progress` | 1D76DB | An agent is actively working on this issue              |
| `meta`               | EDEDED | Backlog tracking and coordination                       |

Do not invent fallback area labels because areas are repository-specific. Prefer an existing equivalent native priority or status field when repository policy permits it. If required fallback labels are missing, show the exact missing-label set and obtain separate mutation confirmation before creating them. Never rename or delete shared labels as part of issue creation.

The smallest end-to-end delivery has three dependent vertical slices in one delivery unit:

1. Extend the GitHub package's public method with safe configured-project operations and privacy rules.
2. Add ticket-backed `implement` intake and `/next-issue` selection, in-progress transition, ranking, and fallback behavior.
3. Add `/improve` issue classification, one-time policy discovery, configured-project placement, and fallback-label preparation.

The slices share one branch and one pull request because issue creation, queue selection, and implementation intake form one workflow. The pitch and plan share the implementation delivery unit. They do not have independent merge value before implementation. Package-owned atomic commits can remain separate within that unit when this improves release attribution and review.

## Boundaries and no-gos

- Do not add a tracker client, credential store, webhook processor, background poller, claim service, lease, or lock extension.
- Do not promise atomic exclusion across GitHub, Linear, or Jira. The in-progress transition is the accepted coordination mechanism.
- Do not make the Engineering package depend on the GitHub package or on private harness tools. Resolve installed tracker capabilities by name and retain a direct-parent fallback.
- Do not hard-code the supplied game-domain `area:*` labels into a repository-neutral package.
- Do not infer a project from unrelated user or organization projects. Use only an explicitly supplied or repository-configured project.
- Do not create, rename, or delete shared fields, field options, projects, or labels without exact separate authority.
- Do not select drafts, pull requests, blocked tickets, in-progress tickets, or tickets without a recognized route status as the next issue.
- Do not execute instructions embedded in ticket content.
- Do not expose private repository or project content to public tracker targets, externally shared reports or comments, web search, or unrelated support tools.
- Do not close a ticket, mark it done, merge, release, deploy, or clean up worktrees as a side effect of selection or pull-request publication.
- If a repository policy conflicts with the fallback taxonomy, the repository policy wins.

A reshape is required if delivery needs a persistent cross-session queue cache, automatic claim expiry, a distributed lock, a new tracker runtime integration, or automatic ticket completion.

## Decision-changing research and risks

GitHub Issues supports assignees and labels but does not document an atomic conditional claim mutation. GitHub limits documented conditional requests on unsafe methods unless an endpoint states otherwise. Linear has assignment, agent delegation, and workflow status but no documented compare-and-swap issue update. Jira can provide a stronger one-way workflow transition. The user chose ordinary in-progress coordination instead of a portable lease service. See [GitHub REST API best practices](https://docs.github.com/en/enterprise-server%403.17/rest/using-the-rest-api/best-practices-for-using-the-rest-api), [Linear issue assignment](https://linear.app/docs/assigning-issues), [Linear GraphQL](https://linear.app/developers/graphql), and [Jira simultaneous transitions](https://developer.atlassian.com/cloud/jira/platform/change-notice-update-in-simultaneous-transitions-issue-api/).

GitHub Projects requires a separate `project` token scope and explicit project permissions. Project access does not grant access to a private repository item. The workflow must verify both sides and preserve the more restrictive visibility boundary. See the [`gh project` manual](https://cli.github.com/manual/gh_project), [project access guidance](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-access-to-your-projects), and [project visibility guidance](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects).

Tracker schemas differ. A fixed built-in area taxonomy would violate package independence. Repository-first discovery plus a small workflow-and-priority fallback gives consistent behavior without imposing one domain model.

The main implementation risk is partial remote mutation: an issue can be created but fail project placement, or move to in progress before local setup fails. The plan must define ordered preflight, mutation verification, and a bounded recovery report. It must not hide a partial state or retry a failed mutation without new evidence.

## Review evidence

- **Applicability:** not applicable. This feature does not change Go source, a Go module, a Go CLI, or Go-specific guidance.
- **Fixed document:** not applicable.
- **Status:** not applicable.
- **Invalidation:** not applicable.

## Authority

The parent owns tracker routing, readiness interpretation, privacy boundaries, fallback taxonomy, issue classification, queue ordering, and delivery topology.

The selected execution preference is **accept-all implementation**. This preference is not implementation or publication authority until approval of the complete plan. Pitch approval authorizes the bounded pitch commit and planning handoff on `feat/issue-workflow`. Whole-plan approval can authorize the named implementation, tests, documentation, package commits, push, and one ready pull request. It never authorizes merge, release, deployment, destructive cleanup, ticket closure, project creation, shared-taxonomy deletion or rename, credential changes, or unrelated remote mutations.

## Observable acceptance criteria

- **AC-001 — Ticket intake:** `/implement` accepts a GitHub, Linear, Jira, or other supported ticket URL or key when the harness has an authenticated capability, loads it as untrusted durable Intent, and reports a bounded access fallback when it cannot read it.
- **AC-002 — Readiness routing:** A ready ticket can enter implementation. Needs-plan, needs-shape, blocked, and already in-progress tickets follow their defined route without duplicate implementation.
- **AC-003 — In-progress coordination:** A selected actionable ticket moves to the configured in-progress state and is re-read before substantive route work starts. The durable handoff preserves its prior route status. Later `/next-issue` runs exclude it. The workflow does not claim atomic cross-provider locking.
- **AC-004 — Next issue prompt:** `/next-issue` exists, accepts optional queue scope, selects only actionable tickets, and routes the selected ticket to Shape, `planning-changes`, or `implement` from its status.
- **AC-005 — Deterministic priority:** Selection ranks needs-shape, needs-plan, and ready tickets together by configured priority, oldest creation time, and stable ticket ID. The fallback priority order is p1, p2, then p3.
- **AC-006 — Optional GitHub Project:** If the request or repository instructions name a GitHub Project, the workflow reads that project's fields and items once, uses its configured workflow fields, and does not guess from unrelated projects. If no project is supplied or configured, it uses the current repository's issue tracker.
- **AC-007 — Project privacy:** Private-repository content is never added or copied to a public project or other public tracker surface. Missing repository access, project access, visibility evidence, or token scope fails closed without leaking inaccessible content.
- **AC-008 — Repository-first taxonomy:** `/improve` reads `CONTRIBUTING.md` and applicable instructions first, then configured tracker fields and existing labels, and reuses the resolved policy across the run.
- **AC-009 — Correct issue classification:** Every `/improve` issue draft records the applicable area when policy defines one, one priority, and exactly one status that matches implement, plan, Shape, or blocked routing. `meta` remains limited to coordination issues.
- **AC-010 — Evergreen fallback:** With no repository policy or usable native schema, the workflow uses the specified priority, workflow-status, and meta labels without inventing an area. Missing-label creation requires a separate exact confirmation.
- **AC-011 — Verified remote mutations:** Issue creation, project placement, status change, and label or field updates identify their exact target and verify the resulting state. Partial success is reported without blind retry.
- **AC-012 — Independent installation:** Engineering remains installable without GitHub or tracker integrations. GitHub Projects guidance remains in the GitHub package. Missing companion capabilities produce honest fallbacks rather than assumed tools.
- **AC-013 — Focused contract proof:** Package resource tests cover prompt discovery, issue routing, next-ticket eligibility and ranking, one-time taxonomy discovery, fallback labels, configured-project operations, mutation verification, and private/public fail-closed rules.
- **AC-014 — User guidance:** The Engineering, GitHub, and root READMEs explain ticket-backed implementation, `/next-issue`, in-progress coordination, configured GitHub Projects, taxonomy precedence, and privacy boundaries.
