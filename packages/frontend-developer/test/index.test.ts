import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import frontendDeveloperExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

afterEach(() => {
  vi.restoreAllMocks();
});

function png(alpha: boolean): Buffer {
  const bytes = Buffer.alloc(26);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes[25] = alpha ? 6 : 2;
  return bytes;
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
      .mockResolvedValue(
        Response.json({ data: [{ b64_json: Buffer.from("image").toString("base64") }] }),
      );
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
    expect(await readFile(join(root, "art/mockup.png"), "utf8")).toBe("image");
    expect(result.content[0]?.text).toContain("art/mockup.png");
    expect(result.content[0]?.text).not.toContain("secret");
    fetchMock.mockRestore();
  });

  it("sends edits as multipart input images", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-edit-"));
    await mkdir(join(root, "input"));
    await writeFile(
      join(root, "input/source.png"),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
    );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ data: [{ b64_json: Buffer.from("edited").toString("base64") }] }),
      );
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
    expect(await readFile(join(root, "art/edited.png"), "utf8")).toBe("edited");
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
    fetchMock.mockResolvedValue(new Response("x".repeat(10_000), { status: 500 }));
    await expect(
      tool().execute(
        "provider",
        { operation: "generate", outputPath: "new.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/^Image generation failed \(500\): x{100}/);
    fetchMock.mockRestore();
  });

  it("maps portable output controls and preserves an existing authorization header", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-options-"));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ data: [{ b64_json: Buffer.from("ok").toString("base64") }] }),
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
    await writeFile(join(root, "opaque.png"), png(false));
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
    await writeFile(join(root, "source.jpg"), Buffer.from([0xff, 0xd8, 0xff, 1]));
    await writeFile(join(root, "source.webp"), Buffer.from("RIFFxxxxWEBPdata"));
    await writeFile(join(root, "mask.png"), png(true));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ data: [{ b64_json: Buffer.from("ok").toString("base64") }] }),
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
