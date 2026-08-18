import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

import { computeFileHash, normalizeToLF, stripBom } from "./hashline/index.ts";

import type { Clipboard, InMemorySnapshotStore } from "./hashline/index.ts";
import type { ExtensionContext, SessionEntry } from "@earendil-works/pi-coding-agent";

const SCHEMA = "pi-hashline";
const VERSION = 1;
const MAX_STATE_BYTES = 32 * 1024;
const MAX_BRANCH_ENTRIES = 200;
const MAX_SNAPSHOTS = 20;
const MAX_PATH_LENGTH = 1024;
const MAX_SEEN_PER_SNAPSHOT = 1000;
const MAX_SEEN_TOTAL = 2000;
const MAX_REGISTERS = 10;
const MAX_REGISTER_NAME = 64;
const MAX_REGISTER_LINES = 100;
const MAX_REGISTER_CHARS = 4096;

interface StoredSnapshot {
  readonly path: string;
  readonly tag: string;
  /** Omitted when the model supplied the complete text through `write`. */
  readonly seen?: readonly number[];
}

interface HashlineState {
  readonly schema: typeof SCHEMA;
  readonly version: typeof VERSION;
  readonly snapshots: readonly StoredSnapshot[];
  readonly registers: Readonly<Record<string, readonly string[]>>;
}

export interface HashlineToolDetails {
  readonly hashline: HashlineState;
}

function byteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function boundedSeen(lines: Iterable<number> | undefined, remaining: number): number[] {
  return [...(lines ?? [])]
    .filter(Number.isSafeInteger)
    .filter((line) => line > 0)
    .slice(0, Math.min(MAX_SEEN_PER_SNAPSHOT, remaining));
}

function validLines(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_REGISTER_LINES &&
    value.every((line) => typeof line === "string") &&
    value.join("\n").length <= MAX_REGISTER_CHARS
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validPath(path: string): boolean {
  return (
    path.length > 0 && path.length <= MAX_PATH_LENGTH && isAbsolute(path) && resolve(path) === path
  );
}

function isSnapshot(value: unknown): value is StoredSnapshot {
  if (!isRecord(value)) return false;
  const { path, seen, tag } = value;
  return (
    typeof path === "string" &&
    validPath(path) &&
    typeof tag === "string" &&
    /^[0-9A-F]{4}$/u.test(tag) &&
    (seen === undefined ||
      (Array.isArray(seen) &&
        seen.length <= MAX_SEEN_PER_SNAPSHOT &&
        seen.every((line) => Number.isSafeInteger(line) && line > 0)))
  );
}

function isState(value: unknown): value is HashlineState {
  if (!isRecord(value)) return false;
  const { registers, schema, snapshots, version } = value;
  if (
    schema !== SCHEMA ||
    version !== VERSION ||
    !Array.isArray(snapshots) ||
    snapshots.length > MAX_SNAPSHOTS ||
    !snapshots.every(isSnapshot) ||
    !isRecord(registers)
  )
    return false;
  const registerEntries = Object.entries(registers);
  return (
    registerEntries.length <= MAX_REGISTERS &&
    registerEntries.every(
      ([name, lines]) => name.length <= MAX_REGISTER_NAME && validLines(lines),
    ) &&
    snapshots.reduce((total, snapshot) => total + (snapshot.seen?.length ?? 0), 0) <=
      MAX_SEEN_TOTAL &&
    new Set(snapshots.map((snapshot) => snapshot.path)).size === snapshots.length &&
    byteLength(value) <= MAX_STATE_BYTES
  );
}

function stateFromDetails(details: unknown): HashlineState | null {
  if (!isRecord(details)) return null;
  return isState(details["hashline"]) ? details["hashline"] : null;
}

function stateFromEntry(entry: SessionEntry): HashlineState | null {
  if (entry.type !== "message" || entry.message.role !== "toolResult") return null;
  return stateFromDetails(entry.message.details);
}

function serializeRegisters(
  clipboard: Clipboard,
  base: HashlineState,
): Readonly<Record<string, readonly string[]>> {
  const registers: Record<string, readonly string[]> = {};
  if (clipboard.named === undefined) return registers;
  for (const [name, lines] of clipboard.named) {
    if (
      name.length > MAX_REGISTER_NAME ||
      !validLines(lines) ||
      Object.keys(registers).length === MAX_REGISTERS
    )
      continue;
    const candidate = { ...base, registers: { ...registers, [name]: [...lines] } };
    if (byteLength(candidate) > MAX_STATE_BYTES) break;
    registers[name] = [...lines];
  }
  return registers;
}

/** Builds compact, independently valid session metadata without file content. */
export function detailsFor(
  snapshots: InMemorySnapshotStore,
  clipboard: Clipboard,
  paths: readonly string[],
): HashlineToolDetails {
  const recorded: StoredSnapshot[] = [];
  let seenRemaining = MAX_SEEN_TOTAL;
  for (const path of new Set(paths)) {
    if (recorded.length === MAX_SNAPSHOTS || !validPath(path)) break;
    const snapshot = snapshots.head(path);
    if (snapshot === null) continue;
    const seen = boundedSeen(snapshot.seenLines, seenRemaining);
    const stored: StoredSnapshot = {
      path,
      tag: snapshot.hash,
      ...(snapshot.seenLines === undefined ? {} : { seen }),
    };
    const candidate: HashlineState = {
      schema: SCHEMA,
      version: VERSION,
      snapshots: [...recorded, stored],
      registers: {},
    };
    if (byteLength(candidate) > MAX_STATE_BYTES) break;
    recorded.push(stored);
    seenRemaining -= seen.length;
  }
  const base: HashlineState = {
    schema: SCHEMA,
    version: VERSION,
    snapshots: recorded,
    registers: {},
  };
  const state: HashlineState = { ...base, registers: serializeRegisters(clipboard, base) };
  return { hashline: state };
}

function activeStates(ctx: ExtensionContext): HashlineState[] {
  const branch = ctx.sessionManager.getBranch();
  const states: HashlineState[] = [];
  for (
    let index = branch.length - 1;
    index >= Math.max(0, branch.length - MAX_BRANCH_ENTRIES);
    index--
  ) {
    const entry = branch[index];
    if (entry === undefined) continue;
    const state = stateFromEntry(entry);
    if (state !== null) states.push(state);
  }
  return states;
}

async function verifiedSnapshots(states: readonly HashlineState[]): Promise<
  readonly {
    readonly path: string;
    readonly text: string;
    readonly seen?: readonly number[];
  }[]
> {
  const attempted = new Set<string>();
  const restored: { path: string; text: string; seen?: readonly number[] }[] = [];
  for (const state of states) {
    for (const stored of state.snapshots) {
      if (attempted.size === MAX_SNAPSHOTS) return restored;
      if (attempted.has(stored.path)) continue;
      attempted.add(stored.path);
      try {
        const current = normalizeToLF(stripBom(await readFile(stored.path, "utf8")).text);
        if (computeFileHash(current) === stored.tag)
          restored.push({
            path: stored.path,
            text: current,
            ...(stored.seen === undefined ? {} : { seen: stored.seen }),
          });
      } catch {
        // File I/O is untrusted at restoration time; a fresh read is required.
      }
    }
  }
  return restored;
}

/** Restore active-branch metadata, giving latest registers and each path's latest snapshot precedence. */
export async function restoreState(
  ctx: ExtensionContext,
  snapshots: InMemorySnapshotStore,
  clipboard: Clipboard,
): Promise<void> {
  const states = activeStates(ctx);
  const restored = await verifiedSnapshots(states);
  const registers =
    states[0] === undefined
      ? undefined
      : new Map(Object.entries(states[0].registers).map(([name, lines]) => [name, [...lines]]));
  snapshots.clear();
  for (const snapshot of restored) snapshots.record(snapshot.path, snapshot.text, snapshot.seen);
  if (registers === undefined) clipboard.named?.clear();
  else clipboard.named = registers;
}
