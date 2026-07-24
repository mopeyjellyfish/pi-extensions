import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

import developmentWorkflowExtension, {
  DevelopmentWorkflowParameters,
  STATE_TYPE,
  SUMMARY_EVENT,
  checkpointQuestion,
  checkpointSelection,
  createWorkflow,
  type WorkflowSnapshot,
} from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface ToolResult {
  readonly content: readonly { readonly text: string; readonly type: string }[];
  readonly details: { readonly action: string; readonly snapshot?: WorkflowSnapshot };
}

interface RegisteredTool {
  readonly executionMode?: string;
  readonly name: string;
  readonly parameters: unknown;
  readonly promptGuidelines?: readonly string[];
  execute(
    id: string,
    input: never,
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<ToolResult>;
}

interface RegisteredCommand {
  handler(arguments_: string, context: ExtensionContext): Promise<void>;
}

interface Entry {
  readonly customType?: string;
  readonly data?: unknown;
  readonly type: string;
}

interface ExecResult {
  readonly code: number;
  readonly killed: boolean;
  readonly stderr: string;
  readonly stdout: string;
}

type ExecMock = Mock<(command: string, arguments_: readonly string[]) => Promise<ExecResult>>;

function gitStdout(
  arguments_: readonly string[],
  branch = "feat/workflow",
  head = "abc123",
  changedPaths = "",
  blob = "blob123",
): string {
  if (arguments_.includes("--abbrev-ref")) return `${branch}\n`;
  if (arguments_.includes("--show-object-format")) return "sha1\n";
  if (arguments_[0] === "rev-parse") return `${head}\n`;
  if (gitSubcommand(arguments_) === "diff") return changedPaths;
  if (gitSubcommand(arguments_) === "ls-files") return "";
  if (arguments_[0] === "hash-object") {
    return `${arguments_
      .slice(3)
      .map(() => blob)
      .join("\n")}\n`;
  }
  return "";
}

interface Harness {
  readonly bus: Map<string, Set<(data: unknown) => void>>;
  readonly commands: Map<string, RegisteredCommand>;
  readonly entries: Entry[];
  readonly events: Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >;
  readonly exec: ExecMock;
  readonly notifications: { readonly level: string; readonly message: string }[];
  readonly statuses: (string | undefined)[];
  readonly summaries: unknown[];
  readonly tool: RegisteredTool;
}

const roots: string[] = [];

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

function createHarness(): Harness {
  const bus = new Map<string, Set<(data: unknown) => void>>();
  const commands = new Map<string, RegisteredCommand>();
  const entries: Entry[] = [];
  const events = new Map<
    string,
    ((event: Record<string, unknown>, context: ExtensionContext) => unknown)[]
  >();
  const notifications: { level: string; message: string }[] = [];
  const exec: ExecMock = vi.fn((_command: string, arguments_: readonly string[]) =>
    Promise.resolve({
      code: 0,
      killed: false,
      stderr: "",
      stdout: gitStdout(arguments_),
    }),
  );
  const statuses: (string | undefined)[] = [];
  const summaries: unknown[] = [];
  let tool: RegisteredTool | undefined;
  const pi = {
    appendEntry(customType: string, data: unknown) {
      entries.push({ customType, data, type: "custom" });
    },
    events: {
      emit(channel: string, data: unknown) {
        if (channel === SUMMARY_EVENT) summaries.push(data);
        for (const handler of bus.get(channel) ?? []) handler(data);
      },
      on(channel: string, handler: (data: unknown) => void) {
        const handlers = bus.get(channel) ?? new Set<(data: unknown) => void>();
        handlers.add(handler);
        bus.set(channel, handlers);
        return () => handlers.delete(handler);
      },
    },
    exec,
    on(
      name: string,
      handler: (event: Record<string, unknown>, context: ExtensionContext) => unknown,
    ) {
      events.set(name, [...(events.get(name) ?? []), handler]);
    },
    registerCommand(name: string, command: RegisteredCommand) {
      commands.set(name, command);
    },
    registerTool(definition: RegisteredTool) {
      tool = definition;
    },
  } as unknown as ExtensionAPI;
  developmentWorkflowExtension(pi);
  if (tool === undefined) throw new Error("tool not registered");
  return { bus, commands, entries, events, exec, notifications, statuses, summaries, tool };
}

function context(harness: Harness, cwd: string, mode: "print" | "tui" = "tui"): ExtensionContext {
  return {
    cwd,
    hasUI: mode === "tui",
    mode,
    sessionManager: { getBranch: () => harness.entries },
    ui: {
      notify: (message: string, level: string) => harness.notifications.push({ level, message }),
      setStatus: (_key: string, value: string | undefined) => harness.statuses.push(value),
    },
  } as unknown as ExtensionContext;
}

async function emit(
  harness: Harness,
  name: string,
  ctx: ExtensionContext,
  event: Record<string, unknown> = {},
): Promise<void> {
  await Promise.all((harness.events.get(name) ?? []).map((handler) => handler(event, ctx)));
}

function submittedCheckpoint(
  phase: "discover" | "pitch" | "plan",
  selection: "refine" | "advance",
  input: unknown = checkpointQuestion(phase),
): Record<string, unknown> {
  const questions =
    typeof input === "object" && input !== null
      ? (input as { readonly questions?: readonly { readonly id?: unknown }[] }).questions
      : undefined;
  const questionId = questions?.[0]?.id;
  if (typeof questionId !== "string") throw new Error("checkpoint question id missing");
  return {
    answers: [
      {
        questionId,
        selections: [
          {
            label: selection === "advance" ? "Approve and continue" : "Refine again",
            optionId: selection,
          },
        ],
      },
    ],
    status: "submitted",
  };
}

function emitBus(harness: Harness, channel: string, data: unknown): void {
  for (const handler of harness.bus.get(channel) ?? []) handler(data);
}

async function command(harness: Harness, ctx: ExtensionContext, arguments_: string): Promise<void> {
  const registered = harness.commands.get("dev-workflow");
  if (registered === undefined) throw new Error("command not registered");
  await registered.handler(arguments_, ctx);
}

async function tool(
  harness: Harness,
  ctx: ExtensionContext,
  input: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ToolResult> {
  return harness.tool.execute("call", input as never, signal, undefined, ctx);
}

async function advanceCheckpoint(
  harness: Harness,
  ctx: ExtensionContext,
  phase: "discover" | "pitch" | "plan",
): Promise<void> {
  const pending = (await tool(harness, ctx, { action: "status" })).details.snapshot
    ?.pendingCheckpoint;
  await emit(harness, "tool_result", ctx, {
    details: submittedCheckpoint(phase, "advance", pending?.question),
    input: pending?.question,
    toolName: "question",
  });
}

async function workspace(): Promise<{
  readonly cwd: string;
  readonly plan: string;
  readonly research: string;
  readonly slice: string;
  readonly spec: string;
}> {
  const cwd = await mkdtemp(join(tmpdir(), "dev-workflow-test-"));
  roots.push(cwd);
  await mkdir(join(cwd, "specs", "change", "slices"), { recursive: true });
  const research = "specs/change/research.md";
  const spec = "specs/change/spec.md";
  const plan = "specs/change/plan.md";
  const slicePath = "specs/change/slices/VS-001.md";
  await writeFile(
    join(cwd, research),
    `---\nschema: dev-workflow/research-v1\nid: RESEARCH-001\n---\n# Repository Evidence\nReducer tests and session contracts govern behavior.\n# External Prior Art\nDisposition: not-applicable. Rationale: repository-local lifecycle semantics control this change.\n# Options Considered\nRetain implicit state or build a bounded ledger.\n# Recommendation\nBuild the bounded ledger.\n# Pitch Implications\nKeep the pitch branch-local.\n# Simplicity Check\nThe behavior is necessary; reuse the existing reducer and session-entry seams; standard library primitives are sufficient; no dependency, configurability, or speculative abstraction is justified.\n# Unknowns\nNo consequential unknowns remain.\n`,
  );
  await writeFile(
    join(cwd, spec),
    `---\nschema: dev-workflow/pitch-v1\nid: PITCH-001\n---\n# Problem\nConcrete failing workflow.\n### Research Basis\n[RESEARCH-001](./research.md) records repository evidence.\n### Prior Art\nBranch-local ledgers preserve replayable state.\n### Alternatives\nRetain chat state or build a project database.\n### Shared Understanding\nAgreed fixed decisions require a bounded branch ledger without remote mutation; reducer internals remain agent discretion.\n# Appetite\n### Why This Is Worth the Investment\nReliable branch-local restoration justifies the bounded change.\n### Agent Investment\nChange the bounded reducer and session restoration seam.\n### Scope Control\nDeliver local restoration first and reshape on cross-project state.\n### Fixed Floors\nPreserve type safety, branch isolation, and focused verification.\n# Solution\nA bounded branch ledger.\n### Simplicity Case\nReuse the existing reducer and session-entry seams; add no dependency, watcher, project database, speculative abstraction, or configuration.\n### Agent Discretion\nChoose reducer internals without changing the branch-local contract.\n### Acceptance Signals\nState restores after branching.\n# Rabbit Holes\nAvoid file watchers.\n# No-Gos\nNo remote mutations.\n`,
  );
  await writeFile(
    join(cwd, plan),
    "# Plan\n\nPitch and boundaries: [PITCH-001](./spec.md)\n\n## Vertical Slices\n\nThe first integrated slice is [VS-001](./slices/VS-001.md).\n\n## Dependencies and Sequencing\n\nVS-001 has no dependencies and is first.\n\n## Simplification Review\n\nReuse the existing reducer and session-entry seams; add no project database, watcher, dependency, or generalized abstraction.\n",
  );
  await writeFile(
    join(cwd, slicePath),
    `---\nschema: dev-workflow/vertical-slice-v1\nid: VS-001\ndepends_on: []\nrequirements: [REQ-001]\nrisk: medium\n---\n# Observable Outcome\nStart and restore a workflow.\n# Pitch Fit\nProves the ledger.\n# Boundaries Crossed\nCommand, reducer, and session entry.\n# Execution Profile\n### Worker Model\nTerra handles bounded implementation.\n### Worker Effort\nMedium effort is sufficient.\n### Rationale\nThe seams are understood.\n### Escalation\nUse Terra high for difficult bounded work.\n### Conceptual Replanning\nReturn conceptual failure to Sol planning.\n### Frontier Fallback\nUse Sol medium only after explicit replanning.\n### Reviewer\nUse one fresh Sol high reviewer.\n# Simplification Pass\nReuse the existing reducer and session-entry seams, delete superseded code, and add no speculative abstraction or configuration.\n# RED\nPublic test fails.\n# GREEN\nMinimum path passes.\n# Verification\nFocused test and smoke.\n# Done When\nUser sees restored state.\n`,
  );
  return { cwd, plan, research, slice: slicePath, spec };
}

async function advanceToBuild(
  harness: Harness,
  ctx: ExtensionContext,
  files: Awaited<ReturnType<typeof workspace>>,
): Promise<void> {
  await command(harness, ctx, "start Integrated workflow");
  await tool(harness, ctx, {
    action: "record_artifact",
    artifact: "research",
    path: files.research,
  });
  for (const [evidenceKind, claim] of [
    ["problem", "Problem reproduced"],
    ["research", "Repository code and tests established the controlling behavior"],
  ] as const) {
    await tool(harness, ctx, {
      action: "record_evidence",
      claim,
      evidenceKind,
      reference: `test:${evidenceKind}`,
      sensitivity: "public",
    });
  }
  await tool(harness, ctx, { action: "request_transition", reason: "understood", to: "pitch" });
  await advanceCheckpoint(harness, ctx, "discover");
  await command(harness, ctx, "backstop 1d");
  await tool(harness, ctx, { action: "record_artifact", artifact: "spec", path: files.spec });
  for (const evidenceKind of ["pitch-simplification", "pitch-review"] as const)
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: `${evidenceKind} complete`,
      evidenceKind,
      reference: files.spec,
    });
  await tool(harness, ctx, { action: "request_transition", reason: "shaped", to: "plan" });
  await advanceCheckpoint(harness, ctx, "pitch");
  await tool(harness, ctx, { action: "record_artifact", artifact: "plan", path: files.plan });
  await tool(harness, ctx, { action: "register_slice", id: "VS-001", path: files.slice });
  for (const evidenceKind of [
    "validation-contract",
    "workspace-decision",
    "plan-simplification",
  ] as const) {
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: `${evidenceKind} recorded`,
      evidenceKind,
      reference: files.plan,
    });
  }
  await tool(harness, ctx, { action: "request_transition", reason: "planned", to: "build" });
  await advanceCheckpoint(harness, ctx, "plan");
  await tool(harness, ctx, { action: "set_slice", id: "VS-001", sliceStatus: "active" });
}

async function advanceToShip(
  harness: Harness,
  ctx: ExtensionContext,
  files: Awaited<ReturnType<typeof workspace>>,
): Promise<void> {
  await advanceToBuild(harness, ctx, files);
  for (const evidenceKind of [
    "red",
    "green",
    "focused-verification",
    "regression-verification",
    "worker-handoff",
    "build-simplification",
  ])
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: `${evidenceKind} passed`,
      evidenceKind,
      reference: `build:${evidenceKind}`,
    });
  await tool(harness, ctx, { action: "set_slice", id: "VS-001", sliceStatus: "verified" });
  await tool(harness, ctx, { action: "request_transition", reason: "built", to: "review" });
  for (const evidenceKind of [
    "review-intent",
    "review-correctness",
    "review-maintainability",
    "review-risk-operations",
    "final-verification",
  ])
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: `${evidenceKind} passed`,
      evidenceKind,
      reference: `review:${evidenceKind}`,
    });
  await tool(harness, ctx, { action: "request_transition", reason: "reviewed", to: "ship" });
}

function gitSubcommand(arguments_: readonly string[]): string | undefined {
  return arguments_[0] === "--no-replace-objects" ? arguments_[1] : arguments_[0];
}

function commitBranch(committed: boolean, committedBranch: string): string {
  return committed ? committedBranch : "feat/workflow";
}

function gitCommandCode(
  arguments_: readonly string[],
  failed: string | undefined,
  committed: boolean,
): number {
  if (!committed || gitSubcommand(arguments_) !== failed) return 0;
  if (failed !== "diff") return 1;
  return arguments_.includes("abc123") && arguments_.includes("def456") ? 1 : 0;
}

function mockSingleCommit(
  harness: Harness,
  specPath: string,
  committedMode: "100644" | "100755" | "120000" = "100644",
  object = "a".repeat(40),
  treeOutput?: string,
  failedSubcommand?: "diff" | "ls-tree" | "rev-list",
  committedBranch = "feat/workflow",
): () => void {
  let committed = false;
  const committedTree = treeOutput ?? `${committedMode} blob ${object}\t${specPath}\0`;
  harness.exec.mockImplementation((_command: string, arguments_: readonly string[]) => {
    let stdout = "";
    switch (gitSubcommand(arguments_)) {
      case "symbolic-ref":
        stdout = "feat/workflow\n";
        break;
      case "rev-parse":
        stdout = arguments_.includes("--abbrev-ref")
          ? `${commitBranch(committed, committedBranch)}\n`
          : arguments_.includes("--show-object-format")
            ? "sha1\n"
            : committed
              ? "def456\n"
              : "abc123\n";
        break;
      case "diff":
        if (arguments_.includes("--name-only"))
          stdout =
            arguments_.includes("abc123") && arguments_.includes("def456")
              ? `${specPath}\0`
              : committed
                ? ""
                : `${specPath}\0`;
        break;
      case "hash-object":
        stdout = `${object}\n`;
        break;
      case "rev-list":
        stdout = "def456 abc123\n";
        break;
      case "ls-tree":
        stdout = committedTree;
        break;
      case undefined:
      default:
        break;
    }
    return Promise.resolve({
      code: gitCommandCode(arguments_, failedSubcommand, committed),
      killed: false,
      stderr: "",
      stdout,
    });
  });
  return () => {
    committed = true;
  };
}

describe("development workflow extension", () => {
  it("registers a sequential authority-bounded tool and direct command", () => {
    expect.hasAssertions();
    const harness = createHarness();
    expect(harness.tool.name).toBe("development_workflow");
    expect(harness.tool.executionMode).toBe("sequential");
    expect(harness.tool.parameters).toBe(DevelopmentWorkflowParameters);
    expect(harness.tool.promptGuidelines).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Use development_workflow/u)]),
    );
    expect(harness.commands.has("dev-workflow")).toBe(true);
  });

  it("runs the pitch-to-build public chain and publishes branch-local summaries", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await emit(harness, "session_start", ctx);
    await command(harness, ctx, "start Integrated workflow");
    await tool(harness, ctx, {
      action: "record_artifact",
      artifact: "research",
      path: files.research,
    });
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Problem reproduced",
      evidenceKind: "problem",
      reference: "test:problem",
      sensitivity: "public",
    });
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Repository truth was sufficient",
      evidenceKind: "research",
      reference: "test:repository-reading",
      sensitivity: "public",
    });
    await tool(harness, ctx, {
      action: "request_transition",
      reason: "problem understood",
      to: "pitch",
    });
    await advanceCheckpoint(harness, ctx, "discover");
    await command(harness, ctx, "backstop 1d");
    await tool(harness, ctx, { action: "record_artifact", artifact: "spec", path: files.spec });
    for (const evidenceKind of ["pitch-simplification", "pitch-review"] as const)
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} complete`,
        evidenceKind,
        reference: files.spec,
        sensitivity: "public",
      });
    await tool(harness, ctx, {
      action: "request_transition",
      reason: "rough solved bounded",
      to: "plan",
    });
    await advanceCheckpoint(harness, ctx, "pitch");
    await tool(harness, ctx, { action: "record_artifact", artifact: "plan", path: files.plan });
    await tool(harness, ctx, { action: "register_slice", id: "VS-001", path: files.slice });
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Focused and repository checks are defined",
      evidenceKind: "validation-contract",
      reference: files.plan,
      sensitivity: "public",
    });
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Current workspace is approved",
      evidenceKind: "workspace-decision",
      reference: files.cwd,
      sensitivity: "private",
    });
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "The slice map reuses existing seams and removes speculative work",
      evidenceKind: "plan-simplification",
      reference: files.plan,
      sensitivity: "public",
    });
    await tool(harness, ctx, {
      action: "request_transition",
      reason: "walking skeleton ready",
      to: "build",
    });
    await advanceCheckpoint(harness, ctx, "plan");
    const activated = await tool(harness, ctx, {
      action: "set_slice",
      id: "VS-001",
      sliceStatus: "active",
    });
    const status = await tool(harness, ctx, { action: "status" });

    expect(activated.details.snapshot).toMatchObject({
      phase: "build",
      slices: [{ id: "VS-001", status: "active" }],
    });
    expect(status.content[0]?.text).toContain("Phase: build");
    expect(harness.entries.every((entry) => entry.customType === STATE_TYPE)).toBe(true);
    expect(harness.exec).toHaveBeenCalledWith(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      expect.objectContaining({ cwd: files.cwd, timeout: 2000 }),
    );
    expect(activated.details.snapshot?.workspace).toMatchObject({
      branch: "feat/workflow",
      head: "abc123",
    });
    expect(activated.details.snapshot?.evidence[0]).toMatchObject({
      branch: "feat/workflow",
      head: "abc123",
    });
    expect(harness.summaries.at(-1)).toMatchObject({
      activeSlice: "VS-001",
      backstop: "active",
      phase: "build",
      version: 1,
    });
    expect(harness.statuses.at(-1)).toBe("flow build · VS-001");

    await rm(join(files.cwd, files.slice));
    await emit(harness, "session_tree", ctx);
    expect(
      (await tool(harness, ctx, { action: "status" })).details.snapshot?.slices[0]?.status,
    ).toBe("blocked");
    await emit(harness, "session_compact", ctx);
    expect((await tool(harness, ctx, { action: "status" })).content[0]?.text).toContain(
      "Slice: no active slice",
    );
    await emit(harness, "session_shutdown", ctx);
    expect(harness.summaries.at(-1)).toBeUndefined();
    expect(harness.statuses.at(-1)).toBeUndefined();
    expect(harness.bus.get("mopeyjellyfish:pi-worktrunk:route:v1")?.size).toBe(0);
  });

  it("consumes the exact Question result and advances in the same interaction", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "start Question checkpoint");
    await tool(harness, ctx, {
      action: "record_artifact",
      artifact: "research",
      path: files.research,
    });
    for (const evidenceKind of ["problem", "research"])
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} recorded`,
        evidenceKind,
        reference: files.research,
      });
    const requested = await tool(harness, ctx, {
      action: "request_transition",
      reason: "discovery is ready",
      to: "pitch",
    });
    const input = requested.details.snapshot?.pendingCheckpoint?.question;
    await emit(harness, "tool_result", ctx, {
      details: submittedCheckpoint("discover", "advance", input),
      input,
      toolName: "question",
    });
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot).toMatchObject({
      checkpointDecisions: [{ phase: "discover", selection: "advance" }],
      phase: "pitch",
    });
  });

  it("loops on Refine, accepts the fresh checkpoint after intervening evidence, and ignores duplicates", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "start Refinement loop");
    await tool(harness, ctx, {
      action: "record_artifact",
      artifact: "research",
      path: files.research,
    });
    for (const evidenceKind of ["problem", "research"])
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} recorded`,
        evidenceKind,
        reference: files.research,
      });
    const first = await tool(harness, ctx, {
      action: "request_transition",
      reason: "first research draft",
      to: "pitch",
    });
    const firstInput = first.details.snapshot?.pendingCheckpoint?.question;
    await emit(harness, "tool_result", ctx, {
      details: submittedCheckpoint("discover", "refine", firstInput),
      input: firstInput,
      toolName: "question",
    });
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot).toMatchObject({
      checkpointDecisions: [{ phase: "discover", selection: "refine" }],
      phase: "discover",
    });
    const second = await tool(harness, ctx, {
      action: "request_transition",
      reason: "refined research draft",
      to: "pitch",
    });
    const secondInput = second.details.snapshot?.pendingCheckpoint?.question;
    expect(secondInput).not.toEqual(firstInput);
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "The refined understanding remains grounded",
      evidenceKind: "research",
      reference: files.research,
    });
    const submitted = submittedCheckpoint("discover", "advance", secondInput);
    await emit(harness, "tool_result", ctx, {
      details: submitted,
      input: secondInput,
      toolName: "question",
    });
    const advanced = (await tool(harness, ctx, { action: "status" })).details.snapshot;
    expect(advanced?.phase).toBe("pitch");
    await emit(harness, "tool_result", ctx, {
      details: submitted,
      input: secondInput,
      toolName: "question",
    });
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.revision).toBe(
      advanced?.revision,
    );
  });

  it("registers a later vertical slice during Build without another Plan approval", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await advanceToBuild(harness, ctx, files);
    const laterSlice = "specs/change/slices/VS-002.md";
    const source = (await readFile(join(files.cwd, files.slice), "utf8"))
      .replace("id: VS-001", "id: VS-002")
      .replace("Start and restore a workflow.", "Observe the next integrated behavior.");
    await writeFile(join(files.cwd, laterSlice), source);
    await expect(
      tool(harness, ctx, { action: "register_slice", id: "VS-003", path: laterSlice }),
    ).rejects.toThrow(/document id VS-002.*requested id VS-003/iu);
    await tool(harness, ctx, { action: "register_slice", id: "VS-002", path: laterSlice });
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot).toMatchObject({
      gates: { plan: true },
      phase: "build",
      slices: [
        { id: "VS-001", status: "active" },
        { id: "VS-002", status: "planned" },
      ],
    });
  });

  it("rejects slice identity or dependency drift after registration", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await advanceToBuild(harness, ctx, files);
    for (const evidenceKind of [
      "red",
      "green",
      "focused-verification",
      "regression-verification",
      "worker-handoff",
      "build-simplification",
    ])
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} passed`,
        evidenceKind,
        reference: `build:${evidenceKind}`,
      });
    await tool(harness, ctx, { action: "set_slice", id: "VS-001", sliceStatus: "verified" });
    const changed = (await readFile(join(files.cwd, files.slice), "utf8"))
      .replace("id: VS-001", "id: VS-999")
      .replace("depends_on: []", "depends_on: [VS-001]");
    await writeFile(join(files.cwd, files.slice), changed);
    await expect(
      tool(harness, ctx, { action: "request_transition", reason: "built", to: "review" }),
    ).rejects.toThrow(/identity or dependency graph changed/iu);
  });

  it("validates action fields, artifacts, cancellation, and direct approval errors atomically", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "status");
    expect(harness.notifications.at(-1)?.message).toBe("No active workflow.");
    await command(harness, ctx, "start Validation");
    await expect(tool(harness, ctx, { action: "status", reason: "extra" })).rejects.toThrow(
      /does not accept/iu,
    );
    await expect(
      tool(harness, ctx, { action: "record_artifact", artifact: "spec" }),
    ).rejects.toThrow(/path is required/iu);
    await expect(
      tool(harness, ctx, { action: "record_artifact", artifact: "spec", path: "../outside.md" }),
    ).rejects.toThrow(/escapes/iu);
    await writeFile(join(files.cwd, "bad.md"), "# Not a pitch\n");
    await expect(
      tool(harness, ctx, { action: "record_artifact", artifact: "spec", path: "bad.md" }),
    ).rejects.toThrow(/frontmatter/iu);
    const controller = new AbortController();
    controller.abort();
    await expect(tool(harness, ctx, { action: "status" }, controller.signal)).rejects.toThrow();
    await command(harness, ctx, "approve discover");
    expect(harness.notifications.at(-1)?.level).toBe("error");
    expect(harness.notifications.at(-1)?.message).toMatch(/request transition/iu);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.phase).toBe(
      "discover",
    );
  });

  it("supports direct slice, pause, rewind, abandon, and error controls", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "start Controls");
    await command(harness, ctx, "");
    expect(harness.notifications.at(-1)?.message).toContain("Phase: discover");
    await command(harness, ctx, "pause -- waiting for decision");
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.status).toBe(
      "paused",
    );
    expect(harness.statuses.at(-1)).toBe("flow discover · paused");
    await command(harness, ctx, "resume");
    await command(harness, ctx, "rewind discover -- cannot rewind to same phase");
    expect(harness.notifications.at(-1)?.level).toBe("error");
    for (const operation of ["activate", "block", "verify", "cut"]) {
      await command(harness, ctx, `slice ${operation} VS-999 -- missing`);
      expect(harness.notifications.at(-1)?.message).toMatch(/build phase/iu);
    }
    await command(harness, ctx, "approve nonsense");
    expect(harness.notifications.at(-1)?.message).toMatch(/phase must be/iu);
    await command(harness, ctx, "approve ship");
    expect(harness.notifications.at(-1)?.message).toMatch(/not an approval gate/iu);
    await command(harness, ctx, "circuit finish -- no expiry");
    expect(harness.notifications.at(-1)?.message).toMatch(
      /only after wall-clock backstop expiry/iu,
    );
    await command(harness, ctx, "circuit extend -- missing duration");
    expect(harness.notifications.at(-1)?.message).toMatch(/new backstop duration/iu);
    await command(harness, ctx, "circuit wrong -- no");
    expect(harness.notifications.at(-1)?.message).toMatch(/outcome/iu);
    await command(harness, ctx, "unknown");
    expect(harness.notifications.at(-1)?.message).toMatch(/unknown/iu);
    await command(harness, ctx, "abandon -- no longer valuable");
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.status).toBe(
      "abandoned",
    );
    expect(harness.statuses.at(-1)).toBe("flow discover · abandoned");
    await command(harness, ctx, "start Replacement");
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.title).toBe(
      "Replacement",
    );
  });

  it("handles detached Git identity and binds available HEAD evidence", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    harness.exec.mockImplementation((_commandName: string, arguments_: readonly string[]) => {
      if (arguments_.includes("--abbrev-ref"))
        return Promise.resolve({ code: 1, killed: false, stderr: "detached", stdout: "" });
      return Promise.resolve({
        code: 0,
        killed: false,
        stderr: "",
        stdout: arguments_[0] === "rev-parse" ? "head-only\n" : "",
      });
    });
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "start Detached");
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Bound observation",
      evidenceKind: "problem",
      reference: "test",
    });
    const state = (await tool(harness, ctx, { action: "status" })).details.snapshot;
    expect(state?.workspace).toMatchObject({ head: "head-only", path: files.cwd });
    expect(state?.workspace.tree).toMatch(/^sha256:/u);
    expect(state?.evidence[0]).toMatchObject({ head: "head-only", sensitivity: "private" });
  });

  it.skipIf(process.platform === "win32")(
    "fingerprints symlink text without reading its external target",
    async () => {
      expect.hasAssertions();
      const harness = createHarness();
      const files = await workspace();
      const external = await mkdtemp(join(tmpdir(), "dev-workflow-external-"));
      roots.push(external);
      const externalFile = join(external, "secret.txt");
      await writeFile(externalFile, "external secret");
      await symlink(externalFile, join(files.cwd, "linked-secret"));
      harness.exec.mockImplementation((_commandName: string, arguments_: readonly string[]) =>
        Promise.resolve({
          code: 0,
          killed: false,
          stderr: "",
          stdout: gitStdout(arguments_, "feat/workflow", "abc123", "linked-secret\0"),
        }),
      );
      const ctx = context(harness, files.cwd);

      await command(harness, ctx, "start Symlink fingerprint");
      const state = (await tool(harness, ctx, { action: "status" })).details.snapshot;

      expect(state?.workspace.tree).toMatch(/^sha256:/u);
      expect(
        harness.exec.mock.calls.some(([, arguments_]) => arguments_[0] === "hash-object"),
      ).toBe(false);
    },
  );

  it.skipIf(process.platform === "win32")(
    "rejects workflow artifacts whose symlink target escapes the workspace",
    async () => {
      expect.hasAssertions();
      const harness = createHarness();
      const files = await workspace();
      const external = await mkdtemp(join(tmpdir(), "dev-workflow-artifact-external-"));
      roots.push(external);
      const externalSpec = join(external, "spec.md");
      await writeFile(externalSpec, await readFile(join(files.cwd, files.spec), "utf8"));
      const linkedSpec = "specs/change/linked-spec.md";
      await symlink(externalSpec, join(files.cwd, linkedSpec));
      const ctx = context(harness, files.cwd);
      await command(harness, ctx, "start Artifact containment");
      await tool(harness, ctx, {
        action: "record_artifact",
        artifact: "research",
        path: files.research,
      });
      for (const evidenceKind of ["problem", "research"])
        await tool(harness, ctx, {
          action: "record_evidence",
          claim: `${evidenceKind} recorded`,
          evidenceKind,
          reference: "test",
        });
      await tool(harness, ctx, {
        action: "request_transition",
        reason: "discovery complete",
        to: "pitch",
      });
      await command(harness, ctx, "approve discover");

      await expect(
        tool(harness, ctx, { action: "record_artifact", artifact: "spec", path: linkedSpec }),
      ).rejects.toThrow(/symlink target escapes/iu);
    },
  );

  it("fails closed when dirty-tree fingerprint bounds or file assumptions are violated", async () => {
    expect.hasAssertions();
    const scenarios: readonly {
      readonly changedPaths: string;
      readonly hashOutput?: string;
      readonly message: RegExp;
    }[] = [
      {
        changedPaths: `${"x".repeat(100_001)}\0`,
        message: /path-byte limit/iu,
      },
      {
        changedPaths: `${Array.from({ length: 1001 }, (_, index) => `f-${String(index)}`).join("\0")}\0`,
        message: /changed-path limit/iu,
      },
      { changedPaths: "../escape\0", message: /outside the workspace/iu },
      { changedPaths: "specs\0", message: /directory or submodule/iu },
      { changedPaths: "specs/change/spec.md\0", hashOutput: "", message: /unable to hash/iu },
    ];

    for (const scenario of scenarios) {
      const harness = createHarness();
      const files = await workspace();
      harness.exec.mockImplementation((_commandName: string, arguments_: readonly string[]) =>
        Promise.resolve({
          code: 0,
          killed: false,
          stderr: "",
          stdout:
            arguments_[0] === "hash-object" && scenario.hashOutput !== undefined
              ? scenario.hashOutput
              : gitStdout(arguments_, "feat/workflow", "abc123", scenario.changedPaths),
        }),
      );

      await command(harness, context(harness, files.cwd), "start Bounded fingerprint");

      expect(harness.notifications.at(-1)?.message).toMatch(scenario.message);
    }
  });

  it("adopts from the routed Worktrunk path and rejects duplicate starts", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const main = await workspace();
    const routed = await workspace();
    const ctx = context(harness, main.cwd);
    emitBus(harness, "mopeyjellyfish:pi-worktrunk:route:v1", {
      activePath: routed.cwd,
      version: 2,
    });
    emitBus(harness, "mopeyjellyfish:pi-worktrunk:route:v1", {
      activePath: routed.cwd,
      branch: "feat/routed",
      head: "def456",
      version: 1,
    });
    await command(harness, ctx, `adopt ${routed.spec} -- import existing artifacts`);
    const adopted = (await tool(harness, ctx, { action: "status" })).details.snapshot;
    expect(adopted).toMatchObject({
      artifacts: { spec: routed.spec },
      evidence: [],
      gates: {},
      phase: "discover",
      workspace: { branch: "feat/workflow", head: "abc123", path: routed.cwd },
    });
    await command(harness, ctx, `adopt ${routed.spec} -- duplicate`);
    expect(harness.notifications.at(-1)?.message).toMatch(/requires an empty/iu);
    await command(harness, ctx, "start Duplicate");
    expect(harness.notifications.at(-1)?.message).toMatch(/already active/iu);
    emitBus(harness, "mopeyjellyfish:pi-worktrunk:route:v1", undefined);
  });

  it("blocks malformed replay until direct recovery and stays useful without TUI", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    harness.entries.push(
      { customType: STATE_TYPE, data: createWorkflow("Valid", files.cwd, 1), type: "custom" },
      { customType: STATE_TYPE, data: { version: 99 }, type: "custom" },
    );
    const print = context(harness, files.cwd, "print");
    await emit(harness, "session_start", print);
    await expect(tool(harness, print, { action: "status" })).rejects.toThrow(/malformed/iu);
    await command(harness, print, "start blocked");
    expect(harness.notifications).toEqual([]);
    const tui = context(harness, files.cwd);
    await command(harness, tui, "recover -- manual session corruption");
    expect((await tool(harness, tui, { action: "status" })).content[0]?.text).toContain(
      "Recovered workflow",
    );
    await command(harness, tui, "recover -- again");
    expect(harness.notifications.at(-1)?.message).toMatch(/only for a malformed/iu);
    await emit(harness, "session_shutdown", print);
  });

  it("requires direct authorization, typed receipts, and direct completion for shipping", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await advanceToBuild(harness, ctx, files);
    for (const evidenceKind of [
      "red",
      "green",
      "focused-verification",
      "regression-verification",
      "worker-handoff",
      "build-simplification",
    ]) {
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} passed`,
        evidenceKind,
        reference: `test:${evidenceKind}`,
      });
    }
    await tool(harness, ctx, { action: "set_slice", id: "VS-001", sliceStatus: "verified" });
    await tool(harness, ctx, { action: "request_transition", reason: "built", to: "review" });
    for (const evidenceKind of [
      "review-intent",
      "review-correctness",
      "review-maintainability",
      "review-risk-operations",
      "final-verification",
    ]) {
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} passed`,
        evidenceKind,
        reference: `review:${evidenceKind}`,
      });
    }
    await tool(harness, ctx, { action: "request_transition", reason: "reviewed", to: "ship" });

    await expect(
      tool(harness, ctx, {
        action: "record_outcome",
        receipt: "PR #26 merged",
        shipAction: "merge",
      }),
    ).rejects.toThrow(/direct human/iu);

    await command(harness, ctx, "authorize merge -- merge the reviewed pull request");
    await tool(harness, ctx, {
      action: "record_outcome",
      receipt: "PR #26 merged",
      shipAction: "merge",
    });
    await command(harness, ctx, "finish -- requested shipping sequence is complete");
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot).toMatchObject({
      outcomes: [{ action: "merge", receipt: "PR #26 merged" }],
      status: "completed",
    });
  });

  it("fails closed when an authorized commit is not exactly one matching direct child", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    let committed = false;
    harness.exec.mockImplementation((_command: string, arguments_: readonly string[]) => {
      let stdout = "";
      if (arguments_.includes("--abbrev-ref")) stdout = "feat/workflow\n";
      else if (arguments_[0] === "rev-parse") stdout = committed ? "def456\n" : "abc123\n";
      else if (gitSubcommand(arguments_) === "diff" && arguments_.includes("--name-only"))
        stdout = committed ? "" : `${files.spec}\0`;
      else if (arguments_[0] === "hash-object") stdout = "reviewed-blob\n";
      else if (gitSubcommand(arguments_) === "rev-list")
        stdout = "def456 unrelated-parent extra-parent\n";
      return Promise.resolve({ code: 0, killed: false, stderr: "", stdout });
    });
    await advanceToBuild(harness, ctx, files);
    for (const evidenceKind of [
      "red",
      "green",
      "focused-verification",
      "regression-verification",
      "worker-handoff",
      "build-simplification",
    ])
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} passed`,
        evidenceKind,
        reference: `build:${evidenceKind}`,
      });
    await tool(harness, ctx, { action: "set_slice", id: "VS-001", sliceStatus: "verified" });
    await tool(harness, ctx, { action: "request_transition", reason: "built", to: "review" });
    for (const evidenceKind of [
      "review-intent",
      "review-correctness",
      "review-maintainability",
      "review-risk-operations",
      "final-verification",
    ])
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} passed`,
        evidenceKind,
        reference: `review:${evidenceKind}`,
      });
    await tool(harness, ctx, { action: "request_transition", reason: "reviewed", to: "ship" });
    await command(harness, ctx, "authorize commit -- create exactly the reviewed commit");
    committed = true;
    await expect(
      tool(harness, ctx, {
        action: "record_outcome",
        receipt: "commit attempted",
        shipAction: "commit",
      }),
    ).rejects.toThrow(/direct-child commit/iu);
    expect(
      harness.exec.mock.calls.some(
        ([, arguments_]) =>
          arguments_.includes("--no-replace-objects") &&
          arguments_.includes("rev-list") &&
          arguments_.includes("def456"),
      ),
    ).toBe(true);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.outcomes).toEqual([]);
  });

  it("accepts one direct-child commit whose exact content and mode match authorization", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    const markCommitted = mockSingleCommit(harness, files.spec);
    await advanceToShip(harness, ctx, files);
    await command(harness, ctx, "authorize commit -- create exactly the reviewed commit");
    markCommitted();
    await tool(harness, ctx, {
      action: "record_outcome",
      receipt: "def456",
      shipAction: "commit",
    });
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.outcomes).toEqual([
      expect.objectContaining({ action: "commit", head: "def456", receipt: "def456" }),
    ]);
    expect(
      harness.exec.mock.calls.some(
        ([, arguments_]) =>
          arguments_.includes("--no-replace-objects") &&
          arguments_.includes("diff") &&
          arguments_.includes("abc123") &&
          arguments_.includes("def456"),
      ),
    ).toBe(true);
    expect(
      harness.exec.mock.calls.some(
        ([, arguments_]) =>
          arguments_.includes("--no-replace-objects") &&
          arguments_.includes("ls-tree") &&
          arguments_.includes("def456"),
      ),
    ).toBe(true);
  });

  it("rejects workspace drift during pinned commit receipt inspection", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    const markCommitted = mockSingleCommit(harness, files.spec);
    await advanceToShip(harness, ctx, files);
    await command(harness, ctx, "authorize commit -- create exactly the reviewed commit");
    markCommitted();
    const implementation = harness.exec.getMockImplementation();
    if (implementation === undefined) throw new Error("Expected the Git mock implementation.");
    let inspectedTree = false;
    harness.exec.mockImplementation(async (commandName: string, arguments_: readonly string[]) => {
      const result = await implementation(commandName, arguments_);
      if (gitSubcommand(arguments_) === "ls-tree") inspectedTree = true;
      return inspectedTree &&
        gitSubcommand(arguments_) === "rev-parse" &&
        !arguments_.includes("--abbrev-ref")
        ? { ...result, stdout: "extra-head\n" }
        : result;
    });
    await expect(
      tool(harness, ctx, {
        action: "record_outcome",
        receipt: "def456 before concurrent drift",
        shipAction: "commit",
      }),
    ).rejects.toThrow(/changed during commit receipt validation/iu);
  });

  it("rejects a direct-child commit when the checked-out branch changes after authorization", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    const markCommitted = mockSingleCommit(
      harness,
      files.spec,
      "100644",
      "a".repeat(40),
      undefined,
      undefined,
      "feat/other",
    );
    await advanceToShip(harness, ctx, files);
    await command(harness, ctx, "authorize commit -- create exactly the reviewed commit");
    markCommitted();
    await expect(
      tool(harness, ctx, {
        action: "record_outcome",
        receipt: "def456 on another branch",
        shipAction: "commit",
      }),
    ).rejects.toThrow(/authorized branch\/path/iu);
  });

  it("rejects a direct-child commit when its file mode differs from authorization", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    const markCommitted = mockSingleCommit(harness, files.spec, "100755");
    await advanceToShip(harness, ctx, files);
    await command(harness, ctx, "authorize commit -- create exactly the reviewed commit");
    markCommitted();
    await expect(
      tool(harness, ctx, {
        action: "record_outcome",
        receipt: "def456 with changed mode",
        shipAction: "commit",
      }),
    ).rejects.toThrow(/delta does not exactly match/iu);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.outcomes).toEqual([]);
  });

  it("rejects missing and malformed authoritative Git tree entries", async () => {
    expect.hasAssertions();
    const object = "a".repeat(40);
    for (const [treeOutput, message] of [
      ["", /missing changed path/iu],
      [`100644 tree ${object}\tspecs/change/spec.md\0`, /invalid changed-path/iu],
      [`100600 blob ${object}\tspecs/change/spec.md\0`, /invalid changed-path/iu],
      ["100644 blob\tspecs/change/spec.md\0", /invalid changed-path/iu],
      ["100644 blob not-a-hash\tspecs/change/spec.md\0", /invalid changed-path/iu],
      ["malformed\0", /invalid changed-path/iu],
      [`100644 blob ${object}\twrong-path\0`, /invalid changed-path/iu],
      [
        `100644 blob ${object}\tspecs/change/spec.md` +
          "\0" +
          `100644 blob ${object}\tspecs/change/spec.md\0`,
        /invalid changed-path/iu,
      ],
    ] as const) {
      const harness = createHarness();
      const files = await workspace();
      const ctx = context(harness, files.cwd);
      const markCommitted = mockSingleCommit(harness, files.spec, "100644", object, treeOutput);
      await advanceToShip(harness, ctx, files);
      await command(harness, ctx, "authorize commit -- create exactly the reviewed commit");
      markCommitted();
      await expect(
        tool(harness, ctx, {
          action: "record_outcome",
          receipt: "invalid tree entry",
          shipAction: "commit",
        }),
      ).rejects.toThrow(message);
    }
  });

  it("fails closed when pinned Git delta inspection commands fail", async () => {
    expect.hasAssertions();
    for (const [failedSubcommand, message] of [
      ["rev-list", /direct-child commit/iu],
      ["diff", /fingerprint the authorized commit delta/iu],
      ["ls-tree", /inspect committed Git tree entries/iu],
    ] as const) {
      const harness = createHarness();
      const files = await workspace();
      const ctx = context(harness, files.cwd);
      const markCommitted = mockSingleCommit(
        harness,
        files.spec,
        "100644",
        "a".repeat(40),
        undefined,
        failedSubcommand,
      );
      await advanceToShip(harness, ctx, files);
      await command(harness, ctx, "authorize commit -- create exactly the reviewed commit");
      markCommitted();
      await expect(
        tool(harness, ctx, {
          action: "record_outcome",
          receipt: "failed Git inspection",
          shipAction: "commit",
        }),
      ).rejects.toThrow(message);
    }
  });

  it("rejects a retained sparse path when authorization recorded a deletion", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    const markCommitted = mockSingleCommit(harness, "removed-file");
    await advanceToShip(harness, ctx, files);
    await command(harness, ctx, "authorize commit -- create exactly the reviewed deletion");
    markCommitted();
    await expect(
      tool(harness, ctx, {
        action: "record_outcome",
        receipt: "def456 retained sparse path",
        shipAction: "commit",
      }),
    ).rejects.toThrow(/delta does not exactly match/iu);
  });

  it.skipIf(process.platform === "win32")(
    "rejects a committed symlink whose authoritative Git blob differs from authorization",
    async () => {
      expect.hasAssertions();
      const harness = createHarness();
      const files = await workspace();
      const ctx = context(harness, files.cwd);
      const link = "commit-link";
      await symlink("target-file", join(files.cwd, link));
      const markCommitted = mockSingleCommit(harness, link, "120000", "b".repeat(40));
      await advanceToShip(harness, ctx, files);
      await command(harness, ctx, "authorize commit -- create exactly the reviewed symlink");
      markCommitted();
      await expect(
        tool(harness, ctx, {
          action: "record_outcome",
          receipt: "def456 with changed symlink blob",
          shipAction: "commit",
        }),
      ).rejects.toThrow(/delta does not exactly match/iu);
    },
  );

  it("revalidates artifacts and Git identity before agent-owned transitions", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await advanceToBuild(harness, ctx, files);
    for (const evidenceKind of [
      "red",
      "green",
      "focused-verification",
      "regression-verification",
      "worker-handoff",
      "build-simplification",
    ])
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} passed`,
        evidenceKind,
        reference: `build:${evidenceKind}`,
      });
    await tool(harness, ctx, { action: "set_slice", id: "VS-001", sliceStatus: "verified" });

    const validSlice = await readFile(join(files.cwd, files.slice), "utf8");
    await writeFile(join(files.cwd, files.slice), "malformed before transition");
    await expect(
      tool(harness, ctx, { action: "request_transition", reason: "built", to: "review" }),
    ).rejects.toThrow(/frontmatter/iu);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.phase).toBe("build");
    await writeFile(join(files.cwd, files.slice), validSlice);

    harness.exec.mockImplementation((commandName: string, arguments_: readonly string[]) =>
      Promise.resolve({
        code: 0,
        killed: false,
        stderr: "",
        stdout:
          commandName === "git" && arguments_.includes("--abbrev-ref")
            ? "feat/rerouted\n"
            : "transition-head\n",
      }),
    );
    await expect(
      tool(harness, ctx, { action: "request_transition", reason: "built", to: "review" }),
    ).rejects.toThrow(/RED\/GREEN|verification/iu);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot).toMatchObject({
      phase: "build",
      workspace: { branch: "feat/rerouted", head: "transition-head" },
    });
  });

  it("rewinds instead of advancing when an artifact disappears before transition", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await advanceToBuild(harness, ctx, files);
    await rm(join(files.cwd, files.slice));
    await expect(
      tool(harness, ctx, { action: "request_transition", reason: "built", to: "review" }),
    ).rejects.toThrow(/ENOENT|no such file/iu);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot).toMatchObject({
      phase: "plan",
      slices: [{ id: "VS-001", status: "blocked" }],
    });
  });

  it("revalidates retained artifacts and routed Git identity before circuit finish", async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await advanceToBuild(harness, ctx, files);
    for (const evidenceKind of [
      "red",
      "green",
      "focused-verification",
      "regression-verification",
      "worker-handoff",
      "build-simplification",
    ])
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} passed`,
        evidenceKind,
        reference: `build:${evidenceKind}`,
      });
    await tool(harness, ctx, { action: "set_slice", id: "VS-001", sliceStatus: "verified" });
    const validSpec = await readFile(join(files.cwd, files.spec), "utf8");
    await writeFile(join(files.cwd, files.spec), "invalid after build");
    vi.setSystemTime(new Date("2026-01-02T00:00:01Z"));
    await command(harness, ctx, "circuit finish -- retain useful scope");
    expect(harness.notifications.at(-1)).toMatchObject({ level: "error" });
    expect(harness.notifications.at(-1)?.message).toMatch(/frontmatter/iu);
    await writeFile(join(files.cwd, files.spec), validSpec);

    harness.exec.mockImplementation((commandName: string, arguments_: readonly string[]) =>
      Promise.resolve({
        code: 0,
        killed: false,
        stderr: "",
        stdout:
          commandName === "git" && arguments_.includes("--abbrev-ref")
            ? "feat/rerouted\n"
            : "circuit-head\n",
      }),
    );
    await command(harness, ctx, "circuit finish -- retain useful scope");
    expect(harness.notifications.at(-1)?.message).toMatch(
      /RED\/GREEN|worker-handoff|verification/iu,
    );
    const stale = (await tool(harness, ctx, { action: "status" })).details.snapshot;
    expect(stale).toMatchObject({
      phase: "build",
      slices: [{ id: "VS-001", status: "verified" }],
      workspace: { branch: "feat/rerouted", head: "circuit-head" },
    });
    expect(stale?.evidence.some((item) => item.stale === true)).toBe(true);
  });

  it("records bounded blockers and decisions that only the direct command resolves", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "start Decision");
    await tool(harness, ctx, {
      action: "record_issue",
      id: "DEC-001",
      issueType: "decision",
      reason: "Choose compatibility behavior",
    });
    expect(harness.statuses.at(-1)).toBe("flow discover · blocked");
    await expect(
      tool(harness, ctx, {
        action: "record_evidence",
        claim: "should block",
        evidenceKind: "problem",
        reference: "test",
      }),
    ).rejects.toThrow(/blocked/iu);
    await command(harness, ctx, "resolve DEC-001 -- preserve compatibility");
    const resolved = (await tool(harness, ctx, { action: "status" })).details.snapshot;
    expect(resolved).toMatchObject({
      resolvedDecisions: [{ id: "DEC-001", reason: "preserve compatibility" }],
      status: "active",
      unresolved: [],
    });
    expect(typeof resolved?.resolvedDecisions[0]?.timestamp).toBe("number");
  });

  it("revalidates current artifacts at approval and rejects on-disk edits", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "start Revalidate");
    await tool(harness, ctx, {
      action: "record_artifact",
      artifact: "research",
      path: files.research,
    });
    for (const evidenceKind of ["problem", "research"]) {
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: evidenceKind,
        evidenceKind,
        reference: "test",
      });
    }
    await tool(harness, ctx, { action: "request_transition", reason: "ready", to: "pitch" });
    await command(harness, ctx, "approve discover");
    await command(harness, ctx, "appetite 1d");
    await tool(harness, ctx, { action: "record_artifact", artifact: "spec", path: files.spec });
    for (const evidenceKind of ["pitch-simplification", "pitch-review"] as const)
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} complete`,
        evidenceKind,
        reference: files.spec,
      });
    await tool(harness, ctx, { action: "request_transition", reason: "ready", to: "plan" });
    await writeFile(join(files.cwd, files.spec), "edited into an invalid pitch");
    await command(harness, ctx, "approve pitch");
    expect(harness.notifications.at(-1)).toMatchObject({ level: "error" });
    expect(harness.notifications.at(-1)?.message).toMatch(/frontmatter/iu);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.phase).toBe("pitch");
  });

  it("serializes commands behind delayed Git lifecycle refreshes without stale overwrites", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    harness.entries.push({
      customType: STATE_TYPE,
      data: createWorkflow("Serialized", files.cwd, 1),
      type: "custom",
    });
    vi.useFakeTimers();
    const delayedResult = new Promise<{
      code: number;
      killed: boolean;
      stderr: string;
      stdout: string;
    }>((resolve) => {
      setTimeout(() => {
        resolve({ code: 0, killed: false, stderr: "", stdout: "identity-2\n" });
      }, 100);
    });
    harness.exec.mockReturnValue(delayedResult);
    const ctx = context(harness, files.cwd);
    const starting = emit(harness, "session_start", ctx);
    await Promise.resolve();
    const pausing = command(harness, ctx, "pause -- wait after refresh");
    await vi.advanceTimersByTimeAsync(100);
    await Promise.all([starting, pausing]);
    const snapshots = harness.entries
      .map((entry) => entry.data)
      .filter(
        (value): value is WorkflowSnapshot =>
          value !== undefined && "revision" in (value as object),
      );
    expect(snapshots.at(-1)).toMatchObject({
      revision: 2,
      status: "paused",
      workspace: { branch: "identity-2", head: "identity-2" },
    });
    expect(snapshots.map((value) => value.revision)).toEqual([0, 1, 2]);
  });

  it("invalidates delayed lifecycle refreshes at shutdown without late ledger writes", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    harness.entries.push({
      customType: STATE_TYPE,
      data: createWorkflow("Delayed", files.cwd, 1),
      type: "custom",
    });
    vi.useFakeTimers();
    const delayedResult = new Promise<{
      code: number;
      killed: boolean;
      stderr: string;
      stdout: string;
    }>((resolve) => {
      setTimeout(() => {
        resolve({ code: 0, killed: false, stderr: "", stdout: "late\n" });
      }, 100);
    });
    harness.exec.mockReturnValue(delayedResult);
    const ctx = context(harness, files.cwd);
    const starting = emit(harness, "session_start", ctx);
    await Promise.resolve();
    const shuttingDown = emit(harness, "session_shutdown", ctx);
    await vi.advanceTimersByTimeAsync(100);
    await Promise.all([starting, shuttingDown]);
    expect(harness.entries).toHaveLength(1);
    expect(harness.summaries.at(-1)).toBeUndefined();
    expect(harness.statuses.at(-1)).toBeUndefined();
  });

  it("handles every model-authorized action shape and rejects omitted fields", async () => {
    expect.hasAssertions();
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "start Model actions");
    for (const input of [
      { action: "record_artifact" },
      { action: "register_slice", path: files.slice },
      { action: "register_slice", id: "VS-001" },
      { action: "set_slice", id: "VS-001" },
      { action: "record_evidence", evidenceKind: "problem", reference: "x" },
      { action: "request_transition", reason: "x" },
      { action: "record_outcome" },
      { action: "record_issue", id: "DEC-001", issueType: "decision" },
    ])
      await expect(tool(harness, ctx, input)).rejects.toThrow(/required/iu);

    await expect(
      tool(harness, ctx, {
        action: "record_outcome",
        receipt: "Local observation completed",
        shipAction: "commit",
      }),
    ).rejects.toThrow(/ship phase/iu);
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Problem",
      evidenceKind: "problem",
      reference: "test",
      sensitivity: "private",
    });
    const status = await tool(harness, ctx, { action: "status" });
    expect(status.details.snapshot?.outcomes).toEqual([]);
    expect(status.details.snapshot?.evidence[0]).toMatchObject({ sensitivity: "private" });
  });
});

describe("approved checkpoint protocol", () => {
  it("exposes research and slice-scoped evidence fields", () => {
    expect.hasAssertions();
    expect(DevelopmentWorkflowParameters).toBeDefined();
    expect(JSON.stringify(DevelopmentWorkflowParameters)).toContain("sliceId");
    expect(JSON.stringify(DevelopmentWorkflowParameters)).toContain("research");
  });

  it("accepts only the exact package-independent Question result", () => {
    expect.hasAssertions();
    const input = checkpointQuestion("discover");
    const submitted = submittedCheckpoint("discover", "advance", input);
    expect(
      checkpointSelection(
        {
          details: submitted,
          input,
          toolName: "question",
        },
        "discover",
      ),
    ).toBe("advance");
    expect(
      checkpointSelection(
        {
          details: { ...submitted, continuedFrom: "question-continuation" },
          input,
          toolName: "question",
        },
        "discover",
      ),
    ).toBe("advance");
    const questions = (input as { readonly questions: readonly { readonly header: string }[] })
      .questions;
    expect(questions[0]?.header.length).toBeLessThanOrEqual(12);
    for (const malformed of [
      {
        details: submittedCheckpoint("discover", "advance", input),
        input: {},
        toolName: "question",
      },
      {
        details: {
          answers: [
            {
              questionId: "development-workflow-discover-checkpoint",
              selections: [{ label: "Advance", note: "custom", optionId: "advance" }],
            },
          ],
          status: "submitted",
        },
        input,
        toolName: "question",
      },
      { details: { ...submitted, continuedFrom: "" }, input, toolName: "question" },
      { details: { answers: [], status: "cancelled" }, input, toolName: "question" },
      {
        details: submittedCheckpoint("discover", "advance", input),
        input,
        toolName: "other",
      },
    ])
      expect(checkpointSelection(malformed, "discover")).toBeUndefined();
  });
});
