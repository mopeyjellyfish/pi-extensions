# pi-github

`@mopeyjellyfish/pi-github` is an independent, skill-only Pi package for
concise and safe GitHub CLI workflows. It uses the user's installed and
authenticated `gh` command; it does not register a runtime extension, replace
GitHub CLI authentication, or introduce another GitHub API client.

## Skill

`github-cli` covers common repository-aware operations:

- create, inspect, and open pull requests;
- collect PR conversation, review summaries, and inline review threads;
- leave reviewed PR or issue comments without fragile shell quoting;
- inspect pull request checks and GitHub Actions runs, jobs, and failed logs;
- list, create, edit, label, close, and reopen issues;
- inspect repositories, search GitHub, work with releases, and use bounded
  `gh api` fallbacks.

The core skill stays compact and loads focused pull request, Actions, issue, or
repository references only when needed. Read operations request selected JSON
fields and bounded lists. Remote mutations require an explicit request and a
resolved repository and target.

## Requirements

Install [GitHub CLI](https://cli.github.com/) and authenticate it for the
intended host:

```sh
gh auth login
gh auth status
```

Credentials remain in GitHub CLI's auth storage. The skill never requires a
repository token file or project-level credential configuration.
