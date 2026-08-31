---
name: typescript-library
description: Design or change a reusable TypeScript library package, its exports, ESM boundary, public types, dependencies, or compatibility policy.
---

# TypeScript library

First inspect the target repository's supported runtimes, package format, build
and test commands, export map, declaration output, and compatibility policy.
Design the smallest useful public surface. Export values and types deliberately;
do not leak internal helpers or a dependency's accidental types. Use native ESM
where the target runtime supports it, and test a packed consumer import rather
than only source imports. Test public behavior, declarations, and important
public inference; check Node/browser portability where promised.

Read the branch you need: [package design](references/package-design.md),
[ESM](references/esm.md), [exports](references/exports.md),
[public types](references/public-types.md), [dependencies](references/dependencies.md),
and [compatibility](references/compatibility.md).
