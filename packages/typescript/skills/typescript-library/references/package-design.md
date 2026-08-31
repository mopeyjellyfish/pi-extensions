# Package design

## Decision

Name one primary consumer task before designing a library. Make its first call
small and keep configuration proportional to real variation. A stable minimal
API is easier to document, test, and evolve than a general framework. Follow
the target's support policy rather than assuming a package manager, bundler, or
class-based architecture.

## Procedure

Write a consumer example and identify the value imports, type imports, errors,
and lifecycle it needs. Keep helpers private until a second independent caller
needs the same promise. Prefer a direct function such as `format(input)` over a
factory that only returns that function. Add an interface only for a demonstrated
substitution, not because a class might someday be mocked.

## Failure modes

A flexible options bag often accepts invalid combinations and makes every
future field a compatibility commitment. Exporting a class commits consumers to
construction, inheritance, and method layout. Do not make a module public just
because tests import it. Test through the intended package entrypoint so an
internal move remains safe and a real consumer's first call stays understandable.
