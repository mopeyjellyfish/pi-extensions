# Review and ship

Use fresh reviewers after the writer finishes when pi-subagents is available:

- behavior and pitch compliance;
- maintainability and repository conventions;
- security, operations, and release risk.

Reviewers are read-only. One writer applies accepted fixes. If independent reviewers are unavailable, review sequentially in the current context and label the result **reduced assurance**. Record that label separately: it never substitutes for explicit intent, correctness, maintainability, or risk/operations evidence, and final verification is still required. Do not use arbitrary numeric scores as a gate.

Before requesting Review approval, ensure every retained slice is verified or explicitly cut, debugging regressions are covered, accepted findings are fixed, and focused plus required repository checks are fresh against the current branch/HEAD.

Review approval moves the workflow to Ship/ready-to-ship. It does not authorize external mutations; every such action needs explicit user authorization. Ask separately before commit, push, PR creation, merge, release, deploy, publish, or worktree removal. Use the Git conventions and GitHub skills when available; otherwise provide commands or steps without claiming execution. Record outcomes only after they happen.
