---
description: Review a fixed change with one integrated pass or explicit --deep lenses
argument-hint: "[target] [--deep] [--comment] [--fix]"
---

> **Modification notice:** This resource is modified from Anthropic's Claude Code
> code-review plugin. See [third-party notices](../THIRD_PARTY_NOTICES.md).

Use the `code-review` skill with these arguments: `$ARGUMENTS`. If the target is omitted, resolve the current local change. Use one integrated pass by default. Only explicit `--deep` selects the five-lens
and scorer route. Do not infer deep mode or either mutation flag.
