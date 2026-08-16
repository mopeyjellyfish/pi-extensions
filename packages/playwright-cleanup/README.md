# pi-playwright-cleanup

`@mopeyjellyfish/pi-playwright-cleanup` gives Pi agents one owned Playwright CLI
browser and verifies that its process tree stops.

## Why it exists

`@playwright/cli` starts detached browser daemons. Its registry is scoped to the
detected `.playwright` workspace. A close from a sibling checkout can miss a
browser. Concurrent `open` calls with one session name can also overwrite the
socket and registry record for a live daemon. A missing record makes
`playwright-cli list --all` incomplete.

## Behavior

The extension registers `playwright_browser`. Any number of agents can use the
tool concurrently. Each active agent gets one managed browser tree, reuses it,
and closes it when that agent settles. The extension does not impose a global or
per-worktree browser limit.

The tool:

- creates one collision-resistant session name for the current Pi session;
- reuses one browser tree per agent and serializes that agent's commands;
- records the session name, opening workspace, daemon PID, owner Pi session ID,
  owner process identity, and owned process tree in a user-private lease;
- closes by exact session name from the opening workspace;
- verifies the recorded daemon and descendants stopped;
- sends signals only to recorded processes whose PID, start time, and command
  hash still match;
- cleans up during `agent_settled` and `session_shutdown`;
- recovers stale leases at the next Pi session start after SIGKILL or a host
  crash;
- leaves a lease unchanged while its recorded Pi owner process is still alive.

The extension blocks direct `playwright-cli` and `@playwright/cli` calls through
Pi Bash and context-mode execution tools. Those paths cannot provide durable
ownership. Arbitrary shell indirection cannot be owned reliably, so agents must
use `playwright_browser`. The extension never runs `kill-all` or `close-all`
during normal cleanup.

## Agent workflow

Open once, reuse the owned browser, then close it explicitly:

```text
playwright_browser { action: "open", url: "https://example.com" }
playwright_browser { action: "run", command: "snapshot" }
playwright_browser { action: "run", command: "click", arguments: ["e3"] }
playwright_browser { action: "close" }
```

`agent_settled` is a final safeguard when explicit close is missed. Do not run
`playwright-cli` through Bash or `ctx_execute`. Keep `playwright-cli kill-all`
as a manual emergency operation only because it can stop browsers owned by
parallel agents.

## Installation

Install the package with Pi:

```sh
pi install npm:@mopeyjellyfish/pi-playwright-cleanup
```

The repository's root profile includes this extension and pins a local
`@playwright/cli`, so `pi install git:github.com/mopeyjellyfish/pi-extensions`
can use `playwright_browser` without a global CLI. A standalone installation
still needs `playwright-cli` on `PATH` when browser automation is required.
Install the required browser separately, for example with
`npx playwright-cli install-browser chromium` from a trusted workspace.
