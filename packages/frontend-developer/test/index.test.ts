import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import frontendDeveloperExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

afterEach(() => {
  vi.restoreAllMocks();
});

function crc32(bytes: Buffer): number {
  let crc = 0xff_ff_ff_ff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (-(crc & 1) & 0xed_b8_83_20);
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

function png(width = 1024, height = 1024, alpha = false): Buffer {
  const chunk = (type: string, data: Buffer): Buffer => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const length = Buffer.alloc(4);
    const checksum = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    checksum.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = alpha ? 6 : 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", Buffer.from([120, 156, 3, 0, 0, 0, 0, 1])),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function jpeg(width: number, height: number): Buffer {
  return Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0,
    17,
    8,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
    3,
    1,
    0x11,
    0,
    2,
    0x11,
    0,
    3,
    0x11,
    0,
    0xff,
    0xda,
    0,
    12,
    3,
    1,
    0,
    2,
    0,
    3,
    0,
    0,
    0x3f,
    0,
    0xff,
    0xd9,
  ]);
}

function webp(width: number, height: number): Buffer {
  const canvas = Buffer.alloc(10);
  canvas.writeUIntLE(width - 1, 4, 3);
  canvas.writeUIntLE(height - 1, 7, 3);
  const frame = Buffer.alloc(5);
  frame[0] = 0x2f;
  frame.writeUInt32LE((width - 1) | ((height - 1) << 14), 1);
  return Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.from([36, 0, 0, 0]),
    Buffer.from("WEBPVP8X"),
    Buffer.from([10, 0, 0, 0]),
    canvas,
    Buffer.from("VP8L"),
    Buffer.from([5, 0, 0, 0]),
    frame,
    Buffer.alloc(1),
  ]);
}

interface ImageTool {
  readonly name: string;
  readonly parameters: { readonly additionalProperties?: boolean };
  execute(
    id: string,
    input: {
      inputPaths?: string[];
      maskPath?: string;
      operation: "generate" | "edit";
      outputFormat?: "png" | "jpeg" | "webp";
      outputPath: string;
      prompt: string;
      size?: "1024x1024" | "1024x1536" | "1536x1024";
    },
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<{
    content: readonly { text: string; type: "text" }[];
    details: Record<string, unknown>;
  }>;
}

function tool(): ImageTool {
  let registered: ImageTool | undefined;
  frontendDeveloperExtension({
    on: vi.fn(),
    registerTool(value: ImageTool) {
      registered = value;
    },
  } as unknown as ExtensionAPI);
  if (!registered) throw new Error("image_generation was not registered");
  return registered;
}

function context(
  cwd: string,
  options: {
    api?: string;
    apiKey?: string | null;
    authHeaders?: Record<string, string | null>;
    baseUrl?: string;
    find?: ReturnType<typeof vi.fn>;
    modelHeaders?: Record<string, string | null>;
    noModel?: boolean;
    provider?: string;
    trusted?: boolean;
  } = {},
): ExtensionContext {
  const model = options.noModel
    ? undefined
    : {
        api: options.api ?? "openai-responses",
        baseUrl: options.baseUrl ?? "https://api.openai.com/v1",
        headers: options.modelHeaders ?? { "X-Model": "model" },
        id: "gpt-5",
        provider: options.provider ?? "openai",
      };
  return {
    cwd,
    isProjectTrusted: () => options.trusted ?? false,
    model,
    modelRegistry: {
      find: options.find ?? vi.fn(),
      getApiKeyAndHeaders: vi.fn(() =>
        Promise.resolve({
          apiKey: options.apiKey === null ? undefined : (options.apiKey ?? "secret"),
          headers: options.authHeaders ?? { "X-Trace": "trace" },
          ok: true as const,
        }),
      ),
    },
  } as unknown as ExtensionContext;
}

describe("image_generation", () => {
  it("registers a strict tool and writes a generated artifact through Pi authentication", async () => {
    expect.hasAssertions();
    const imageTool = tool();
    expect(imageTool.name).toBe("image_generation");
    expect(imageTool.parameters.additionalProperties).toBe(false);
    const root = await mkdtemp(join(tmpdir(), "image-generation-"));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ data: [{ b64_json: png().toString("base64") }] }));
    const result = await imageTool.execute(
      "call-1",
      { operation: "generate", outputPath: "@art/mockup.png", prompt: "A calm dashboard" },
      undefined,
      undefined,
      context(root),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/images/generations",
      expect.objectContaining({
        body: JSON.stringify({ model: "gpt-image-2", prompt: "A calm dashboard" }),
      }),
    );
    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(requestHeaders.get("authorization")).toBe("Bearer secret");
    expect(requestHeaders.get("x-model")).toBe("model");
    expect(requestHeaders.get("x-trace")).toBe("trace");
    expect(await readFile(join(root, "art/mockup.png"))).toEqual(png());
    expect(result.content[0]?.text).toContain("art/mockup.png");
    expect(result.content[0]?.text).not.toContain("secret");
    fetchMock.mockRestore();
  });

  it("rejects mismatched output extensions and invalid provider image artifacts", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-artifact-validation-"));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ data: [{ b64_json: png().toString("base64") }] }))
      .mockResolvedValueOnce(Response.json({ data: [{ b64_json: png().toString("base64") }] }))
      .mockResolvedValueOnce(
        Response.json({ data: [{ b64_json: png().subarray(0, -1).toString("base64") }] }),
      );
    await expect(
      tool().execute(
        "extension",
        { operation: "generate", outputPath: "out.jpg", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/extension.*png/i);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      tool().execute(
        "unsupported-extension",
        { operation: "generate", outputPath: "out.gif", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/must end/i);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      tool().execute(
        "format",
        { operation: "generate", outputFormat: "jpeg", outputPath: "out.jpg", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/JPEG/);
    await expect(
      tool().execute(
        "dimensions",
        {
          operation: "generate",
          outputPath: "wide.png",
          prompt: "mock-up",
          size: "1536x1024",
        },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/1536x1024/);
    await expect(readFile(join(root, "out.jpg"))).rejects.toThrow();
    await expect(readFile(join(root, "wide.png"))).rejects.toThrow();
    await expect(
      tool().execute(
        "truncated",
        { operation: "generate", outputPath: "truncated.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/invalid PNG/);
    await expect(readFile(join(root, "truncated.png"))).rejects.toThrow();
  });

  it("rejects malformed PNG, JPEG, and WebP containers before writing", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-malformed-containers-"));
    const badPng = png();
    badPng.writeUInt8(badPng.readUInt8(20) ^ 1, 20);
    const badJpeg = jpeg(1024, 1024);
    badJpeg[3] = 0xe0;
    const mismatchedWebp = webp(1024, 1024);
    mismatchedWebp.writeUInt32LE((1023 - 1) | ((1024 - 1) << 14), 39);
    const badRiff = webp(1024, 1024);
    badRiff.writeUInt8(badRiff.readUInt8(4) + 1, 4);
    const cases = [
      { artifact: jpeg(1024, 1024), format: "png", path: "not-png.png" },
      { artifact: png(0, 1024), format: "png", path: "zero-width.png" },
      { artifact: badPng, format: "png", path: "bad-crc.png" },
      { artifact: badJpeg, format: "jpeg", path: "bad-frame.jpg" },
      { artifact: mismatchedWebp, format: "webp", path: "mismatched.webp" },
      { artifact: badRiff, format: "webp", path: "bad-riff.webp" },
    ] as const;
    const fetchMock = vi.spyOn(globalThis, "fetch");
    for (const { artifact } of cases) {
      fetchMock.mockResolvedValueOnce(
        Response.json({ data: [{ b64_json: artifact.toString("base64") }] }),
      );
    }
    for (const { format, path } of cases) {
      await expect(
        tool().execute(
          `bad-${format}`,
          { operation: "generate", outputFormat: format, outputPath: path, prompt: "mock-up" },
          undefined,
          undefined,
          context(root),
        ),
      ).rejects.toThrow(new RegExp(`invalid ${format}`, "i"));
      await expect(readFile(join(root, path))).rejects.toThrow();
    }
    expect(fetchMock).toHaveBeenCalledTimes(cases.length);
  });

  it("bounds and validates provider response payloads before writing", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-response-validation-"));
    const streamLimit = 2 * 20 * 1024 * 1024 + 8192;
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { headers: { "content-length": "100000000" } }))
      .mockResolvedValueOnce(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new Uint8Array(streamLimit + 1));
            },
          }),
        ),
      )
      .mockResolvedValueOnce(new Response("{"));
    for (const [id, path, error] of [
      ["declared", "declared.png", /response is too large/],
      ["streamed", "streamed.png", /response is too large/],
      ["json", "json.png", /invalid JSON/],
    ] as const) {
      await expect(
        tool().execute(
          id,
          { operation: "generate", outputPath: path, prompt: "mock-up" },
          undefined,
          undefined,
          context(root),
        ),
      ).rejects.toThrow(error);
      await expect(readFile(join(root, path))).rejects.toThrow();
    }
  });

  it("sends edits as multipart input images", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-edit-"));
    await mkdir(join(root, "input"));
    await writeFile(join(root, "input/source.png"), png());
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ data: [{ b64_json: png().toString("base64") }] }));
    await tool().execute(
      "call-edit",
      {
        inputPaths: ["input/source.png"],
        operation: "edit",
        outputPath: "art/edited.png",
        prompt: "Use a calmer hierarchy",
      },
      undefined,
      undefined,
      context(root, { modelHeaders: { "Content-Type": "application/json" } }),
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.openai.com/v1/images/edits");
    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.body).toBeInstanceOf(FormData);
    expect((request?.headers as Headers).has("content-type")).toBe(false);
    expect((request?.body as FormData).getAll("image[]")).toHaveLength(1);
    expect(await readFile(join(root, "art/edited.png"))).toEqual(png());
    fetchMock.mockRestore();
  });

  it("rejects Codex OAuth, invalid project configuration, and cancellation before fetch", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-preflight-"));
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      tool().execute(
        "codex",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { api: "openai-codex-responses" }),
      ),
    ).rejects.toThrow(/Codex subscription OAuth/);
    await expect(
      tool().execute(
        "third-party",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { baseUrl: "https://api.x.ai/v1", provider: "xai" }),
      ),
    ).rejects.toThrow(/official OpenAI Platform/);
    await expect(
      tool().execute(
        "generate-input",
        {
          inputPaths: ["reference.png"],
          operation: "generate",
          outputPath: "out.png",
          prompt: "mock-up",
        },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/only for edit/);
    await mkdir(join(root, ".pi"));
    await writeFile(join(root, ".pi/image-generation.json"), '{"provider":"openai"}');
    await expect(
      tool().execute(
        "config",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { trusted: true }),
      ),
    ).rejects.toThrow(/configuration is invalid/);
    const controller = new AbortController();
    controller.abort();
    await expect(
      tool().execute(
        "abort",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        controller.signal,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/abort/i);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("uses trusted project selection and leaves no artifact for malformed responses", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-config-"));
    await mkdir(join(root, ".pi"));
    await writeFile(
      join(root, ".pi/image-generation.json"),
      '{"provider":"openai","model":"configured"}',
    );
    const selected = {
      api: "openai-responses",
      baseUrl: "https://api.openai.com/v1",
      headers: {},
      id: "configured",
      provider: "openai",
    };
    const find = vi.fn(() => selected);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ data: [] }));
    await expect(
      tool().execute(
        "malformed",
        { operation: "generate", outputPath: "art/out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { find, trusted: true }),
      ),
    ).rejects.toThrow(/no usable image data/);
    expect(find).toHaveBeenCalledWith("openai", "configured");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.openai.com/v1/images/generations");
    await expect(readFile(join(root, "art/out.png"))).rejects.toThrow();
    fetchMock.mockRestore();
  });

  it("refuses overwrite and reports bounded provider errors", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-errors-"));
    await writeFile(join(root, "existing.png"), "keep");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      tool().execute(
        "overwrite",
        { operation: "generate", outputPath: "existing.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/Refusing to overwrite/);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(new Response("x".repeat(100), { status: 500 }));
    await expect(
      tool().execute(
        "provider",
        { operation: "generate", outputPath: "new.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/^Image generation failed \(500\): x{100}$/);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(
      tool().execute(
        "empty-provider-error",
        { operation: "generate", outputPath: "empty-error.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow("Image generation failed (500).");
    await expect(readFile(join(root, "empty-error.png"))).rejects.toThrow();
    fetchMock.mockRestore();
  });

  it("cancels an oversized provider error stream after the bounded message", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-error-stream-"));
    const cancel = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        new ReadableStream<Uint8Array>({
          cancel,
          start(controller) {
            controller.enqueue(new TextEncoder().encode("x".repeat(4096)));
          },
          pull(controller) {
            controller.enqueue(new TextEncoder().encode("unbounded-tail"));
            controller.close();
          },
        }),
        { status: 500 },
      ),
    );
    await expect(
      tool().execute(
        "stream-error",
        { operation: "generate", outputPath: "error.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/^Image generation failed \(500\): x+$/);
    expect(cancel).toHaveBeenCalledTimes(1);
    await expect(readFile(join(root, "error.png"))).rejects.toThrow();
  });

  it("maps portable output controls and preserves an existing authorization header", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-options-"));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ data: [{ b64_json: webp(1536, 1024).toString("base64") }] }),
      );
    await tool().execute(
      "options",
      {
        operation: "generate",
        outputFormat: "webp",
        outputPath: "out.webp",
        prompt: "mock-up",
        size: "1536x1024",
      },
      undefined,
      undefined,
      context(root, {
        authHeaders: { Authorization: "Bearer supplied", "X-Removed": null },
        modelHeaders: { "X-Removed": "old" },
      }),
    );
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(request?.body as string)).toEqual({
      model: "gpt-image-2",
      output_format: "webp",
      prompt: "mock-up",
      size: "1536x1024",
    });
    const headers = request?.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer supplied");
    expect(headers.has("x-removed")).toBe(false);
  });

  it("writes a structurally valid JPEG artifact at the requested dimensions", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-jpeg-"));
    const artifact = jpeg(1024, 1536);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ data: [{ b64_json: artifact.toString("base64") }] }),
    );
    await tool().execute(
      "jpeg",
      {
        operation: "generate",
        outputFormat: "jpeg",
        outputPath: "out.jpeg",
        prompt: "mock-up",
        size: "1024x1536",
      },
      undefined,
      undefined,
      context(root),
    );
    expect(await readFile(join(root, "out.jpeg"))).toEqual(artifact);
  });

  it("validates project paths, edit inputs, masks, and supported image formats", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-inputs-"));
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      tool().execute(
        "outside",
        { operation: "generate", outputPath: "../out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/within the project/);
    await expect(
      tool().execute(
        "missing-input",
        { operation: "edit", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/at least one input/);
    await writeFile(join(root, "bad.txt"), "bad");
    await expect(
      tool().execute(
        "bad-input",
        { inputPaths: ["bad.txt"], operation: "edit", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/PNG, JPEG, or WebP/);
    await writeFile(join(root, "source.jpg"), Buffer.from([0xff, 0xd8, 0xff, 1]));
    await expect(
      tool().execute(
        "bad-mask",
        {
          inputPaths: ["source.jpg"],
          maskPath: "source.jpg",
          operation: "edit",
          outputPath: "out.png",
          prompt: "mock-up",
        },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/mask must be a PNG/);
    await writeFile(join(root, "opaque.png"), png(1024, 1024, false));
    await expect(
      tool().execute(
        "opaque-mask",
        {
          inputPaths: ["source.jpg"],
          maskPath: "opaque.png",
          operation: "edit",
          outputPath: "out.png",
          prompt: "mock-up",
        },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/with alpha/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts multiple supported edit images and a PNG mask", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-formats-"));
    await writeFile(join(root, "source.jpg"), jpeg(1, 1));
    await writeFile(join(root, "source.webp"), webp(1, 1));
    await writeFile(join(root, "mask.png"), png(1024, 1024, true));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ data: [{ b64_json: png(1024, 1536).toString("base64") }] }),
      );
    await tool().execute(
      "formats",
      {
        inputPaths: ["source.jpg", "source.webp"],
        maskPath: "mask.png",
        operation: "edit",
        outputFormat: "png",
        outputPath: "out.png",
        prompt: "mock-up",
        size: "1024x1536",
      },
      undefined,
      undefined,
      context(root),
    );
    const form = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(form.getAll("image[]")).toHaveLength(2);
    expect(form.get("mask")).toBeInstanceOf(File);
    expect(form.get("output_format")).toBe("png");
    expect(form.get("size")).toBe("1024x1536");
  });

  it("rejects missing models, missing keys, bad JSON, and invalid base64 before writing", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-invalid-"));
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      tool().execute(
        "no-model",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { noModel: true }),
      ),
    ).rejects.toThrow(/configured OpenAI Responses model/);
    await expect(
      tool().execute(
        "no-key",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { apiKey: null }),
      ),
    ).rejects.toThrow(/separately billed/);
    await mkdir(join(root, ".pi"));
    await writeFile(join(root, ".pi/image-generation.json"), "{");
    await expect(
      tool().execute(
        "bad-json",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { trusted: true }),
      ),
    ).rejects.toThrow(/configuration is invalid/);
    await rm(join(root, ".pi/image-generation.json"));
    fetchMock.mockResolvedValue(Response.json({ data: [{ b64_json: "%%%" }] }));
    await expect(
      tool().execute(
        "base64",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/invalid base64/);
    await expect(readFile(join(root, "out.png"))).rejects.toThrow();
  });
});
