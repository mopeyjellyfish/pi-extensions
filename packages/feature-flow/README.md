# pi-feature-flow

`@mopeyjellyfish/pi-feature-flow` is a skill-only Pi package for shaping and
delivering one feature in an isolated Worktrunk worktree. It ships one `shape`
skill, the `/shape [feature brief]` prompt, and Markdown templates. It registers
no extension, service, agent, or runtime dependency.

The workflow intentionally relies on the Worktrunk tool supplied by this
repository's aggregate package; it is not a standalone feature-flow install.

## Use

Start naturally with an end-to-end feature brief or run:

```text
/shape let users resume interrupted uploads
```

Run `/shape` without a brief to resume the active `feat/<slug>` Worktrunk route.
If none is active, the skill uses Worktrunk's list and asks which existing shape
worktree to activate.

Each feature keeps two durable files:

```text
docs/features/<slug>/
├── pitch.md
└── plan.md
```

`pitch.md` is the complete human- and agent-readable Shape Up contract. A
separate read-only review and one whole-document human approval precede
implementation. Material intent changes return it to draft and repeat that gate;
Git preserves history.

`plan.md` is one ordered list of vertical slices. The first unchecked slice is
current or next. Git state shows whether to start or resume it. A slice is
checked only after implementation, appropriate tests and required checks,
independent review, and applicable integrated QA.

Worktrunk alone owns worktree lifecycle. Local commits and every push, pull
request, merge, publication, deployment, cleanup, or worktree removal remain
separately authorized by repository instructions and the user.

## Install

Install the repository aggregate so the skill and its required Worktrunk tool
load together:

```sh
pi install git:github.com/mopeyjellyfish/pi-extensions
```
