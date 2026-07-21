import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

import developmentWorkflowExtension, {
  DevelopmentWorkflowParameters,
  STATE_TYPE,
  SUMMARY_EVENT,
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
  const exec: ExecMock = vi.fn((command: string, arguments_: readonly string[]) =>
    Promise.resolve({
      code: 0,
      killed: false,
      stderr: "",
      stdout:
        command === "git" && arguments_.includes("--abbrev-ref") ? "feat/workflow\n" : "abc123\n",
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

async function emit(harness: Harness, name: string, ctx: ExtensionContext): Promise<void> {
  await Promise.all((harness.events.get(name) ?? []).map((handler) => handler({}, ctx)));
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

async function workspace(): Promise<{
  readonly cwd: string;
  readonly plan: string;
  readonly slice: string;
  readonly spec: string;
}> {
  const cwd = await mkdtemp(join(tmpdir(), "dev-workflow-test-"));
  roots.push(cwd);
  await mkdir(join(cwd, "specs", "change", "slices"), { recursive: true });
  const spec = "specs/change/spec.md";
  const plan = "specs/change/plan.md";
  const slicePath = "specs/change/slices/VS-001.md";
  await writeFile(
    join(cwd, spec),
    `---\nschema: dev-workflow/pitch-v1\nid: PITCH-001\n---\n# Problem\nConcrete failing workflow.\n# Appetite\nOne day with variable scope.\n# Solution\nA bounded branch ledger.\n### Acceptance Signals\nState restores after branching.\n# Rabbit Holes\nAvoid file watchers.\n# No-Gos\nNo remote mutations.\n`,
  );
  await writeFile(
    join(cwd, plan),
    "# Plan\n\nPitch: [PITCH-001](./spec.md)\n\n## Appetite\n\nOne day with variable scope.\n\n## No-Gos\n\nNo remote mutation.\n\n## Vertical Slices\n\nThe first integrated slice is [VS-001](./slices/VS-001.md).\n\n## Dependencies and Sequencing\n\nVS-001 has no dependencies and is first.\n",
  );
  await writeFile(
    join(cwd, slicePath),
    `---\nschema: dev-workflow/vertical-slice-v1\nid: VS-001\ndepends_on: []\nrequirements: [REQ-001]\nrisk: medium\n---\n# Observable Outcome\nStart and restore a workflow.\n# Pitch Fit\nProves the ledger.\n# Boundaries Crossed\nCommand, reducer, and session entry.\n# RED\nPublic test fails.\n# GREEN\nMinimum path passes.\n# Verification\nFocused test and smoke.\n# Done When\nUser sees restored state.\n`,
  );
  return { cwd, plan, slice: slicePath, spec };
}

async function advanceToBuild(
  harness: Harness,
  ctx: ExtensionContext,
  files: Awaited<ReturnType<typeof workspace>>,
): Promise<void> {
  await command(harness, ctx, "start Integrated workflow");
  for (const [evidenceKind, claim] of [
    ["problem", "Problem reproduced"],
    ["research-not-needed", "Repository truth was sufficient"],
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
  await command(harness, ctx, "approve discover");
  await command(harness, ctx, "backstop 1d");
  await tool(harness, ctx, { action: "record_artifact", artifact: "spec", path: files.spec });
  await tool(harness, ctx, {
    action: "record_evidence",
    claim: "Pitch is rough, solved, and bounded",
    evidenceKind: "pitch-review",
    reference: files.spec,
  });
  await tool(harness, ctx, { action: "request_transition", reason: "shaped", to: "plan" });
  await command(harness, ctx, "approve pitch");
  await tool(harness, ctx, { action: "record_artifact", artifact: "plan", path: files.plan });
  await tool(harness, ctx, { action: "register_slice", id: "VS-001", path: files.slice });
  for (const evidenceKind of ["validation-contract", "workspace-decision"] as const) {
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: `${evidenceKind} recorded`,
      evidenceKind,
      reference: files.plan,
    });
  }
  await tool(harness, ctx, { action: "request_transition", reason: "planned", to: "build" });
  await command(harness, ctx, "approve plan");
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
      action: "record_evidence",
      claim: "Problem reproduced",
      evidenceKind: "problem",
      reference: "test:problem",
      sensitivity: "public",
    });
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Repository truth was sufficient",
      evidenceKind: "research-not-needed",
      reference: "decision:local",
      sensitivity: "public",
    });
    await tool(harness, ctx, {
      action: "request_transition",
      reason: "problem understood",
      to: "pitch",
    });
    await command(harness, ctx, "approve discover");
    await command(harness, ctx, "backstop 1d");
    await tool(harness, ctx, { action: "record_artifact", artifact: "spec", path: files.spec });
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Pitch is rough, solved, and bounded",
      evidenceKind: "pitch-review",
      reference: files.spec,
      sensitivity: "public",
    });
    await tool(harness, ctx, {
      action: "request_transition",
      reason: "rough solved bounded",
      to: "plan",
    });
    await command(harness, ctx, "approve pitch");
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
      action: "request_transition",
      reason: "walking skeleton ready",
      to: "build",
    });
    await command(harness, ctx, "approve plan");
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
    harness.exec
      .mockResolvedValueOnce({ code: 1, killed: false, stderr: "detached", stdout: "" })
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: "head-only\n" })
      .mockResolvedValueOnce({ code: 1, killed: false, stderr: "detached", stdout: "" })
      .mockResolvedValueOnce({ code: 0, killed: false, stderr: "", stdout: "head-only\n" });
    const ctx = context(harness, files.cwd);
    await command(harness, ctx, "start Detached");
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "Bound observation",
      evidenceKind: "problem",
      reference: "test",
    });
    const state = (await tool(harness, ctx, { action: "status" })).details.snapshot;
    expect(state?.workspace).toEqual({ head: "head-only", path: files.cwd });
    expect(state?.evidence[0]).toMatchObject({ head: "head-only", sensitivity: "private" });
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
    await command(harness, ctx, `adopt pitch ${routed.spec} -- reviewed existing work`);
    const adopted = (await tool(harness, ctx, { action: "status" })).details.snapshot;
    expect(adopted).toMatchObject({
      phase: "pitch",
      workspace: { branch: "feat/workflow", head: "abc123", path: routed.cwd },
    });
    await command(harness, ctx, `adopt pitch ${routed.spec} -- duplicate`);
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

  it("runs the full public chain through direct-human completion and permits a new start", async () => {
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
    await command(harness, ctx, "approve build");
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
    await command(harness, ctx, "approve review");
    await tool(harness, ctx, {
      action: "record_outcome",
      outcome: "PR merged after authorization",
    });

    const validSlice = await readFile(join(files.cwd, files.slice), "utf8");
    await writeFile(join(files.cwd, files.slice), "invalidated after review");
    await command(harness, ctx, "complete -- accepted shipped outcome");
    expect(harness.notifications.at(-1)).toMatchObject({ level: "error" });
    expect(harness.notifications.at(-1)?.message).toMatch(/frontmatter/iu);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.phase).toBe("ship");
    await writeFile(join(files.cwd, files.slice), validSlice);

    harness.exec.mockImplementation((commandName: string, arguments_: readonly string[]) =>
      Promise.resolve({
        code: 0,
        killed: false,
        stderr: "",
        stdout:
          commandName === "git" && arguments_.includes("--abbrev-ref")
            ? "feat/workflow\n"
            : "drifted-head\n",
      }),
    );
    await command(harness, ctx, "complete -- accepted shipped outcome");
    expect(harness.notifications.at(-1)).toMatchObject({ level: "error" });
    expect(harness.notifications.at(-1)?.message).toMatch(/evidence/iu);
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot).toMatchObject({
      phase: "ship",
      workspace: { head: "drifted-head" },
    });

    for (const evidenceKind of [
      "problem",
      "research-not-needed",
      "pitch-review",
      "validation-contract",
      "workspace-decision",
      "red",
      "green",
      "focused-verification",
      "regression-verification",
      "review-intent",
      "review-correctness",
      "review-maintainability",
      "review-risk-operations",
      "final-verification",
    ]) {
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} refreshed after drift`,
        evidenceKind,
        reference: `refresh:${evidenceKind}`,
      });
    }
    await command(harness, ctx, "complete -- accepted shipped outcome");
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.status).toBe(
      "completed",
    );
    expect(harness.statuses.at(-1)).toBe("flow ship · completed");
    await command(harness, ctx, "start Follow-up workflow");
    expect((await tool(harness, ctx, { action: "status" })).details.snapshot?.title).toBe(
      "Follow-up workflow",
    );
  });

  it("revalidates retained artifacts and routed Git identity before circuit finish", async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const harness = createHarness();
    const files = await workspace();
    const ctx = context(harness, files.cwd);
    await advanceToBuild(harness, ctx, files);
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
    expect(harness.notifications.at(-1)?.message).toMatch(/RED\/GREEN/iu);
    for (const evidenceKind of ["red", "green", "focused-verification", "regression-verification"])
      await tool(harness, ctx, {
        action: "record_evidence",
        claim: `${evidenceKind} refreshed after reroute`,
        evidenceKind,
        reference: `reroute:${evidenceKind}`,
      });
    await command(harness, ctx, "circuit finish -- retain useful scope");
    const finished = (await tool(harness, ctx, { action: "status" })).details.snapshot;
    expect(finished).toMatchObject({
      phase: "review",
      slices: [{ id: "VS-001", status: "verified" }],
      workspace: { branch: "feat/rerouted", head: "circuit-head" },
    });
    expect(finished?.evidence.some((item) => item.stale === true)).toBe(true);
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
    for (const evidenceKind of ["problem", "research-not-needed"]) {
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
    await tool(harness, ctx, {
      action: "record_evidence",
      claim: "reviewed",
      evidenceKind: "pitch-review",
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
      tool(harness, ctx, { action: "record_outcome", outcome: "Local observation completed" }),
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
