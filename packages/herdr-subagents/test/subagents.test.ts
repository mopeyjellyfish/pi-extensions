import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { createDescriptorStore } from "../src/artifacts.ts";
import {
  asyncDirectoryFromStarted,
  projectionFromStarted,
  projectionsFromRun,
  projectionsFromToolEvent,
  rpcPing,
} from "../src/subagents.ts";

describe("subagent observation", () => {
  it("accepts only exact current-session async starts", () => {
    expect.hasAssertions();
    expect(
      projectionFromStarted(
        {
          agent: "worker",
          asyncDir: "/private/run",
          id: "run-1",
          sessionId: "session-1",
        },
        "session-1",
      ),
    ).toMatchObject({ key: "run-1:0", outputPath: "/private/run/output-0.log" });
    expect(
      projectionFromStarted(
        { asyncDir: "/private/run", id: "run-1", sessionId: "other" },
        "session-1",
      ),
    ).toBeUndefined();
    const workflow = {
      agents: ["worker", "reviewer"],
      asyncDir: "/private/workflow",
      id: "workflow-1",
      sessionId: "session-1",
    };
    expect(projectionFromStarted(workflow, "session-1")).toBeUndefined();
    expect(asyncDirectoryFromStarted(workflow, "session-1")).toBe("/private/workflow");
    expect(
      asyncDirectoryFromStarted(
        { asyncDir: "relative", id: "run", sessionId: "session-1" },
        "session-1",
      ),
    ).toBeUndefined();
  });

  it("turns structured foreground progress into a private transcript feed", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "herdr-foreground-"));
    const store = await createDescriptorStore(directory);
    const projections = await projectionsFromToolEvent(
      {
        partialResult: {
          content: [{ text: "full child output", type: "text" }],
          details: {
            runId: "foreground-1",
            results: [{ agent: "worker", index: 0, runId: "foreground-1" }],
          },
        },
        toolName: "subagent",
      },
      store,
      false,
    );

    expect(projections).toHaveLength(1);
    expect(projections[0]).toMatchObject({ key: "foreground-1:0", state: "running" });
    expect(await readFile(projections[0]?.outputPath ?? "", "utf8")).toBe("full child output");
    await store.close();
  });

  it("handles terminal foreground results and ignores unrelated tools", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "herdr-foreground-terminal-"));
    const store = await createDescriptorStore(directory);
    expect(await projectionsFromToolEvent({ toolName: "read" }, store, false)).toEqual([]);
    const projections = await projectionsFromToolEvent(
      {
        result: {
          content: [{ text: "failed output", type: "text" }, { type: "image" }],
          details: {
            runId: "foreground-2",
            sessionFile: "/sessions/foreground-2.jsonl",
            success: false,
          },
        },
        toolName: "subagent",
      },
      store,
      true,
    );

    expect(projections[0]).toMatchObject({
      key: "foreground-2:0",
      outputPath: "/sessions/foreground-2.jsonl",
      sourceKind: "session-jsonl",
      state: "failed",
    });
    await expect(
      projectionsFromToolEvent(
        {
          result: { content: [], details: { runId: "foreground-3", success: true } },
          toolName: "subagent",
        },
        store,
        true,
      ),
    ).resolves.toEqual([expect.objectContaining({ state: "complete" })]);
    await expect(
      projectionsFromToolEvent({ result: {}, toolName: "subagent" }, store, true),
    ).resolves.toEqual([]);
    await expect(
      projectionsFromToolEvent(
        {
          result: { content: [], details: { agent: "workflow", runId: "workflow" } },
          toolName: "subagent",
        },
        store,
        false,
      ),
    ).resolves.toEqual([]);
    await store.close();
  });

  it("reads authoritative status files and bounds missing files", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "herdr-status-"));
    await writeFile(
      join(directory, "status.json"),
      JSON.stringify({ runId: "run", sessionId: "session", state: "running" }),
      "utf8",
    );

    await expect(projectionsFromRun(directory, "session")).resolves.toHaveLength(1);
    await expect(projectionsFromRun(join(directory, "missing"), "session")).resolves.toEqual([]);
  });

  it("negotiates RPC v1 and bounds a missing owner", async () => {
    expect.hasAssertions();
    const listeners = new Map<string, (value: unknown) => void>();
    const events = {
      emit(channel: string, value: unknown) {
        if (channel !== "subagents:rpc:v1:request") return;
        const request = value as { requestId: string };
        listeners.get(`subagents:rpc:v1:reply:${request.requestId}`)?.({
          data: { capabilities: {} },
          requestId: request.requestId,
          success: true,
          version: 1,
        });
      },
      on(channel: string, listener: (value: unknown) => void) {
        listeners.set(channel, listener);
        return () => listeners.delete(channel);
      },
    };

    await expect(rpcPing(events)).resolves.toMatchObject({ success: true });
    await expect(rpcPing({ emit: vi.fn(), on: vi.fn(() => vi.fn()) }, 1)).resolves.toBeUndefined();
  });
});
