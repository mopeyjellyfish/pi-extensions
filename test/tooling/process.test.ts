import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { credentialFreeEnvironment, npmInvocation, runCommand } from "../../scripts/lib/process.ts";
import { repositoryRoot } from "../../scripts/lib/repository.ts";

describe("npm invocation", () => {
  it("runs npm's JavaScript CLI through the active Node executable", () => {
    expect.hasAssertions();
    expect(npmInvocation(["pack", "--json"], { npm_execpath: "C:\\npm\\npm-cli.js" })).toEqual({
      arguments: ["C:\\npm\\npm-cli.js", "pack", "--json"],
      command: process.execPath,
    });
  });

  it("rejects execution outside an npm script", () => {
    expect.hasAssertions();
    expect(() => npmInvocation([], {})).toThrow(/npm_execpath is unavailable/u);
  });
});

describe("environment isolation", () => {
  it("removes credentials, proxy settings, and inherited npm configuration", () => {
    expect.hasAssertions();
    expect(
      credentialFreeEnvironment({
        API_KEY: "api-key",
        HTTPS_PROXY: "https://user:password@example.test",
        NODE_AUTH_TOKEN: "token",
        NPM_CONFIG_USERCONFIG: "/private/npmrc",
        PATH: "/usr/bin",
        SAFE_SETTING: "safe",
      }),
    ).toEqual({ PATH: "/usr/bin", SAFE_SETTING: "safe" });
  });
});

describe("portable command runner", () => {
  it("captures standard output and a successful exit code", async () => {
    expect.hasAssertions();
    const result = await runCommand(process.execPath, ["-e", 'process.stdout.write("ok")'], {
      cwd: repositoryRoot,
    });
    expect(result).toMatchObject({ code: 0, stdout: "ok", timedOut: false });
  });

  it("terminates commands that exceed their deadline", async () => {
    expect.hasAssertions();
    const result = await runCommand(process.execPath, ["-e", "setTimeout(() => {}, 10_000)"], {
      cwd: repositoryRoot,
      timeoutMs: 25,
    });
    expect(result.timedOut).toBe(true);
    expect(result.code).not.toBe(0);
  });

  it("terminates descendant processes when a command times out", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-process-tree-test-"));
    const marker = join(root, "grandchild-survived");
    const grandchildScript = [
      'const { writeFileSync } = require("node:fs");',
      `setTimeout(() => writeFileSync(${JSON.stringify(marker)}, "alive"), 1_000);`,
      "setInterval(() => {}, 1_000);",
    ].join("\n");
    const parentScript = [
      'const { spawn } = require("node:child_process");',
      `spawn(process.execPath, ["-e", ${JSON.stringify(grandchildScript)}], { stdio: "ignore" });`,
      'process.stdout.write("spawned");',
      "setInterval(() => {}, 1_000);",
    ].join("\n");

    try {
      const result = await runCommand(process.execPath, ["-e", parentScript], {
        cwd: repositoryRoot,
        timeoutMs: 500,
      });
      expect(result).toMatchObject({ stdout: "spawned", timedOut: true });
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1100));
      await expect(access(marker)).rejects.toThrow();
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
