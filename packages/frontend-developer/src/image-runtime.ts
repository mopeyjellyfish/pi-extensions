import { randomUUID } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

import { selectImageModel } from "./config.ts";
import { pathFrom } from "./image-path.ts";

import type { Api, Model } from "@earendil-works/pi-ai";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ReadableStream, ReadableStreamDefaultReader } from "node:stream/web";

const MAX_INPUT_BYTES = 50 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024;
const CODEX_IMAGE_BASE = "https://chatgpt.com/backend-api/codex";
const LOGIN_GUIDANCE =
  "Image generation requires openai-codex subscription OAuth. Use Pi /login for openai-codex, then select or configure an openai-codex model.";

export interface ImageInput {
  readonly inputPaths?: readonly string[];
  readonly maskPath?: string;
  readonly operation: "generate" | "edit";
  readonly outputFormat?: "png" | "jpeg" | "webp";
  readonly outputPath: string;
  readonly prompt: string;
  readonly size?: string;
}

interface ImageRuntime {
  generate(
    input: ImageInput,
    signal: AbortSignal | undefined,
    ctx: ExtensionContext,
  ): Promise<Buffer>;
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

async function imageFile(
  cwd: string,
  value: string,
  signal: AbortSignal | undefined,
): Promise<{ bytes: Buffer; type: string }> {
  const path = pathFrom(cwd, value);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size === 0 || metadata.size > MAX_INPUT_BYTES) {
    throw new Error(`Input image ${value} must be a non-empty file no larger than 50 MB.`);
  }
  const bytes = await readFile(path, { signal });
  if (bytes.length === 0 || bytes.length > MAX_INPUT_BYTES)
    throw new Error("Input image size is invalid.");
  const type = mediaType(bytes);
  if (type === undefined) throw new Error(`Input image ${value} must be PNG, JPEG, or WebP.`);
  return { bytes, type };
}

function accountIdFromToken(token: string): string | undefined {
  if (token.length > 32_768) return undefined;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[1] === undefined) return undefined;
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!isRecord(payload)) return undefined;
    const auth = payload["https://api.openai.com/auth"];
    if (!isRecord(auth)) return undefined;
    const id = auth["chatgpt_account_id"];
    return typeof id === "string" && /^[\w-]{1,256}$/u.test(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeHeaders(
  modelHeaders: Readonly<Record<string, string | null>> | undefined,
  authHeaders: Readonly<Record<string, string | null>> | undefined,
  token: string,
): Headers {
  const headers = new Headers();
  for (const source of [modelHeaders, authHeaders]) {
    for (const [name, value] of Object.entries(source ?? {})) {
      if (value === null) headers.delete(name);
      else headers.set(name, value);
    }
  }
  const accountId = headers.get("chatgpt-account-id") ?? accountIdFromToken(token);
  if (!accountId || !/^[\w-]{1,256}$/u.test(accountId)) {
    throw new Error("Cannot resolve Codex account ID. Use Pi /login for openai-codex.");
  }
  headers.set("authorization", `Bearer ${token}`);
  headers.set("chatgpt-account-id", accountId);
  headers.delete("openai-beta");
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  headers.set("originator", "pi-frontend-developer");
  headers.set("user-agent", "pi-frontend-developer/codex-images-rust-v0.160.0");
  headers.set("x-codex-image-turn-id", randomUUID());
  return headers;
}

function validateInput(input: ImageInput): void {
  if (input.maskPath !== undefined)
    throw new Error("Codex image generation does not support masks.");
  if (input.outputFormat !== undefined && input.outputFormat !== "png") {
    throw new Error("Codex image generation supports PNG only.");
  }
  const size = input.size ?? "auto";
  if (size === "auto") return;
  const match = /^([1-9]\d{0,3})x([1-9]\d{0,3})$/u.exec(size);
  const width = Number(match?.[1]);
  const height = Number(match?.[2]);
  const pixels = width * height;
  if (
    !match ||
    width % 16 !== 0 ||
    height % 16 !== 0 ||
    Math.max(width, height) > 3840 ||
    Math.max(width, height) / Math.min(width, height) > 3 ||
    pixels < 655_360 ||
    pixels > 8_294_400
  ) {
    throw new Error(
      "Invalid image size: use auto or WIDTHxHEIGHT with edges divisible by 16, at most 3840, ratio at most 3:1, and 655360–8294400 pixels.",
    );
  }
}

async function requestBody(
  input: ImageInput,
  cwd: string,
  imageModel: string,
  signal: AbortSignal | undefined,
): Promise<string> {
  const body = {
    model: imageModel,
    prompt: input.prompt,
    background: "opaque",
    quality: "auto",
    size: input.size ?? "auto",
  };
  if (input.operation === "generate") {
    if ((input.inputPaths?.length ?? 0) > 0)
      throw new Error("Input images are valid only for edit operations.");
    return JSON.stringify(body);
  }
  if (!input.inputPaths?.length)
    throw new Error("Image edits require at least one input image path.");
  if (input.inputPaths.length > 4)
    throw new Error("Image edits accept at most four reference images.");
  const images = [];
  for (const path of input.inputPaths) {
    signal?.throwIfAborted();
    const image = await imageFile(cwd, path, signal);
    images.push({ image_url: `data:${image.type};base64,${image.bytes.toString("base64")}` });
  }
  return JSON.stringify({ ...body, images });
}

function decodeImage(value: unknown): Buffer {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_RESPONSE_BYTES * 2) {
    throw new Error("Provider returned no usable image data.");
  }
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(value)) {
    throw new Error("Provider returned invalid base64 image data.");
  }
  const bytes = Buffer.from(value, "base64");
  if (bytes.length === 0 || bytes.length > MAX_RESPONSE_BYTES) {
    throw new Error("Provider image data is invalid or too large.");
  }
  return bytes;
}

function crc32(bytes: Buffer): number {
  let crc = 0xff_ff_ff_ff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (-(crc & 1) & 0xed_b8_83_20);
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

function pngDimensions(bytes: Buffer): readonly [number, number] | undefined {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return undefined;
  }
  let offset = 8;
  let dimensions: readonly [number, number] | undefined;
  let hasImageData = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) return undefined;
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== bytes.readUInt32BE(end - 4))
      return undefined;
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (offset === 8) {
      if (type !== "IHDR" || length !== 13) return undefined;
      const width = bytes.readUInt32BE(offset + 8);
      const height = bytes.readUInt32BE(offset + 12);
      if (width === 0 || height === 0) return undefined;
      dimensions = [width, height];
    }
    if (type === "IDAT") hasImageData = true;
    if (type === "IEND")
      return length === 0 && hasImageData && end === bytes.length ? dimensions : undefined;
    offset = end;
  }
  return undefined;
}

function validateOutput(bytes: Buffer, input: ImageInput): void {
  const dimensions = pngDimensions(bytes);
  if (dimensions === undefined) {
    throw new Error("Provider returned an invalid PNG image artifact.");
  }
  if (input.size !== undefined && input.size !== "auto" && dimensions.join("x") !== input.size) {
    throw new Error(`Provider image dimensions must match requested size ${input.size}.`);
  }
}

async function cancelResponse(stream: { cancel(): Promise<unknown> } | null): Promise<void> {
  try {
    await stream?.cancel();
  } catch {
    // Cancellation is best-effort; never expose credential-bearing transport errors.
  }
}

async function readChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal | undefined,
) {
  try {
    return await reader.read();
  } catch {
    signal?.throwIfAborted();
    throw new Error("Codex image response could not be read.");
  }
}

async function authenticatedHeaders(ctx: ExtensionContext, model: Model<Api>): Promise<Headers> {
  try {
    if (!ctx.modelRegistry.isUsingOAuth(model)) throw new Error(LOGIN_GUIDANCE);
    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (!auth.ok || !auth.apiKey) throw new Error(LOGIN_GUIDANCE);
    return mergeHeaders(model.headers, auth.headers, auth.apiKey);
  } catch {
    throw new Error(LOGIN_GUIDANCE);
  }
}

async function responsePayload(
  response: Response,
  signal: AbortSignal | undefined,
): Promise<unknown> {
  const limit = MAX_RESPONSE_BYTES * 2 + 8192;
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    await cancelResponse(response.body);
    throw new Error("Provider response is too large.");
  }
  const body = response.body as ReadableStream<Uint8Array> | null;
  if (body === null) throw new Error("Provider returned an empty response.");
  const reader = body.getReader();
  const abort = (): void => {
    void cancelResponse(reader);
  };
  signal?.addEventListener("abort", abort, { once: true });
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      signal?.throwIfAborted();
      const { done, value } = await readChunk(reader, signal);
      signal?.throwIfAborted();
      if (done) break;
      total += value.byteLength;
      if (total > limit) throw new Error("Provider response is too large.");
      chunks.push(value);
    }
  } finally {
    signal?.removeEventListener("abort", abort);
    await cancelResponse(reader);
    reader.releaseLock();
  }
  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))) as unknown;
  } catch {
    throw new Error("Provider returned invalid JSON.");
  }
}

// Native image-only JSON protocol verified against OpenAI Codex rust-v0.160.0.
// Fixed destination: never use a model/auth baseUrl for subscription credentials.
export const codexImageRuntime: ImageRuntime = {
  async generate(input, signal, ctx) {
    validateInput(input);
    const { model, imageModel } = await selectImageModel(ctx);
    const headers = await authenticatedHeaders(ctx, model);
    const body = await requestBody(input, ctx.cwd, imageModel, signal);
    signal?.throwIfAborted();
    let response: Response;
    try {
      response = await fetch(
        `${CODEX_IMAGE_BASE}/images/${input.operation === "edit" ? "edits" : "generations"}`,
        {
          body,
          headers,
          method: "POST",
          redirect: "error",
          ...(signal === undefined ? {} : { signal }),
        },
      );
    } catch {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      throw new Error(
        "Codex image request failed. Check connectivity and subscription access; no automatic retry was made.",
      );
    }
    if (!response.ok) {
      // Never echo provider bodies: they can contain tokens or private reference data.
      await cancelResponse(response.body);
      throw new Error(
        `Image generation failed (${String(response.status)}). Check Codex subscription access and requested size; custom-size backend acceptance is unverified.`,
      );
    }
    const payload = await responsePayload(response, signal);
    const data = isRecord(payload) ? payload["data"] : undefined;
    const first: unknown = Array.isArray(data) ? data[0] : undefined;
    const bytes = decodeImage(isRecord(first) ? first["b64_json"] : undefined);
    validateOutput(bytes, input);
    signal?.throwIfAborted();
    return bytes;
  },
};
