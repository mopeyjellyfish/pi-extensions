import { watch, type FSWatcher } from "node:fs";

import { createDescriptorStore, type DescriptorStore } from "./artifacts.ts";
import { compatibility } from "./compatibility.ts";
import { createControlBridge, type ControlBridge } from "./control-bridge.ts";
import { HerdrCli } from "./herdr.ts";
import {
  asyncDirectoryFromStarted,
  projectionFromStarted,
  projectionsFromRun,
  projectionsFromToolEvent,
  rpcPing,
} from "./subagents.ts";

import type { ChildProjection, ViewerDescriptor } from "./types.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface RetainedRuntime {
  readonly descriptors: DescriptorStore;
  readonly mainPaneId: string;
  readonly sessionId: string;
  readonly supervisor: HerdrSubagentSupervisor;
}

const runtimeGlobal = globalThis as typeof globalThis & {
  __piHerdrSubagentsReloadV1?: RetainedRuntime;
};

export type { ChildProjection } from "./types.ts";

export interface OpenPaneInput {
  readonly descriptorPath: string;
  readonly direction: "down" | "right";
  readonly focus: false;
  readonly projection: ChildProjection;
  readonly targetPaneId: string;
}

export interface HerdrAdapter {
  close(paneId: string): Promise<void>;
  exists(paneId: string): Promise<boolean>;
  open(input: OpenPaneInput): Promise<string>;
}

interface Binding {
  readonly descriptorPath: string;
  readonly paneId: string;
  projection: ChildProjection;
}

const ACTIVE_STATES = new Set(["active", "pending", "queued", "running", "starting"]);

function isActiveState(state: string): boolean {
  return ACTIVE_STATES.has(state.toLowerCase());
}

type ControlProvider = (projection: ChildProjection) => NonNullable<ViewerDescriptor["control"]>;

function bindControl(
  bridge: ControlBridge,
  projection: ChildProjection,
): NonNullable<ViewerDescriptor["control"]> {
  return bridge.bind({
    ...(projection.asyncControl === true ? { asyncDir: projection.asyncDir } : {}),
    index: projection.index,
    runId: projection.runId,
  });
}

export interface SupervisorOptions {
  readonly control?: ControlProvider;
  readonly descriptors: DescriptorStore;
  readonly herdr: HerdrAdapter;
  readonly mainPaneId: string;
  readonly sessionId: string;
}

export class HerdrSubagentSupervisor {
  #control: ControlProvider | undefined;
  readonly #bindings = new Map<string, Binding>();
  #closed = false;
  readonly #descriptors: DescriptorStore;
  readonly #dismissed = new Set<string>();
  #herdr: HerdrAdapter;
  readonly #mainPaneId: string;
  readonly #sessionId: string;
  #pending: Promise<void> = Promise.resolve();

  constructor(options: SupervisorOptions) {
    this.#control = options.control;
    this.#descriptors = options.descriptors;
    this.#herdr = options.herdr;
    this.#mainPaneId = options.mainPaneId;
    this.#sessionId = options.sessionId;
  }

  get sessionId(): string {
    return this.#sessionId;
  }

  async rebind(herdr: HerdrAdapter, control: ControlProvider): Promise<void> {
    await this.#pending;
    this.#herdr = herdr;
    this.#control = control;
    for (const binding of this.#bindings.values()) {
      await this.#descriptors.update(binding.descriptorPath, {
        control: control(binding.projection),
      });
    }
  }

  observe(projection: ChildProjection): Promise<void> {
    if (this.#closed) return Promise.resolve();
    const next = this.#observeAfter(this.#pending, projection);
    this.#pending = this.#ignoreFailure(next);
    return next;
  }

  async #observeAfter(previous: Promise<void>, projection: ChildProjection): Promise<void> {
    await previous;
    await this.#observe(projection);
  }

  async #ignoreFailure(operation: Promise<void>): Promise<void> {
    try {
      await operation;
    } catch {
      // The caller receives the original failure. Later observations can continue.
    }
  }

  async #observe(projection: ChildProjection): Promise<void> {
    const dismissed = this.#dismissed.has(projection.key);
    const current = this.#bindings.get(projection.key);
    if (current !== undefined) {
      if (!isActiveState(current.projection.state) && isActiveState(projection.state)) return;
      current.projection = projection;
      await this.#descriptors.update(current.descriptorPath, {
        agent: projection.agent,
        outputPath: projection.outputPath,
        ...(projection.sourceKind === undefined ? {} : { sourceKind: projection.sourceKind }),
        state: projection.state,
      });
      if (dismissed) return;
      if (!(await this.#herdr.exists(current.paneId))) this.#dismissed.add(projection.key);
      return;
    }

    const previous = [...this.#bindings.values()].at(-1);
    const descriptorPath = await this.#descriptors.write({
      ...projection,
      ...(this.#control === undefined ? {} : { control: this.#control(projection) }),
      ownerPid: process.pid,
      version: 1,
    });
    const paneId = await this.#herdr.open({
      descriptorPath,
      direction: previous === undefined ? "right" : "down",
      focus: false,
      projection,
      targetPaneId: previous?.paneId ?? this.#mainPaneId,
    });
    this.#bindings.set(projection.key, { descriptorPath, paneId, projection });
  }

  async shutdown(options: { readonly closePanes: boolean }): Promise<void> {
    this.#closed = true;
    await this.#pending;
    if (options.closePanes) {
      for (const binding of this.#bindings.values()) {
        if (await this.#herdr.exists(binding.paneId)) await this.#herdr.close(binding.paneId);
      }
    }
    this.#bindings.clear();
    await this.#descriptors.close();
  }
}

async function disposeRetained(retained: RetainedRuntime | undefined): Promise<void> {
  if (retained === undefined) return;
  await retained.supervisor.shutdown({ closePanes: true });
}

async function runtimeConfiguration(
  pi: ExtensionAPI,
  context: ExtensionContext,
): Promise<{ readonly mainPaneId: string } | undefined> {
  const mainPaneId = process.env["HERDR_PANE_ID"];
  if (context.mode !== "tui" || process.env["HERDR_ENV"] !== "1" || mainPaneId === undefined) {
    return undefined;
  }
  const [versionResult, ping] = await Promise.all([
    pi.exec("herdr", ["--version"], { timeout: 2000 }),
    rpcPing(pi.events),
  ]);
  const supported = compatibility({
    herdr: versionResult.code === 0 ? versionResult.stdout.trim() : undefined,
    rpc: ping?.success === true ? 1 : undefined,
  });
  return supported.enabled ? { mainPaneId } : undefined;
}

export function registerHerdrSubagentSupervisor(pi: ExtensionAPI): void {
  let active: HerdrSubagentSupervisor | undefined;
  let controlBridge: ControlBridge | undefined;
  let descriptorStore: DescriptorStore | undefined;
  let generation = 0;
  let notify: ((message: string) => void) | undefined;
  const watchers = new Map<string, FSWatcher>();
  const reconcileTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const settleTimers = new Set<ReturnType<typeof setTimeout>>();

  const clearWatchers = (): void => {
    for (const watcher of watchers.values()) watcher.close();
    watchers.clear();
    for (const timer of reconcileTimers.values()) clearTimeout(timer);
    reconcileTimers.clear();
    for (const timer of settleTimers) clearTimeout(timer);
    settleTimers.clear();
  };

  const report = (operation: Promise<unknown>): void => {
    void operation.catch((error: unknown) => {
      notify?.(
        `Herdr subagent pane: ${error instanceof Error ? error.message : "unexpected failure"}`,
      );
    });
  };

  const reconcile = async (asyncDir: string): Promise<void> => {
    const current = active;
    if (current === undefined) return;
    for (const projection of await projectionsFromRun(asyncDir, current.sessionId)) {
      await current.observe(projection);
    }
  };

  const scheduleReconcile = (asyncDir: string): void => {
    const pending = reconcileTimers.get(asyncDir);
    if (pending !== undefined) clearTimeout(pending);
    const timer = setTimeout(() => {
      reconcileTimers.delete(asyncDir);
      report(reconcile(asyncDir));
    }, 75);
    timer.unref();
    reconcileTimers.set(asyncDir, timer);
  };

  const observeStarted = async (value: unknown): Promise<void> => {
    const current = active;
    if (current === undefined) return;
    const asyncDir = asyncDirectoryFromStarted(value, current.sessionId);
    if (asyncDir === undefined) return;
    const projection = projectionFromStarted(value, current.sessionId);
    if (projection !== undefined) await current.observe(projection);
    if (!watchers.has(asyncDir)) {
      try {
        watchers.set(
          asyncDir,
          watch(asyncDir, () => {
            scheduleReconcile(asyncDir);
          }),
        );
      } catch {
        // The first lifecycle event can arrive just before the artifact directory.
      }
    }
    await reconcile(asyncDir);
  };

  const started = pi.events.on("subagent:async-started", (value) => {
    report(observeStarted(value));
  });
  const completed = pi.events.on("subagent:async-complete", (value) => {
    report(observeStarted(value));
  });

  const observedToolResults = new Set<string>();

  const observeTool = async (value: unknown, terminal: boolean): Promise<number> => {
    const current = active;
    const descriptors = descriptorStore;
    if (current === undefined || descriptors === undefined) return 0;
    const projections = await projectionsFromToolEvent(value, descriptors, terminal);
    for (const projection of projections) {
      await current.observe(projection);
    }
    return projections.length;
  };

  const observeBranchToolResults = async (context: ExtensionContext): Promise<void> => {
    for (const entry of context.sessionManager.getBranch()) {
      if (
        entry.type !== "message" ||
        entry.message.role !== "toolResult" ||
        entry.message.toolName !== "subagent" ||
        observedToolResults.has(entry.id)
      ) {
        continue;
      }
      const observed = await observeTool(
        { result: entry.message, toolName: entry.message.toolName },
        true,
      );
      if (observed > 0) observedToolResults.add(entry.id);
    }
  };

  pi.on("tool_execution_update", (event) => {
    report(observeTool(event, false));
  });
  pi.on("tool_execution_end", (event) => {
    report(observeTool(event, true));
  });
  pi.on("tool_result", (event) => {
    report(
      observeTool(
        {
          result: { content: event.content, details: event.details },
          toolName: event.toolName,
        },
        true,
      ),
    );
  });
  pi.on("message_end", (event) => {
    if (event.message.role !== "toolResult" || event.message.toolName !== "subagent") return;
    report(
      observeTool(
        {
          result: { content: event.message.content, details: event.message.details as unknown },
          toolName: event.message.toolName,
        },
        true,
      ),
    );
  });
  pi.on("turn_end", (event, context) => {
    for (const result of event.toolResults) {
      report(observeTool({ result, toolName: result.toolName }, true));
    }
    report(observeBranchToolResults(context));
  });
  pi.on("agent_settled", (_event, context) => {
    report(observeBranchToolResults(context));
    for (const delay of [250, 1000]) {
      const timer = setTimeout(() => {
        settleTimers.delete(timer);
        report(observeBranchToolResults(context));
      }, delay);
      timer.unref();
      settleTimers.add(timer);
    }
  });

  pi.on("session_start", async (_event, context: ExtensionContext) => {
    generation += 1;
    const currentGeneration = generation;
    clearWatchers();
    observedToolResults.clear();
    notify = context.hasUI
      ? (message) => {
          context.ui.notify(message, "warning");
        }
      : undefined;
    const retained = runtimeGlobal.__piHerdrSubagentsReloadV1;
    if (retained !== undefined) delete runtimeGlobal.__piHerdrSubagentsReloadV1;
    const runtime = await runtimeConfiguration(pi, context);
    if (runtime === undefined) {
      await disposeRetained(retained);
      return;
    }
    if (currentGeneration !== generation) {
      await disposeRetained(retained);
      return;
    }
    const { mainPaneId } = runtime;
    const sessionId =
      context.sessionManager.getSessionFile() ?? context.sessionManager.getSessionId();
    if (!sessionId) {
      await disposeRetained(retained);
      return;
    }
    if (retained?.sessionId === sessionId && retained.mainPaneId === mainPaneId) {
      const bridge = await createControlBridge(pi.events);
      if (currentGeneration !== generation) {
        await Promise.all([bridge.close(), disposeRetained(retained)]);
        return;
      }
      try {
        await retained.supervisor.rebind(new HerdrCli(pi, context.cwd), (projection) =>
          bindControl(bridge, projection),
        );
      } catch (error) {
        await Promise.allSettled([bridge.close(), disposeRetained(retained)]);
        throw error;
      }
      if (currentGeneration !== generation) {
        await Promise.all([bridge.close(), disposeRetained(retained)]);
        return;
      }
      active = retained.supervisor;
      descriptorStore = retained.descriptors;
      controlBridge = bridge;
      return;
    }
    await disposeRetained(retained);
    const descriptors = await createDescriptorStore();
    const bridge = await createControlBridge(pi.events);
    if (currentGeneration !== generation) {
      await Promise.all([descriptors.close(), bridge.close()]);
      return;
    }
    descriptorStore = descriptors;
    controlBridge = bridge;
    active = new HerdrSubagentSupervisor({
      control: (projection) => bindControl(bridge, projection),
      descriptors,
      herdr: new HerdrCli(pi, context.cwd),
      mainPaneId,
      sessionId,
    });
  });

  pi.on("session_shutdown", async (event) => {
    generation += 1;
    clearWatchers();
    const current = active;
    const bridge = controlBridge;
    const descriptors = descriptorStore;
    active = undefined;
    controlBridge = undefined;
    descriptorStore = undefined;
    notify = undefined;
    if (event.reason === "reload" && current !== undefined && descriptors !== undefined) {
      await bridge?.close();
      runtimeGlobal.__piHerdrSubagentsReloadV1 = {
        descriptors,
        mainPaneId: process.env["HERDR_PANE_ID"] ?? "",
        sessionId: current.sessionId,
        supervisor: current,
      };
    } else {
      delete runtimeGlobal.__piHerdrSubagentsReloadV1;
      await current?.shutdown({ closePanes: true });
      await bridge?.close();
    }
    started();
    completed();
  });
}
