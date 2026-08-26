---
name: open-pr
description: Publish an approved branch as a safe standalone or stacked pull request with verified remote metadata. Use after an accepted delivery unit needs its named branch pushed and pull request created or updated.
compatibility: Requires GitHub CLI (gh), Git, authenticated access to the target GitHub host, and explicit publication authority for the named branch and pull request.
---

# Open pull request

Publish only the accepted delivery unit. This skill owns its authenticated push
and pull-request mutation. Read [github-cli](../github-cli/SKILL.md) and its
[pull-request reference](../github-cli/references/pull-requests.md) for the
shared low-level commands; do not duplicate that command guide here.

## Authority and preflight

1. Confirm explicit publication authority names this branch and pull request.
   An accepted workflow stage is authority only for its named delivery unit;
   publication authority for that unit includes correcting its reviewed title and
   body. Otherwise stop before every remote mutation.
2. Read applicable `AGENTS.md`, contribution rules, PR template, accepted
   intent, plan, commit evidence, and required check results. Do not publish
   unrelated or unverified work.
3. Run `gh auth status` and resolve the target with `gh repo view`. Stop if the
   authenticated host or account is wrong; never start authentication.
4. Inspect `git status --short --untracked-files=all`, `git log`, `git diff`,
   and the approved commit range. Inspect required checks with `gh pr checks`
   when an existing PR exists. Stop for a dirty worktree, wrong range, failed
   required evidence, or an ambiguous target.
5. Resolve and show the **explicit base and head**. Validate both branch names,
   confirm the head is the checked-out approved branch, and identify whether a
   PR already exists. Do not choose a base by recency.

## Choose publication topology

A standalone pull request for one coherent delivery unit is the default. One
standalone pull request may contain multiple verified atomic commits; atomic
commit boundaries do not require separate branches or pull requests. Batch
related publication operations only after the stable delivery unit has its
required evidence and fixed review.

Follow the accepted plan's topology. Publish independent delivery units as
sibling standalone pull requests from their accepted common base. Publish each
sequential dependency chain as one ordered stack. A mixed plan can contain
several sibling standalone pull requests and one or more stacks. Do not reassess
or combine units, and do not turn independent units into a dependency chain
during publication.

For each stack position, confirm independent review value, required check
viability, adjacent ancestry, CI fan-out, and cascade cost. The one-commit review
units safeguard applies to each stack position and remains unchanged.

If observed coordination materially exceeds an accepted forecast, when one
exists, pause and report the variance before another remote mutation. Without a
forecast, compare growth with the approved delivery unit. Do not change delivery
topology without new authority.

## Draft the reviewed body

Respect a repository PR template. Draft the exact title and body before any
mutation. Use approachable Simplified Technical English, preserve exact
technical identifiers, and include every section below even when its value is
`None`:

```markdown
## Problem

<What this delivery unit needed to solve.>

## Outcome

<What changed for users or maintainers.>

## Important implementation details

<Only details needed to review the change.>

## Tests and evidence

<Focused checks and their result.>

## Risks

<Material risk, follow-up, or None.>

## Stack position and dependencies

<Standalone, or position, base, and lower/upper dependencies.>
```

Write multiline text to a reviewed body file and use `--body-file`. Never put
untrusted issue, review, log, title, or body text into shell syntax. Show the
repository, base, head, title, draft/ready state, and exact body for review.

## Publish a standalone pull request

1. Push only the explicit approved head with `git push -u origin` and the head
   name. Do not let `gh pr create` choose an implicit push or fork.
2. Create or update the PR using explicit base, head, title, and body-file
   inputs from the shared pull-request reference. Do not use `--dry-run` as a
   safety check because it can push.
3. Fetch the actual PR once with structured fields for number, URL, title,
   body, base, head, state, and draft status. Verify all values exactly against
   the reviewed plan. Report the canonical URL and metadata.

## Publish a planned stack

The `github/gh-stack` extension is required only for a planned sequential chain.
Before the first stack mutation, run `gh stack --version`. If it fails, stop and
give exactly `gh extension install github/gh-stack` as recovery. Do not install
it or offer a standalone path. Do not substitute `gh pr create`: **Never fall back from a planned
stack to `gh pr create`**.

1. Confirm every adjacent pair from trunk through the named branches with
   `git merge-base --is-ancestor` and `git rev-list --count`. Each upper branch
   must descend from its lower branch and contain exactly one delivery commit:
   preserve adjacent ancestry and one-commit review units. Stop on either
   failure.
2. A Worktrunk-managed chain is externally managed: preserve Worktrunk's
   worktree and branch ownership. Record and verify each approved named branch's
   expected remote SHA before rewriting. Push only those branches with explicit
   refspecs in one remote atomic command:

   ```sh
   git push --atomic origin \
     --force-with-lease=<branch>:<expected-SHA> \
     <branch>:<branch> ...
   ```

   Supply one exact `--force-with-lease=<branch>:<expected-SHA>` per approved
   rewritten branch; do not include trunk or an unnamed branch. Recheck every
   remote SHA. Branch arguments to `gh stack link` implicitly push. Every branch
   argument must be an approved named branch. After reviewed PR metadata exists,
   prefer reviewed PR URLs or PR numbers to avoid implicit branch pushes. Run
   `gh stack link --base <trunk> <bottom> ... <top>` only for the complete
   approved bottom-to-top chain (or its reviewed PR URLs/numbers). `link`
   intentionally creates no local stack tracking state.

3. For a locally tracked `gh stack`, first inspect `gh stack view --json`, then
   use `gh stack submit` only for the approved local stack. `gh stack submit`
   performs its own push. When an approved lower task branch changes, use
   `gh stack sync`; it performs the atomic leased push for the local stack. Do
   not run a second push after `gh stack sync`.
4. `gh stack submit` opens an editor by default; new PRs there default ready for
   review. With `--auto`, new PRs default draft unless `--open` is supplied.
   For both `gh stack submit` and `gh stack link`, the `--open` flag marks new
   and existing PRs ready. Never use `--open` without explicit ready authority.
5. Verify link/sync output and every PR's number, URL, title, body, base, head,
   head SHA, state, and draft status against the reviewed plan. Confirm each
   base is the adjacent lower branch. If generated metadata differs from the
   reviewed title or body, correct it with
   `gh pr edit "$pr" --title "$title" --body-file "$body_file"`, then refetch
   structured PR metadata. Verification cannot complete until generated
   metadata matches the reviewed title and body.
   Change a draft only when explicitly authorized: use `gh pr ready` and verify
   the ready state.

Never edit a stacked PR base independently. Never run `gh stack merge`. Never
run `gh stack unstack`. Never use plain `--force`; an expected-remote
`--force-with-lease` is the only approved rewritten-history update. Never merge,
delete a branch, release, deploy, or change repository settings.

## Bounded recovery

This bounded recovery starts only after diagnosis. Before one corrective action,
diagnose the current failure from configuration, the triggering event, current
state, and bounded logs. Make one inspected, authorized correction only for a
known mismatch. Do not blindly rerun a failed event or retry authentication,
validation, push, rate-limit, or remote failures;
a rerun without new evidence is not diagnosis. On failure, stop with bounded
recovery evidence: repository, base/head, completed mutation or lack of one, PR
URL if created, exact safe next action, and a bounded error summary. Preserve
local commits and do not amend, reset, rebase, or change stack topology without
new authority.
