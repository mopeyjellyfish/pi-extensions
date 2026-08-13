import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { isAbsolute } from "node:path";

import {
  isToolCallEventType,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";

interface BrowserEntry {
  readonly name: string;
  readonly status: string;
  readonly workspace: string;
}

interface Launcher {
  readonly arguments: readonly string[];
  readonly command: string;
  readonly key: string;
}

interface LauncherState {
  readonly cwd: string;
  readonly launcher: Launcher;
  readonly name: string;
}

const DIRECT: Launcher = { arguments: [], command: "playwright-cli", key: "direct" };
const NPX: Launcher = {
  arguments: ["--no-install", "playwright-cli"],
  command: "npx",
  key: "npx",
};
const DELEGATED_LAUNCHER =
  /\b(?:npx(?:\s+--no-install)?|npm\s+exec(?:\s+--)?)\s+playwright-cli\b/gu;

function launchersFor(command: string): Launcher[] {
  const launchers: Launcher[] = [];
  if (/\bnpx\s+--no-install\s+playwright-cli\b/u.test(command)) launchers.push(NPX);
  if (/\bplaywright-cli\b/u.test(command.replaceAll(DELEGATED_LAUNCHER, ""))) {
    launchers.push(DIRECT);
  }
  return launchers;
}

function browserEntries(stdout: string): BrowserEntry[] | undefined {
  try {
    const parsed = JSON.parse(stdout) as { readonly browsers?: readonly unknown[] };
    if (!Array.isArray(parsed.browsers) || parsed.browsers.length > 10_000) return undefined;
    const entries: BrowserEntry[] = [];
    for (const value of parsed.browsers) {
      if (typeof value !== "object" || value === null) return undefined;
      const entry = value as Readonly<Record<string, unknown>>;
      if (
        typeof entry["name"] !== "string" ||
        typeof entry["status"] !== "string" ||
        typeof entry["workspace"] !== "string"
      ) {
        return undefined;
      }
      entries.push({ name: entry["name"], status: entry["status"], workspace: entry["workspace"] });
    }
    return entries;
  } catch {
    return undefined;
  }
}

async function list(
  pi: ExtensionAPI,
  state: LauncherState,
): Promise<{ readonly entries: readonly BrowserEntry[]; readonly ok: boolean }> {
  try {
    const result = await pi.exec(
      state.launcher.command,
      [...state.launcher.arguments, "list", "--all", "--json"],
      { cwd: state.cwd, timeout: 5000 },
    );
    const entries = browserEntries(result.stdout);
    return { entries: entries ?? [], ok: result.code === 0 && entries !== undefined };
  } catch {
    return { entries: [], ok: false };
  }
}

async function cleanup(pi: ExtensionAPI, state: LauncherState): Promise<number> {
  const initial = await list(pi, state);
  if (!initial.ok) return 1;

  const owned = initial.entries.filter(
    (entry) => entry.status === "open" && entry.name === state.name,
  );
  for (const entry of owned) {
    const cwd = isAbsolute(entry.workspace) ? entry.workspace : tmpdir();
    try {
      await pi.exec(
        state.launcher.command,
        [...state.launcher.arguments, `-s=${entry.name}`, "close"],
        { cwd, timeout: 5000 },
      );
    } catch {
      // Verification below reports any session that remains open.
    }
  }

  const verified = await list(pi, state);
  if (!verified.ok) return 1;
  return verified.entries.filter((entry) => entry.status === "open" && entry.name === state.name)
    .length;
}

export default function playwrightCleanupExtension(pi: ExtensionAPI): void {
  const defaultSession = `pi-${String(process.pid)}-${randomUUID().slice(0, 8)}`;
  const launchers = new Map<string, LauncherState>();

  pi.on("tool_call", (event, ctx) => {
    if (!isToolCallEventType("bash", event)) return;
    const command = event.input.command;
    const detected = launchersFor(command);
    if (detected.length === 0) return;

    for (const launcher of detected) {
      if (!launchers.has(launcher.key)) {
        launchers.set(launcher.key, { cwd: ctx.cwd, launcher, name: defaultSession });
      }
    }
    event.input.command = `export PLAYWRIGHT_CLI_SESSION=${defaultSession}; ${command}`;
  });

  const cleanupOwned = async (ctx: ExtensionContext, retryOnShutdown: boolean): Promise<void> => {
    const pending = [...launchers.values()];
    launchers.clear();
    const results = await Promise.all(
      pending.map(async (state) => ({ remaining: await cleanup(pi, state), state })),
    );
    const failed = results.filter(({ remaining }) => remaining > 0);
    if (retryOnShutdown) {
      for (const { state } of failed) launchers.set(state.launcher.key, state);
    }
    const remaining = failed.reduce((total, result) => total + result.remaining, 0);
    if (remaining > 0 && ctx.hasUI) {
      ctx.ui.notify(
        `Playwright cleanup could not close or verify ${String(remaining)} Pi-owned browser session(s). No global cleanup was attempted. Review the remaining sessions with playwright-cli list --all --json.`,
        "warning",
      );
    }
  };

  pi.on("agent_settled", async (_event, ctx) => cleanupOwned(ctx, true));
  pi.on("session_shutdown", async (_event, ctx) => cleanupOwned(ctx, false));
}
