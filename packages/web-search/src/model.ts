import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { Api, Model } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const SUPPORTED_APIS = new Set([
  "anthropic-messages",
  "google-generative-ai",
  "openai-codex-responses",
  "openai-responses",
]);

interface ModelOverride {
  readonly model: string;
  readonly path: string;
  readonly provider: string;
  readonly thinkingLevel?: SearchThinkingLevel;
}

type SearchThinkingLevel = ReturnType<ExtensionAPI["getThinkingLevel"]>;

export interface SearchSelection {
  readonly model: Model<Api>;
  readonly thinkingLevel?: SearchThinkingLevel;
}

const THINKING_LEVELS = new Set<SearchThinkingLevel>([
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function parseOverride(raw: string, path: string): ModelOverride {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(
      `Invalid web search configuration at ${path}: ${error instanceof Error ? error.message : String(error)}.`,
      { cause: error },
    );
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid web search configuration at ${path}: expected a JSON object.`);
  }
  const record = value as Record<string, unknown>;
  const provider = record["provider"];
  const model = record["model"];
  const thinkingLevel = record["thinkingLevel"];
  const unexpected = Object.keys(record).filter(
    (key) => key !== "model" && key !== "provider" && key !== "thinkingLevel",
  );
  if (
    typeof provider !== "string" ||
    provider.trim() === "" ||
    typeof model !== "string" ||
    model.trim() === "" ||
    unexpected.length > 0 ||
    (thinkingLevel !== undefined &&
      (typeof thinkingLevel !== "string" ||
        !THINKING_LEVELS.has(thinkingLevel as SearchThinkingLevel)))
  ) {
    throw new Error(
      `Invalid web search configuration at ${path}: expected non-empty provider and model strings plus an optional valid thinkingLevel.`,
    );
  }
  return {
    model: model.trim(),
    path,
    provider: provider.trim(),
    ...(thinkingLevel === undefined ? {} : { thinkingLevel: thinkingLevel as SearchThinkingLevel }),
  };
}

async function readOverride(path: string, required: boolean): Promise<ModelOverride | undefined> {
  try {
    return parseOverride(await readFile(path, "utf8"), path);
  } catch (error) {
    if (!required && isMissingFile(error)) {
      return undefined;
    }
    throw error;
  }
}

async function configuredOverride(ctx: ExtensionContext): Promise<ModelOverride | undefined> {
  const explicitPath = process.env["PI_WEB_SEARCH_CONFIG"];
  if (explicitPath !== undefined) {
    return await readOverride(explicitPath, true);
  }
  if (ctx.isProjectTrusted()) {
    const project = await readOverride(join(ctx.cwd, ".pi", "web-search.json"), false);
    if (project !== undefined) {
      return project;
    }
  }
  return await readOverride(join(homedir(), ".pi", "agent", "web-search.json"), false);
}

function supportsNativeWebSearch(model: Model<Api> | undefined): model is Model<Api> {
  return model !== undefined && SUPPORTED_APIS.has(model.api);
}

function describe(model: Model<Api>): string {
  return `${model.provider}/${model.id} (${model.api})`;
}

export async function resolveSearchSelection(ctx: ExtensionContext): Promise<SearchSelection> {
  const override = await configuredOverride(ctx);
  if (override !== undefined) {
    const configured = ctx.modelRegistry.find(override.provider, override.model);
    if (configured === undefined) {
      throw new Error(
        `The configured web search model ${override.provider}/${override.model} from ${override.path} was not found.`,
      );
    }
    if (!supportsNativeWebSearch(configured)) {
      throw new Error(
        `The configured web search model ${describe(configured)} from ${override.path} does not support native web search.`,
      );
    }
    return {
      model: configured,
      ...(override.thinkingLevel === undefined ? {} : { thinkingLevel: override.thinkingLevel }),
    };
  }
  if (!supportsNativeWebSearch(ctx.model)) {
    const description =
      ctx.model === undefined
        ? "No current model is selected"
        : `The current model ${describe(ctx.model)}`;
    throw new Error(`${description} does not support native web search.`);
  }
  return { model: ctx.model };
}
