# Unit testing

## Decision

Test observable behavior at a small public seam with an independent expected
value. Use the target repository's runner and conventions: Vitest, Jest,
`node:test`, and Playwright have different setup and assertion tools, but the
behavioral contract is the same. Prefer real values and cheap collaborators;
mock only a true process, clock, filesystem, network, or UI boundary.

## Procedure

Choose one input and a known result that a plausible wrong implementation would
miss. For a price parser, assert that `"12.50"` becomes `1250` cents and an
invalid value returns the chosen failure. Arrange through the exported function,
act once, and assert result plus a visible effect where that effect is the
contract. Keep fixture setup smaller than the behavior being demonstrated.

## Failure modes

A test that calls a private helper or asserts mock call counts can survive while
users break. Snapshotting a whole object often freezes incidental fields. Do not
make a typecheck stand in for runtime validation: JavaScript callers and JSON
can still supply malformed values. If a mock is necessary, verify the resulting
public behavior rather than the owned implementation sequence.
