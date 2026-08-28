import { fileURLToPath } from "node:url";

import type { HerdrAdapter, OpenPaneInput } from "./supervisor.ts";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const FIXED_VIEWER_COMMAND = 'exec node "$PI_HERDR_SUBAGENT_VIEWER"';

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function parseJson(value: string): Record<string, unknown> | undefined {
  try {
    return record(JSON.parse(value));
  } catch {
    return undefined;
  }
}

function paneId(value: string): string | undefined {
  const root = parseJson(value);
  const result = record(root?.["result"]);
  const pane = record(result?.["pane"]);
  const id = pane?.["pane_id"];
  return typeof id === "string" && id !== "" ? id : undefined;
}

function shellReady(value: string): boolean {
  const root = parseJson(value);
  const result = record(root?.["result"]);
  const info = record(result?.["process_info"]);
  const shell = info?.["shell_pid"];
  const foreground = info?.["foreground_process_group_id"];
  return typeof shell === "number" && (foreground === shell || foreground === undefined);
}

function label(value: string): string {
  return Array.from(value, (character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 31 || (code >= 127 && code <= 159) ? " " : character;
  })
    .join("")
    .slice(0, 80);
}

export class HerdrCli implements HerdrAdapter {
  readonly #cwd: string;
  readonly #exec: ExtensionAPI["exec"];
  readonly #viewerPath = fileURLToPath(new URL("viewer-runner.mjs", import.meta.url));

  constructor(pi: Pick<ExtensionAPI, "exec">, cwd: string) {
    this.#cwd = cwd;
    this.#exec = pi.exec.bind(pi);
  }

  async close(id: string): Promise<void> {
    await this.#exec("herdr", ["pane", "close", id], { timeout: 2000 });
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.#exec("herdr", ["pane", "get", id], { timeout: 2000 });
    return result.code === 0;
  }

  async open(input: OpenPaneInput): Promise<string> {
    const split = await this.#exec(
      "herdr",
      [
        "pane",
        "split",
        "--pane",
        input.targetPaneId,
        "--direction",
        input.direction,
        "--ratio",
        input.direction === "right" ? "0.6" : "0.5",
        "--cwd",
        this.#cwd,
        "--env",
        `PI_HERDR_SUBAGENT_VIEWER=${this.#viewerPath}`,
        "--env",
        `PI_HERDR_SUBAGENT_DESCRIPTOR=${input.descriptorPath}`,
        "--no-focus",
      ],
      { timeout: 5000 },
    );
    const id = split.code === 0 ? paneId(split.stdout) : undefined;
    if (id === undefined) throw new Error("Herdr did not return an exact pane id.");

    let ready = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const inspection = await this.#exec("herdr", ["pane", "process-info", "--pane", id], {
        timeout: 1000,
      });
      if (inspection.code === 0 && shellReady(inspection.stdout)) {
        ready = true;
        break;
      }
      await new Promise((resolveReady) => setTimeout(resolveReady, 25));
    }
    if (!ready) {
      await this.close(id);
      throw new Error("The new Herdr pane did not reach an interactive shell prompt.");
    }

    const run = await this.#exec("herdr", ["pane", "run", id, FIXED_VIEWER_COMMAND], {
      timeout: 2000,
    });
    if (run.code !== 0) {
      await this.close(id);
      throw new Error("Herdr could not start the fixed subagent viewer command.");
    }
    await this.#exec("herdr", ["pane", "rename", id, label(input.projection.agent)], {
      timeout: 2000,
    });
    await this.#exec(
      "herdr",
      [
        "pane",
        "report-metadata",
        "--source",
        "pi-herdr-subagents",
        "--title",
        `Subagent ${label(input.projection.agent)}`,
        "--display-agent",
        label(input.projection.agent),
        id,
      ],
      { timeout: 2000 },
    );
    return id;
  }
}

export { FIXED_VIEWER_COMMAND, paneId, shellReady };
