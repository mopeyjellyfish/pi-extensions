# @mopeyjellyfish/pi-question

Ask structured clarifying questions in Pi instead of making the model guess.

## Features

- One to four questions in a tabbed bottom dialog.
- Single- and multi-select options with persistent selections.
- Responsive Markdown previews, stacked below 100 columns and side-by-side at wider widths.
- Per-option notes, an **Other…** free-text answer, and a review/Submit tab.
- **Chat about this…** redirects the conversation, then lets the model reopen revised questions with an opaque continuation ID while preserving compatible draft answers.
- Terminal-row-aware scrolling with sticky chrome and clipping indicators.
- A sequential dialog fallback for RPC clients and explicit unavailable results in JSON/print modes.

## Install

```sh
pi install npm:@mopeyjellyfish/pi-question
```

Restart Pi after installation.

## Tool

The package registers the `question` tool. Each call accepts one to four questions. Questions and options require stable IDs; retain an ID across a redirected continuation only when its meaning is unchanged.

````ts
question({
  questions: [
    {
      id: "scope",
      header: "Scope",
      question: "Which scope should the change cover?",
      options: [
        {
          id: "minimal",
          label: "Minimal",
          description: "Only the directly requested behavior",
          preview: "```text\nrequest -> focused change\n```",
        },
        {
          id: "broader",
          label: "Broader",
          description: "Include closely related cleanup",
        },
      ],
    },
  ],
});
````

The UI supplies **Other…**, **Chat about this…**, **Next →**, and Submit controls. Do not include these as options.

A redirected result contains `continuationId`, the bounded clarification, structured answers, and a compact continuation snapshot in tool details. The snapshot stores stable IDs plus SHA-256 semantic hashes for question text/selection mode and option labels/descriptions; it does not duplicate those strings, raw UI state, or previews. After addressing the clarification, call `question` again with that ID and the revised questions. Drafts are restored only from `question` results on the current session branch. Each continuation ID is one-use: the consuming result records `continuedFrom`, and later reuse fails as stale. Rewritten questions, changed selection modes, or changed option labels/descriptions clear affected selections and notes; preview-only changes do not. Removed options and their notes are dropped.

## Controls

- `Tab` / `Shift+Tab` or left/right: switch tabs.
- Up/down: move through rows.
- `Enter`: select, toggle, advance, or submit.
- `Space`: toggle a multi-select option.
- `n`: edit the note for a focused option with a preview.
- `Esc` or the configured `tui.select.cancel` binding: leave an editor or cancel the dialog.

Submitting an empty note or **Other…** editor clears its existing value. Empty **Chat about this…** text is not submitted. Submit remains disabled until every current question has an answer.

## Modes

The complete dialog requires TUI mode. RPC mode walks the same questions through Pi's `select` and `input` UI protocol and uses the documented **Next →** sentinel. JSON and print modes return a structured `unavailable` result rather than inventing an answer; continuation IDs are deliberately not resolved in those modes.

## Bounds

Detail-field bounds are measured by JSON-encoded UTF-8 cost after sanitization, so escaped characters and multibyte Unicode count at their serialized size. User-authored notes are capped at 512 encoded bytes. **Other…** answers and **Chat about this…** redirects are capped at 2,000 encoded bytes. Model-facing tool content is capped at 8,000 decoded UTF-8 bytes, and compact transcript rendering is capped at 320 decoded UTF-8 bytes. Truncated values end with `… [truncated]`. Carriage returns normalize to newlines; tabs/newlines are preserved; other C0 controls and DEL become `�`. Structural IDs, headers, and option labels containing controls are rejected. The maximum valid result details, including a continuation snapshot, remain below Pi's 50 KB tool-result guidance.

## Development

```sh
npm --workspace @mopeyjellyfish/pi-question test
npm --workspace @mopeyjellyfish/pi-question run typecheck
```
