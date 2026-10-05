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
const unshadowedBuiltInAgentNames = ["advisor", "delegate", "oracle", "scout"] as const;

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

/** Inspect only the private profile contract; never rewrite settings or restrict extra agents. */
export async function diagnoseProfile(
  settingsPath: string,
  configPath: string,
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
        severity: "error",
        message:
          "Remove this override, or set disabled to true. pi-subagents applies a built-in override before disableBuiltins, so this path can leave the built-in enabled. The doctor cannot verify effective agent discovery or whether a custom agent shadows this built-in.",
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
  return diagnostics;
}
