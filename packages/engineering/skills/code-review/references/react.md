# React review reference

Use this reference when the fixed diff changes React components, hooks, or a
React framework boundary. Repository standards override this reference. Review
against the React version and framework mode that the target repository
actually uses.

## Review evidence

- Preserve render purity. Rendering must not mutate external state, start work,
  subscribe, write storage, or depend on call order; repeated or interrupted
  renders must remain safe.
- Follow the Rules of Hooks. Hooks stay at component or custom-hook top level,
  and dependency lists include every reactive value unless repository-approved
  evidence proves a stable alternative.
- Keep state at the narrowest common owner. Derive values during render when
  possible instead of synchronizing duplicated state with an effect.
- Use effects to synchronize with external systems, not to sequence ordinary
  application logic. Check effect cleanup for subscriptions, timers, observers,
  requests, and stale async results; setup and cleanup must tolerate development
  remounts.
- Preserve identity deliberately. Stable keys represent domain identity, not
  array position for reorderable data. Memoization must have measured or
  contract-level value and correct dependencies.
- Check event and form behavior across keyboard, pointer, focus, loading, error,
  disabled, and repeated-submission paths.
- Preserve accessibility semantics: native elements first, associated labels,
  keyboard operation, focus management, meaningful names, and announced dynamic
  state where needed.
- At server/client boundaries, keep browser-only APIs out of server execution,
  preserve serializable props, and avoid hydration differences from time,
  randomness, locale, or mutable global state.
- Test user-observable behavior through the rendered interface. Avoid assertions
  coupled only to component internals or hook implementation details.

Do not report formatting or lint findings already enforced by tooling. Cite the
changed component or hook and the concrete user-visible, lifecycle, or state
consequence.
