# pi-typescript

`@mopeyjellyfish/pi-typescript` is a skill-only Pi package for simpler, safer
TypeScript. It favors normal JavaScript control flow, useful inference, runtime
parsing, narrow APIs, and compiler feedback over enterprise-style layers and
compiler escape hatches. It adds no runtime extension or dependency.

## Install

In a target repository that uses Pi:

```sh
pi install npm:@mopeyjellyfish/pi-typescript
```

Pi can use contextual activation when a task matches a skill description. Invoke
a skill directly when you need its focused workflow:

```text
/skill:typescript
/skill:typescript-library
/skill:typescript-testing
/skill:typescript-review
/skill:typescript-modernize
```

## Choose a skill

- Use `/skill:typescript` to implement, debug, or refactor substantial TypeScript
  and TSX. For example, replace an `any` JSON response with `unknown`, parsing,
  and narrowing before domain code reads it.
- Use `/skill:typescript-library` before changing a package export, declaration,
  ESM entrypoint, dependency type, or compatibility promise.
- Use `/skill:typescript-testing` to choose runtime, boundary, type-level, or
  async tests without changing the target repository's runner.
- Use `/skill:typescript-review` to report concrete risks in priority order.
- Use `/skill:typescript-modernize` to improve one legacy module with before and
  after compiler and targeted-test evidence rather than a broad rewrite.

For example, a focused target-repository loop is:

```sh
npm test -- path/to/changed.test.ts
npm run typecheck
```

Use the repository's documented equivalents when it does not use npm or these
scripts. Inspect its instructions, `package.json`, `tsconfig`, installed tools,
runtimes, and public seams before applying advice.

## Scope and strictness

New projects should generally prefer `strict`. It includes
`useUnknownInCatchVariables`; `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, and `noImplicitOverride` are separate
compatibility choices, not a universal switch. Existing projects should adopt
stronger checking incrementally, with a small behavior boundary and evidence
for each change.

The skills are portable guidance, not a framework guide or a generic TypeScript
syntax tutorial. They do not require a package manager, test runner, validator,
bundler, formatter, linter, or dependency-injection pattern.

## Sources and authority

This package paraphrases its sources and uses original examples. Research was
recorded on 2026-08-31 at the revisions below.

- **Microsoft semantics:** the [TypeScript Handbook](https://www.typescriptlang.org/docs/),
  [Design Goals](https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals),
  and [TSConfig reference](https://www.typescriptlang.org/tsconfig/) define
  language behavior and compiler-option meaning.
- **typescript-eslint executable checks:** [typed linting](https://typescript-eslint.io/getting-started/typed-linting/)
  and [shared configurations](https://typescript-eslint.io/users/configs/)
  describe mechanically enforced checks. Preset membership can change, so the
  skills direct agents to inspect the installed version and presets.
- **Practitioner guidance:** [Effective TypeScript](https://effectivetypescript.com/),
  [Matt Pocock's skills](https://github.com/mattpocock/skills) at
  `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`, [Anthony Fu's skills](https://github.com/antfu/skills)
  at `a74f281a27dadc02397bc1a174b0f2c97531b6ae`, and
  [Sindre Sorhus's tsconfig](https://github.com/sindresorhus/tsconfig) at
  `5db01b5dc2492011deee834e5bb175804f05c198` and
  [definition style guide](https://github.com/sindresorhus/typescript-definition-style-guide)
  at `5be6cdab9c13bc2a7eb9ef345d497ba8ae43f919` inform recommendations. They
  do not override target-repository contracts.
- **Skill-package research:** [spf13/go-skills](https://github.com/spf13/go-skills)
  at `e67851cfcca008592c7c4965b8220c7cb37e2f1c` and
  [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) at
  `063bee94c3f4df8453406c830b0a7df0f2860278` informed progressive disclosure
  and package structure, not TypeScript language rules.
