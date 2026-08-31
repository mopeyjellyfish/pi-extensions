---
name: typescript-modernize
description: Incrementally modernize legacy TypeScript by removing unsafe types, assertions, accidental layers, and invalid state models without broad rewrites.
---

# Modernize TypeScript

Inspect existing behavior, compiler settings, ESLint configuration, module
format, and commands before changing code. Make one small, reviewable step:
state the objective, preserve a known boundary, record before/after compiler and
targeted-test evidence, then stop. Modernize `any`, assertions, state,
architecture, ESM, compiler settings, ESLint, and error handling incrementally;
do not use a broad rewrite or blind global strictness change as a shortcut.

Read [legacy patterns](references/legacy-patterns.md), [remove any](references/remove-any.md),
[remove assertions](references/remove-assertions.md),
[simplify architecture](references/simplify-architecture.md), or
[improve state models](references/improve-state-models.md).
