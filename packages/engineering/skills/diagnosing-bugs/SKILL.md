---
name: diagnosing-bugs
description: >-
  Diagnose software bugs through observable reproduction, shared-root-cause
  tracing, and one durable regression check.
---

# Diagnosing bugs

Use this workflow for a reported bug. Keep the investigation evidence-led and
make the smallest root-cause change.

1. Establish one command, test, log, metric, or other observable feedback loop
   that fails for the reported behavior.
2. Reproduce the failure. Reduce it to the smallest useful case while keeping
   the failure. Record inputs, environment, and expected versus actual output.
3. Trace every caller of the suspect code and inspect sibling paths. Do not fix
   only the first named call site.
4. Write testable hypotheses. Check each against the reproduction and code.
   Add temporary instrumentation only when it separates plausible hypotheses.
5. Fix the shared root cause, not a symptom. Add one focused regression check
   that fails before the fix and passes after it.
6. Remove temporary instrumentation and rerun the reproduction plus relevant
   checks.

If the bug is nondeterministic, capture repeated runs, timing, concurrency,
inputs, and environment; preserve a useful stress or diagnostic check. If it is
unreproducible, state what was tried, keep the smallest observable signal, and
add logging or a guard that will make the next occurrence actionable. Do not
claim certainty without evidence.

Report the reproduction, hypothesis tested, root cause, changed shared path,
regression check, and remaining uncertainty.
