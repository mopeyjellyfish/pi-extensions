# TypeScript review reference

Use this reference only when the fixed diff changes TypeScript or JavaScript
that is governed by TypeScript types. Repository standards override this
reference. Treat each point as a review question, not a reason to demand broad
cleanup.

## Review evidence

- Preserve the configured strictness contract. Flag a disabled strict option,
  widened compiler exclusion, or local escape that makes changed behavior less
  type-safe.
- Prefer `unknown` at untrusted boundaries, then narrow it with runtime evidence.
  Report `any`, unchecked assertions, or double casts only when they can hide a
  concrete invalid state in the changed path.
- Model finite state with a discriminated union and require exhaustive handling.
  Look for optional-field bags, boolean combinations, or default branches that
  admit states the domain does not support.
- Keep runtime validation at file, process, environment, and network seams. A
  static type does not validate JSON, configuration, database rows, or user
  input.
- Preserve useful inference. Prefer `satisfies` when a value needs contract
  checking without widening; avoid annotations or generic parameters that erase
  more precise inferred types.
- Check asynchronous control flow for returned or awaited promises, preserved
  errors, cancellation where the caller supplies it, and cleanup of timers,
  streams, listeners, or other resources.
- Keep module contracts explicit. Watch for type/value import confusion,
  incompatible ESM or CommonJS assumptions, and public exports that expose
  implementation-only types.
- Test observable behavior through the public interface. Type-level assertions
  can complement runtime tests but cannot replace them where behavior exists.

Do not report formatting, import ordering, unused symbols, or other findings
already enforced by tooling. Cite the changed expression and the concrete
runtime, maintenance, or contract consequence.
