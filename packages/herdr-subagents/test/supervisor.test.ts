import { describe, expect, it, vi } from "vitest";

import { HerdrSubagentSupervisor, type ChildProjection } from "../src/supervisor.ts";

function child(runId: string, index = 0): ChildProjection {
  return {
    agent: "worker",
    asyncDir: `/tmp/${runId}`,
    index,
    key: `${runId}:${String(index)}`,
    outputPath: `/tmp/${runId}/output-${String(index)}.log`,
    runId,
    state: "running",
    statusPath: `/tmp/${runId}/status.json`,
  };
}

function descriptors(overrides: Record<string, unknown> = {}) {
  return {
    close: vi.fn(),
    directory: "/private",
    feed: vi.fn(),
    update: vi.fn(),
    write: vi.fn(),
    ...overrides,
  } as never;
}

describe("HerdrSubagentSupervisor", () => {
  it("opens one right pane then stacks exact children down without stealing focus", async () => {
    expect.hasAssertions();
    const open = vi.fn().mockResolvedValueOnce("pane-1").mockResolvedValueOnce("pane-2");
    const descriptor = vi.fn((projection: ChildProjection) =>
      Promise.resolve(`/private/${projection.key}.json`),
    );
    const supervisor = new HerdrSubagentSupervisor({
      descriptors: descriptors({ write: descriptor }),
      herdr: { close: vi.fn(), exists: vi.fn().mockResolvedValue(true), open },
      mainPaneId: "main-pane",
      sessionId: "session-1",
    });

    await supervisor.observe(child("run-1"));
    await supervisor.observe(child("run-1"));
    for (const state of ["active", "pending", "queued", "starting"]) {
      await supervisor.observe({ ...child("run-1"), state });
    }
    await supervisor.observe(child("run-2"));

    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ direction: "right", focus: false, targetPaneId: "main-pane" }),
    );
    expect(open).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ direction: "down", focus: false, targetPaneId: "pane-1" }),
    );
    expect(descriptor).toHaveBeenCalledTimes(2);
    const reboundOpen = vi.fn().mockResolvedValue("pane-3");
    await supervisor.rebind(
      { close: vi.fn(), exists: vi.fn().mockResolvedValue(true), open: reboundOpen },
      () => ({ endpoint: "http://127.0.0.1:1234/control", token: "new-token" }),
    );
    await supervisor.observe(child("run-3"));
    expect(reboundOpen).toHaveBeenCalledOnce();
  });

  it("keeps terminal panes, treats a missing pane as dismissed, and closes only owned panes", async () => {
    expect.hasAssertions();
    const close = vi.fn().mockResolvedValue(undefined);
    const exists = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const update = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn().mockResolvedValue("pane-1");
    const supervisor = new HerdrSubagentSupervisor({
      descriptors: descriptors({ update, write: vi.fn().mockResolvedValue("/private/run.json") }),
      herdr: { close, exists, open },
      mainPaneId: "main-pane",
      sessionId: "session-1",
    });

    await supervisor.observe(child("run-1"));
    await supervisor.observe({ ...child("run-1"), state: "failed" });
    await supervisor.observe({ ...child("run-1"), state: "running" });
    await supervisor.observe({ ...child("run-1"), state: "complete" });
    await supervisor.observe({ ...child("run-1"), state: "partial" });
    await supervisor.shutdown({ closePanes: true });
    await supervisor.observe(child("run-1"));

    expect(update).toHaveBeenCalledWith(
      "/private/run.json",
      expect.objectContaining({ state: "failed" }),
    );
    expect(update).toHaveBeenCalledWith(
      "/private/run.json",
      expect.objectContaining({ state: "complete" }),
    );
    expect(close).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledOnce();
  });

  it("does nothing when no exact child is observed", async () => {
    expect.hasAssertions();
    const open = vi.fn();
    const supervisor = new HerdrSubagentSupervisor({
      descriptors: descriptors(),
      herdr: { close: vi.fn(), exists: vi.fn(), open },
      mainPaneId: "main-pane",
      sessionId: "session-1",
    });

    await supervisor.shutdown({ closePanes: false });

    expect(open).not.toHaveBeenCalled();
  });

  it("recovers serialization after an open failure and skips an already missing owned pane", async () => {
    expect.hasAssertions();
    const close = vi.fn();
    const open = vi
      .fn()
      .mockRejectedValueOnce(new Error("open failed"))
      .mockResolvedValueOnce("pane-2");
    const supervisor = new HerdrSubagentSupervisor({
      descriptors: descriptors({ write: vi.fn().mockResolvedValue("/private/run.json") }),
      herdr: { close, exists: vi.fn().mockResolvedValue(false), open },
      mainPaneId: "main-pane",
      sessionId: "session-1",
    });

    await expect(supervisor.observe(child("run-1"))).rejects.toThrow("open failed");
    await expect(supervisor.observe(child("run-2"))).resolves.toBeUndefined();
    await supervisor.shutdown({ closePanes: true });

    expect(close).not.toHaveBeenCalled();
  });
});
