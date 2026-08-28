import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createDescriptorStore, projectionsFromStatus } from "../src/artifacts.ts";

describe("subagent artifacts", () => {
  it("projects direct, workflow, and nested leaves with exact identities", () => {
    expect.hasAssertions();
    const root = "/tmp/run-safe";
    const children = projectionsFromStatus(
      {
        runId: "workflow-1",
        sessionId: "session-1",
        state: "running",
        steps: [
          {
            agent: "worker",
            index: 0,
            runId: "child-0",
            sessionFile: "/sessions/child-0.jsonl",
            status: "running",
          },
          {
            agent: "reviewer",
            index: 1,
            runId: "child-1",
            status: "complete",
            children: [{ agent: "utility", index: 0, runId: "nested-0", status: "running" }],
          },
        ],
      },
      root,
      "session-1",
    );

    expect(
      children.map(({ agent, index, outputPath, runId, sourceKind }) => ({
        agent,
        index,
        outputPath,
        runId,
        sourceKind,
      })),
    ).toEqual([
      {
        agent: "worker",
        index: 0,
        outputPath: "/sessions/child-0.jsonl",
        runId: "child-0",
        sourceKind: "session-jsonl",
      },
      {
        agent: "utility",
        index: 0,
        outputPath: join(root, "output-0.log"),
        runId: "nested-0",
        sourceKind: "text",
      },
    ]);
  });

  it("uses the exact top-level run when a direct status step has no child run id", () => {
    expect.hasAssertions();
    expect(
      projectionsFromStatus(
        {
          runId: "direct-1",
          sessionId: "session-1",
          state: "complete",
          steps: [
            {
              agent: "utility",
              index: 0,
              sessionFile: "/sessions/direct.jsonl",
              status: "complete",
            },
          ],
        },
        "/tmp/direct-1",
        "session-1",
      ),
    ).toEqual([
      expect.objectContaining({
        key: "direct-1:0",
        outputPath: "/sessions/direct.jsonl",
        sourceKind: "session-jsonl",
        state: "complete",
      }),
    ]);
  });

  it("waits for exact workflow child identities instead of opening a wrapper pane", () => {
    expect.hasAssertions();
    expect(
      projectionsFromStatus(
        {
          agent: "workflow",
          mode: "workflow",
          runId: "workflow-1",
          sessionId: "session-1",
          state: "running",
          steps: [
            { agent: "utility", status: "pending" },
            { agent: "utility", status: "pending" },
          ],
        },
        "/tmp/workflow-1",
        "session-1",
      ),
    ).toEqual([]);
  });

  it("rejects the wrong session and escaped output paths", () => {
    expect.hasAssertions();
    expect(
      projectionsFromStatus({ runId: "run", sessionId: "other" }, "/tmp/run", "session"),
    ).toEqual([]);
    expect(
      projectionsFromStatus(
        {
          runId: "run",
          sessionId: "session",
          steps: [{ index: 0, outputFile: "/etc/passwd", runId: "child", status: "running" }],
        },
        "/tmp/run",
        "session",
      ),
    ).toEqual([]);
  });

  it("writes a private descriptor and updates it without exposing a token in its path", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "herdr-subagent-artifacts-"));
    const store = await createDescriptorStore(root);
    const path = await store.write({
      agent: "worker",
      asyncDir: root,
      index: 0,
      key: "run:0",
      outputPath: join(root, "output-0.log"),
      runId: "run",
      state: "running",
      statusPath: join(root, "status.json"),
      version: 1,
    });
    await store.update(path, { state: "failed" });

    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(path, "utf8"))).toMatchObject({ state: "failed", version: 1 });
    expect(path).not.toContain("token");
    await writeFile(join(root, "output-0.log"), "safe", "utf8");
    await store.close();
  });
});
