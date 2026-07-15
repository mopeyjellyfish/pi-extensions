import { describe, expect, it, vi } from "vitest";

import piWorktrunkExtension, {
  WorktreeParameters,
  assertActionFields,
  isPersistedState,
  stateFromBranch,
} from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const MAIN_PATH = "/projects/example";
const ACTIVE_PATH = "/projects/example-feature";

interface CommandResult {
  readonly code: number;
  readonly killed: boolean;
  readonly stderr: string;
  readonly stdout: string;
}

interface RegisteredTool {
  readonly executionMode?: string;
  readonly name: string;
  execute(
    id: string,
    input: Record<string, unknown>,
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<{ content: { text: string }[]; details: Record<string, unknown> }>;
}

interface RegisteredCommand {
  handler(arguments_: string, context: ExtensionContext): Promise<void>;
}

interface Harness {
  readonly commands: Map<string, RegisteredCommand>;
  readonly confirmations: boolean[];
  readonly entries: {
    readonly customType: string;
    readonly data: unknown;
    readonly type: "custom";
  }[];
  readonly events: Map<
    string,
    ((event: Record<string, unknown>, ctx: ExtensionContext) => unknown)[]
  >;
  readonly exec: ReturnType<typeof vi.fn>;
  readonly notifications: { readonly level: string; readonly message: string }[];
  readonly publishedRoutes: unknown[];
  readonly statuses: (string | undefined)[];
  readonly tool: RegisteredTool;
}

function worktreeList(
  featureDirty = false,
  featurePath = ACTIVE_PATH,
  featureBranch = "feature/adapter",
  featureHead = "2222222222222222222222222222222222222222",
): string {
  return JSON.stringify({
    schema: 2,
    repo: { default_branch: "main" },
    items: [
      {
        branch: "main",
        head: { sha: "1111111111111111111111111111111111111111" },
        worktree: {
          changes: {
            conflicted: false,
            deleted: false,
            modified: false,
            renamed: false,
            staged: false,
            untracked: false,
          },
          current: true,
          main: true,
          path: MAIN_PATH,
        },
      },
      {
        branch: featureBranch,
        head: { sha: featureHead },
        worktree: {
          changes: {
            conflicted: false,
            deleted: false,
            modified: featureDirty,
            renamed: false,
            staged: false,
            untracked: false,
          },
          current: false,
          main: false,
          path: featurePath,
        },
      },
    ],
  });
}

function detachedWorktreeList(): string {
  const parsed = JSON.parse(worktreeList()) as { items: Record<string, unknown>[] };
  const feature = parsed.items[1];
  if (feature === undefined) throw new Error("Feature worktree fixture is missing.");
  delete feature["branch"];
  delete feature["head"];
  return JSON.stringify(parsed);
}

function context(
  harness: Harness,
  options: {
    readonly abort?: () => void;
    readonly hasUI?: boolean;
    readonly signal?: AbortSignal;
  } = {},
): ExtensionContext {
  return {
    abort: options.abort ?? vi.fn(),
    cwd: MAIN_PATH,
    hasUI: options.hasUI ?? true,
    mode: options.hasUI === false ? "print" : "tui",
    sessionManager: { getBranch: () => harness.entries },
    signal: options.signal,
    ui: {
      confirm: vi.fn(() => Promise.resolve(harness.confirmations.shift() ?? true)),
      notify: (message: string, level: string) => {
        harness.notifications.push({ level, message });
      },
      setStatus: (_key: string, value: string | undefined) => {
        harness.statuses.push(value);
      },
    },
  } as unknown as ExtensionContext;
}

function createHarness(results: readonly (CommandResult | Error)[]): Harness {
  const commands = new Map<string, RegisteredCommand>();
  const confirmations: boolean[] = [];
  const entries: {
    readonly customType: string;
    readonly data: unknown;
    readonly type: "custom";
  }[] = [];
  const events = new Map<
    string,
    ((event: Record<string, unknown>, ctx: ExtensionContext) => unknown)[]
  >();
  const notifications: { readonly level: string; readonly message: string }[] = [];
  const publishedRoutes: unknown[] = [];
  const statuses: (string | undefined)[] = [];
  const queued = [...results];
  const exec = vi.fn(() => {
    const result = queued.shift();
    return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
  });
  let tool: RegisteredTool | undefined;
  const pi = {
    appendEntry(customType: string, data: unknown) {
      entries.push({ customType, data, type: "custom" });
    },
    events: {
      emit(channel: string, data: unknown) {
        if (channel === "mopeyjellyfish:pi-worktrunk:route:v1") publishedRoutes.push(data);
      },
      on: vi.fn(() => vi.fn()),
    },
    exec,
    on(name: string, handler: (event: Record<string, unknown>, ctx: ExtensionContext) => unknown) {
      events.set(name, [...(events.get(name) ?? []), handler]);
    },
    registerCommand(name: string, definition: RegisteredCommand) {
      commands.set(name, definition);
    },
    registerTool(definition: RegisteredTool) {
      tool = definition;
    },
  } as unknown as ExtensionAPI;
  piWorktrunkExtension(pi);
  if (tool === undefined) {
    throw new Error("worktree tool was not registered");
  }
  return {
    commands,
    confirmations,
    entries,
    events,
    exec,
    notifications,
    publishedRoutes,
    statuses,
    tool,
  };
}

async function emit(
  harness: Harness,
  name: string,
  event: Record<string, unknown>,
  ctx: ExtensionContext,
): Promise<unknown[]> {
  return await Promise.all((harness.events.get(name) ?? []).map((handler) => handler(event, ctx)));
}

describe("pi-worktrunk extension", () => {
  it("enforces action-specific fields and restores only the latest valid route state", () => {
    expect.hasAssertions();
    expect(WorktreeParameters).toHaveProperty("additionalProperties", false);
    expect(() => {
      assertActionFields({ action: "status" });
    }).not.toThrow();
    expect(() => {
      assertActionFields({ action: "status", branch: "feature/adapter" });
    }).toThrow("action=status does not accept: branch");
    expect(isPersistedState(null)).toBe(false);
    expect(isPersistedState({ activePath: 1, mainPath: MAIN_PATH, version: 1 })).toBe(false);
    expect(isPersistedState({ activePath: ACTIVE_PATH, mainPath: MAIN_PATH, version: 1 })).toBe(
      true,
    );

    const harness = createHarness([]);
    harness.entries.push(
      {
        customType: "other",
        data: { activePath: "/ignored", mainPath: "/ignored", version: 1 },
        type: "custom",
      },
      {
        customType: "mopeyjellyfish-pi-worktrunk-state",
        data: { activePath: ACTIVE_PATH, mainPath: MAIN_PATH, version: 1 },
        type: "custom",
      },
      {
        customType: "mopeyjellyfish-pi-worktrunk-state",
        data: { mainPath: MAIN_PATH, version: 1 },
        type: "custom",
      },
    );
    expect(stateFromBranch(context(harness))).toEqual({ mainPath: MAIN_PATH, version: 1 });
  });

  it("activates a Worktrunk worktree sequentially and routes Pi's existing tools there", async () => {
    expect.hasAssertions();
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({
          action: "existing",
          branch: "feature/adapter",
          path: ACTIVE_PATH,
        }),
      },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    const ctx = context(harness);

    const result = await harness.tool.execute(
      "activate",
      { action: "activate", identifier: "feature/adapter" },
      undefined,
      undefined,
      ctx,
    );
    expect(harness.tool.executionMode).toBe("sequential");
    expect(result.details).toMatchObject({ action: "activate", activePath: ACTIVE_PATH });
    expect(result.content[0]?.text).toContain("Activated feature/adapter");
    expect(harness.entries).toContainEqual({
      customType: "mopeyjellyfish-pi-worktrunk-state",
      data: { activePath: ACTIVE_PATH, mainPath: MAIN_PATH, version: 1 },
      type: "custom",
    });
    expect(harness.publishedRoutes.at(-1)).toEqual({
      activePath: ACTIVE_PATH,
      branch: "feature/adapter",
      head: "2222222222222222222222222222222222222222",
      version: 1,
    });

    const bash = { input: { command: "pwd" }, toolCallId: "bash", toolName: "bash" };
    await emit(harness, "tool_call", bash, ctx);
    expect(bash.input.command).toBe(`cd -- '${ACTIVE_PATH}' && pwd`);
    for (const toolName of ["read", "write", "edit", "grep", "find", "ls"]) {
      const event = { input: { path: "README.md" }, toolCallId: toolName, toolName };
      await emit(harness, "tool_call", event, ctx);
      expect(event.input.path).toBe(`${ACTIVE_PATH}/README.md`);
    }

    const userBash = (
      await emit(
        harness,
        "user_bash",
        { command: "true", excludeFromContext: false, type: "user_bash" },
        ctx,
      )
    )[0] as
      | {
          readonly operations?: {
            exec(
              command: string,
              cwd: string,
              options: { readonly onData: (data: Buffer) => void },
            ): Promise<{ readonly exitCode: number | null }>;
          };
        }
      | undefined;
    expect(userBash?.operations).toBeDefined();
    if (userBash?.operations === undefined) {
      throw new Error("active user Bash was not routed");
    }
    let userBashFailure: unknown;
    try {
      await userBash.operations.exec("true", MAIN_PATH, { onData: vi.fn() });
    } catch (error) {
      userBashFailure = error;
    }
    expect(userBashFailure).toBeInstanceOf(Error);
  });

  it("publishes path fallbacks for detached or unborn linked worktrees", async () => {
    expect.hasAssertions();
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({ action: "existing", path: ACTIVE_PATH }),
      },
      { code: 0, killed: false, stderr: "", stdout: detachedWorktreeList() },
    ]);

    const result = await harness.tool.execute(
      "activate-detached",
      { action: "activate", identifier: "detached" },
      undefined,
      undefined,
      context(harness),
    );
    expect(result.content[0]?.text).toContain(ACTIVE_PATH);
    expect(harness.statuses.at(-1)).toBe("worktree: example-feature");
    expect(harness.publishedRoutes.at(-1)).toEqual({
      activePath: ACTIVE_PATH,
      branch: undefined,
      head: undefined,
      version: 1,
    });
  });

  it("accepts Worktrunk's documented previous-worktree shortcuts", async () => {
    expect.hasAssertions();
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({ action: "created", branch: "feature/adapter", path: ACTIVE_PATH }),
      },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);

    await expect(
      harness.tool.execute(
        "create",
        { action: "create", base: "-", branch: "feature/adapter" },
        undefined,
        undefined,
        context(harness),
      ),
    ).resolves.toMatchObject({ details: { action: "create", activePath: ACTIVE_PATH } });
    expect(harness.exec).toHaveBeenNthCalledWith(
      2,
      "wt",
      ["switch", "--create", "--base", "-", "--no-cd", "--format=json", "feature/adapter"],
      { cwd: MAIN_PATH, timeout: 300_000 },
    );

    const activate = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({
          action: "existing",
          branch: "feature/adapter",
          path: ACTIVE_PATH,
        }),
      },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    await expect(
      activate.tool.execute(
        "activate",
        { action: "activate", identifier: "-" },
        undefined,
        undefined,
        context(activate),
      ),
    ).resolves.toMatchObject({ details: { action: "activate", activePath: ACTIVE_PATH } });
    expect(activate.exec).toHaveBeenNthCalledWith(
      2,
      "wt",
      ["switch", "--no-cd", "--format=json", "-"],
      { cwd: MAIN_PATH, timeout: 300_000 },
    );
  });

  it("serves status, list, create, deactivate, and confirmed clean removal as one bounded workflow", async () => {
    expect.hasAssertions();
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({ action: "created", branch: "feature/adapter", path: ACTIVE_PATH }),
      },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify([
          {
            branch: "feature/adapter",
            branch_deleted: false,
            kind: "worktree",
            path: ACTIVE_PATH,
          },
        ]),
      },
    ]);
    const ctx = context(harness);

    const inactiveStatus = await harness.tool.execute(
      "status",
      { action: "status" },
      undefined,
      undefined,
      ctx,
    );
    expect(inactiveStatus.content[0]?.text).toContain("No active routed");
    await expect(
      harness.tool.execute("list", { action: "list" }, undefined, undefined, ctx),
    ).resolves.toMatchObject({ details: { action: "list", truncated: false } });
    const created = await harness.tool.execute(
      "create",
      { action: "create", branch: "feature/adapter" },
      undefined,
      undefined,
      ctx,
    );
    expect(created.content[0]?.text).toContain("Created and activated");
    await expect(
      harness.tool.execute("status", { action: "status" }, undefined, undefined, ctx),
    ).resolves.toMatchObject({ details: { action: "status", activePath: ACTIVE_PATH } });
    await expect(
      harness.tool.execute("deactivate", { action: "deactivate" }, undefined, undefined, ctx),
    ).resolves.toMatchObject({ details: { action: "deactivate" } });
    expect(harness.publishedRoutes.at(-1)).toBeUndefined();
    await expect(
      harness.tool.execute(
        "remove",
        {
          action: "remove",
          confirm: true,
          expectedHead: "2222222222222222222222222222222222222222",
          identifier: "feature/adapter",
        },
        undefined,
        undefined,
        ctx,
      ),
    ).resolves.toMatchObject({
      content: [{ text: "Removed feature/adapter. The branch was preserved." }],
    });

    expect(harness.exec).toHaveBeenNthCalledWith(
      4,
      "wt",
      ["switch", "--create", "--no-cd", "--format=json", "feature/adapter"],
      { cwd: MAIN_PATH, timeout: 300_000 },
    );
    expect(harness.exec).toHaveBeenNthCalledWith(
      9,
      "wt",
      [
        "--yes",
        "remove",
        "--no-delete-branch",
        "--no-hooks",
        "--foreground",
        "--format=json",
        "feature/adapter",
      ],
      { cwd: MAIN_PATH, timeout: 300_000 },
    );
  });

  it("bounds Worktrunk-derived list text and structured details", async () => {
    expect.hasAssertions();
    const longBranch = `feature/${"b".repeat(500)}`;
    const longHead = "h".repeat(500);
    const longPath = `/projects/${"p".repeat(500)}`;
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: worktreeList(false, longPath, longBranch, longHead),
      },
    ]);

    const result = await harness.tool.execute(
      "list",
      { action: "list" },
      undefined,
      undefined,
      context(harness),
    );
    expect(result.content[0]?.text).toContain(
      "[Worktree list truncated; use agent Bash to run `wt list --format=json`",
    );
    const worktrees: unknown = result.details["worktrees"];
    if (!Array.isArray(worktrees)) {
      throw new TypeError("worktree list details were absent");
    }
    const feature: unknown = worktrees[1];
    if (typeof feature !== "object" || feature === null) {
      throw new TypeError("linked worktree details were absent");
    }
    const details = feature as Record<string, unknown>;
    for (const field of ["branch", "head", "path"]) {
      expect(details[field]).toEqual(expect.stringContaining("[truncated]"));
    }
  });

  it("rechecks a removal target after confirmation and keeps non-interactive UI state quiet", async () => {
    expect.hasAssertions();
    const changed = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList(false, "/projects/moved") },
    ]);
    await expect(
      changed.tool.execute(
        "remove",
        {
          action: "remove",
          confirm: true,
          expectedHead: "2222222222222222222222222222222222222222",
          identifier: "feature/adapter",
        },
        undefined,
        undefined,
        context(changed),
      ),
    ).rejects.toThrow("changed before removal");
    expect(changed.exec).toHaveBeenCalledTimes(3);

    const nonInteractive = createHarness([]);
    await expect(
      nonInteractive.tool.execute(
        "deactivate",
        { action: "deactivate" },
        undefined,
        undefined,
        context(nonInteractive, { hasUI: false }),
      ),
    ).resolves.toMatchObject({ details: { action: "deactivate" } });
    expect(nonInteractive.statuses).toEqual([]);
  });

  it("refuses to remove a dirty worktree before it can call Worktrunk", async () => {
    expect.hasAssertions();
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList(true) },
    ]);

    await expect(
      harness.tool.execute(
        "remove",
        {
          action: "remove",
          confirm: true,
          expectedHead: "2222222222222222222222222222222222222222",
          identifier: "feature/adapter",
        },
        undefined,
        undefined,
        context(harness),
      ),
    ).rejects.toThrow("clean");
    expect(harness.exec).toHaveBeenCalledTimes(2);
  });

  it("provides informational slash-command actions and reports command failures through the UI", async () => {
    expect.hasAssertions();
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    const command = harness.commands.get("worktree");
    if (command === undefined) {
      throw new Error("worktree command was not registered");
    }
    const ctx = context(harness);

    await command.handler("", ctx);
    await command.handler("list", ctx);
    await command.handler("deactivate", ctx);
    await command.handler("unrecognized", ctx);
    expect(
      harness.notifications.some(
        (notification) => notification.level === "info" && notification.message.includes("Main:"),
      ),
    ).toBe(true);
    expect(harness.notifications).toContainEqual({
      level: "info",
      message: "Worktree routing deactivated.",
    });
    expect(
      harness.notifications.some(
        (notification) =>
          notification.level === "warning" && notification.message.includes("Usage:"),
      ),
    ).toBe(true);

    const failed = createHarness([{ code: 127, killed: false, stderr: "wt missing", stdout: "" }]);
    const failedCommand = failed.commands.get("worktree");
    if (failedCommand === undefined) {
      throw new Error("worktree command was not registered");
    }
    await failedCommand.handler("status", context(failed, { hasUI: false }));
    expect(
      failed.notifications.some(
        (notification) =>
          notification.level === "error" &&
          notification.message.includes("Worktrunk (`wt`) is required"),
      ),
    ).toBe(true);
  });

  it("restores only a same-repository linked route and clears its UI status on shutdown", async () => {
    expect.hasAssertions();
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    harness.entries.push({
      customType: "mopeyjellyfish-pi-worktrunk-state",
      data: { activePath: ACTIVE_PATH, mainPath: MAIN_PATH, version: 1 },
      type: "custom",
    });
    const ctx = context(harness);

    await emit(harness, "session_start", {}, ctx);
    await emit(harness, "session_tree", {}, ctx);
    expect(harness.statuses).toContain("worktree: feature/adapter");
    expect(harness.publishedRoutes.at(-1)).toEqual({
      activePath: ACTIVE_PATH,
      branch: "feature/adapter",
      head: "2222222222222222222222222222222222222222",
      version: 1,
    });
    const bash = { input: { command: "pwd" }, toolCallId: "bash", toolName: "bash" };
    await emit(harness, "tool_call", bash, ctx);
    expect(bash.input.command).toBe(`cd -- '${ACTIVE_PATH}' && pwd`);
    await emit(harness, "session_shutdown", {}, ctx);
    expect(harness.statuses.at(-1)).toBeUndefined();
    expect(harness.publishedRoutes.at(-1)).toBeUndefined();

    const stale = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    stale.entries.push({
      customType: "mopeyjellyfish-pi-worktrunk-state",
      data: { activePath: "/projects/elsewhere", mainPath: MAIN_PATH, version: 1 },
      type: "custom",
    });
    const staleContext = context(stale);
    await emit(stale, "session_start", {}, staleContext);
    const staleBash = { input: { command: "pwd" }, toolCallId: "bash", toolName: "bash" };
    await emit(stale, "tool_call", staleBash, staleContext);
    expect(staleBash.input.command).toBe("pwd");

    const empty = createHarness([]);
    empty.entries.push({
      customType: "mopeyjellyfish-pi-worktrunk-state",
      data: { mainPath: MAIN_PATH, version: 1 },
      type: "custom",
    });
    await emit(empty, "session_start", {}, context(empty));
    expect(empty.exec).not.toHaveBeenCalled();

    const unavailable = createHarness([{ code: 127, killed: false, stderr: "", stdout: "" }]);
    unavailable.entries.push({
      customType: "mopeyjellyfish-pi-worktrunk-state",
      data: { activePath: ACTIVE_PATH, mainPath: MAIN_PATH, version: 1 },
      type: "custom",
    });
    await emit(unavailable, "session_start", {}, context(unavailable));
    expect(unavailable.statuses.at(-1)).toBeUndefined();
  });

  it("fails closed for non-interactive, unconfirmed, mismatched, declined, and option-like mutations", async () => {
    expect.hasAssertions();
    const removeInput = {
      action: "remove",
      confirm: true,
      expectedHead: "2222222222222222222222222222222222222222",
      identifier: "feature/adapter",
    };
    const nonInteractive = createHarness([]);
    await expect(
      nonInteractive.tool.execute(
        "remove",
        removeInput,
        undefined,
        undefined,
        context(nonInteractive, { hasUI: false }),
      ),
    ).rejects.toThrow("interactive");
    await expect(
      nonInteractive.tool.execute(
        "remove",
        { action: "remove" },
        undefined,
        undefined,
        context(nonInteractive),
      ),
    ).rejects.toThrow("confirm:true");
    expect(nonInteractive.exec).not.toHaveBeenCalled();

    const mismatch = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    await expect(
      mismatch.tool.execute(
        "remove",
        { ...removeInput, expectedHead: "3333333333333333333333333333333333333333" },
        undefined,
        undefined,
        context(mismatch),
      ),
    ).rejects.toThrow("expectedHead");
    expect(mismatch.exec).toHaveBeenCalledTimes(2);

    const declined = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    declined.confirmations.push(false);
    await expect(
      declined.tool.execute("remove", removeInput, undefined, undefined, context(declined)),
    ).rejects.toThrow("cancelled by the user");
    expect(declined.exec).toHaveBeenCalledTimes(2);

    const missing = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    await expect(
      missing.tool.execute(
        "remove",
        { ...removeInput, identifier: "missing" },
        undefined,
        undefined,
        context(missing),
      ),
    ).rejects.toThrow("exact branch identifier");

    const invalid = createHarness([]);
    const abort = vi.fn();
    await expect(
      invalid.tool.execute(
        "activate",
        { action: "activate", identifier: "--unsafe" },
        undefined,
        undefined,
        context(invalid, { abort }),
      ),
    ).rejects.toThrow("option prefix");
    await expect(
      invalid.tool.execute(
        "create",
        { action: "create", branch: "feature\u{1}unsafe" },
        undefined,
        undefined,
        context(invalid, { abort }),
      ),
    ).rejects.toThrow("control characters");
    await expect(
      invalid.tool.execute(
        "create",
        { action: "create", base: "--unsafe", branch: "feature/adapter" },
        undefined,
        undefined,
        context(invalid, { abort }),
      ),
    ).rejects.toThrow("base cannot begin with an option prefix");
    await expect(
      invalid.tool.execute(
        "create",
        { action: "create", base: "-x", branch: "feature/adapter" },
        undefined,
        undefined,
        context(invalid, { abort }),
      ),
    ).rejects.toThrow("base cannot begin with an option prefix");
    await expect(
      invalid.tool.execute(
        "create",
        { action: "create" },
        undefined,
        undefined,
        context(invalid, { abort }),
      ),
    ).rejects.toThrow("branch is required");
    await expect(
      invalid.tool.execute(
        "create",
        { action: "create", base: "", branch: "feature/adapter" },
        undefined,
        undefined,
        context(invalid, { abort }),
      ),
    ).rejects.toThrow("base cannot be empty");
    await expect(
      invalid.tool.execute(
        "create",
        { action: "create", base: "feature\u{1}unsafe", branch: "feature/adapter" },
        undefined,
        undefined,
        context(invalid, { abort }),
      ),
    ).rejects.toThrow("base cannot contain control characters");
    expect(abort).toHaveBeenCalledTimes(7);
    expect(invalid.exec).not.toHaveBeenCalled();
  });

  it("aborts a failed activation and leaves Pi's tools at the session checkout", async () => {
    expect.hasAssertions();
    const harness = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      { code: 1, killed: false, stderr: "branch is unavailable", stdout: "" },
    ]);
    const abort = vi.fn();
    const ctx = { ...context(harness), abort } as ExtensionContext;

    await expect(
      harness.tool.execute(
        "activate",
        { action: "activate", identifier: "feature/adapter" },
        undefined,
        undefined,
        ctx,
      ),
    ).rejects.toThrow("branch is unavailable");
    expect(abort).toHaveBeenCalledOnce();
    expect(harness.entries).toContainEqual({
      customType: "mopeyjellyfish-pi-worktrunk-state",
      data: { mainPath: MAIN_PATH, version: 1 },
      type: "custom",
    });

    const bash = { input: { command: "pwd" }, toolCallId: "bash", toolName: "bash" };
    await emit(harness, "tool_call", bash, ctx);
    expect(bash.input.command).toBe("pwd");
  });

  it("clears stale routes, refuses active removal, aborts invalid creation, and leaves inactive user Bash alone", async () => {
    expect.hasAssertions();
    const stale = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({
          action: "existing",
          branch: "feature/adapter",
          path: ACTIVE_PATH,
        }),
      },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList(false, "/projects/moved") },
    ]);
    const staleContext = context(stale);
    await stale.tool.execute(
      "activate",
      { action: "activate", identifier: "feature/adapter" },
      undefined,
      undefined,
      staleContext,
    );
    await expect(
      stale.tool.execute("status", { action: "status" }, undefined, undefined, staleContext),
    ).resolves.toMatchObject({ details: { action: "status" } });

    const active = createHarness([
      { code: 0, killed: false, stderr: "", stdout: "wt 0.67.0\n" },
      {
        code: 0,
        killed: false,
        stderr: "",
        stdout: JSON.stringify({
          action: "existing",
          branch: "feature/adapter",
          path: ACTIVE_PATH,
        }),
      },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
      { code: 0, killed: false, stderr: "", stdout: worktreeList() },
    ]);
    const activeContext = context(active);
    await active.tool.execute(
      "activate",
      { action: "activate", identifier: "feature/adapter" },
      undefined,
      undefined,
      activeContext,
    );
    await expect(
      active.tool.execute(
        "remove",
        {
          action: "remove",
          confirm: true,
          expectedHead: "2222222222222222222222222222222222222222",
          identifier: "feature/adapter",
        },
        undefined,
        undefined,
        activeContext,
      ),
    ).rejects.toThrow("Deactivate the routed");

    const invalid = createHarness([]);
    const abort = vi.fn();
    await expect(
      invalid.tool.execute(
        "create",
        { action: "create", branch: "--unsafe" },
        undefined,
        undefined,
        context(invalid, { abort }),
      ),
    ).rejects.toThrow("option prefix");
    expect(abort).toHaveBeenCalledOnce();

    const inactive = createHarness([]);
    await expect(
      emit(
        inactive,
        "user_bash",
        { command: "pwd", excludeFromContext: false, type: "user_bash" },
        context(inactive),
      ),
    ).resolves.toEqual([undefined]);
  });
});
