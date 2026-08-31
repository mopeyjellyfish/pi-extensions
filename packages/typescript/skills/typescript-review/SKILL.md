---
name: typescript-review
description: Review TypeScript changes for concrete correctness, type safety, state, async, architecture, exports, and maintainability risks.
---

# TypeScript review

Read repository rules, the fixed review scope, changed public seams, tests, and
current tool output first. Do not repeat compiler or linter diagnostics. Report
findings by impact, with a concrete consequence and the smallest correction.
Use this priority order:

1. Correctness against the requested behavior and public contract.
2. Runtime bugs, data loss, and unvalidated external input.
3. Unsafe typing, including `any`, assertions, and false public types.
4. Invalid state models and missing exhaustive handling.
5. Async and control-flow failures.
6. API design and compatibility.
7. Unnecessary architecture and hidden data flow.
8. Readability of the changed behavior and state transitions.
9. Maintainability, duplication, and accidental exports.
10. Style only when tooling does not own it and it has a practical consequence.

Check exports against support promises and abstractions against demonstrated
need. Read [correctness](references/correctness.md),
[type safety](references/type-safety.md),
[architecture](references/architecture.md), or
[maintainability](references/maintainability.md).
