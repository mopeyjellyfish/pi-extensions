# pi-playwright-cleanup

`@mopeyjellyfish/pi-playwright-cleanup` prevents browser daemons started by Pi
agents from surviving the Pi session that owns them.

## Why it exists

`@playwright/cli` scopes browser registry entries to the nearest `.playwright`
workspace. A browser opened from a linked worktree is therefore not closed by
`playwright-cli close-all` when that command runs from the main checkout.
Repeated misses can leave many Chrome and Playwright daemon processes active.

## Behavior

The extension watches Pi's `bash` tool calls that use `playwright-cli` or
`npx --no-install playwright-cli`. It assigns one unique default Playwright
session name to that Pi process. On
`session_shutdown`, it uses `playwright-cli list --all --json` to find only
that process's browser sessions, closes each session from its original
workspace, and lists all sessions again to verify cleanup.

Explicit `-s` or `--session` names remain caller-owned and must be closed by
the agent. The extension does not claim names that can collide with a user or
another Pi process. It never calls `kill-all` because that global command can
stop browsers owned by other Pi or user sessions. If targeted cleanup cannot be
verified, Pi clearly warns that owned sessions remain and does not attempt
global cleanup.

Cleanup runs for quit, reload, resume, fork, and other Pi shutdown transitions.
It does nothing when the Pi process did not use `playwright-cli`.

## Agent workflow

Use the same checkout or worktree for browser commands and manual cleanup:

```sh
playwright-cli open https://example.com
# test the page
playwright-cli close
playwright-cli list --all --json
```

Do not change to the main checkout before cleanup. If targeted cleanup fails,
stop and tell the user which owned sessions remain. Do not run `kill-all`.

## Installation

Install the package with Pi:

```sh
pi install npm:@mopeyjellyfish/pi-playwright-cleanup
```

The `playwright-cli` executable remains optional and must already be available
through the agent's shell when browser automation is required.
