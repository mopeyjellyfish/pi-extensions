# Compatibility

## Decision

Follow the repository's stated Node, browser, TypeScript, module-format, and
semantic-version support policy. A changed export, narrowed accepted input,
different error mode, or altered public type is a compatibility decision even
if a unit test stays green. Prefer additive, documented changes when support is
uncertain.

## Procedure

Identify supported consumers first. Compare old and new export maps,
declarations, and representative calls. Test the published package under each
credible runtime boundary: Node versus browser, ESM versus any documented
alternative, and the oldest supported compiler where practical. Make a
rollback-sized change so a failed consumer test can be reverted without
unwinding unrelated cleanup.

## Failure modes

A browser bundle can accidentally import `node:fs`; a Node library can publish
syntax older consumers cannot parse. Removing an apparently unused overload may
break downstream inference. Do not treat a source-only test as compatibility
proof. If a breaking change is intentional, use the package's release policy,
clear migration notes, and tests that state the new public contract.
