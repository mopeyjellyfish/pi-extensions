import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { CONFIG_DIR_NAME, type ExtensionContext } from "@earendil-works/pi-coding-agent";

import type { Api, Model } from "@earendil-works/pi-ai";

interface ImageConfig {
  readonly model: string;
  readonly provider: string;
}

function parseConfig(raw: string, path: string): ImageConfig {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(`Image generation configuration is invalid: ${path}.`);
  }
  const record = value as Record<string, unknown>;
  const provider = record["provider"];
  const model = record["model"];
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    typeof provider !== "string" ||
    typeof model !== "string" ||
    !provider.trim() ||
    !model.trim()
  ) {
    throw new Error(`Image generation configuration is invalid: ${path}.`);
  }
  return { model: model.trim(), provider: provider.trim() };
}

async function configAt(path: string): Promise<ImageConfig | undefined> {
  try {
    return parseConfig(await readFile(path, "utf8"), path);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function selectImageModel(ctx: ExtensionContext): Promise<Model<Api>> {
  const projectPath = join(ctx.cwd, CONFIG_DIR_NAME, "image-generation.json");
  const project = ctx.isProjectTrusted() ? await configAt(projectPath) : undefined;
  const user = project
    ? undefined
    : await configAt(join(homedir(), ".pi", "agent", "image-generation.json"));
  const configured = project ?? user;
  const selected = configured
    ? ctx.modelRegistry.find(configured.provider, configured.model)
    : ctx.model;
  if (selected === undefined) {
    const requested = configured ? ` ${configured.provider}/${configured.model}` : "";
    throw new Error(
      `Image generation requires a configured OpenAI Responses model and API key${requested}.`,
    );
  }
  const officialOpenAi =
    selected.provider === "openai" && new URL(selected.baseUrl).origin === "https://api.openai.com";
  if (selected.api !== "openai-responses" || !officialOpenAi) {
    throw new Error(
      "Image generation requires an official OpenAI Platform Responses model; Codex subscription OAuth and compatible third-party providers are not supported.",
    );
  }
  return selected;
}
