# API design

## Decision

Design from ordinary JavaScript calls before inventing classes, factories, or
dependency injection. Accept the fewest meaningful inputs, return canonical
runtime values, make failure and optionality visible, and export only the
stable types callers need. Add an abstraction after repeated callers prove a
substitution, policy, or lifecycle boundary.

## Procedure

Write a representative JavaScript call, then list what a caller must know and
what can remain private. Account for structural typing: compatible values do
not need shared inheritance. Remember that excess property checking is a
limited object-literal check, not proof that extra properties cannot exist at
runtime.

Prefer `findUser(id): User | undefined` over a nullable wrapper with redundant
flags. Canonicalize aliases at the edge so `"yes"`, `true`, and `1` do not leak
three meanings through the API. Test the exported call rather than its private
helper graph.

## Failure modes

A broad options object makes invalid combinations and future compatibility
harder to see. A public class exposes construction and inheritance promises
that a function need not make. Do not export inferred dependency types by
accident; they couple consumers to your internals. If an API needs a cast to be
pleasant, reconsider its input model or add a parser at the boundary.
