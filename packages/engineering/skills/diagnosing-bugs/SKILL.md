---
name: diagnosing-bugs
description: >-
  Diagnoses software bugs through a tight observable loop, competing
  hypotheses, shared-root repair, and one durable regression check.
---

# Diagnosing bugs

Redact every secret from commands, output, and artifacts before sharing it; use
`<REDACTED>` and retain only lines that carry the diagnostic signal.

1. Establish one tight observable feedback loop that detects the reported
   symptom. Prefer a fast deterministic command that can turn red and green.
2. Reproduce the failure and minimize inputs, environment, callers, and steps
   while keeping the exact symptom observable. Record expected and actual output.
3. Trace every caller of the suspect code and inspect sibling paths. Form ranked,
   competing, testable hypotheses with a prediction that can disprove each one.
4. Add temporary instrumentation only when it discriminates between hypotheses;
   change one variable at a time and mark the instrumentation for cleanup.
5. Fix the shared root cause, not the first symptom. Turn the minimized case into
   one focused regression check at the correct public seam, and show that it
   fails before the fix and passes after it.
6. Rerun the original scenario and relevant checks. Remove instrumentation and
   throwaway artifacts, then report remaining uncertainty without overstating
   confidence.

For a nondeterministic bug, increase and record its reproduction rate with
repeated runs, timing, concurrency, fixed inputs, or a controlled environment.
If it is unreproducible, state what was tried, preserve the smallest observable
signal, and add safe diagnostics that make another occurrence actionable.

Report the loop command, minimized reproduction, hypotheses tested, root cause,
changed shared path, regression red and green, original-scenario result,
cleanup, and uncertainty.
