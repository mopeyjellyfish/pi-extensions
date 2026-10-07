import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { CONFIG_DIR_NAME, type ExtensionContext } from "@earendil-works/pi-coding-agent";

import type { Api, Model } from "@earendil-works/pi-ai";

interface ImageConfig {
  readonly imageModel: string;
  readonly model: string;
  readonly provider: string;
}

function invalidConfig(path: string): Error {
  return new Error(
    `Image generation configuration is invalid: ${path}. Set provider to openai-codex, model to an existing openai-codex-responses registry model ID, and optional imageModel to gpt-image-2. Never put credentials in this file.`,
  );
}

function parseConfig(raw: string, path: string): ImageConfig {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw invalidConfig(path);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidConfig(path);
  }
  const record = value as Record<string, unknown>;
  const imageModel = record["imageModel"] === undefined ? "gpt-image-2" : record["imageModel"];
  const provider = record["provider"];
  const model = record["model"];
  if (
    Object.keys(value).some((key) => !["provider", "model", "imageModel"].includes(key)) ||
    typeof imageModel !== "string" ||
    imageModel !== "gpt-image-2" ||
    typeof provider !== "string" ||
    typeof model !== "string" ||
    !provider.trim() ||
    !model.trim()
  ) {
    throw invalidConfig(path);
  }
  return { model: model.trim(), provider: provider.trim(), imageModel };
}

async function configAt(path: string): Promise<ImageConfig | undefined> {
  let raw: string | undefined;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    // Do not expose filesystem error details in tool output.
  }
  if (raw === undefined) {
    throw new Error(`Cannot read image generation configuration: ${path}. Check file access.`);
  }
  return parseConfig(raw, path);
}

export async function selectImageModels(ctx: ExtensionContext): Promise<{
  models: readonly Model<Api>[];
  imageModel: string;
  configurationPath: string | undefined;
}> {
  const projectPath = join(ctx.cwd, CONFIG_DIR_NAME, "image-generation.json");
  const userPath = join(homedir(), ".pi", "agent", "image-generation.json");
  const project = ctx.isProjectTrusted() ? await configAt(projectPath) : undefined;
  const user = project ? undefined : await configAt(userPath);
  const configured = project ?? user;
  if (configured) {
    const configurationPath = project ? projectPath : userPath;
    const selected = ctx.modelRegistry.find(configured.provider, configured.model);
    if (selected === undefined || !isCodexModel(selected)) {
      throw new Error(
        `Image generation configuration selects a missing or unsupported model: ${configurationPath}. Set provider to openai-codex and model to an existing openai-codex-responses registry model ID. Use Pi /login for openai-codex.`,
      );
    }
    return { models: [selected], imageModel: configured.imageModel, configurationPath };
  }
  return {
    models: ctx.modelRegistry.getAll().filter(isCodexModel),
    imageModel: "gpt-image-2",
    configurationPath: undefined,
  };
}

function isCodexModel(model: Model<Api>): boolean {
  return model.api === "openai-codex-responses" && model.provider === "openai-codex";
}
