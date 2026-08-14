import { createHash, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { StringEnum } from "@earendil-works/pi-ai";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  getAgentDir,
  isToolCallEventType,
  truncateTail,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";

const WORKTREE_ROUTE_EVENT = "mopeyjellyfish:pi-worktrunk:route:v1";
const LEASE_VERSION = 1;
const PROCESS_TIMEOUT = 5000;
const CLOSE_WAIT = 2000;
const BLOCKED_CONTEXT_TOOLS = new Set(["ctx_batch_execute", "ctx_execute", "ctx_execute_file"]);
const PLAYWRIGHT_CLI_PATTERN = /\bplaywright-cli\b|@playwright\/cli\b/u;
const BLOCKED_RUN_COMMANDS = new Set([
  "attach",
  "close",
  "close-all",
  "delete-data",
  "install",
  "install-browser",
  "kill-all",
  "open",
  "show",
]);

const ACTIONS = ["open", "run", "close", "status"] as const;

const PlaywrightBrowserParameters = Type.Object(
  {
    action: StringEnum(ACTIONS),
    arguments: Type.Optional(Type.Array(Type.String({ maxLength: 4096 }), { maxItems: 100 })),
    browser: Type.Optional(
      StringEnum(["chromium", "chrome", "firefox", "webkit", "msedge"] as const),
    ),
    command: Type.Optional(Type.String({ maxLength: 80 })),
    config: Type.Optional(Type.String({ maxLength: 4096 })),
    headed: Type.Optional(Type.Boolean()),
    persistent: Type.Optional(Type.Boolean()),
    profile: Type.Optional(Type.String({ maxLength: 4096 })),
    url: Type.Optional(Type.String({ maxLength: 16_384 })),
  },
  { additionalProperties: false },
);

type BrowserAction = (typeof ACTIONS)[number];
type PlaywrightBrowserInput = Static<typeof PlaywrightBrowserParameters>;

interface ProcessIdentity {
  readonly commandHash: string;
  readonly pid: number;
  readonly ppid: number;
  readonly startedAt: string;
}

interface SystemProcess extends ProcessIdentity {
  readonly command: string;
}

interface BrowserLease {
  readonly createdAt: string;
  readonly daemonPid?: number;
  readonly launcher: "playwright-cli";
  readonly ownerPiSessionId: string;
  readonly ownerProcess: ProcessIdentity;
  readonly processes: readonly ProcessIdentity[];
  readonly sessionName: string;
  readonly updatedAt: string;
  readonly version: 1;
  readonly workspace: string;
}

interface BrowserToolDetails {
  readonly action: BrowserAction;
  readonly daemonPid?: number;
  readonly ownerPiSessionId: string;
  readonly sessionName: string;
  readonly workspace?: string;
}

interface WorktreeRouteEventV1 {
  readonly activePath: string;
  readonly version: 1;
}

export interface PlaywrightCleanupOptions {
  readonly leaseDirectory?: string;
}

/* v8 ignore start -- defensive validation paths reject malformed external state */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function routeEvent(value: unknown): WorktreeRouteEventV1 | undefined {
  if (
    !isRecord(value) ||
    value["version"] !== 1 ||
    typeof value["activePath"] !== "string" ||
    value["activePath"].trim() === ""
  ) {
    return undefined;
  }
  return { activePath: value["activePath"], version: 1 };
}

function processIdentity(value: unknown): value is ProcessIdentity {
  if (!isRecord(value)) return false;
  return (
    Number.isInteger(value["pid"]) &&
    Number.isInteger(value["ppid"]) &&
    typeof value["startedAt"] === "string" &&
    value["startedAt"] !== "" &&
    typeof value["commandHash"] === "string" &&
    /^[0-9a-f]{64}$/u.test(value["commandHash"])
  );
}

function browserLease(value: unknown): value is BrowserLease {
  if (!isRecord(value) || !Array.isArray(value["processes"])) return false;
  const strings = ["createdAt", "ownerPiSessionId", "updatedAt", "workspace"] as const;
  const validStrings = strings.every(
    (field) => typeof value[field] === "string" && value[field] !== "",
  );
  return (
    value["version"] === LEASE_VERSION &&
    value["launcher"] === "playwright-cli" &&
    validStrings &&
    typeof value["sessionName"] === "string" &&
    /^pi-[a-zA-Z0-9-]+$/u.test(value["sessionName"]) &&
    processIdentity(value["ownerProcess"]) &&
    value["processes"].every(processIdentity) &&
    (value["daemonPid"] === undefined || Number.isInteger(value["daemonPid"]))
  );
}

/* v8 ignore stop */

function commandHash(command: string): string {
  return createHash("sha256").update(command).digest("hex");
}

function processIdentityFor(process: SystemProcess): ProcessIdentity {
  return {
    commandHash: process.commandHash,
    pid: process.pid,
    ppid: process.ppid,
    startedAt: process.startedAt,
  };
}

function parsePosixProcesses(stdout: string): SystemProcess[] | undefined {
  const processes: SystemProcess[] = [];
  for (const line of stdout.split("\n")) {
    if (line.trim() === "") continue;
    const fields = line.trimStart().split(/[ \t]+/u);
    const pid = Number(fields[0]);
    const ppid = Number(fields[1]);
    const startedAt = fields.slice(2, 7).join(" ");
    const command = fields.slice(7).join(" ");
    if (
      !Number.isInteger(pid) ||
      !Number.isInteger(ppid) ||
      !/^\S+ \S+ \d+ \d\d:\d\d:\d\d \d{4}$/u.test(startedAt) ||
      command === ""
    ) {
      return undefined;
    }
    processes.push({ command, commandHash: commandHash(command), pid, ppid, startedAt });
  }
  return processes;
}

/* v8 ignore start -- exercised on Windows, not by the Unix CI process table */
function parseWindowsProcesses(stdout: string): SystemProcess[] | undefined {
  try {
    const parsed = JSON.parse(stdout) as unknown;
    const values = Array.isArray(parsed) ? parsed : [parsed];
    const processes: SystemProcess[] = [];
    for (const value of values) {
      if (!isRecord(value)) return undefined;
      const pid = Number(value["ProcessId"]);
      const ppid = Number(value["ParentProcessId"]);
      const startedAt = value["CreationDate"];
      const command = value["CommandLine"];
      if (
        !Number.isInteger(pid) ||
        !Number.isInteger(ppid) ||
        typeof startedAt !== "string" ||
        startedAt === "" ||
        typeof command !== "string" ||
        command === ""
      ) {
        return undefined;
      }
      processes.push({ command, commandHash: commandHash(command), pid, ppid, startedAt });
    }
    return processes;
  } catch {
    return undefined;
  }
}
/* v8 ignore stop */

async function listProcesses(pi: ExtensionAPI): Promise<SystemProcess[] | undefined> {
  try {
    if (process.platform === "win32") {
      const result = await pi.exec(
        "powershell",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress",
        ],
        { timeout: PROCESS_TIMEOUT },
      );
      return result.code === 0 ? parseWindowsProcesses(result.stdout) : undefined;
    }
    const result = await pi.exec("ps", ["-axo", "pid=,ppid=,lstart=,command="], {
      timeout: PROCESS_TIMEOUT,
    });
    return result.code === 0 ? parsePosixProcesses(result.stdout) : undefined;
  } catch {
    return undefined;
  }
}

function sameProcess(left: ProcessIdentity, right: ProcessIdentity): boolean {
  return (
    left.pid === right.pid &&
    left.startedAt === right.startedAt &&
    left.commandHash === right.commandHash
  );
}

function processTree(
  processes: readonly SystemProcess[],
  roots: readonly SystemProcess[],
): ProcessIdentity[] {
  const selected = new Map(roots.map((systemProcess) => [systemProcess.pid, systemProcess]));
  let parents = new Set(roots.map((systemProcess) => systemProcess.pid));
  while (parents.size > 0) {
    const next = new Set<number>();
    for (const process of processes) {
      if (parents.has(process.ppid) && !selected.has(process.pid)) {
        selected.set(process.pid, process);
        next.add(process.pid);
      }
    }
    parents = next;
  }
  return [...selected.values()].map(processIdentityFor);
}

function daemonProcesses(
  processes: readonly SystemProcess[],
  sessionName: string,
): SystemProcess[] {
  const suffix = ` ${sessionName}`;
  return processes.filter(
    (process) =>
      /(?:^|[/\\])cliDaemon\.js(?:\s|$)/u.test(process.command) && process.command.endsWith(suffix),
  );
}

function currentMatches(
  identities: readonly ProcessIdentity[],
  processes: readonly SystemProcess[],
): ProcessIdentity[] {
  const current = new Map<number, SystemProcess>(
    processes.map((systemProcess) => [systemProcess.pid, systemProcess]),
  );
  return identities.filter((identity) => {
    const process = current.get(identity.pid);
    return process !== undefined && sameProcess(identity, process);
  });
}

function leasePath(directory: string, sessionName: string): string {
  return join(directory, `${sessionName}.json`);
}

async function writeLease(directory: string, lease: BrowserLease): Promise<void> {
  await mkdir(directory, { mode: 0o700, recursive: true });
  const path = leasePath(directory, lease.sessionName);
  const temporary = `${path}.${String(process.pid)}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(lease, undefined, 2)}\n`, { mode: 0o600 });
  await chmod(temporary, 0o600);
  await rename(temporary, path);
}

async function removeLease(directory: string, sessionName: string): Promise<void> {
  await rm(leasePath(directory, sessionName), { force: true });
}

async function readLeases(directory: string): Promise<BrowserLease[]> {
  let directoryFiles: string[];
  try {
    directoryFiles = await readdir(directory);
  } catch {
    directoryFiles = [];
  }
  const files = directoryFiles.filter((file) => file.endsWith(".json"));
  const leases: BrowserLease[] = [];
  for (const file of files) {
    try {
      const contents = await readFile(join(directory, file), "utf8");
      if (Buffer.byteLength(contents, "utf8") > 65_536) continue;
      const parsed = JSON.parse(contents) as unknown;
      if (browserLease(parsed)) leases.push(parsed);
    } catch {
      // A malformed lease cannot grant process-termination authority.
    }
  }
  return leases;
}

function openResult(stdout: string): { readonly pid: number } | undefined {
  try {
    const parsed = JSON.parse(stdout) as unknown;
    if (!isRecord(parsed) || !Number.isInteger(parsed["pid"])) return undefined;
    return { pid: parsed["pid"] as number };
  } catch {
    return undefined;
  }
}

function output(stdout: string, stderr: string): string {
  const text = stdout.trim() || stderr.trim() || "Playwright CLI completed without output.";
  const truncated = truncateTail(text, {
    maxBytes: DEFAULT_MAX_BYTES,
    maxLines: DEFAULT_MAX_LINES,
  });
  return `${truncated.content}${truncated.truncated ? "\n[Playwright CLI output truncated.]" : ""}`;
}

function inputFields(input: PlaywrightBrowserInput): void {
  const allowed: Readonly<Record<BrowserAction, ReadonlySet<keyof PlaywrightBrowserInput>>> = {
    close: new Set(["action"]),
    open: new Set(["action", "browser", "config", "headed", "persistent", "profile", "url"]),
    run: new Set(["action", "arguments", "command"]),
    status: new Set(["action"]),
  };
  const unexpected = Object.keys(input).filter(
    (key) => !allowed[input.action].has(key as keyof PlaywrightBrowserInput),
  );
  if (unexpected.length > 0) {
    throw new Error(`action=${input.action} does not accept: ${unexpected.join(", ")}.`);
  }
}

/* v8 ignore start -- schema-valid tool input plus defensive invalid-input checks */
function commandArguments(command: string | undefined, arguments_: readonly string[]): string {
  const value = command?.trim();
  if (value === undefined || value === "") throw new Error("command is required for action=run.");
  if (!/^[a-z][a-z0-9-]*$/u.test(value) || BLOCKED_RUN_COMMANDS.has(value)) {
    throw new Error(`playwright_browser action=run does not permit command=${value}.`);
  }
  if (arguments_.some((argument) => /^(?:-s|--session|--json)(?:=|$)/u.test(argument))) {
    throw new Error("Session and JSON flags are owned by playwright_browser.");
  }
  return value;
}

/* v8 ignore stop */

function sessionName(sessionId: string): string {
  const safe = sessionId.replaceAll(/[^a-zA-Z0-9]/gu, "").slice(-20) || "session";
  return `pi-${safe}-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function notify(ctx: ExtensionContext, message: string): void {
  if (ctx.hasUI) ctx.ui.notify(message, "warning");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function signalProcesses(processes: readonly ProcessIdentity[], signal: NodeJS.Signals): void {
  for (const identity of [...processes].sort((left, right) => right.pid - left.pid)) {
    try {
      process.kill(identity.pid, signal);
    } catch {
      // It exited between validation and signalling.
    }
  }
}

export default function playwrightCleanupExtension(
  pi: ExtensionAPI,
  options: PlaywrightCleanupOptions = {},
): void {
  const leaseDirectory = options.leaseDirectory ?? join(getAgentDir(), "playwright-browser-leases");
  let activeWorkspace: string | undefined;
  let currentLease: BrowserLease | undefined;
  let ownerProcess: ProcessIdentity | undefined;
  let ownerPiSessionId = "";
  let ownedSessionName = "";
  let activeOperation = false;
  const waiters: (() => void)[] = [];

  const acquire = async (): Promise<void> => {
    if (!activeOperation) {
      activeOperation = true;
      return;
    }
    await new Promise<void>((resolve) => waiters.push(resolve));
  };

  const release = (): void => {
    const next = waiters.shift();
    if (next === undefined) activeOperation = false;
    else next();
  };

  const serialized = async <T>(operation: () => Promise<T>): Promise<T> => {
    await acquire();
    try {
      return await operation();
    } finally {
      release();
    }
  };

  const refreshProcesses = async (
    lease: BrowserLease,
    knownProcesses?: readonly SystemProcess[],
  ): Promise<BrowserLease | undefined> => {
    const processes = knownProcesses ?? (await listProcesses(pi));
    if (processes === undefined) return undefined;
    const candidates = daemonProcesses(processes, lease.sessionName);
    const daemonIdentity = lease.processes.find((identity) => identity.pid === lease.daemonPid);
    const daemonAtRecordedPid = processes.find(
      (systemProcess) => systemProcess.pid === lease.daemonPid,
    );
    if (
      daemonIdentity !== undefined &&
      daemonAtRecordedPid !== undefined &&
      !sameProcess(daemonIdentity, daemonAtRecordedPid)
    ) {
      return undefined;
    }
    const roots =
      lease.processes.length === 0
        ? candidates
        : candidates.filter((candidate) =>
            lease.processes.some((identity) => sameProcess(identity, candidate)),
          );
    const existing = currentMatches(lease.processes, processes);
    const retained = processTree(processes, roots);
    const tree = new Map([...existing, ...retained].map((identity) => [identity.pid, identity]));
    const daemonPid = roots[0]?.pid ?? lease.daemonPid;
    const refreshed: BrowserLease = {
      ...lease,
      ...(daemonPid === undefined ? {} : { daemonPid }),
      processes: [...tree.values()],
      updatedAt: new Date().toISOString(),
    };
    await writeLease(leaseDirectory, refreshed);
    return refreshed;
  };

  /* v8 ignore start -- conservative ambiguity branches intentionally retain the lease */
  const discoverRecordedTree = async (
    lease: BrowserLease,
    processes: readonly SystemProcess[],
  ): Promise<BrowserLease | undefined> => {
    if (lease.processes.length > 0 || lease.daemonPid === undefined) return lease;
    const daemon = processes.find((process) => process.pid === lease.daemonPid);
    if (daemon === undefined) return lease;
    if (daemonProcesses([daemon], lease.sessionName).length === 0) return undefined;
    const tracked = {
      ...lease,
      processes: processTree(processes, [daemon]),
      updatedAt: new Date().toISOString(),
    };
    await writeLease(leaseDirectory, tracked);
    return tracked;
  };
  /* v8 ignore stop */

  const cleanupLease = async (lease: BrowserLease): Promise<boolean> => {
    const processesBeforeClose = await listProcesses(pi);
    if (processesBeforeClose === undefined) return false;
    let tracked = await refreshProcesses(lease, processesBeforeClose);
    if (tracked === undefined) return false;
    try {
      await pi.exec(tracked.launcher, ["--json", `-s=${tracked.sessionName}`, "close"], {
        cwd: tracked.workspace,
        timeout: 10_000,
      });
    } catch {
      // Exact owned-process cleanup below is independent of registry/socket health.
    }

    let processes = await listProcesses(pi);
    if (processes === undefined) return false;
    const discovered = await discoverRecordedTree(tracked, processes);
    if (discovered === undefined) return false;
    tracked = discovered;
    let remaining = currentMatches(tracked.processes, processes);
    if (remaining.length > 0) {
      await delay(CLOSE_WAIT);
      processes = await listProcesses(pi);
      if (processes === undefined) return false;
      remaining = currentMatches(remaining, processes);
    }
    if (remaining.length > 0) {
      signalProcesses(remaining, "SIGTERM");
      await delay(CLOSE_WAIT);
      processes = await listProcesses(pi);
      if (processes === undefined) return false;
      remaining = currentMatches(remaining, processes);
    }
    if (remaining.length > 0) {
      signalProcesses(remaining, "SIGKILL");
      await delay(CLOSE_WAIT);
      processes = await listProcesses(pi);
      if (processes === undefined) return false;
      remaining = currentMatches(remaining, processes);
    }
    if (remaining.length > 0) {
      tracked = { ...tracked, processes: remaining, updatedAt: new Date().toISOString() };
      await writeLease(leaseDirectory, tracked);
      return false;
    }
    await removeLease(leaseDirectory, lease.sessionName);
    if (currentLease?.sessionName === lease.sessionName) currentLease = undefined;
    return true;
  };

  const recoverLeases = async (ctx: ExtensionContext): Promise<void> => {
    const leases = await readLeases(leaseDirectory);
    if (leases.length === 0) return;
    const processes = await listProcesses(pi);
    if (processes === undefined) {
      notify(
        ctx,
        "Playwright cleanup could not inspect processes; stale browser leases were left unchanged.",
      );
      return;
    }
    let failed = 0;
    for (const lease of leases) {
      const owner = processes.find((candidate) => candidate.pid === lease.ownerProcess.pid);
      const ownerIsCurrentProcess = lease.ownerProcess.pid === process.pid;
      if (owner !== undefined && sameProcess(owner, lease.ownerProcess) && !ownerIsCurrentProcess) {
        continue;
      }
      if (!(await cleanupLease(lease))) failed += 1;
    }
    if (failed > 0) {
      notify(
        ctx,
        `Playwright cleanup could not verify ${String(failed)} stale owned browser lease(s). No browser from another live Pi session was terminated.`,
      );
    }
  };

  const closeCurrent = async (ctx: ExtensionContext): Promise<void> => {
    if (currentLease === undefined) return;
    if (!(await cleanupLease(currentLease))) {
      notify(
        ctx,
        `Playwright cleanup could not stop or verify session ${currentLease.sessionName}. The durable lease remains for the next Pi startup.`,
      );
    }
  };

  const ensureOwner = (): ProcessIdentity => {
    if (ownerProcess === undefined || ownerPiSessionId === "" || ownedSessionName === "") {
      throw new Error(
        "Playwright browser ownership is unavailable because Pi process identity was not established.",
      );
    }
    return ownerProcess;
  };

  /* v8 ignore start -- optional detail omission is an output-shape fallback */
  const details = (action: BrowserAction): BrowserToolDetails => ({
    action,
    ...(currentLease?.daemonPid === undefined ? {} : { daemonPid: currentLease.daemonPid }),
    ownerPiSessionId,
    sessionName: ownedSessionName,
    ...(currentLease?.workspace === undefined ? {} : { workspace: currentLease.workspace }),
  });
  /* v8 ignore stop */

  const execOwned = async (
    command: string,
    arguments_: readonly string[],
    signal: AbortSignal | undefined,
  ) => {
    if (currentLease === undefined) throw new Error("Open the Playwright browser first.");
    return pi.exec(
      currentLease.launcher,
      ["--json", `-s=${currentLease.sessionName}`, command, ...arguments_],
      {
        cwd: currentLease.workspace,
        ...(signal === undefined ? {} : { signal }),
        timeout: 120_000,
      },
    );
  };

  const newOpenArguments = (input: PlaywrightBrowserInput): string[] => {
    const arguments_ = ["--json", `-s=${ownedSessionName}`, "open"];
    if (input.headed === true) arguments_.push("--headed");
    if (input.browser !== undefined) arguments_.push(`--browser=${input.browser}`);
    if (input.persistent === true) arguments_.push("--persistent");
    if (input.profile !== undefined) arguments_.push(`--profile=${input.profile}`);
    if (input.config !== undefined) arguments_.push(`--config=${input.config}`);
    if (input.url !== undefined) arguments_.push(input.url);
    return arguments_;
  };

  const createBrowser = async (
    input: PlaywrightBrowserInput,
    signal: AbortSignal | undefined,
    ctx: ExtensionContext,
  ) => {
    const workspace = activeWorkspace ?? ctx.cwd;
    const now = new Date().toISOString();
    let lease: BrowserLease = {
      createdAt: now,
      launcher: "playwright-cli",
      ownerPiSessionId,
      ownerProcess: ensureOwner(),
      processes: [],
      sessionName: ownedSessionName,
      updatedAt: now,
      version: LEASE_VERSION,
      workspace,
    };
    currentLease = lease;
    await writeLease(leaseDirectory, lease);
    const result = await pi.exec(lease.launcher, newOpenArguments(input), {
      cwd: workspace,
      ...(signal === undefined ? {} : { signal }),
      timeout: 120_000,
    });
    const opened = openResult(result.stdout);
    if (opened !== undefined) lease = { ...lease, daemonPid: opened.pid };
    currentLease = (await refreshProcesses(lease)) ?? lease;
    await writeLease(leaseDirectory, currentLease);
    if (result.code !== 0 || opened === undefined) {
      throw new Error(output(result.stdout, result.stderr));
    }
    return {
      content: [{ type: "text" as const, text: output(result.stdout, result.stderr) }],
      details: details(input.action),
    };
  };

  const openBrowser = async (
    input: PlaywrightBrowserInput,
    signal: AbortSignal | undefined,
    ctx: ExtensionContext,
  ) => {
    if (currentLease === undefined) {
      ensureOwner();
      return createBrowser(input, signal, ctx);
    }
    const command = input.url === undefined ? "snapshot" : "goto";
    const arguments_ = input.url === undefined ? [] : [input.url];
    const result = await execOwned(command, arguments_, signal);
    if (result.code !== 0) throw new Error(output(result.stdout, result.stderr));
    return {
      content: [{ type: "text" as const, text: output(result.stdout, result.stderr) }],
      details: details(input.action),
    };
  };

  const runBrowser = async (input: PlaywrightBrowserInput, signal: AbortSignal | undefined) => {
    const arguments_ = input.arguments ?? [];
    const command = commandArguments(input.command, arguments_);
    const result = await execOwned(command, arguments_, signal);
    if (result.code !== 0) throw new Error(output(result.stdout, result.stderr));
    return {
      content: [{ type: "text" as const, text: output(result.stdout, result.stderr) }],
      details: details(input.action),
    };
  };

  const executeBrowser = async (
    input: PlaywrightBrowserInput,
    signal: AbortSignal | undefined,
    ctx: ExtensionContext,
  ) => {
    if (input.action === "open") return openBrowser(input, signal, ctx);
    ensureOwner();
    switch (input.action) {
      case "status": {
        const state = currentLease === undefined ? "closed" : "open or recovering";
        return {
          content: [
            { type: "text" as const, text: `Playwright session ${ownedSessionName}: ${state}.` },
          ],
          details: details(input.action),
        };
      }
      case "close": {
        await closeCurrent(ctx);
        if (currentLease !== undefined) {
          throw new Error(`Could not verify cleanup of ${ownedSessionName}.`);
        }
        return {
          content: [
            {
              type: "text" as const,
              text: `Playwright session ${ownedSessionName} closed and verified.`,
            },
          ],
          details: details(input.action),
        };
      }
      case "run":
        return runBrowser(input, signal);
    }
  };

  pi.events.on(WORKTREE_ROUTE_EVENT, (value) => {
    activeWorkspace = value === undefined ? undefined : routeEvent(value)?.activePath;
  });

  pi.on("session_start", async (_event, ctx) => {
    await serialized(async () => {
      ownerPiSessionId = ctx.sessionManager.getSessionId();
      ownedSessionName = sessionName(ownerPiSessionId);
      const processes = await listProcesses(pi);
      const processRecord = processes?.find((candidate) => candidate.pid === process.pid);
      ownerProcess = processRecord === undefined ? undefined : processIdentityFor(processRecord);
      await recoverLeases(ctx);
    });
  });

  pi.on("tool_call", (event) => {
    if (isToolCallEventType("bash", event) && PLAYWRIGHT_CLI_PATTERN.test(event.input.command)) {
      return {
        block: true,
        reason:
          "Use the playwright_browser tool. Direct playwright-cli Bash commands bypass durable ownership and cleanup.",
      };
    }
    if (
      BLOCKED_CONTEXT_TOOLS.has(event.toolName) &&
      PLAYWRIGHT_CLI_PATTERN.test(JSON.stringify(event.input))
    ) {
      return {
        block: true,
        reason:
          "Use the playwright_browser tool. Running playwright-cli through context-mode bypasses durable ownership and cleanup.",
      };
    }
    // Tool-call handlers may allow the call by returning no result.
    return;
  });

  pi.registerTool({
    name: "playwright_browser",
    label: "Playwright browser",
    description:
      "Open, control, inspect, and close one Playwright CLI browser that is durably owned by the current Pi session. Output is limited to 50 KB or 2,000 lines.",
    promptSnippet: "Open and control one Pi-owned Playwright CLI browser with durable cleanup",
    promptGuidelines: [
      "Use playwright_browser instead of running playwright-cli through bash or context-mode tools.",
      "Reuse the current playwright_browser session and call action=close when browser work is complete.",
    ],
    parameters: PlaywrightBrowserParameters,
    async execute(_toolCallId, input, signal, _onUpdate, ctx) {
      inputFields(input);
      return serialized(async () => executeBrowser(input, signal, ctx));
    },
  });

  pi.on("agent_settled", async (_event, ctx) => serialized(async () => closeCurrent(ctx)));
  pi.on("session_shutdown", async (_event, ctx) => serialized(async () => closeCurrent(ctx)));
}
