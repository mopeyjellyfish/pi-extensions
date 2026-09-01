import { describe, expect, it, vi } from "vitest";

import { FIXED_VIEWER_COMMAND, HerdrCli, paneId, shellReady } from "../src/herdr.ts";

function result(stdout = ""): { code: number; killed: boolean; stderr: string; stdout: string } {
  return { code: 0, killed: false, stderr: "", stdout };
}

const projection = {
  agent: "worker; echo unsafe",
  asyncDir: "/private/run",
  index: 0,
  key: "run:0",
  outputPath: "/private/run/output-0.log",
  runId: "secret-run-id",
  state: "running",
  statusPath: "/private/run/status.json",
};

function openInput() {
  return {
    descriptorPath: "/private/run descriptor.json",
    direction: "right" as const,
    focus: false as const,
    projection,
    targetPaneId: "main",
  };
}

describe("HerdrCli", () => {
  it("passes variable data through split env and sends one fixed non-secret command", async () => {
    expect.hasAssertions();
    const exec = vi.fn((_command: string, arguments_: string[]) => {
      if (arguments_[1] === "split") {
        return Promise.resolve(result(JSON.stringify({ result: { pane: { pane_id: "pane-1" } } })));
      }
      if (arguments_[1] === "process-info") {
        return Promise.resolve(
          result(
            JSON.stringify({
              result: {
                process_info: { foreground_process_group_id: 42, shell_pid: 42 },
              },
            }),
          ),
        );
      }
      return Promise.resolve(result());
    });
    const herdr = new HerdrCli({ exec }, "/projects/example");

    const id = await herdr.open(openInput());

    expect(id).toBe("pane-1");
    expect(exec).toHaveBeenCalledWith(
      "herdr",
      expect.arrayContaining(["PI_HERDR_SUBAGENT_DESCRIPTOR=/private/run descriptor.json"]),
      expect.any(Object),
    );
    expect(exec).toHaveBeenCalledWith(
      "herdr",
      ["pane", "run", "pane-1", FIXED_VIEWER_COMMAND],
      expect.any(Object),
    );
    expect(
      exec.mock.calls.some(
        (call) => call[1][1] === "run" && !call[1].join(" ").includes("secret-run-id"),
      ),
    ).toBe(true);
    expect(
      exec.mock.calls.some((call) => call[1][1] === "run" && !call[1].join(" ").includes("unsafe")),
    ).toBe(true);
    await herdr.open({
      ...openInput(),
      direction: "down",
      projection: { ...projection, agent: "worker\n\u{7F}" },
    });
    expect(exec.mock.calls.some((call) => call[1][1] === "split" && call[1].includes("0.5"))).toBe(
      true,
    );
  });

  it("bounds malformed and unavailable pane launches", async () => {
    expect.hasAssertions();
    expect(paneId("not json")).toBeUndefined();
    expect(shellReady("{}")).toBe(false);
    expect(shellReady(JSON.stringify({ result: { process_info: { shell_pid: 9 } } }))).toBe(true);
    const malformed = new HerdrCli(
      { exec: vi.fn().mockResolvedValue(result("{}")) },
      "/projects/example",
    );
    await expect(malformed.open(openInput())).rejects.toThrow("exact pane id");
    const failedSplit = new HerdrCli(
      { exec: vi.fn().mockResolvedValue({ ...result(), code: 1 }) },
      "/projects/example",
    );
    await expect(failedSplit.open(openInput())).rejects.toThrow("exact pane id");

    const exec = vi.fn((_command: string, arguments_: string[]) => {
      if (arguments_[1] === "split") {
        return Promise.resolve(result(JSON.stringify({ result: { pane: { pane_id: "pane-2" } } })));
      }
      if (arguments_[1] === "process-info") {
        return Promise.resolve(
          result(
            JSON.stringify({
              result: { process_info: { foreground_process_group_id: 4, shell_pid: 4 } },
            }),
          ),
        );
      }
      return Promise.resolve(arguments_[1] === "run" ? { ...result(), code: 1 } : result());
    });
    const unavailable = new HerdrCli({ exec }, "/projects/example");
    await expect(unavailable.open(openInput())).rejects.toThrow("fixed subagent viewer");
    expect(exec).toHaveBeenCalledWith("herdr", ["pane", "close", "pane-2"], expect.any(Object));
  });

  it("queries and closes exact pane ids", async () => {
    expect.hasAssertions();
    const exec = vi.fn().mockResolvedValue(result());
    const herdr = new HerdrCli({ exec }, "/projects/example");

    await expect(herdr.exists("pane-1")).resolves.toBe(true);
    await herdr.close("pane-1");
    expect(exec).toHaveBeenCalledWith("herdr", ["pane", "close", "pane-1"], expect.any(Object));
    const missing = new HerdrCli(
      { exec: vi.fn().mockResolvedValue({ ...result(), code: 1 }) },
      "/projects/example",
    );
    await expect(missing.exists("missing")).resolves.toBe(false);
  });
});
