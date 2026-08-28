import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import { projectionsFromStatus, type DescriptorStore } from "./artifacts.ts";

import type { ChildProjection } from "./types.ts";

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export function asyncDirectoryFromStarted(value: unknown, sessionId: string): string | undefined {
  const event = record(value);
  const asyncDir = text(event?.["asyncDir"]);
  return asyncDir !== undefined && isAbsolute(asyncDir) && text(event?.["sessionId"]) === sessionId
    ? asyncDir
    : undefined;
}

function startedAgent(event: Record<string, unknown>): string {
  const configured = text(event["agent"]);
  if (configured !== undefined) return configured;
  const agents = event["agents"];
  if (!Array.isArray(agents)) return "subagent";
  return text(agents.find((candidate) => typeof candidate === "string")) ?? "subagent";
}

function isMultiAgentStart(event: Record<string, unknown>): boolean {
  const agents = event["agents"];
  return Array.isArray(agents) && agents.length > 1;
}

export function projectionFromStarted(
  value: unknown,
  sessionId: string,
): ChildProjection | undefined {
  const event = record(value);
  const runId = text(event?.["id"]) ?? text(event?.["runId"]);
  const asyncDir = asyncDirectoryFromStarted(value, sessionId);
  if (event === undefined || runId === undefined || asyncDir === undefined) return undefined;
  const agent = startedAgent(event);
  if (agent === "workflow" || isMultiAgentStart(event)) return undefined;
  return {
    agent,
    asyncControl: true,
    asyncDir,
    index: 0,
    key: `${runId}:0`,
    outputPath: join(asyncDir, "output-0.log"),
    runId,
    state: "running",
    statusPath: join(asyncDir, "status.json"),
  };
}

export async function projectionsFromRun(
  asyncDir: string,
  sessionId: string,
): Promise<ChildProjection[]> {
  try {
    const status: unknown = JSON.parse(await readFile(join(asyncDir, "status.json"), "utf8"));
    return projectionsFromStatus(status, asyncDir, sessionId);
  } catch {
    return [];
  }
}

function resultText(value: Record<string, unknown>): string {
  const content = value["content"];
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => record(item))
    .map((item) => (item?.["type"] === "text" ? text(item["text"]) : undefined))
    .filter((item): item is string => item !== undefined)
    .join("\n");
}

interface ToolIdentity {
  readonly agent: string;
  readonly index: number;
  readonly key: string;
  readonly runId: string;
}

function toolIdentity(
  row: Record<string, unknown> | undefined,
  details: Record<string, unknown>,
  fallbackIndex: number,
): ToolIdentity | undefined {
  const agent = text(row?.["agent"]) ?? text(details["agent"]) ?? "subagent";
  if (agent === "workflow") return undefined;
  const runId = text(row?.["runId"]) ?? text(details["runId"]);
  const rowIndex = Number.isInteger(row?.["index"]) ? Number(row?.["index"]) : fallbackIndex;
  if (runId === undefined || rowIndex < 0) return undefined;
  return { agent, index: rowIndex, key: `${runId}:${String(rowIndex)}`, runId };
}

function sessionOutput(
  row: Record<string, unknown> | undefined,
  terminal: boolean,
): string | undefined {
  if (!terminal) return undefined;
  const artifactPaths = record(row?.["artifactPaths"]);
  const path =
    text(row?.["sessionFile"]) ??
    text(row?.["transcriptPath"]) ??
    text(artifactPaths?.["transcriptPath"]);
  return path !== undefined && isAbsolute(path) ? path : undefined;
}

function toolState(row: Record<string, unknown> | undefined, terminal: boolean): string {
  const reported = text(row?.["state"]) ?? text(row?.["status"]);
  if (reported !== undefined) return reported;
  if (!terminal) return "running";
  return row?.["success"] === false ? "failed" : "complete";
}

async function projectionFromToolRow(
  valueRow: unknown,
  details: Record<string, unknown>,
  fallbackIndex: number,
  snapshot: string,
  descriptors: DescriptorStore,
  terminal: boolean,
): Promise<ChildProjection | undefined> {
  const row = record(valueRow);
  const identity = toolIdentity(row, details, fallbackIndex);
  if (identity === undefined) return undefined;
  const sessionPath = sessionOutput(row, terminal);
  const outputPath = sessionPath ?? (await descriptors.feed(identity.key, snapshot));
  return {
    agent: identity.agent,
    asyncDir: descriptors.directory,
    index: identity.index,
    key: identity.key,
    outputPath,
    runId: identity.runId,
    sourceKind: sessionPath === undefined ? "text" : "session-jsonl",
    state: toolState(row, terminal),
    statusPath: join(descriptors.directory, "foreground-status.json"),
  };
}

export async function projectionsFromToolEvent(
  value: unknown,
  descriptors: DescriptorStore,
  terminal: boolean,
): Promise<ChildProjection[]> {
  const event = record(value);
  if (event?.["toolName"] !== "subagent") return [];
  const result = record(event["partialResult"]) ?? record(event["result"]);
  const details = record(result?.["details"]);
  if (result === undefined || details === undefined) return [];
  const snapshot = resultText(result);
  const rows = Array.isArray(details["results"]) ? details["results"] : [details];
  const projections: ChildProjection[] = [];
  for (const [fallbackIndex, valueRow] of rows.entries()) {
    const projection = await projectionFromToolRow(
      valueRow,
      details,
      fallbackIndex,
      snapshot,
      descriptors,
      terminal,
    );
    if (projection !== undefined) projections.push(projection);
  }
  return projections;
}

interface RpcReply {
  readonly data?: Record<string, unknown>;
  readonly success: boolean;
}

export async function rpcPing(
  events: {
    emit(channel: string, value: unknown): void;
    on(channel: string, listener: (value: unknown) => void): () => void;
  },
  timeoutMs = 1000,
): Promise<RpcReply | undefined> {
  const requestId = `pi-herdr-subagents-${randomUUID()}`;
  const replyChannel = `subagents:rpc:v1:reply:${requestId}`;
  return new Promise((resolvePing) => {
    let settled = false;
    const finish = (value: RpcReply | undefined): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolvePing(value);
    };
    const unsubscribe = events.on(replyChannel, (value) => {
      const reply = record(value);
      if (reply?.["requestId"] !== requestId || reply["version"] !== 1) return;
      const data = record(reply["data"]);
      finish({
        ...(data === undefined ? {} : { data }),
        success: reply["success"] === true,
      });
    });
    const timer = setTimeout(() => {
      finish(undefined);
    }, timeoutMs);
    timer.unref();
    events.emit("subagents:rpc:v1:request", {
      method: "ping",
      params: {},
      requestId,
      source: { extension: "@mopeyjellyfish/pi-herdr-subagents" },
      version: 1,
    });
  });
}
