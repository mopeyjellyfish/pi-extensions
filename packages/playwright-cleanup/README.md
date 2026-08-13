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

The extension registers `playwright_browser`. The tool:

- creates one collision-resistant session name for the current Pi session;
- reuses one browser and serializes all commands;
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

The extension blocks direct `playwright-cli` calls through Pi Bash and
context-mode execution tools. Those paths cannot provide durable ownership.
It never runs `kill-all` or `close-all` during normal cleanup.

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

The `playwright-cli` executable remains optional and must already be available
when browser automation is required.
