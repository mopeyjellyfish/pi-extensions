# pi-github

`@mopeyjellyfish/pi-github` is an independent, skill-only Pi package for
concise and safe GitHub CLI workflows. It uses the user's installed and
authenticated `gh` command; it does not register a runtime extension, replace
GitHub CLI authentication, or introduce another GitHub API client.

## Skill

`github-cli` is the shared low-level reference for common repository-aware
operations:

- create, inspect, and open pull requests;
- collect PR conversation, review summaries, and inline review threads;
- leave reviewed PR or issue comments without fragile shell quoting;
- inspect pull request checks and GitHub Actions runs, jobs, and failed logs;
- list, create, edit, label, close, and reopen issues;
- safely inspect or update an explicitly supplied or repository-configured
  GitHub Projects queue; and
- inspect repositories, search GitHub, work with releases, and use bounded
  `gh api` fallbacks.

The core skill stays compact and loads focused pull request, Actions, issue,
GitHub Projects, or repository references only when needed. Read operations request
selected JSON fields and bounded lists. Remote mutations require an explicit
request and a resolved repository and target. Projects need the GitHub CLI
`project` scope and separate verified repository and project access. Without an
explicit or repository-configured Project, workflows use repository issues.
Private repository content can enter only a verified private Project; missing
access or visibility evidence fails closed without exposing inaccessible content.

`open-pr` owns approved pull-request delivery. It preflights authenticated
repository and explicit base/head state, inspects commit, diff, checks, and
evidence, and pushes only the approved branch. One coherent delivery unit uses a
standalone PR by default and may contain multiple verified atomic commits.
Independent delivery units publish as sibling standalone pull requests;
sequential dependency chains publish as ordered stacks. A mixed plan can contain
several sibling pull requests and one or more stacks.

Independent units keep their accepted common base. Stack positions use the
adjacent lower branch and retain one-commit review units. Publication operations
wait for stable units and are batched where safe. Only planned sequential chains
require `gh stack`: Worktrunk chains use `gh stack link`, locally tracked stacks
use `gh stack submit`, and approved lower-branch changes use checked
`gh stack sync` with expected-remote `--force-with-lease`, never plain force. The
skill verifies link/sync output and structured PR metadata after publication. Its
approachable body records problem, outcome, implementation details, tests and
evidence, risks, and stack dependencies. It never merges or changes accepted
topology destructively.

For a failed check, inspect configuration, triggering event, current state, and
bounded logs before one corrective action. Never treat a blind rerun as
diagnosis. Pause and report material coordination variance against an accepted
forecast before more remote mutation.

`triage` owns bounded review-feedback processing. It resolves one explicit,
current-branch, or conversation-recorded pull request; collects comments,
reviews, checks, and unresolved review threads; classifies feedback; routes
valid fixes through `implement`, `commit`, and `open-pr`; drafts exact replies;
and resolves only addressed and verified threads. It never infers approval or
performs merge or other destructive actions.

## Requirements

Install [GitHub CLI](https://cli.github.com/) and authenticate it for the
intended host:

```sh
gh auth login
gh auth status
```

Credentials remain in GitHub CLI's auth storage. The skill never requires a
repository token file or project-level credential configuration.

Planned stack delivery also requires the `github/gh-stack` extension. Install it
before publication when authorized:

```sh
gh extension install github/gh-stack
```

`open-pr` preflights `gh stack --version`, stops if it is unavailable, and never
automatically installs it or falls back to ad hoc `gh pr create` for a planned
stack.

Actionable `triage` fixes compose the separately installed `implement` skill
from `@mopeyjellyfish/pi-engineering` and `commit` skill from
`@mopeyjellyfish/pi-git-conventions`, then return through `open-pr`. Without
those companion skills, `triage` remains useful for read-only inventory and
stops before a fix.
