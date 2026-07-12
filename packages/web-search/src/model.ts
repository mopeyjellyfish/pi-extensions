import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { Api, Model } from "@earendil-works/pi-ai";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

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
}

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
  const unexpected = Object.keys(record).filter((key) => key !== "model" && key !== "provider");
  if (
    typeof provider !== "string" ||
    provider.trim() === "" ||
    typeof model !== "string" ||
    model.trim() === "" ||
    unexpected.length > 0
  ) {
    throw new Error(
      `Invalid web search configuration at ${path}: expected only non-empty provider and model strings.`,
    );
  }
  return { model: model.trim(), path, provider: provider.trim() };
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

export async function resolveSearchModel(ctx: ExtensionContext): Promise<Model<Api>> {
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
    return configured;
  }
  if (!supportsNativeWebSearch(ctx.model)) {
    const description =
      ctx.model === undefined
        ? "No current model is selected"
        : `The current model ${describe(ctx.model)}`;
    throw new Error(`${description} does not support native web search.`);
  }
  return ctx.model;
}
