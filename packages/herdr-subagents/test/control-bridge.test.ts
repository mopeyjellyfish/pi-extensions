import { describe, expect, it, vi } from "vitest";

import { createControlBridge } from "../src/control-bridge.ts";

const { requestStop } = vi.hoisted(() => ({ requestStop: vi.fn() }));

vi.mock("pi-subagents/control-channel", () => ({ requestAsyncStop: requestStop }));

describe("control bridge", () => {
  it("accepts bounded authenticated intent and routes it through public RPC", async () => {
    expect.hasAssertions();
    const listeners = new Map<string, (value: unknown) => void>();
    const emit = vi.fn((channel: string, value: unknown) => {
      if (channel !== "subagents:rpc:v1:request") return;
      const request = value as { requestId: string };
      const listener = listeners.get(`subagents:rpc:v1:reply:${request.requestId}`);
      listener?.({ requestId: "another-request", success: true, version: 1 });
      listener?.({ requestId: request.requestId, success: true, version: 1 });
      listener?.({ requestId: request.requestId, success: true, version: 1 });
    });
    const bridge = await createControlBridge({
      emit,
      on(channel, listener) {
        listeners.set(channel, listener);
        return () => listeners.delete(channel);
      },
    });
    const run1 = bridge.bind({ asyncDir: "/private/run-1", index: 0, runId: "run-1" });
    const run2 = bridge.bind({ asyncDir: "/private/run-2", index: 0, runId: "run-2" });
    const run3 = bridge.bind({ asyncDir: "/private/run-3", index: 0, runId: "run-3" });
    expect(run1.token).not.toBe(run2.token);

    const forbidden = await fetch(bridge.endpoint, { method: "POST" });
    const wrongMethod = await fetch(bridge.endpoint, {
      headers: { authorization: `Bearer ${run1.token}` },
    });
    const wrongPath = await fetch(new URL("missing", bridge.endpoint), {
      headers: { authorization: `Bearer ${run1.token}` },
      method: "POST",
    });
    const accepted = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "steer", message: "Continue safely" }),
      headers: {
        authorization: `Bearer ${run1.token}`,
        "content-type": "application/json",
      },
      method: "POST",
    });
    const resumed = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "resume", message: "Finish" }),
      headers: {
        authorization: `Bearer ${run2.token}`,
        "content-type": "application/json",
      },
      method: "POST",
    });
    const stopped = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "stop" }),
      headers: {
        authorization: `Bearer ${run3.token}`,
        "content-type": "application/json",
      },
      method: "POST",
    });
    const invalid = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "unknown" }),
      headers: {
        authorization: `Bearer ${run1.token}`,
        "content-type": "application/json",
      },
      method: "POST",
    });

    expect(forbidden.status).toBe(403);
    expect(wrongMethod.status).toBe(403);
    expect(wrongPath.status).toBe(403);
    expect(accepted.status).toBe(202);
    expect(resumed.status).toBe(202);
    expect(stopped.status).toBe(202);
    expect(invalid.status).toBe(400);
    expect(emit).toHaveBeenCalledWith(
      "subagents:rpc:v1:request",
      expect.objectContaining({
        method: "steer",
        params: { id: "run-1", index: 0, message: "Continue safely" },
      }),
    );
    await bridge.close();
  });

  it("rejects invalid input and uses the public stop channel only after RPC declines", async () => {
    expect.hasAssertions();
    requestStop.mockClear();
    const listeners = new Map<string, (value: unknown) => void>();
    const bridge = await createControlBridge({
      emit(channel, value) {
        if (channel !== "subagents:rpc:v1:request") return;
        const request = value as { requestId: string };
        listeners.get(`subagents:rpc:v1:reply:${request.requestId}`)?.({
          requestId: request.requestId,
          success: false,
          version: 1,
        });
      },
      on(channel, listener) {
        listeners.set(channel, listener);
        return () => listeners.delete(channel);
      },
    });
    const run1 = bridge.bind({ asyncDir: "/private/run", index: 2, runId: "run-1" });
    const run2 = bridge.bind({ asyncDir: "/private/run-2", index: 0, runId: "run-2" });
    const headers = {
      authorization: `Bearer ${run1.token}`,
      "content-type": "application/json",
    };
    const invalid = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "resume" }),
      headers,
      method: "POST",
    });
    const invalidArray = await fetch(bridge.endpoint, {
      body: "[]",
      headers,
      method: "POST",
    });
    const stopped = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "stop" }),
      headers,
      method: "POST",
    });
    const stoppedWithoutIndex = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "stop" }),
      headers: { ...headers, authorization: `Bearer ${run2.token}` },
      method: "POST",
    });
    const oversized = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "stop", extra: "x".repeat(9000) }),
      headers,
      method: "POST",
    });

    const foreign = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "stop", asyncDir: "/private/foreign", runId: "foreign" }),
      headers,
      method: "POST",
    });
    const malformedIndex = await fetch(bridge.endpoint, {
      body: JSON.stringify({ action: "stop", index: "not-an-index" }),
      headers,
      method: "POST",
    });

    expect(invalid.status).toBe(400);
    expect(invalidArray.status).toBe(400);
    expect(stopped.status).toBe(202);
    expect(stoppedWithoutIndex.status).toBe(202);
    expect(oversized.status).toBe(400);
    expect(foreign.status).toBe(400);
    expect(malformedIndex.status).toBe(400);
    expect(requestStop).toHaveBeenCalledWith(
      "/private/run",
      expect.objectContaining({ source: "pi-herdr-subagents", targetIndex: 2 }),
    );
    await bridge.close();
  });
});
