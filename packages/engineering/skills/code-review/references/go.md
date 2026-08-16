# Go review reference

Use this reference when the fixed diff changes Go. Repository standards override
this reference. Review against the Go version and module contracts declared by
the target repository.

## Review evidence

- Keep errors useful and comparable. Add operation context with wrapping when
  callers need the cause, preserve sentinel or typed error contracts, and do not
  both log and return the same failure without an explicit ownership reason.
- Pass `context.Context` as the first parameter for request-scoped work. Do not
  store it in a struct, replace a caller's context silently, or ignore
  cancellation in blocking I/O and retry loops.
- Give every goroutine an owner, stop condition, and joined or intentionally
  detached lifetime. Check channel close ownership, blocked sends, leaked ticker
  or timer resources, and shutdown paths.
- Examine shared state for race behavior, not only map safety. Synchronization
  must cover compound invariants, and callbacks must not run under a lock unless
  reentrancy and latency are safe.
- Prefer useful zero values and constructors only where invariants or required
  dependencies need them. Keep interfaces small and define them near the
  consumer; do not add an interface for one implementation without a real seam.
- Check resource lifetime directly: close files and response bodies, propagate
  close or flush errors when material, stop timers, and release locks on every
  return path.
- Preserve slice, map, pointer, and ownership semantics. Look for retained large
  backing arrays, aliased mutable buffers, loop-variable capture, nil-versus-empty
  contract changes, and accidental copies of mutex-bearing values.
- Keep concurrency and table tests deterministic. Require behavior evidence for
  cancellation, error paths, and concurrent access; use the race detector when
  the changed path shares mutable state.

Do not report `gofmt`, import grouping, vet findings, or other issues already
enforced by tooling. Cite the changed operation and the concrete correctness,
lifetime, or compatibility consequence.
