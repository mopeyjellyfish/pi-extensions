import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { pathToFileURL } from "node:url";

import { npmInvocation, terminateProcessTree } from "./lib/process.ts";

export interface CheckCommand {
  readonly name: string;
  readonly command: string;
  readonly arguments: readonly string[];
}

export interface CheckOptions {
  readonly concurrency: number;
  readonly cwd: string;
  readonly signal?: AbortSignal;
  readonly write?: (text: string) => void;
}

const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;

function rootChecks(): readonly CheckCommand[] {
  const npmCheck = (name: string): CheckCommand => ({ name, ...npmInvocation(["run", name]) });
  return [
    npmCheck("format:check"),
    npmCheck("lint"),
    npmCheck("markdownlint"),
    npmCheck("knip"),
    npmCheck("typecheck"),
    npmCheck("packages:check"),
    npmCheck("test:coverage"),
    npmCheck("smoke"),
    npmCheck("go:check"),
  ];
}

function runCheck(
  check: CheckCommand,
  options: CheckOptions,
): Promise<{ name: string; output: string; passed: boolean }> {
  return new Promise((resolvePromise) => {
    if (options.signal?.aborted === true) {
      resolvePromise({ name: check.name, output: "cancelled before start\n", passed: false });
      return;
    }
    const child = spawn(check.command, check.arguments, {
      cwd: options.cwd,
      detached: process.platform !== "win32",
      shell: false,
      stdio: "pipe",
      windowsHide: true,
    });
    let output = "";
    let truncated = false;
    const append = (text: string): void => {
      if (truncated) return;
      const remaining = MAX_OUTPUT_BYTES - Buffer.byteLength(output);
      if (remaining <= 0) {
        output += "\n[output truncated]\n";
        truncated = true;
        return;
      }
      const encoded = Buffer.from(text);
      if (encoded.byteLength <= remaining) {
        output += text;
        return;
      }
      let end = remaining;
      while (end > 0) {
        const byte = encoded[end];
        if (byte === undefined || (byte & 0xc0) !== 0x80) break;
        end--;
      }
      output += encoded.subarray(0, end).toString("utf8");
      output += "\n[output truncated]\n";
      truncated = true;
    };
    const stdoutDecoder = new StringDecoder("utf8");
    const stderrDecoder = new StringDecoder("utf8");
    const cancel = (): void => {
      terminateProcessTree(child);
    };
    options.signal?.addEventListener("abort", cancel, { once: true });
    child.stdout.on("data", (chunk: Buffer) => {
      append(stdoutDecoder.write(chunk));
    });
    child.stderr.on("data", (chunk: Buffer) => {
      append(stderrDecoder.write(chunk));
    });
    child.stdin.end();
    child.on("error", (error: Error) => {
      append(`${error.message}\n`);
    });
    child.on("close", (code) => {
      append(stdoutDecoder.end());
      append(stderrDecoder.end());
      options.signal?.removeEventListener("abort", cancel);
      resolvePromise({ name: check.name, output, passed: code === 0 && !options.signal?.aborted });
    });
  });
}

export async function runChecks(
  commands: readonly CheckCommand[],
  options: CheckOptions,
): Promise<number> {
  if (!Number.isInteger(options.concurrency) || options.concurrency <= 0) {
    throw new RangeError("Check concurrency must be a positive integer.");
  }
  const write =
    options.write ??
    ((text: string): void => {
      process.stdout.write(text);
    });
  const results: { name: string; output: string; passed: boolean }[] = [];
  let cursor = 0;
  const next = async (): Promise<void> => {
    while (!options.signal?.aborted) {
      const check = commands[cursor++];
      if (check === undefined) return;
      results.push(await runCheck(check, options));
    }
  };
  await Promise.all(Array.from({ length: Math.min(options.concurrency, commands.length) }, next));
  for (const result of results.sort(
    (left, right) =>
      commands.findIndex((item) => item.name === left.name) -
      commands.findIndex((item) => item.name === right.name),
  )) {
    write(`\n== ${result.name} ==\n${result.output}`);
  }
  if (options.signal?.aborted) write("\ncheck runner cancelled\n");
  const failures = results.filter((result) => !result.passed);
  if (failures.length > 0) write(`\n${String(failures.length)} required check(s) failed\n`);
  return failures.length === 0 && !options.signal?.aborted ? 0 : 1;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const controller = new AbortController();
  process.once("SIGINT", () => {
    controller.abort();
  });
  process.once("SIGTERM", () => {
    controller.abort();
  });
  const configuredConcurrency = Number(process.env["CHECK_CONCURRENCY"] ?? "3");
  const concurrency =
    Number.isInteger(configuredConcurrency) && configuredConcurrency > 0
      ? configuredConcurrency
      : 3;
  process.exitCode = await runChecks(rootChecks(), {
    concurrency,
    cwd: process.cwd(),
    signal: controller.signal,
  });
}
