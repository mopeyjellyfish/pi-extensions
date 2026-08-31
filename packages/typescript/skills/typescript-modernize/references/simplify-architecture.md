# Simplify architecture

## Decision

Remove a wrapper, layer, interface, or factory only after tracing callers and
its actual policy. Prefer one direct module when the abstraction has no real
substitution, lifecycle, or boundary responsibility. Preserve documented public
imports unless a compatibility change is approved.

## Procedure

Pick one call chain and state the before cost: for example, a factory creates a
single implementation that merely forwards `save`. Inline that forwarding step,
keep the public function stable, and run its focused behavior and type tests.
If the module is packaged, test the export map and declaration consumer too.
Record before/after evidence such as fewer public constructors and unchanged
consumer output; stop before broad formatting or unrelated dependency changes.

## Failure modes

Do not flatten an adapter that converts a transport, injects credentials, or
owns cleanup merely because it has one implementation today. A private source
test can miss a broken package export after moving files. Avoid replacing a
simple layer with a new service locator or generic container. Each change must
be rollback-sized: if a caller reveals a hidden policy, restore that one step
instead of reverting an entire modernization batch.
