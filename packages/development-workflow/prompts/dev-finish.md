---
description: Finish verification and prepare explicit shipping decisions
argument-hint: "[requested ship outcome]"
---

# Finish development

Load the `pi-development-workflow` skill and read `development_workflow` status. Close review loops and rerun required checks for: $ARGUMENTS. If Build or Review evidence is complete, request its agent-owned transition. In Ship, obtain `/dev-workflow authorize <action> -- <reason>` separately for each mutation, record its typed receipt only after the action occurs, cancel unused authorization directly, and ask the user to `/dev-workflow finish -- <reason>` when the requested sequence is over.
