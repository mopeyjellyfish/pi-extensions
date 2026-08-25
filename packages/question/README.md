# @mopeyjellyfish/pi-question

Ask structured clarifying questions in Pi instead of making the model guess.

## Features

- `presentation: "inline"` keeps a contextual clarification below the visible transcript; omit presentation or use `"fullscreen"` for the existing capturing overlay.
- Inline questions use the same one-to-four question dialog, choices, multi-select, notes, custom answers, redirection, and final review at their natural height when space permits. They scroll only when the complete question exceeds the terminal height.
- Full-screen questions use every terminal row and column.
- At 100 terminal columns or wider, options and final-review controls stay in a one-third left rail while an attached document, focused preview, or blank space uses the remaining two-thirds; narrower overlays stack content.
- Optional full-document review with persistent, independently scrollable Markdown (including bulleted and numbered nested lists, spacing, rules, and language-highlighted fenced code in theme-aware background blocks), YAML, JSON, XML, or text rendering in a stable full-screen overlay viewport.
- Per-option notes, an **Other…** free-text answer, and a review/Submit tab for multi-question dialogs.
- Immediate submission after a single question is answered, without a redundant review step.
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

Use `presentation: "inline"` for a short clarification that refers to nearby transcript context. Use `presentation: "fullscreen"`, or omit the field, for attached documents and formal approval decisions. Inline presentation rejects attached documents rather than hiding the transcript or dropping the document.

After displaying terminal images, use `presentation: "inline"` so the question and its options render below the images instead of overlapping them, unless the question attaches a document or requests formal approval; those stay full-screen.

```ts
question({
  presentation: "inline",
  questions: [
    {
      id: "scope",
      header: "Scope",
      question: "Should the change stay minimal?",
      options: [
        { id: "yes", label: "Yes", description: "Keep the requested scope" },
        { id: "no", label: "No", description: "Broaden the change" },
      ],
    },
  ],
});
```

The UI supplies **Other…**, **Chat about this…**, **Next →**, and, for multi-question dialogs, Submit controls. Do not include these as options.

Attach one optional document to any full-screen question when the choice requires reviewing more than a compact option preview:

```ts
question({
  presentation: "fullscreen",
  questions: [
    {
      id: "plan-review",
      header: "Plan",
      question: "Should we proceed with this plan?",
      document: {
        name: "implementation-plan.md",
        format: "md",
        content: "# Implementation plan\n\n1. Add the public API.\n2. Verify it.",
      },
      options: [
        { id: "agree", label: "Agree", description: "Proceed with the plan" },
        { id: "revise", label: "Revise", description: "Request changes first" },
      ],
    },
  ],
});
```

`document.format` is `md`, `yml`, `json`, `xml`, or `txt`. Markdown uses Pi's formatted Markdown renderer, including language-highlighted fenced code in padded theme-aware background blocks without fence labels; structured text uses Pi's syntax highlighter. The full-screen overlay keeps document rows stable while scrolling. At 100 terminal columns or wider, options and review controls use the left third while a document, focused option preview, or blank content area uses the right two-thirds; content stacks below the controls at narrower widths. Per-option previews still work and appear with the focused option.

A redirected result contains `continuationId`, the bounded clarification, structured answers, and a compact continuation snapshot in tool details. The snapshot stores stable IDs plus SHA-256 semantic hashes for question text/selection mode and option labels/descriptions; it does not duplicate those strings, raw UI state, or previews. After addressing the clarification, call `question` again with that ID and the revised questions. Drafts are restored only from `question` results on the current session branch. Each continuation ID is one-use: the consuming result records `continuedFrom`, and later reuse fails as stale. Rewritten questions, changed selection modes, or changed option labels/descriptions clear affected selections and notes; preview-only changes do not. Removed options and their notes are dropped.

## Controls

- `Tab` / `Shift+Tab` or left/right: switch tabs.
- Up/down: move through rows.
- `Enter`: select, toggle, advance, or submit.
- `Space`: toggle a multi-select option.
- `n`: edit the note for a focused option with a preview.
- `d`: focus or leave an attached document.
- In document focus: up/down scroll one rendered row, PageUp/PageDown scroll a page, Home/End jump, and `Esc` returns to the options.
- `Esc` or the configured `tui.select.cancel` binding: leave an editor or cancel the dialog.

Submitting an empty note or **Other…** editor clears its existing value. Empty **Chat about this…** text is not submitted. A one-question single-select dialog submits when an option or non-empty **Other…** answer is confirmed; a one-question multi-select dialog submits through **Next →**. Multiple questions retain the final review step, where Submit remains disabled until every current question has an answer.

## Modes

The complete dialog and document viewer require TUI mode. `presentation` affects only TUI: RPC ignores it and walks the same questions through Pi's `select` and `input` UI protocol, omitting document content from dialog titles and using the documented **Next →** sentinel. In both modes, a single question submits from its answer while multiple questions retain final review. JSON and print modes return a structured `unavailable` result rather than inventing an answer; continuation IDs are deliberately not resolved in those modes.

## Bounds

Attached documents are limited to 100,000 characters and are never copied into result details or continuation snapshots. Accepted content is scrollable without UI truncation. Document-only changes preserve compatible continuation drafts, like preview-only changes.

Detail-field bounds are measured by JSON-encoded UTF-8 cost after sanitization, so escaped characters and multibyte Unicode count at their serialized size. User-authored notes are capped at 512 encoded bytes. **Other…** answers and **Chat about this…** redirects are capped at 2,000 encoded bytes. Model-facing tool content is capped at 8,000 decoded UTF-8 bytes, and compact transcript rendering is capped at 320 decoded UTF-8 bytes. Truncated values end with `… [truncated]`. Carriage returns normalize to newlines; tabs/newlines are preserved; other C0 controls and DEL become `�`. Structural IDs, headers, document names, and option labels containing controls are rejected. The maximum valid result details, including a continuation snapshot, remain below Pi's 50 KB tool-result guidance.

## Development

```sh
npm --workspace @mopeyjellyfish/pi-question test
npm --workspace @mopeyjellyfish/pi-question run typecheck
```
