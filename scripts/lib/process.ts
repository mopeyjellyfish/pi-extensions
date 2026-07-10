import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";

const MAX_CAPTURE_BYTES = 4 * 1024 * 1024;
const WINDOWS_TREE_KILL_TIMEOUT_MS = 2000;

export interface CommandResult {
  readonly code: number;
  readonly signal: NodeJS.Signals | null;
  readonly stderr: string;
  readonly stdout: string;
  readonly timedOut: boolean;
}

export interface RunOptions {
  readonly cwd: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly input?: string;
  readonly timeoutMs?: number;
}

export interface CommandInvocation {
  readonly arguments: readonly string[];
  readonly command: string;
}

export function npmInvocation(
  arguments_: readonly string[],
  environment: NodeJS.ProcessEnv = process.env,
): CommandInvocation {
  const npmExecPath = environment["npm_execpath"];
  if (npmExecPath === undefined || npmExecPath === "") {
    throw new Error("npm_execpath is unavailable; run this command through an npm script.");
  }
  return {
    arguments: [npmExecPath, ...arguments_],
    command: process.execPath,
  };
}

export function credentialFreeEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(environment).filter(([key]) => {
      const sensitive = /api[_-]?key|auth|credential|password|secret|token/iu.test(key);
      const proxy = /^(?:all|http|https|no)_proxy$/iu.test(key);
      const npmConfiguration = /^npm_config_/iu.test(key);
      return !sensitive && !proxy && !npmConfiguration;
    }),
  );
}

function terminateProcessTree(child: ChildProcessWithoutNullStreams): void {
  if (child.pid === undefined) {
    child.kill("SIGKILL");
    return;
  }

  if (process.platform === "win32") {
    const result = spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      timeout: WINDOWS_TREE_KILL_TIMEOUT_MS,
      windowsHide: true,
    });
    if (result.status !== 0 || result.error !== undefined) {
      child.kill("SIGKILL");
    }
    return;
  }

  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    child.kill("SIGKILL");
  }
}

export async function runCommand(
  command: string,
  arguments_: readonly string[],
  options: RunOptions,
): Promise<CommandResult> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, arguments_, {
      cwd: options.cwd,
      detached: process.platform !== "win32",
      env: options.env,
      shell: false,
      stdio: "pipe",
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const append = (current: string, chunk: Buffer): string => {
      if (Buffer.byteLength(current) >= MAX_CAPTURE_BYTES) {
        return current;
      }
      return current + chunk.toString("utf8");
    };

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = append(stdout, chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = append(stderr, chunk);
    });
    child.on("error", reject);

    const timeout = setTimeout(() => {
      timedOut = true;
      terminateProcessTree(child);
    }, options.timeoutMs ?? 30_000);

    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      resolvePromise({
        code: code ?? 1,
        signal,
        stderr,
        stdout,
        timedOut,
      });
    });

    if (options.input === undefined) {
      child.stdin.end();
    } else {
      child.stdin.end(options.input);
    }
  });
}

export function describeFailure(command: string, result: CommandResult): string {
  const timeout = result.timedOut ? " (timed out)" : "";
  const output = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");
  return `${command} exited with ${String(result.code)}${timeout}${output ? `\n${output}` : ""}`;
}
