import { watch, type FSWatcher } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { kill, stdin, stdout } from "node:process";
import { createInterface, type Interface } from "node:readline";

import type { ViewerDescriptor } from "./types.ts";

const ESCAPE = String.fromCodePoint(27);
const BELL = String.fromCodePoint(7);
const ANSI_OSC = new RegExp(`${ESCAPE}\\][^${BELL}]*(?:${BELL}|${ESCAPE}\\\\)`, "gu");
const ANSI_CSI = new RegExp(
  `${ESCAPE}\\[[\\u0030-\\u003F]*[\\u0020-\\u002F]*[\\u0040-\\u007E]`,
  "gu",
);
const COLOR: Readonly<Record<string, string>> = {
  complete: "\u{1B}[32m",
  completed: "\u{1B}[32m",
  failed: "\u{1B}[31m",
  needs_attention: "\u{1B}[33m",
  partial: "\u{1B}[33m",
  running: "\u{1B}[32m",
  stopped: "\u{1B}[33m",
};

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function safeCharacter(character: string, allowNewline: boolean): string {
  const code = character.codePointAt(0) ?? 0;
  if (allowNewline && (code === 9 || code === 10 || code === 13)) return character;
  if ((code >= 32 && code <= 126) || code >= 160) return character;
  return "";
}

function safeLabel(value: unknown): string {
  return typeof value === "string"
    ? Array.from(value, (character) => safeCharacter(character, false) || " ")
        .join("")
        .slice(0, 160)
    : "unknown";
}

export function safeTerminalText(value: string): string {
  return Array.from(value.replaceAll(ANSI_OSC, "").replaceAll(ANSI_CSI, ""), (character) =>
    safeCharacter(character, true),
  ).join("");
}

function sessionContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .map((part) => {
      const item = record(part);
      if (item?.["type"] === "text" && typeof item["text"] === "string") return item["text"];
      if (item?.["type"] === "toolCall" && typeof item["name"] === "string") {
        return `\n› ${item["name"]} ${JSON.stringify(item["arguments"] ?? {})}\n`;
      }
      return "";
    })
    .join("");
}

export function renderSessionJsonl(value: string): string {
  const rendered: string[] = [];
  for (const line of value.split("\n")) {
    if (line.trim() === "") continue;
    try {
      const entry = record(JSON.parse(line));
      if (entry?.["type"] === "message") {
        const message = record(entry["message"]);
        const content = sessionContent(message?.["content"]);
        if (content !== "") {
          const role = safeLabel(message?.["role"]);
          const tool =
            typeof message?.["toolName"] === "string" ? ` ${safeLabel(message["toolName"])}` : "";
          rendered.push(`\n[${role}${tool}]\n${content}\n`);
        }
      } else if (entry?.["type"] === "custom_message" && typeof entry["content"] === "string") {
        rendered.push(`\n${entry["content"]}\n`);
      }
    } catch {
      // Ignore an incomplete final JSONL line while the child is writing it.
    }
  }
  return safeTerminalText(rendered.join(""));
}

export function statusLine(value: {
  readonly agent?: unknown;
  readonly runId?: unknown;
  readonly state?: unknown;
}): string {
  const agent = safeLabel(value.agent);
  const runId = safeLabel(value.runId);
  const state = safeLabel(value.state);
  const color = COLOR[state] ?? "\u{1B}[36m";
  return `${color}● ${state.toUpperCase()}\u{1B}[0m  ${agent}  \u{1B}[2m${runId}\u{1B}[0m`;
}

export async function readDescriptor(path: string): Promise<ViewerDescriptor> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  const descriptor = record(value);
  if (
    descriptor?.["version"] !== 1 ||
    typeof descriptor["key"] !== "string" ||
    typeof descriptor["runId"] !== "string" ||
    typeof descriptor["outputPath"] !== "string" ||
    typeof descriptor["statusPath"] !== "string"
  ) {
    throw new Error("The Herdr subagent descriptor is invalid.");
  }
  return value as ViewerDescriptor;
}

export function controlRequest(line: string): Record<string, unknown> | undefined {
  const input = line.trim();
  const separator = input.search(/\s/u);
  const command = separator === -1 ? input : input.slice(0, separator);
  const action = command.startsWith(":") ? command.slice(1) : "";
  if (!new Set(["resume", "steer", "stop"]).has(action)) return undefined;
  const message = separator === -1 ? undefined : input.slice(separator).trim();
  if ((action === "steer" || action === "resume") && !message) return undefined;
  return {
    action,
    ...(message === undefined ? {} : { message }),
  };
}

export async function sendControl(descriptor: ViewerDescriptor, line: string): Promise<string> {
  const request = controlRequest(line);
  if (descriptor.control === undefined || request === undefined) return "Unsupported command";
  const response = await fetch(descriptor.control.endpoint, {
    body: JSON.stringify(request),
    headers: {
      authorization: `Bearer ${descriptor.control.token}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  return response.text();
}

async function handleControlLine(descriptor: ViewerDescriptor, line: string): Promise<void> {
  let message: string;
  try {
    message = await sendControl(descriptor, line);
  } catch {
    message = "Control unavailable";
  }
  stdout.write(`\u{1B}[2m${safeLabel(message)}\u{1B}[0m\n`);
}

export function ownerAlive(pid: number): boolean {
  try {
    kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export interface ViewerSession {
  close(): void;
  refresh(): Promise<void>;
}

async function runAfter(previous: Promise<void>, operation: () => Promise<void>): Promise<void> {
  await previous;
  await operation();
}

async function ignoreFailure(operation: Promise<void>): Promise<void> {
  try {
    await operation;
  } catch {
    // A later filesystem event retries the viewer refresh.
  }
}

export async function startViewer(descriptorPath: string): Promise<ViewerSession> {
  let descriptor = await readDescriptor(descriptorPath);
  let renderedOutput = "";
  let lastStatus = "";
  let refreshTail: Promise<void> = Promise.resolve();
  const watchers = new Map<string, FSWatcher>();

  let refresh = (): Promise<void> => Promise.resolve();
  const watchDirectory = (directory: string): void => {
    if (watchers.has(directory)) return;
    try {
      watchers.set(
        directory,
        watch(directory, () => void refresh()),
      );
    } catch {
      // A later descriptor update can point at a directory that does not exist yet.
    }
  };

  const performRefresh = async (): Promise<void> => {
    descriptor = await readDescriptor(descriptorPath);
    watchDirectory(dirname(descriptor.outputPath));
    const nextStatus = statusLine(descriptor);
    if (nextStatus !== lastStatus) {
      stdout.write(`${nextStatus}\n`);
      lastStatus = nextStatus;
    }
    try {
      const source = (await readFile(descriptor.outputPath)).toString("utf8");
      const nextOutput =
        descriptor.sourceKind === "session-jsonl"
          ? renderSessionJsonl(source)
          : safeTerminalText(source);
      if (!nextOutput.startsWith(renderedOutput)) {
        stdout.write("\u{1B}[2m── transcript source replaced ──\u{1B}[0m\n");
        renderedOutput = "";
      }
      if (nextOutput.length > renderedOutput.length) {
        stdout.write(nextOutput.slice(renderedOutput.length));
        renderedOutput = nextOutput;
      }
    } catch {
      // The output file can appear after the lifecycle event.
    }
  };
  refresh = async () => {
    const next = runAfter(refreshTail, performRefresh);
    refreshTail = ignoreFailure(next);
    await next;
  };

  watchDirectory(dirname(descriptorPath));
  await refresh();
  let input: Interface | undefined;
  let ownerTimer: ReturnType<typeof setInterval> | undefined;
  if (stdin.isTTY && descriptor.control !== undefined) {
    stdout.write("\u{1B}[2mCommands: :stop · :steer <message> · :resume <message>\u{1B}[0m\n");
    input = createInterface({ input: stdin, output: stdout, terminal: true });
    input.on("line", (line) => {
      void handleControlLine(descriptor, line);
    });
  }
  const close = (): void => {
    if (ownerTimer !== undefined) clearInterval(ownerTimer);
    for (const watcher of watchers.values()) watcher.close();
    watchers.clear();
    input?.close();
  };
  const ownerPid = descriptor.ownerPid;
  if (ownerPid !== undefined) {
    ownerTimer = setInterval(() => {
      if (ownerAlive(ownerPid)) return;
      stdout.write("\u{1B}[2mParent session ended; transcript viewer closed.\u{1B}[0m\n");
      close();
    }, 250);
    ownerTimer.unref();
  }
  return { close, refresh };
}
