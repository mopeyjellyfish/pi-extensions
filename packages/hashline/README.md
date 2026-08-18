# Pi Hashline

Pi Hashline adds anchored text reads and Hashline edits to Pi. Read an existing
text file, then use its `[PATH#TAG]` header with `edit` to change observed lines.
Use `write` for new files or intentional full-file replacement. Successful
writes return a fresh Hashline tag, and named registers persist across separate
edits. Pi restores only bounded snapshot and register metadata from the active
session branch after reload, resume, or fork, and revalidates every restored tag
against the current file before accepting it.

Library consumers using parser-backed block operations must call and await
`initializeSyntax()` from `@mopeyjellyfish/pi-hashline` before using the
synchronous resolver or patcher. The Pi `edit` tool does this automatically.

This package includes source adapted from [Oh My Pi](https://github.com/can1357/oh-my-pi)
by Can Bölük at commit `644ad30d6e9436074a00f8bd08ecadcd98992fc1`. See
[UPSTREAM.md](./UPSTREAM.md) and [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).
