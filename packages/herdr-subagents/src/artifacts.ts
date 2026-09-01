import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

import type { ChildProjection, ViewerDescriptor } from "./types.ts";

export interface DescriptorStore {
  readonly directory: string;
  close(): Promise<void>;
  feed(key: string, snapshot: string): Promise<string>;
  update(path: string, patch: Partial<ViewerDescriptor>): Promise<void>;
  write(descriptor: ViewerDescriptor): Promise<string>;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function index(value: unknown, fallback: number): number | undefined {
  const candidate = value === undefined ? fallback : value;
  return Number.isInteger(candidate) && Number(candidate) >= 0 ? Number(candidate) : undefined;
}

function inside(root: string, path: string): boolean {
  const relation = relative(resolve(root), resolve(path));
  return relation === "" || (!relation.startsWith("..") && !isAbsolute(relation));
}

function childrenOf(value: Record<string, unknown>): readonly unknown[] {
  for (const key of ["children", "steps", "results"] as const) {
    const children = value[key];
    if (Array.isArray(children) && children.length > 0) return children;
  }
  return [];
}

interface OutputSource {
  readonly outputPath: string;
  readonly sourceKind: "session-jsonl" | "text";
}

function outputSource(
  value: Record<string, unknown>,
  asyncDir: string,
  childIndex: number,
): OutputSource | undefined {
  const explicitOutput = text(value["outputFile"]) ?? text(value["outputPath"]);
  const sessionFile = text(value["sessionFile"]);
  const sourceKind =
    explicitOutput === undefined && sessionFile !== undefined ? "session-jsonl" : "text";
  const outputPath =
    explicitOutput ?? sessionFile ?? join(asyncDir, `output-${String(childIndex)}.log`);
  if (!isAbsolute(outputPath) || (sourceKind === "text" && !inside(asyncDir, outputPath))) {
    return undefined;
  }
  return { outputPath, sourceKind };
}

function projection(
  value: Record<string, unknown>,
  asyncRoot: string,
  fallbackIndex: number,
): ChildProjection | undefined {
  const runId = text(value["runId"]) ?? text(value["id"]);
  const childIndex = index(value["index"], fallbackIndex);
  if (runId === undefined || childIndex === undefined) return undefined;
  const asyncDir = text(value["asyncDir"]) ?? asyncRoot;
  const source = outputSource(value, asyncDir, childIndex);
  if (source === undefined) return undefined;
  const state = text(value["state"]) ?? text(value["status"]) ?? "running";
  return {
    agent: text(value["agent"]) ?? "subagent",
    asyncControl: true,
    asyncDir,
    index: childIndex,
    key: `${runId}:${String(childIndex)}`,
    outputPath: source.outputPath,
    runId,
    sourceKind: source.sourceKind,
    state,
    statusPath: join(asyncDir, "status.json"),
  };
}

function leaves(
  value: Record<string, unknown>,
  asyncRoot: string,
  result: ChildProjection[],
): void {
  const children = childrenOf(value);
  if (children.length === 0) {
    const leaf = projection(value, asyncRoot, result.length);
    if (leaf !== undefined) result.push(leaf);
    return;
  }
  for (const [childIndex, child] of children.entries()) {
    const item = record(child);
    if (item === undefined) continue;
    const childRoot = text(item["asyncDir"]) ?? asyncRoot;
    const nested = childrenOf(item);
    if (nested.length === 0) {
      const leaf = projection(item, childRoot, childIndex);
      if (leaf !== undefined) result.push(leaf);
    } else {
      leaves(item, childRoot, result);
    }
  }
}

export function projectionsFromStatus(
  value: unknown,
  asyncDir: string,
  sessionId: string,
): ChildProjection[] {
  const status = record(value);
  if (status === undefined || !isAbsolute(asyncDir)) return [];
  const observedSession = text(status["sessionId"]);
  if (observedSession !== undefined && observedSession !== sessionId) return [];
  const result: ChildProjection[] = [];
  leaves(status, asyncDir, result);
  const hasExactChild = childrenOf(status).some((child) => {
    const item = record(child);
    return text(item?.["runId"]) !== undefined || text(item?.["id"]) !== undefined;
  });
  const isWorkflowWrapper =
    text(status["mode"]) === "workflow" || text(status["agent"]) === "workflow";
  if (result.length === 0 && !hasExactChild && !isWorkflowWrapper) {
    const firstChild = record(childrenOf(status)[0]);
    const childSessionFile = text(firstChild?.["sessionFile"]);
    const childAgent = text(firstChild?.["agent"]);
    const topLevel = projection(
      {
        ...status,
        ...(childAgent === undefined ? {} : { agent: childAgent }),
        ...(childSessionFile === undefined ? {} : { sessionFile: childSessionFile }),
      },
      asyncDir,
      0,
    );
    if (topLevel !== undefined) result.push(topLevel);
  }
  return result.filter(
    (item, itemIndex) => result.findIndex((candidate) => candidate.key === item.key) === itemIndex,
  );
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${String(process.pid)}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  await rename(temporary, path);
}

export async function createDescriptorStore(root?: string): Promise<DescriptorStore> {
  const directory =
    root === undefined
      ? await mkdtemp(join(tmpdir(), "pi-herdr-subagents-"))
      : (await mkdir(root, { mode: 0o700, recursive: true }), root);
  const owned = new Set<string>();
  const feeds = new Map<string, string>();
  return {
    directory,
    async close() {
      await rm(directory, { force: true, recursive: true });
      owned.clear();
    },
    async feed(key, snapshot) {
      const digest = createHash("sha256").update(key).digest("hex").slice(0, 24);
      const path = join(directory, `${digest}.log`);
      const previous = feeds.get(key) ?? "";
      const next = snapshot.startsWith(previous)
        ? snapshot
        : `${previous}\n── transcript snapshot replaced ──\n${snapshot}`;
      feeds.set(key, next);
      await writeFile(path, next, { encoding: "utf8", mode: 0o600 });
      return path;
    },
    async update(path, patch) {
      if (!owned.has(path) || dirname(path) !== directory) return;
      const current = JSON.parse(await readFile(path, "utf8")) as ViewerDescriptor;
      await atomicJson(path, { ...current, ...patch });
    },
    async write(descriptor) {
      const digest = createHash("sha256").update(descriptor.key).digest("hex").slice(0, 24);
      const path = join(directory, `${digest}.json`);
      await atomicJson(path, descriptor);
      owned.add(path);
      return path;
    },
  };
}
