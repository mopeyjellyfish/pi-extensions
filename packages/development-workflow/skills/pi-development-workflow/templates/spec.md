---
schema: dev-workflow/pitch-v1
id: PITCH-001
---

# Pitch

## Problem

### Motivating Story

Name who needs an outcome, what they try today, what happens, and why the failure, friction, risk, or missing capability matters. Separate demonstrated demand from a preferred solution.

### Repository Reality

Describe the current behavior and the relevant code paths, tests, contracts, prior decisions, and constraints.

### Research Basis

Cite the repository evidence and any primary external sources that confirm or change this pitch. Summarize each finding's implication. Link bounded supporting material under `research/` only when the conclusion cannot stay concise here; never attach raw transcripts or search dumps.

### Desired Change

State the outcome and invariants that must change or remain true without prescribing the implementation.

## Appetite

State why this problem and smallest valuable outcome deserve investment, then bound autonomous agent work qualitatively. This is an explicit agent-native adaptation of Shape Up's fixed-time appetite; the ledger backstop remains separate.

### Why This Is Worth the Investment

Explain the human value and opportunity-cost judgment behind this commitment. Name the smallest outcome that would justify spending the shaped agent investment.

### Agent Investment

State the justified context surface, change depth, uncertainty or spike allowance, integration and migration burden, validation matrix, operational hardening, and review assurance. Name assumptions that keep that investment bounded.

### Scope Control

Separate the smallest valuable outcome from optional breadth. Name what to cut first and the conditions that must stop execution and return the pitch for reshaping.

### Fixed Floors

State the correctness, safety, security, accessibility, compatibility, maintainability, and verification obligations that cannot be traded for scope. The ledger's mandatory wall-clock backstop is a separate circuit breaker, not this appetite and not an effort estimate.

## Solution

### Shaped Approach

Describe the macro elements, reused seams, system boundaries, data or control flows, and rough diagrams that make the approach buildable.

### Agent Discretion

State which product and architectural decisions are fixed and which implementation choices the building agent may make locally.

### Acceptance Signals

List observable user, operator, or system outcomes and decisive examples without mutable completion checkboxes.

## Rabbit Holes

For each material risk, record the evidence, likely failure mode, containment or cut, and the tripwire that requires a spike, escalation, or reshaping. Do not list generic risks without a response.

## No-Gos

List explicit exclusions, forbidden generalizations or opportunistic refactors, and boundaries the agent must not cross. Explain which appetite dimension each exclusion protects and when, if ever, it should be reconsidered.
