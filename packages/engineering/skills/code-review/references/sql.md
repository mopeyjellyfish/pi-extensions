# SQL review reference

Use this reference when the fixed diff changes SQL queries, schema, migrations,
or database access that determines SQL semantics. Repository standards override
this reference. Review against the target engine and supported versions.

## Review evidence

- Check `NULL` and three-valued logic explicitly. Comparisons, `NOT IN`,
  aggregates, constraints, and outer-join filters must preserve the intended
  treatment of missing values.
- Verify join and subquery cardinality. A one-to-many join can duplicate rows,
  an unconstrained update can widen its target, and an aggregate can hide a
  multiplicity bug rather than fix it.
- Preserve transaction behavior. Identify the atomic unit, isolation assumption,
  lock order, retry behavior, and failure rollback; avoid holding a transaction
  open across unrelated network or user work.
- Use constraints for invariants the database owns. Check foreign keys, unique
  constraints, check constraints, defaults, and nullability against both current
  and concurrent writes.
- Parameterize values and allow-list dynamic identifiers. Do not accept string
  interpolation as query construction evidence merely because input is typed.
- Review migrations for expand-and-contract compatibility, existing data,
  backfill bounds, lock duration, rollback or forward-fix strategy, and mixed
  application versions during deployment.
- Evaluate performance with cardinality and a query plan, not intuition alone.
  Check sargable predicates, useful index order, bounded result sets, N+1 access,
  sort or hash spill risk, and whether statistics can represent the predicate.
- Require deterministic ordering for pagination and limit operations. Offset and
  keyset pagination must define stable tie-breakers and expected concurrent-write
  behavior.
- Test database-owned behavior with the supported engine or a behaviorally
  compatible local substitute; mocks do not prove SQL semantics.

Do not report keyword case, layout, or static findings already enforced by
tooling. Cite the changed statement and the concrete data-correctness,
concurrency, migration, security, or query-plan consequence.
