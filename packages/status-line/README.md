# pi-status-line

`@mopeyjellyfish/pi-status-line` gives Pi one integrated,
Powerlevel10k-style prompt. The status fields form the top divider, and a short
hook with an accent chevron starts the editable prompt below it. It uses the
same thin inline segment grammar, Nerd Font v3 icons, and semantic palette as
`pi-powerline-footer`.

## Install

Remove `pi-powerline-footer` before installing this package. Pi supports one
custom footer and one custom editor at a time. Extensions that replace either
surface are last-writer-wins.

```sh
pi remove npm:pi-powerline-footer
pi install npm:@mopeyjellyfish/pi-status-line
```

A terminal using a Nerd Font v3 font is required for the `` separator and
segment icons.

For development from this repository, load only this package:

```sh
npm exec -- pi \
  --no-extensions \
  --no-skills \
  --no-prompt-templates \
  --no-themes \
  -e packages/status-line
```

## Layout

Segments appear in this order:

1. model;
2. thinking effort;
3. project directory;
4. effective Git or routed-worktree branch, divergence, staged, changed, and conflict counts;
5. context use and auto-compaction indicator;
6. provider account limits and their remaining percentages;
7. compact active/attention counts for an optional `pi-subagents` fleet;
8. todo progress and the active item, or the next pending item.

For example:

```text
╭─  GPT-5.6 Sol  think:high   pi-extensions   main ↑2 +1 ~3   72.5%/372k 󰁨  limits 5 hour 75% · Weekly 30%   2 !1   2/5 · Implement integration ─
╰─❯ Write here
```

The editor keeps Pi's normal input, keybindings, multiline text, history,
autocomplete, paste handling, and abort behavior. Unrelated extension statuses
follow the first-party segments. The renderer
drops optional segments and shortens long values to remain within the terminal
width.

The package composes with an earlier custom editor when that editor uses Pi's
standard horizontal border layout. A structurally different custom editor can
still conflict because Pi does not expose a general editor-layout composition
contract. Pi also does not expose the previous custom footer, so shutdown
restores Pi's built-in footer.

The package does not reproduce `pi-powerline-footer` welcome overlays, stash,
bash mode, separate prompt history, working vibes, or session token and cost
totals.

## Model and account status

Run `/status` to show the active model, thinking level, directory, session ID,
context use, and all available provider limits. For Codex subscriptions, the
status line shows both the short-window and weekly or monthly percentages. For
provider headers, it shows each observed limit dimension. The limit segment is
prioritized when space is limited. Session token and cost totals are omitted.

OpenAI Codex OAuth refreshes subscription usage at session start, after a model
change, after each settled agent run, and when you run `/status`. This package
uses the same authenticated `GET /backend-api/wham/usage` route as OpenAI Codex
0.146.0. OpenAI does not document this route as a public API. The extension
validates the response and shows usage as unavailable if the route changes.
It does not expose or store the access token or ChatGPT account ID.

For OpenAI API and Anthropic API models, the package uses documented rate-limit
response headers after a model request. For other providers, `/status` reports
that reliable account usage is unavailable. The status line omits the account
limit until reliable data exists.

Usage refreshes have a five-second timeout. The package does not poll while Pi
is idle.

## First-party integrations

The package consumes two optional, versioned Pi event-bus channels:

- `mopeyjellyfish:pi-worktrunk:route:v1` supplies the routed worktree path and
  branch. The project-directory segment remains stable while Git status and the
  branch segment follow the active worktree instead of showing `main` or a
  duplicate Worktrunk status.
- `mopeyjellyfish:pi-todo:summary:v1` supplies closed/total progress and the
  active or next item title. It renders as
  ` 2/5 · Implement status integration`.

Both producer packages remain independently useful without this package. They
retain their standard `setStatus()` fallback, and `pi-todo` retains its bounded
widget. The status line filters those fallback keys only while the matching
structured integration state is present.

When `pi-subagents` is installed, the status line uses its stable v1 status RPC
to restore the current session's active async-run count. Async lifecycle and
control notifications trigger refreshes, and `!N` reports runs whose status
needs attention. The integration is optional and does not add a package
dependency; the normal subagent status fallback is suppressed while the compact
fleet segment is present.

All other extension statuses are preserved. This includes the concise healthy
icon or actionable failure summary published by `pi-lsp`.

## Styling

The first release deliberately has one opinionated style rather than a theme
configuration surface. It follows `pi-powerline-footer` defaults: mauve model,
thinking-level colours, teal directory, semantic Git state, threshold-aware
context and account limits, and a dim `` separator. Todo uses warning colour
while work remains and success colour when all items are closed.
