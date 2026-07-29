# Workspace routing

Before feature work, read repository instructions and bounded Git/Worktrunk
facts. Worktrunk creates or activates `shape/<feature>` from a verified base.
The helper only validates the route; it never creates, switches, or removes a
worktree.

A dirty checkout, unknown base, branch collision, or mismatch between the
expected and current Git top-level, branch, or base requires one structured
routing decision. Until the route is verified, write nothing.
