---
name: typescript-testing
description: Test TypeScript behavior, boundary parsing, types, and asynchronous code using the target repository's existing test runner and conventions.
---

# TypeScript testing

Use the target runner and established commands. Separate runtime behavior,
boundary validation, and type-level tests: a compiler check cannot prove runtime
parsing, and a runtime test cannot prove a public type or declaration contract.
Adapt examples to Vitest, Jest, `node:test`, or Playwright rather than migrating
the target runner. Test state unions and package public types at their public seam. Make
async completion, cancellation, failure, and ordering observable; avoid timing
guesses and implementation-detail assertions.

Read [unit testing](references/unit-testing.md),
[integration testing](references/integration-testing.md),
[type testing](references/type-testing.md), or [async testing](references/async-testing.md).
