# Dependencies

## Decision

Audit both runtime dependencies and type names appearing in public signatures.
A dependency upgrade can change declaration compatibility even when behavior
looks unchanged. Prefer a small public structural type you own when it protects
the contract, but do not duplicate a rich dependency model without a concrete
need.

## Procedure

Search generated declarations and exported signatures for package-qualified
names. For each one, decide whether consumers should deliberately share that
dependency, whether it belongs in the supported peer/runtime contract, or
whether an adapter should return your own stable shape. Run a consumer type
fixture after dependency and export changes.

## Example

Instead of returning a transport library's response object, return
`{ status: number; body: string }` when callers only need those fields. The
adapter owns conversion and can absorb a transport upgrade.

## Failure modes

Hiding a required runtime peer creates a package that compiles but fails for
users. Re-exporting every dependency type makes upgrades breaking by accident.
Do not remove a declared dependency merely because source tests use a workspace
copy. Check package metadata, packed installation, licenses, and the target's
browser or Node portability requirements.
