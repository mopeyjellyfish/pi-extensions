# Architecture

## Decision

Review architecture only where it adds a concrete cost: hidden control flow,
cycle, incompatible public dependency, duplicated policy, or an abstraction
without demonstrated substitution. Prefer direct JavaScript modules and data
flow. TypeScript interfaces, factories, and dependency injection are tools, not
a required architecture.

## Procedure

Trace a caller to its effect. Ask whether an interface has more than one real
implementation, whether a factory selects a policy, and whether a barrel
changes initialization or exports internal layout. Reject class hierarchies,
controllers, managers, generic utilities, or dependency-injection containers
that only rename direct function calls. Check module cycles and package
exports. For example, a `UserService` that delegates one method to one
`UserRepository` adds two public seams without testable policy; a direct
function can be clearer.

## Failure modes

Do not recommend flattening a boundary that owns a real transport, security, or
lifecycle policy. A private refactor is not a review finding unless it harms a
consumer or maintenance. Flag deep imports when they make internal moves
breaking. Explain the specific ongoing cost and smallest simplification instead
of asking for a generic clean architecture rewrite.
