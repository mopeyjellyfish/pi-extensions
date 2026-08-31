---
name: typescript
description: >-
  Implement, debug, review, or refactor substantial TypeScript or TSX with a
  JavaScript-native, compiler-assisted approach. Use for type design, unsafe
  casts, invalid state, module APIs, async code, or strictness adoption.
---

# TypeScript

TypeScript is **not Java or C# with structural typing**. Start from direct
JavaScript values and control flow. Prefer inference locally; write types at
meaningful boundaries: public APIs, parsed input, storage, and cross-process
messages.

1. Inspect target repository instructions, `package.json`, `tsconfig.json`,
   ESLint and formatter configurations, package manager, test runner, module
   system, monorepo tooling, supported runtimes, public seams, and existing
   commands.
2. Inspect the relevant values and tests before changing code. Derive types
   from canonical runtime values where possible; do not maintain a parallel
   value list and union by hand.
3. Model mutually exclusive states with discriminated unions and use
   `satisfies` when shape checking must preserve useful inference.
4. Accept untrusted data as `unknown`, use parsing at the boundary, then narrow
   with runtime evidence. Do not use `any` or assertions to skip uncertainty.
5. Change one behavior, typecheck, run configured type-aware linting and a
   targeted test when applicable, then inspect the result before the next
   change. Treat compiler errors as design feedback, not noise.
6. Keep narrow exports and demonstrated abstractions. A passing compiler is
   necessary, not proof of runtime behavior; use continuous typechecking.

For a new project, prefer `strict`. It includes `useUnknownInCatchVariables`.
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and
`noImplicitOverride` are separate options: adopt them only after checking
repository compatibility. In an existing project, use an incremental path; do
not switch strictness globally without a migration plan.

Read only the reference needed now:
[inference](references/inference.md), [boundaries](references/boundaries.md),
[unions](references/unions.md), [narrowing](references/narrowing.md),
[generics](references/generics.md), [assertions](references/assertions.md),
[errors](references/errors.md), [async](references/async.md),
[modules](references/modules.md), and [API design](references/api-design.md).
