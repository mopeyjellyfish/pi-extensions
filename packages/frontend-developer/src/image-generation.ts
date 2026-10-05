import { mkdir, open, rm, stat } from "node:fs/promises";
import { dirname, extname } from "node:path";

import { withFileMutationQueue, type ExtensionContext } from "@earendil-works/pi-coding-agent";

import { pathFrom } from "./image-path.ts";
import { openAiImageRuntime, type ImageInput } from "./image-runtime.ts";

export interface ImageResult {
  readonly content: { readonly text: string; readonly type: "text" }[];
  readonly details: {
    readonly bytes: number;
    readonly operation: "generate" | "edit";
    readonly path: string;
  };
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
    const bytes = await openAiImageRuntime.generate(input, signal, ctx);
    await writeNew(outputPath, bytes);
    return {
      content: [{ text: `Saved generated image: ${outputPath}`, type: "text" }],
      details: { bytes: bytes.length, operation: input.operation, path: outputPath },
    };
  });
}
