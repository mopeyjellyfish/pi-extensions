import { mkdir, open, rm, stat } from "node:fs/promises";
import { dirname, extname } from "node:path";

import { withFileMutationQueue, type ExtensionContext } from "@earendil-works/pi-coding-agent";

import { pathFrom } from "./image-path.ts";
import { codexImageRuntime, type ImageInput } from "./image-runtime.ts";

export interface ImageResult {
  readonly content: { readonly text: string; readonly type: "text" }[];
  readonly details: {
    readonly bytes: number;
    readonly operation: "generate" | "edit";
    readonly path: string;
  };
}

async function writeNew(
  path: string,
  bytes: Buffer,
  signal: AbortSignal | undefined,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  signal?.throwIfAborted();
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(path, "wx");
    signal?.throwIfAborted();
    await handle.writeFile(bytes, { signal });
    signal?.throwIfAborted();
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
  if (input.maskPath !== undefined)
    throw new Error("Codex image generation does not support masks.");
  if (input.outputFormat !== undefined && input.outputFormat !== "png") {
    throw new Error("Codex image generation supports PNG only.");
  }
  const outputPath = pathFrom(ctx.cwd, input.outputPath);
  if (extname(outputPath).toLowerCase() !== ".png") {
    throw new Error("Image output path extension must end in .png.");
  }
  return withFileMutationQueue(outputPath, async () => {
    try {
      await stat(outputPath);
      throw new Error("Refusing to overwrite an existing image.");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    const bytes = await codexImageRuntime.generate(input, signal, ctx);
    signal?.throwIfAborted();
    await writeNew(outputPath, bytes, signal);
    return {
      content: [{ text: `Saved generated image: ${outputPath}`, type: "text" }],
      details: { bytes: bytes.length, operation: input.operation, path: outputPath },
    };
  });
}
