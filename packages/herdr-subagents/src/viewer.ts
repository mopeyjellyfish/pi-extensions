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
const COLOR = new Map<string, string>([
  ["complete", "\u{1B}[32m"],
  ["completed", "\u{1B}[32m"],
  ["failed", "\u{1B}[31m"],
  ["needs_attention", "\u{1B}[33m"],
  ["partial", "\u{1B}[33m"],
  ["running", "\u{1B}[32m"],
  ["stopped", "\u{1B}[33m"],
]);

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function safeCharacter(character: string, allowNewline: boolean): string {
  const code = character.codePointAt(0) ?? 0;
  if (allowNewline && (code === 9 || code === 10)) return character;
  if ((code >= 32 && code <= 126) || code >= 160) return character;
  return "";
}

function safeLabel(value: unknown): string {
  return typeof value === "string"
    ? Array.from(safeTerminalText(value), (character) => safeCharacter(character, false) || " ")
        .join("")
        .slice(0, 160)
    : "unknown";
}

export function safeTerminalText(value: string): string {
  return Array.from(value.replaceAll(ANSI_OSC, "").replaceAll(ANSI_CSI, ""), (character) =>
    safeCharacter(character, true),
  ).join("");
}

const TOOL_BACKGROUND = new Map<string, string>([
  ["bash", "\u{1B}[48;5;130m"],
  ["edit", "\u{1B}[48;5;90m"],
  ["read", "\u{1B}[48;5;31m"],
  ["write", "\u{1B}[48;5;28m"],
]);
const ROLE_BACKGROUND = new Map<string, string>([
  ["assistant", "\u{1B}[48;5;24m"],
  ["system", "\u{1B}[48;5;240m"],
  ["user", "\u{1B}[48;5;25m"],
]);
const ERROR_BACKGROUND = "\u{1B}[48;5;124m";
const PANEL_FOREGROUND = "\u{1B}[97m";
const PANEL_RESET = "\u{1B}[0m";
const UNKNOWN_BACKGROUND = "\u{1B}[48;5;240m";

function panel(label: string, background: string): string {
  return `${background}${PANEL_FOREGROUND} ${label.toUpperCase()} ${PANEL_RESET}`;
}

function toolName(value: unknown): string {
  const name = safeLabel(value).trim().replaceAll(/\s+/gu, " ");
  return name === "" || name === "unknown" ? "unknown" : name;
}

function toolPanel(name: string, outcome: "call" | "error" | "result"): string {
  const label = outcome === "call" ? name : `${outcome === "error" ? "ERROR " : ""}RESULT ${name}`;
  const background =
    outcome === "error"
      ? ERROR_BACKGROUND
      : (TOOL_BACKGROUND.get(name.toLowerCase()) ?? UNKNOWN_BACKGROUND);
  return panel(label, background);
}

function indent(value: string): string {
  return value
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function structuredValue(value: unknown): string {
  if (typeof value === "string") return safeTerminalText(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item, index) => `[${String(index)}]:\n${indent(structuredValue(item))}`)
      .join("\n");
  }
  const object = record(value);
  if (object !== undefined) {
    const entries = Object.entries(object);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, item]) => {
        const rendered = structuredValue(item);
        return typeof item === "object" || rendered.includes("\n")
          ? `${safeLabel(key)}:\n${indent(rendered)}`
          : `${safeLabel(key)}: ${rendered}`;
      })
      .join("\n");
  }
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "unknown";
}

function textContent(value: unknown): string {
  if (typeof value === "string") return safeTerminalText(value);
  if (!Array.isArray(value)) return "";
  return value
    .map((part) => {
      const item = record(part);
      return item?.["type"] === "text" && typeof item["text"] === "string"
        ? safeTerminalText(item["text"])
        : "";
    })
    .join("");
}

function nonTextPlaceholder(value: unknown): string {
  return Array.isArray(value) && value.some((part) => record(part)?.["type"] === "image")
    ? "[image content]"
    : "[no textual content]";
}

function diagnosticPanels(message: Record<string, unknown>): string {
  const rendered: string[] = [];
  if (typeof message["errorMessage"] === "string" && message["errorMessage"] !== "") {
    rendered.push(
      `\n${panel("error", ERROR_BACKGROUND)}\n${safeTerminalText(message["errorMessage"])}\n`,
    );
  }
  if (Array.isArray(message["diagnostics"])) {
    for (const value of message["diagnostics"]) {
      const diagnostic = record(value);
      if (diagnostic === undefined) continue;
      const kind = safeLabel(diagnostic["type"]);
      const error = record(diagnostic["error"]);
      const body =
        error !== undefined && typeof error["message"] === "string"
          ? safeTerminalText(error["message"])
          : structuredValue(diagnostic["details"] ?? {});
      rendered.push(`\n${panel(`diagnostic ${kind}`, ERROR_BACKGROUND)}\n${body}\n`);
    }
  }
  return rendered.join("");
}

function rolePanel(role: string, body: string): string {
  return body === ""
    ? ""
    : `\n${panel(role, ROLE_BACKGROUND.get(role) ?? UNKNOWN_BACKGROUND)}\n${body}\n`;
}

function renderContentPart(role: string, value: unknown): string {
  const item = record(value);
  if (item?.["type"] === "text" && typeof item["text"] === "string") {
    return rolePanel(role, safeTerminalText(item["text"]));
  }
  if (item?.["type"] === "thinking" && typeof item["thinking"] === "string") {
    const thinking = safeTerminalText(item["thinking"]);
    return thinking === "" ? "" : `\n${panel("thinking", UNKNOWN_BACKGROUND)}\n${thinking}\n`;
  }
  if (item?.["type"] === "toolCall") {
    const name = toolName(item["name"]);
    return `\n${toolPanel(name, "call")}\nArguments:\n${structuredValue(item["arguments"] ?? {})}\n`;
  }
  return item?.["type"] === "image" ? rolePanel(role, "[image content]") : "";
}

function renderRoleContent(role: string, content: unknown): string {
  if (typeof content === "string") return rolePanel(role, safeTerminalText(content));
  return Array.isArray(content)
    ? content.map((part) => renderContentPart(role, part)).join("")
    : "";
}

function renderMessage(message: Record<string, unknown>): string {
  const role = safeLabel(message["role"]);
  if (role === "toolResult") {
    const content = textContent(message["content"]) || nonTextPlaceholder(message["content"]);
    const outcome = message["isError"] === true ? "error" : "result";
    return `\n${toolPanel(toolName(message["toolName"]), outcome)}\n${content}\n`;
  }
  return `${renderRoleContent(role, message["content"])}${diagnosticPanels(message)}`;
}

export function renderSessionJsonl(value: string): string {
  const rendered: string[] = [];
  for (const line of value.split("\n")) {
    if (line.trim() === "") continue;
    try {
      const entry = record(JSON.parse(line));
      if (entry?.["type"] === "message") {
        const message = record(entry["message"]);
        if (message !== undefined) rendered.push(renderMessage(message));
      } else if (entry?.["type"] === "custom_message" && entry["display"] !== false) {
        const content = textContent(entry["content"]);
        const body = content || nonTextPlaceholder(entry["content"]);
        const customType =
          typeof entry["customType"] === "string"
            ? `custom ${safeLabel(entry["customType"])}`
            : "note";
        rendered.push(`\n${panel(customType, UNKNOWN_BACKGROUND)}\n${body}\n`);
      }
    } catch {
      // Ignore an incomplete final JSONL line while the child is writing it.
    }
  }
  return rendered.join("");
}

export function statusLine(value: {
  readonly agent?: unknown;
  readonly runId?: unknown;
  readonly state?: unknown;
}): string {
  const agent = safeLabel(value.agent);
  const runId = safeLabel(value.runId);
  const state = safeLabel(value.state);
  const color = COLOR.get(state) ?? "\u{1B}[36m";
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
