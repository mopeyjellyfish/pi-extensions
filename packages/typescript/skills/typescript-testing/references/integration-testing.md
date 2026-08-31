# Integration testing

## Decision

Use an integration test when the risk is wiring across a real boundary:
parsing, serialization, module loading, database adapter behavior, or browser
interaction. Adapt to the installed runner: use Vitest or Jest fixtures,
`node:test` temporary resources, or Playwright for a user-visible browser flow.
Keep external services deterministic and isolated.

## Procedure

Start from the public input and exercise the smallest real chain. For a config
loader, write a temporary JSON file, call the exported loader, and assert the
canonical domain value; add one malformed file case if invalid-input behavior
matters. Use repository-provided fixtures and cleanup hooks. Prefer a real
in-memory adapter over a mock when it proves serialization or lifecycle logic.

## Failure modes

An integration test that contacts a live service is slow and non-repeatable.
Mocking every layer changes it into a unit test and misses wiring. Do not assert
private query strings or component state when the contract is an output, stored
value, or browser result. Keep runtime boundary validation separate from static
type tests: compilation cannot prove malformed JSON is rejected.
