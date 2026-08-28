import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  controlRequest,
  ownerAlive,
  readDescriptor,
  renderSessionJsonl,
  safeTerminalText,
  sendControl,
  startViewer,
  statusLine,
} from "../src/viewer.ts";

describe("viewer rendering", () => {
  it("renders untrusted values as terminal text without producing a command", () => {
    expect.hasAssertions();
    const line = statusLine({
      agent: "worker; touch /tmp/pwned",
      runId: "run\nnext",
      state: "needs_attention",
    });

    expect(line).toContain("worker; touch /tmp/pwned");
    expect(line).not.toContain("\u{1B}]52;");
    expect(line).not.toContain("\nnext");
    expect(statusLine({ agent: null, runId: 1, state: "custom" })).toContain("unknown");
  });

  it("renders complete Pi session JSONL as readable transcript text", () => {
    expect.hasAssertions();
    const transcript = [
      JSON.stringify({
        message: { content: [{ text: "Working", type: "text" }], role: "assistant" },
        type: "message",
      }),
      JSON.stringify({
        message: {
          content: [{ arguments: { path: "README.md" }, name: "read", type: "toolCall" }],
          role: "assistant",
        },
        type: "message",
      }),
      JSON.stringify({
        message: {
          content: [{ text: "Result", type: "text" }],
          role: "toolResult",
          toolName: "read",
        },
        type: "message",
      }),
      JSON.stringify({
        message: { content: "String content", role: "assistant" },
        type: "message",
      }),
      JSON.stringify({ message: { content: null, role: "assistant" }, type: "message" }),
      JSON.stringify({
        message: {
          content: [{ name: "list", type: "toolCall" }, { type: "image" }],
          role: "assistant",
        },
        type: "message",
      }),
      JSON.stringify({ content: "Attention notice", type: "custom_message" }),
      "",
      "incomplete",
    ].join("\n");

    expect(renderSessionJsonl(transcript)).toContain("[assistant]\nWorking");
    expect(renderSessionJsonl(transcript)).toContain('› read {"path":"README.md"}');
    expect(renderSessionJsonl(transcript)).toContain("[toolResult read]\nResult");
    expect(renderSessionJsonl(transcript)).toContain("String content");
    expect(renderSessionJsonl(transcript)).toContain("› list {}");
    expect(renderSessionJsonl(transcript)).toContain("Attention notice");
  });

  it("parses bounded pane commands without exposing the control capability", () => {
    expect.hasAssertions();
    expect(controlRequest(":stop")).toEqual({ action: "stop" });
    expect(controlRequest(":steer Continue safely")).toMatchObject({
      action: "steer",
      message: "Continue safely",
    });
    expect(controlRequest(":resume")).toBeUndefined();
    expect(controlRequest("unknown")).toBeUndefined();
  });

  it("reads, follows, and closes a private transcript descriptor", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "viewer-test-"));
    const outputPath = join(root, "output.log");
    const descriptorPath = join(root, "descriptor.json");
    await writeFile(outputPath, "first line\n", "utf8");
    await writeFile(
      descriptorPath,
      JSON.stringify({
        agent: "worker",
        asyncDir: root,
        index: 0,
        key: "run:0",
        outputPath,
        runId: "run",
        state: "running",
        statusPath: join(root, "status.json"),
        version: 1,
      }),
      "utf8",
    );
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const viewer = await startViewer(descriptorPath);
    await writeFile(outputPath, "first line\nsecond line\n", "utf8");
    await viewer.refresh();
    expect(write).toHaveBeenCalledWith(expect.stringContaining("second line"));
    await writeFile(outputPath, "reset\n", "utf8");
    await viewer.refresh();
    expect(write).toHaveBeenCalledWith(expect.stringContaining("transcript source replaced"));
    viewer.close();
    write.mockRestore();
    expect((await readDescriptor(descriptorPath)).runId).toBe("run");
  });

  it("rejects invalid descriptors and strips active terminal controls", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "viewer-invalid-"));
    const path = join(root, "descriptor.json");
    await writeFile(path, "{}", "utf8");

    await expect(readDescriptor(path)).rejects.toThrow("descriptor is invalid");
    await writeFile(path, "[]", "utf8");
    await expect(readDescriptor(path)).rejects.toThrow("descriptor is invalid");
    expect(safeTerminalText("ok\u{1B}]52;clipboard\u{7}\u{1B}[31m red")).toBe("ok red");
  });

  it("sends authenticated controls without rendering the token", async () => {
    expect.hasAssertions();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response("Accepted", { status: 202 }));
    vi.stubGlobal("fetch", fetch);
    const descriptor = {
      asyncDir: "/private/run",
      control: { endpoint: "http://127.0.0.1:1234/control", token: "secret-token" },
      index: 0,
      runId: "run",
    } as never;

    await expect(sendControl(descriptor, ":stop")).resolves.toBe("Accepted");
    expect(fetch).toHaveBeenCalledOnce();
    const request = fetch.mock.calls[0]?.[1];
    expect(new Headers(request?.headers).get("authorization")).toBe("Bearer secret-token");
    await expect(
      sendControl({ asyncDir: "/private/run", index: 0, runId: "run" } as never, ":stop"),
    ).resolves.toBe("Unsupported command");
    vi.unstubAllGlobals();
  });

  it("closes an orphan viewer after its owner process is gone", async () => {
    expect.hasAssertions();
    expect(ownerAlive(process.pid)).toBe(true);
    expect(ownerAlive(2_147_483_647)).toBe(false);
    const root = await mkdtemp(join(tmpdir(), "viewer-orphan-"));
    const outputPath = join(root, "output.log");
    const descriptorPath = join(root, "descriptor.json");
    await writeFile(outputPath, "output\n", "utf8");
    await writeFile(
      descriptorPath,
      JSON.stringify({
        agent: "worker",
        asyncDir: root,
        index: 0,
        key: "run:0",
        outputPath,
        ownerPid: 2_147_483_647,
        runId: "run",
        state: "running",
        statusPath: join(root, "status.json"),
        version: 1,
      }),
      "utf8",
    );
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const viewer = await startViewer(descriptorPath);
    await vi.waitFor(() => {
      expect(write).toHaveBeenCalledWith(expect.stringContaining("Parent session ended"));
    });
    viewer.close();
    write.mockRestore();
  });

  it("wires interactive pane lines to the authenticated control sender", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "viewer-interactive-"));
    const outputPath = join(root, "output.log");
    const descriptorPath = join(root, "descriptor.json");
    await writeFile(outputPath, "output\n", "utf8");
    await writeFile(
      descriptorPath,
      JSON.stringify({
        agent: "worker",
        asyncDir: root,
        control: { endpoint: "http://127.0.0.1:1234/control", token: "token" },
        index: 0,
        key: "run:0",
        outputPath,
        runId: "run",
        state: "running",
        statusPath: join(root, "status.json"),
        version: 1,
      }),
      "utf8",
    );
    const previous = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response("Accepted", { status: 202 }));
    vi.stubGlobal("fetch", fetch);
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const viewer = await startViewer(descriptorPath);
    process.stdin.emit("data", Buffer.from(":stop\n"));

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledOnce();
    });
    await vi.waitFor(() => {
      expect(write).toHaveBeenCalledWith(expect.stringContaining("Accepted"));
    });
    fetch.mockRejectedValueOnce(new Error("connection refused"));
    process.stdin.emit("data", Buffer.from(":stop\n"));
    await vi.waitFor(() => {
      expect(write).toHaveBeenCalledWith(expect.stringContaining("Control unavailable"));
    });
    viewer.close();
    write.mockRestore();
    vi.unstubAllGlobals();
    if (previous === undefined) delete (process.stdin as { isTTY?: boolean }).isTTY;
    else Object.defineProperty(process.stdin, "isTTY", previous);
  });
});
