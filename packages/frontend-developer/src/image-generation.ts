import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";

import { withFileMutationQueue, type ExtensionContext } from "@earendil-works/pi-coding-agent";

import { selectImageModel } from "./config.ts";

import type { ReadableStream } from "node:stream/web";

const MAX_INPUT_BYTES = 50 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024;
const MAX_ERROR_BYTES = 4096;

export interface ImageInput {
  readonly inputPaths?: readonly string[];
  readonly maskPath?: string;
  readonly operation: "generate" | "edit";
  readonly outputFormat?: "png" | "jpeg" | "webp";
  readonly outputPath: string;
  readonly prompt: string;
  readonly size?: "1024x1024" | "1024x1536" | "1536x1024";
}

export interface ImageResult {
  readonly content: { readonly text: string; readonly type: "text" }[];
  readonly details: {
    readonly bytes: number;
    readonly operation: "generate" | "edit";
    readonly path: string;
  };
}

function pathFrom(cwd: string, value: string): string {
  const normalized = value.startsWith("@") ? value.slice(1) : value;
  const root = resolve(cwd);
  const path = isAbsolute(normalized) ? resolve(normalized) : resolve(root, normalized);
  const fromRoot = relative(root, path);
  if (fromRoot === "" || fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error("Image paths must stay within the project directory.");
  }
  return path;
}

function mediaType(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | undefined {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return undefined;
}

function pngHasAlpha(bytes: Buffer): boolean {
  return bytes.length > 25 && (bytes[25] === 4 || bytes[25] === 6);
}

async function imageFile(
  cwd: string,
  value: string,
): Promise<{ bytes: Buffer; path: string; type: string }> {
  const path = pathFrom(cwd, value);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size === 0 || metadata.size > MAX_INPUT_BYTES) {
    throw new Error(`Input image ${value} must be a non-empty file no larger than 50 MB.`);
  }
  const bytes = await readFile(path);
  const type = mediaType(bytes);
  if (type === undefined) throw new Error(`Input image ${value} must be PNG, JPEG, or WebP.`);
  return { bytes, path, type };
}

function mergeHeaders(
  modelHeaders: Readonly<Record<string, string | null>> | undefined,
  authHeaders: Readonly<Record<string, string | null>> | undefined,
  apiKey: string,
): Headers {
  const headers = new Headers();
  for (const source of [modelHeaders, authHeaders]) {
    for (const [name, value] of Object.entries(source ?? {})) {
      if (value === null) headers.delete(name);
      else headers.set(name, value);
    }
  }
  if (!headers.has("authorization")) headers.set("authorization", `Bearer ${apiKey}`);
  headers.set("accept", "application/json");
  return headers;
}

function endpoint(baseUrl: string, operation: ImageInput["operation"]): string {
  return `${baseUrl.replace(/\/+$/u, "")}/images/${operation === "edit" ? "edits" : "generations"}`;
}

function generateBody(input: ImageInput, headers: Headers): string {
  if ((input.inputPaths?.length ?? 0) > 0 || input.maskPath !== undefined) {
    throw new Error("Input images and masks are valid only for edit operations.");
  }
  headers.set("content-type", "application/json");
  return JSON.stringify({
    model: "gpt-image-2",
    prompt: input.prompt,
    ...(input.outputFormat === undefined ? {} : { output_format: input.outputFormat }),
    ...(input.size === undefined ? {} : { size: input.size }),
  });
}

async function editBody(input: ImageInput, cwd: string, headers: Headers): Promise<FormData> {
  headers.delete("content-type");
  if (input.inputPaths?.length === undefined || input.inputPaths.length === 0) {
    throw new Error("Image edits require at least one input image path.");
  }
  const images = await Promise.all(input.inputPaths.map((path) => imageFile(cwd, path)));
  const form = new FormData();
  form.set("model", "gpt-image-2");
  form.set("prompt", input.prompt);
  if (input.outputFormat !== undefined) form.set("output_format", input.outputFormat);
  if (input.size !== undefined) form.set("size", input.size);
  for (const image of images) {
    form.append("image[]", new Blob([image.bytes], { type: image.type }), basename(image.path));
  }
  if (input.maskPath !== undefined) {
    const mask = await imageFile(cwd, input.maskPath);
    if (mask.type !== "image/png" || !pngHasAlpha(mask.bytes)) {
      throw new Error("An image edit mask must be a PNG file with alpha.");
    }
    form.set("mask", new Blob([mask.bytes], { type: mask.type }), basename(mask.path));
  }
  return form;
}

async function requestBody(
  input: ImageInput,
  cwd: string,
  headers: Headers,
): Promise<FormData | string> {
  return input.operation === "generate"
    ? generateBody(input, headers)
    : await editBody(input, cwd, headers);
}

function decodeImage(value: unknown): Buffer {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_RESPONSE_BYTES * 2) {
    throw new Error("Provider returned no usable image data.");
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value)) {
    throw new Error("Provider returned invalid base64 image data.");
  }
  const bytes = Buffer.from(value, "base64");
  if (bytes.length === 0 || bytes.length > MAX_RESPONSE_BYTES) {
    throw new Error("Provider image data is invalid or too large.");
  }
  return bytes;
}

async function providerError(response: Response): Promise<Error> {
  const text = (await response.text()).slice(0, MAX_ERROR_BYTES);
  return new Error(`Image generation failed (${String(response.status)}): ${text}`);
}

async function responsePayload(response: Response): Promise<{ data?: { b64_json?: unknown }[] }> {
  const limit = MAX_RESPONSE_BYTES * 2 + 8192;
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    throw new Error("Provider response is too large.");
  }
  const body = response.body as ReadableStream<Uint8Array> | null;
  if (body === null) throw new Error("Provider returned an empty response.");
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error("Provider response is too large.");
    }
    chunks.push(value);
  }
  const text = new TextDecoder().decode(Buffer.concat(chunks));
  try {
    return JSON.parse(text) as { data?: { b64_json?: unknown }[] };
  } catch {
    throw new Error("Provider returned invalid JSON.");
  }
}

async function writeNew(path: string, bytes: Buffer): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(path, "wx");
    await handle.writeFile(bytes);
  } catch (error) {
    if (handle !== undefined) await rm(path, { force: true });
    throw error;
  } finally {
    await handle?.close();
  }
}

export async function generateImage(
  input: ImageInput,
  signal: AbortSignal | undefined,
  ctx: ExtensionContext,
): Promise<ImageResult> {
  signal?.throwIfAborted();
  const outputPath = pathFrom(ctx.cwd, input.outputPath);
  return withFileMutationQueue(outputPath, async () => {
    try {
      await stat(outputPath);
      throw new Error("Refusing to overwrite an existing image.");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    const model = await selectImageModel(ctx);
    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (!auth.ok || auth.apiKey === undefined || auth.apiKey === "") {
      throw new Error("Image generation requires a separately billed OpenAI Platform API key.");
    }
    const headers = mergeHeaders(model.headers, auth.headers, auth.apiKey);
    const body = await requestBody(input, ctx.cwd, headers);
    const response = await fetch(endpoint(model.baseUrl, input.operation), {
      body,
      headers,
      method: "POST",
      ...(signal === undefined ? {} : { signal }),
    });
    if (!response.ok) throw await providerError(response);
    const payload = await responsePayload(response);
    const bytes = decodeImage(payload.data?.[0]?.b64_json);
    await writeNew(outputPath, bytes);
    return {
      content: [{ text: `Saved generated image: ${outputPath}`, type: "text" }],
      details: { bytes: bytes.length, operation: input.operation, path: outputPath },
    };
  });
}
