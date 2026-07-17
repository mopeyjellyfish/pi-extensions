# pi-status-line

`@mopeyjellyfish/pi-status-line` replaces Pi's footer with a focused,
Powerlevel10k-style status line. It uses the same thin inline segment grammar,
Nerd Font v3 icons, and semantic palette as `pi-powerline-footer`.

## Install

Remove `pi-powerline-footer` before installing this package. Pi supports one
custom footer at a time, so two footer extensions are last-writer-wins rather
than composable.

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
6. active-branch session tokens and cost;
7. compact active/attention counts for an optional `pi-subagents` fleet;
8. todo progress and the active item, or the next pending item.

For example:

```text
 GPT-5.6 Sol  think:high   pi-extensions   main ↑2 +1 ~3   72.5%/372k 󰁨    28M · $1.23   2 !1   2/5 · Implement integration
```

Unrelated extension statuses follow the first-party segments. The renderer
drops optional segments and shortens long values to remain within the terminal
width.

This package replaces only the footer/status function of
`pi-powerline-footer`. It intentionally does not reproduce that package's
custom editor, welcome overlay, stash, bash mode, prompt history, or working
vibes.

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
context, muted tokens, and a dim `` separator. Todo uses warning colour while
work remains and success colour when all items are closed.
