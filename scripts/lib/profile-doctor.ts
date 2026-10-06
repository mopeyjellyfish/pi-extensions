import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

interface Diagnostic {
  readonly file: string;
  readonly path: string;
  readonly severity: "error" | "recommendation";
  readonly message: string;
}

// These built-ins have no packaged role with the same name in the private profile.
const unshadowedBuiltInAgentNames = ["delegate", "oracle", "scout"] as const;

/** Resolve Pi's user agent directory without reading or writing it. */
export function resolveAgentDir(configured: string | undefined, home: string = homedir()): string {
  if (configured === undefined || configured === "") return join(home, ".pi", "agent");
  if (configured === "~") return home;
  if (configured.startsWith("~/")) return join(home, configured.slice(2));
  if (configured.startsWith("file://")) return fileURLToPath(configured);
  return configured;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function load(
  file: string,
  diagnostics: Diagnostic[],
): Promise<Record<string, unknown> | undefined> {
  try {
    const value: unknown = JSON.parse(await readFile(file, "utf8"));
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Expected a JSON object");
    }
    return record(value);
  } catch {
    diagnostics.push({
      file,
      path: "$",
      severity: "error",
      message: "Read a valid JSON object from this file. Check that it exists and is readable.",
    });
    return undefined;
  }
}

interface EffectiveAgent {
  readonly name: string;
  readonly source: string;
  readonly filePath: string;
  readonly model?: string;
  readonly thinking?: string | false;
  readonly override?: { readonly path: string };
}

// Private adapter to the pinned pi-subagents 0.50.0 implementation. Reuse its
// filesystem discovery, defaults, overrides, and precedence instead of copying them.
async function diagnoseEffectiveRoles(cwd: string): Promise<Diagnostic[]> {
  const discoveryUrl = new URL("src/agents/agents.ts", import.meta.resolve("pi-subagents"));
  const { discoverAgents } = (await import(discoveryUrl.href)) as {
    discoverAgents: (cwd: string, scope: "both") => { agents: EffectiveAgent[] };
  };
  const modelInfoUrl = new URL("src/shared/model-info.ts", import.meta.resolve("pi-subagents"));
  const { resolveEffectiveThinking, splitKnownThinkingSuffix } = (await import(
    modelInfoUrl.href
  )) as {
    resolveEffectiveThinking: (
      model: string | undefined,
      thinking: string | false | undefined,
    ) => string | undefined;
    splitKnownThinkingSuffix: (model: string) => { baseModel: string };
  };
  const { agents } = discoverAgents(cwd, "both");
  const diagnostics: Diagnostic[] = [];
  const model = "openai-codex/gpt-6.1-sol";
  const roles = {
    worker: "high",
    researcher: "low",
    utility: "low",
    qa: "medium",
    reviewer: "medium",
    git: "medium",
  };
  for (const [role, thinking] of Object.entries(roles)) {
    const agent = agents.find((candidate) => candidate.name === role);
    if (agent === undefined) {
      diagnostics.push({
        file: cwd,
        path: `$.effectiveAgents.${role}`,
        severity: "error",
        message: `Missing effective ${role}. Load the private aggregate and remove a disabling override. Expected ${model} at ${thinking}.`,
      });
      continue;
    }
    const actualModel =
      agent.model === undefined ? undefined : splitKnownThinkingSuffix(agent.model).baseModel;
    const actualThinking = resolveEffectiveThinking(agent.model, agent.thinking);
    const drift = actualModel !== model || actualThinking !== thinking;
    if (!drift && agent.source === "package") continue;
    diagnostics.push({
      file: agent.filePath,
      path: `$.effectiveAgents.${role}`,
      severity: drift ? "error" : "recommendation",
      message: `Effective ${role}: source=${agent.source}, file=${agent.filePath}, model=${actualModel ?? "inherited"}, thinking=${actualThinking ?? "inherited"}. Expected packaged ${model} at ${thinking}. Rename or update the shadowing definition, or inspect user/project agentOverrides${agent.override === undefined ? "" : ` at ${agent.override.path}`}. Reload or restart Pi after an intentional correction. Keep non-conflicting additional user agents.`,
    });
  }
  return diagnostics;
}

/** Inspect configuration and, with a cwd, on-disk effective discovery. Never rewrite user files. */
export async function diagnoseProfile(
  settingsPath: string,
  configPath: string,
  discoveryCwd?: string,
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const settings = await load(settingsPath, diagnostics);
  const config = await load(configPath, diagnostics);
  const check = (
    file: string,
    path: string,
    valid: boolean,
    message: string,
    severity: Diagnostic["severity"] = "error",
  ): void => {
    if (!valid) diagnostics.push({ file, path, severity, message });
  };
  if (settings !== undefined) {
    const subagents = record(settings["subagents"]);
    check(
      settingsPath,
      "$.subagents.disableBuiltins",
      subagents["disableBuiltins"] === true,
      "Set true to disable only pi-subagents built-in roles. Keep additional user agents.",
    );
    const overrides = record(subagents["agentOverrides"]);
    for (const role of ["worker", "researcher", "utility", "qa", "reviewer", "git"]) {
      check(
        settingsPath,
        `$.subagents.agentOverrides.${role}.disabled`,
        record(overrides[role])["disabled"] !== true,
        "Remove the disabled override for this packaged role.",
      );
    }
    for (const role of unshadowedBuiltInAgentNames) {
      const override = overrides[role];
      if (override === undefined || record(override)["disabled"] === true) continue;
      diagnostics.push({
        file: settingsPath,
        path: `$.subagents.agentOverrides.${role}`,
        severity: "recommendation",
        message:
          "Verify effective agent discovery for this name. pi-subagents applies a built-in override before disableBuiltins, so this path can leave a built-in enabled. The effective-role check covers only the six private roles, not whether an additional custom agent shadows this built-in; keep user agents enabled.",
      });
    }
  }
  if (config !== undefined) {
    check(
      configPath,
      "$.toolDescriptionMode",
      config["toolDescriptionMode"] === "compact",
      'Use "compact" for shorter tool descriptions.',
      "recommendation",
    );
    check(
      configPath,
      "$.asyncByDefault",
      config["asyncByDefault"] === false,
      "Set false for foreground execution by default.",
    );
    check(
      configPath,
      "$.forceTopLevelAsync",
      config["forceTopLevelAsync"] !== true,
      "Set false or omit to permit foreground execution.",
    );
    const bounded = (value: unknown): boolean =>
      typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 8;
    check(
      configPath,
      "$.maxSubagentDepth",
      config["maxSubagentDepth"] === 1,
      "Set 1 so ordinary children cannot fan out.",
    );
    check(
      configPath,
      "$.globalConcurrencyLimit",
      bounded(config["globalConcurrencyLimit"]),
      "Set an integer from 1 to 8 to bound concurrent children.",
    );
    const parallel = record(config["parallel"]);
    for (const key of ["maxTasks", "concurrency"]) {
      check(
        configPath,
        `$.parallel.${key}`,
        bounded(parallel[key]),
        "Set an integer from 1 to 8 to bound parallel work.",
      );
    }
    check(
      configPath,
      "$.scheduledRuns.enabled",
      record(config["scheduledRuns"])["enabled"] === false,
      "Set false to disable scheduled runs.",
    );
  }
  if (discoveryCwd !== undefined) {
    try {
      diagnostics.push(...(await diagnoseEffectiveRoles(discoveryCwd)));
    } catch {
      diagnostics.push({
        file: discoveryCwd,
        path: "$.effectiveAgents",
        severity: "error",
        message:
          "Effective discovery failed. Check readable agent definitions and user/project subagent settings against pinned pi-subagents. No files were changed.",
      });
    }
  }
  return diagnostics;
}
