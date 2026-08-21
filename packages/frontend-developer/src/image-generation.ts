import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, relative, resolve } from "node:path";

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

type OutputFormat = NonNullable<ImageInput["outputFormat"]>;

function outputFormatFor(path: string): OutputFormat {
  switch (extname(path).toLowerCase()) {
    case ".png":
      return "png";
    case ".jpg":
    case ".jpeg":
      return "jpeg";
    case ".webp":
      return "webp";
    default:
      throw new Error("Image output paths must end in .png, .jpg, .jpeg, or .webp.");
  }
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

const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function hasJpegEnvelope(bytes: Buffer): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes.at(-2) === 0xff &&
    bytes.at(-1) === 0xd9
  );
}

function isJpegStandaloneMarker(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7);
}

function jpegDimensions(bytes: Buffer): readonly [number, number] | undefined {
  if (!hasJpegEnvelope(bytes)) return undefined;
  let dimensions: readonly [number, number] | undefined;
  for (let offset = 2; offset + 3 < bytes.length;) {
    if (bytes[offset] !== 0xff) return undefined;
    while (bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return undefined;
    const marker = bytes.readUInt8(offset);
    if (marker === 0xd9) break;
    if (isJpegStandaloneMarker(marker)) {
      offset += 1;
      continue;
    }
    const length = bytes.readUInt16BE(offset + 1);
    const end = offset + 1 + length;
    if (length < 2 || end > bytes.length) return undefined;
    if (JPEG_SOF_MARKERS.has(marker)) {
      if (length < 8) return undefined;
      const height = bytes.readUInt16BE(offset + 4);
      const width = bytes.readUInt16BE(offset + 6);
      dimensions = width > 0 && height > 0 ? [width, height] : undefined;
    }
    if (marker === 0xda) return dimensions;
    offset = end;
  }
  return undefined;
}

function webpChunkDimensions(
  bytes: Buffer,
  type: string,
  data: number,
  length: number,
): readonly [number, number] | undefined {
  if (type === "VP8L" && length >= 5 && bytes[data] === 0x2f) {
    const packed = bytes.readUInt32LE(data + 1);
    return [(packed & 0x3f_ff) + 1, ((packed >>> 14) & 0x3f_ff) + 1];
  }
  if (
    type === "VP8 " &&
    length >= 10 &&
    bytes.subarray(data + 3, data + 6).equals(Buffer.from([0x9d, 0x01, 0x2a]))
  ) {
    const width = bytes.readUInt16LE(data + 6) & 0x3f_ff;
    const height = bytes.readUInt16LE(data + 8) & 0x3f_ff;
    return width > 0 && height > 0 ? [width, height] : undefined;
  }
  return undefined;
}

function webpDimensions(bytes: Buffer): readonly [number, number] | undefined {
  if (
    bytes.length < 20 ||
    bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
    bytes.readUInt32LE(4) !== bytes.length - 8 ||
    bytes.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return undefined;
  }
  let canvas: readonly [number, number] | undefined;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.subarray(offset, offset + 4).toString("ascii");
    const length = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    const end = data + length;
    if (end > bytes.length) return undefined;
    if (type === "VP8X") {
      if (length !== 10) return undefined;
      canvas = [bytes.readUIntLE(data + 4, 3) + 1, bytes.readUIntLE(data + 7, 3) + 1];
    } else {
      const dimensions = webpChunkDimensions(bytes, type, data, length);
      if (dimensions !== undefined) {
        return canvas === undefined || (canvas[0] === dimensions[0] && canvas[1] === dimensions[1])
          ? dimensions
          : undefined;
      }
    }
    offset = end + (length % 2);
  }
  return undefined;
}

function validateOutput(bytes: Buffer, input: ImageInput): void {
  const requestedFormat = input.outputFormat ?? "png";
  const dimensions =
    requestedFormat === "png"
      ? pngDimensions(bytes)
      : requestedFormat === "jpeg"
        ? jpegDimensions(bytes)
        : webpDimensions(bytes);
  if (dimensions === undefined) {
    throw new Error(
      `Provider returned an invalid ${requestedFormat.toUpperCase()} image artifact.`,
    );
  }
  if (input.size !== undefined && dimensions.join("x") !== input.size) {
    throw new Error(`Provider image dimensions must match requested size ${input.size}.`);
  }
}

async function providerError(response: Response): Promise<Error> {
  const body = response.body as ReadableStream<Uint8Array> | null;
  if (body === null) return new Error(`Image generation failed (${String(response.status)}).`);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = MAX_ERROR_BYTES - total;
    if (value.byteLength >= remaining) {
      chunks.push(value.subarray(0, remaining));
      await reader.cancel();
      break;
    }
    total += value.byteLength;
    chunks.push(value);
  }
  const text = new TextDecoder().decode(Buffer.concat(chunks));
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
  const outputFormat = input.outputFormat ?? "png";
  if (outputFormatFor(outputPath) !== outputFormat) {
    throw new Error(`Image output path extension must match requested ${outputFormat} format.`);
  }
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
    validateOutput(bytes, input);
    await writeNew(outputPath, bytes);
    return {
      content: [{ text: `Saved generated image: ${outputPath}`, type: "text" }],
      details: { bytes: bytes.length, operation: input.operation, path: outputPath },
    };
  });
}
