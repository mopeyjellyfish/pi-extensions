# Concurrent Playwright CLI open can orphan a daemon

## Affected version

`@playwright/cli@0.1.15`

## Recorded isolated reproduction

The test used a private temporary `PWTEST_DAEMON_SESSION_DIR`, a temporary
workspace, and an exit trap. It did not read or modify normal Playwright
sessions. After the test, the reproducer terminated each PID that it created and
verified that no descendant remained before it removed the temporary directory.

The essential commands were two concurrent opens in the same workspace with the
same session name, followed by `list --all` and an exact close:

```text
playwright-cli --json -s=same-session open about:blank  # concurrent process A
playwright-cli --json -s=same-session open about:blank  # concurrent process B
playwright-cli --json list --all
playwright-cli --json -s=same-session close
```

Do not run these commands as a standalone script on a host. The race can create
an unaddressable daemon, so exact close is not sufficient cleanup. Reproduce it
only in a disposable container with process-namespace isolation.

Both `open` commands returned different daemon PIDs. `list --all` reported only
one session. The exact close stopped only the daemon whose socket and session
file won the race. The other `cliDaemon.js same-session` process and its Chromium
children remained alive until the isolated harness terminated its recorded PIDs.

## Expected behavior

Concurrent opens for one workspace and session must serialize, or one open must
fail without starting a second daemon. A successful exact close must not leave a
daemon that the registry can no longer address.

## Observed mechanism

Each client loads the registry before it starts a daemon. Both clients can see no
entry. Both daemons use one workspace-hash/session socket path and one
`<session>.session` file. Daemon startup unlinks the existing Unix socket before
binding, and the later daemon overwrites the session file. The displaced daemon
keeps running without an addressable registry/socket record.

A per-workspace/session startup lock or atomic ownership check would prevent the
race.

## Related lost-state case

After one successful open, unlinking its socket and running `list --all` removed
the session record but left the detached daemon and Chromium tree alive. An
exact close then reported `not-open`. This shows that registry absence is not
process-exit proof.
