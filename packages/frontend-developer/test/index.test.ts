import * as fs from "node:fs/promises";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Compile } from "typebox/compile";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import frontendDeveloperExtension from "../src/index.ts";

import type { Api, Model } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { TSchema } from "typebox";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, open: vi.fn(actual.open) };
});

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return { ...actual, homedir: () => join(actual.tmpdir(), "pi-image-generation-test-home") };
});

let testHome: string;
beforeEach(async () => {
  testHome = await mkdtemp(join(tmpdir(), "image-test-home-"));
  vi.spyOn(os, "homedir").mockReturnValue(testHome);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(testHome, { recursive: true, force: true });
});

function crc32(bytes: Buffer): number {
  let crc = 0xff_ff_ff_ff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (-(crc & 1) & 0xed_b8_83_20);
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

function png(
  width = 1024,
  height = 1024,
  alpha = false,
  imageData = Buffer.from([120, 156, 3, 0, 0, 0, 0, 1]),
): Buffer {
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
    chunk("IDAT", imageData),
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
  readonly parameters: TSchema;
  execute(
    id: string,
    input: {
      inputPaths?: string[];
      maskPath?: string;
      operation: "generate" | "edit";
      outputFormat?: "png" | "jpeg" | "webp";
      outputPath: string;
      prompt: string;
      size?: string;
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
    oauth?: boolean;
    api?: string;
    apiKey?: string | null;
    authHeaders?: Record<string, string | null>;
    baseUrl?: string;
    find?: ReturnType<typeof vi.fn>;
    modelHeaders?: Record<string, string | null>;
    modelId?: string;
    noModel?: boolean;
    provider?: string;
    registryModels?: readonly Partial<Model<Api>>[];
    trusted?: boolean;
  } = {},
): ExtensionContext {
  const model = options.noModel
    ? undefined
    : {
        api: options.api ?? "openai-codex-responses",
        baseUrl: options.baseUrl ?? "https://chatgpt.com/backend-api",
        headers: options.modelHeaders ?? { "X-Model": "model" },
        id: options.modelId ?? "gpt-5",
        provider: options.provider ?? "openai-codex",
      };
  return {
    cwd,
    isProjectTrusted: () => options.trusted ?? false,
    model,
    modelRegistry: {
      getAll: () => options.registryModels ?? (model ? [model] : []),
      isUsingOAuth: () => options.oauth ?? true,
      find: options.find ?? vi.fn(),
      getApiKeyAndHeaders: vi.fn(() =>
        Promise.resolve({
          apiKey: options.apiKey === null ? undefined : (options.apiKey ?? "secret"),
          headers: options.authHeaders ?? {
            "X-Trace": "trace",
            "ChatGPT-Account-ID": "test-account",
          },
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
    expect(imageTool.parameters).toHaveProperty("additionalProperties", false);
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
      "https://chatgpt.com/backend-api/codex/images/generations",
      expect.objectContaining({
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: "A calm dashboard",
          background: "opaque",
          quality: "auto",
          size: "auto",
        }),
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

  it.each([
    { api: "openai-responses", provider: "openai", modelId: "gpt-6-astra" },
    { api: "anthropic-messages", provider: "anthropic" },
    { noModel: true },
  ])("discovers Codex OAuth independently of conversation selection %j", async (conversation) => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-independent-auth-"));
    const codex = {
      api: "openai-codex-responses" as const,
      provider: "openai-codex",
      id: "registry-codex",
      headers: { "X-Image-Model": "discovered" },
    };
    const ctx = context(root, {
      ...conversation,
      registryModels: [
        { api: "openai-responses", provider: "openai", id: "gpt-6-astra" },
        { api: "openai-codex-responses", provider: "third-party", id: "ineligible" },
        codex,
      ],
    });
    const conversationModel = ctx.model;
    const auth = vi.spyOn(ctx.modelRegistry, "getApiKeyAndHeaders");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ data: [{ b64_json: png().toString("base64") }] }));
    await tool().execute(
      "independent",
      { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
      undefined,
      undefined,
      ctx,
    );
    expect(await readFile(join(root, "out.png"))).toEqual(png());
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://chatgpt.com/backend-api/codex/images/generations",
      expect.objectContaining({ method: "POST" }),
    );
    expect((fetchMock.mock.calls[0]?.[1]?.headers as Headers).get("x-image-model")).toBe(
      "discovered",
    );
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toMatchObject({
      model: "gpt-image-2",
    });
    expect(auth).toHaveBeenCalledExactlyOnceWith(codex);
    expect(ctx.model).toBe(conversationModel);
  });

  it("tries usable automatic candidates without repeating auth resolution or image requests", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-auth-fallback-"));
    const candidates = ["failed-auth", "bad-account", "usable"].map((id) => ({
      api: "openai-codex-responses" as const,
      provider: "openai-codex",
      id,
    }));
    const ctx = context(root, { registryModels: candidates });
    const auth = vi
      .spyOn(ctx.modelRegistry, "getApiKeyAndHeaders")
      .mockRejectedValueOnce(new Error("private-token"))
      .mockResolvedValueOnce({ ok: true, apiKey: "private-token", headers: {} });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ data: [{ b64_json: png().toString("base64") }] }));
    await tool().execute(
      "fallback",
      { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
      undefined,
      undefined,
      ctx,
    );
    expect(await readFile(join(root, "out.png"))).toEqual(png());
    expect(auth.mock.calls.map(([model]) => model.id)).toEqual([
      "failed-auth",
      "bad-account",
      "usable",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0]?.[1]?.headers as Headers).get("authorization")).toBe(
      "Bearer secret",
    );
  });

  it.each(["returned", "thrown"])(
    "sanitizes %s auth failures with login and configuration guidance",
    async (failure) => {
      expect.hasAssertions();
      const root = await mkdtemp(join(tmpdir(), "image-auth-error-"));
      const ctx = context(root);
      const auth = vi.spyOn(ctx.modelRegistry, "getApiKeyAndHeaders");
      if (failure === "returned") auth.mockResolvedValue({ ok: false, error: "private-token" });
      else auth.mockRejectedValue(new Error("private-token"));
      const fetchMock = vi.spyOn(globalThis, "fetch");
      const result = tool().execute(
        "auth-error",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        ctx,
      );
      await expect(result).rejects.toThrow(/\/login for openai-codex/);
      await expect(result).rejects.toThrow(/image-generation.json/);
      await expect(result).rejects.not.toThrow(/private-token/);
      expect(fetchMock).not.toHaveBeenCalled();
      await expect(readFile(join(root, "out.png"))).rejects.toThrow();
    },
  );

  it.each(["missing", "ineligible", "unusable"])(
    "keeps %s explicit configuration authoritative without automatic fallback",
    async (failure) => {
      expect.hasAssertions();
      const root = await mkdtemp(join(tmpdir(), "image-explicit-error-"));
      const path = join(root, ".pi/image-generation.json");
      await mkdir(join(root, ".pi"));
      await writeFile(path, JSON.stringify({ provider: "openai-codex", model: "explicit" }));
      const ctx = context(root, {
        trusted: true,
        find: vi.fn(() =>
          failure === "missing"
            ? undefined
            : {
                api: failure === "ineligible" ? "openai-responses" : "openai-codex-responses",
                provider: "openai-codex",
                id: "explicit",
              },
        ),
      });
      const getAll = vi.spyOn(ctx.modelRegistry, "getAll");
      vi.spyOn(ctx.modelRegistry, "getApiKeyAndHeaders").mockResolvedValue({
        ok: false,
        error: "private-token",
      });
      const fetchMock = vi.spyOn(globalThis, "fetch");
      const result = tool().execute(
        "explicit-error",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        ctx,
      );
      await expect(result).rejects.toThrow(path);
      await expect(result).rejects.toThrow(/existing openai-codex-responses registry model ID/);
      await expect(result).rejects.not.toThrow(/private-token/);
      expect(getAll).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      await expect(readFile(join(root, "out.png"))).rejects.toThrow();
    },
  );

  it("uses user configuration for untrusted projects and trusted project configuration first", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-config-precedence-"));
    vi.spyOn(os, "homedir").mockReturnValue(root);
    await mkdir(join(root, ".pi/agent"), { recursive: true });
    await writeFile(
      join(root, ".pi/agent/image-generation.json"),
      JSON.stringify({ provider: "openai-codex", model: "user" }),
    );
    await writeFile(join(root, ".pi/image-generation.json"), "{");
    const find = vi.fn((_provider: string, id: string) => ({
      api: "openai-codex-responses",
      provider: "openai-codex",
      id,
      headers: { "X-Selection": id },
    }));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        Promise.resolve(Response.json({ data: [{ b64_json: png().toString("base64") }] })),
      );
    await tool().execute(
      "user",
      { operation: "generate", outputPath: "user.png", prompt: "mock-up" },
      undefined,
      undefined,
      context(root, { find }),
    );
    expect(await readFile(join(root, "user.png"))).toEqual(png());
    expect((fetchMock.mock.calls[0]?.[1]?.headers as Headers).get("x-selection")).toBe("user");
    await writeFile(
      join(root, ".pi/image-generation.json"),
      JSON.stringify({ provider: "openai-codex", model: "project" }),
    );
    await writeFile(join(root, ".pi/agent/image-generation.json"), "{");
    await tool().execute(
      "project",
      { operation: "generate", outputPath: "project.png", prompt: "mock-up" },
      undefined,
      undefined,
      context(root, { find, trusted: true }),
    );
    expect(await readFile(join(root, "project.png"))).toEqual(png());
    expect((fetchMock.mock.calls[1]?.[1]?.headers as Headers).get("x-selection")).toBe("project");
    await expect(
      tool().execute(
        "invalid-user",
        { operation: "generate", outputPath: "invalid.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { find }),
      ),
    ).rejects.toThrow(join(root, ".pi/agent/image-generation.json"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(readFile(join(root, "invalid.png"))).rejects.toThrow();
  });

  it("accepts bounded multi-megabyte PNG artifacts", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-large-"));
    const artifact = png(1024, 1024, false, Buffer.alloc(8 * 1024 * 1024));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ data: [{ b64_json: artifact.toString("base64") }] }),
    );
    await tool().execute(
      "large",
      { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
      undefined,
      undefined,
      context(root),
    );
    expect((await readFile(join(root, "out.png"))).equals(artifact)).toBe(true);
  });

  it("removes the output when cancelled between opening and writing evidence", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-write-cancel-"));
    const controller = new AbortController();
    const realOpen = (await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises"))
      .open;
    vi.mocked(fs.open).mockImplementationOnce(async (...args) => {
      const handle = await realOpen(...args);
      controller.abort();
      return handle;
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ data: [{ b64_json: png().toString("base64") }] }),
    );
    await expect(
      tool().execute(
        "cancel-write",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        controller.signal,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/abort/i);
    await expect(readFile(join(root, "out.png"))).rejects.toThrow();
  });

  it("rejects mismatched output extensions and invalid provider image artifacts", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-artifact-validation-"));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
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
    ).rejects.toThrow(/PNG only/);
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

  it("rejects malformed PNG containers before writing", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-malformed-"));
    const badPng = png();
    badPng[20] = 1;
    const fetchMock = vi.spyOn(globalThis, "fetch");
    for (const artifact of [jpeg(1024, 1024), png(0, 1024), badPng]) {
      fetchMock.mockResolvedValueOnce(
        Response.json({ data: [{ b64_json: artifact.toString("base64") }] }),
      );
      await expect(
        tool().execute(
          "bad",
          { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
          undefined,
          undefined,
          context(root),
        ),
      ).rejects.toThrow(/invalid PNG/);
      await expect(readFile(join(root, "out.png"))).rejects.toThrow();
    }
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

  it("sends reference edits as native Codex JSON", async () => {
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
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://chatgpt.com/backend-api/codex/images/edits");
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(request?.body as string)).toEqual({
      model: "gpt-image-2",
      prompt: "Use a calmer hierarchy",
      background: "opaque",
      quality: "auto",
      size: "auto",
      images: [{ image_url: `data:image/png;base64,${png().toString("base64")}` }],
    });
    expect((request?.headers as Headers).get("content-type")).toBe("application/json");
    expect(await readFile(join(root, "art/edited.png"))).toEqual(png());
    fetchMock.mockRestore();
  });

  it("rejects Platform/API-key auth, invalid project configuration, and cancellation before fetch", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-preflight-"));
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(
      tool().execute(
        "codex",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { oauth: false }),
      ),
    ).rejects.toThrow(/OAuth/);
    await expect(
      tool().execute(
        "platform",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { api: "openai-responses", provider: "openai", oauth: false }),
      ),
    ).rejects.toThrow(/openai-codex/);
    await expect(
      tool().execute(
        "third-party",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { baseUrl: "https://api.x.ai/v1", provider: "xai" }),
      ),
    ).rejects.toThrow(/openai-codex/);
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
    await writeFile(
      join(root, ".pi/image-generation.json"),
      JSON.stringify({
        provider: "openai-codex",
        model: "configured",
        imageModel: "gpt-image-2.5",
      }),
    );
    await expect(
      tool().execute(
        "future-model",
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
      '{"provider":"openai-codex","model":"configured","imageModel":"gpt-image-2"}',
    );
    const selected = {
      api: "openai-codex-responses",
      baseUrl: "https://chatgpt.com/backend-api",
      headers: {},
      id: "configured",
      provider: "openai-codex",
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
    expect(find).toHaveBeenCalledWith("openai-codex", "configured");
    const body = fetchMock.mock.calls[0]?.[1]?.body;
    if (typeof body !== "string") throw new Error("Expected JSON image request");
    expect(JSON.parse(body)).toMatchObject({ model: "gpt-image-2" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://chatgpt.com/backend-api/codex/images/generations",
    );
    await expect(readFile(join(root, "art/out.png"))).rejects.toThrow();
    fetchMock.mockRestore();
  });

  it("removes a partial artifact when the filesystem write fails", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-write-failure-"));
    const realOpen = (await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises"))
      .open;
    vi.mocked(fs.open).mockImplementationOnce(async (...args) => {
      const handle = await realOpen(...args);
      vi.spyOn(handle, "writeFile").mockRejectedValue(new Error("Disk full"));
      return handle;
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ data: [{ b64_json: png().toString("base64") }] }),
    );
    try {
      await expect(
        tool().execute(
          "write-failure",
          { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
          undefined,
          undefined,
          context(root),
        ),
      ).rejects.toThrow("Disk full");
      await expect(readFile(join(root, "out.png"))).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("passes cancellation to the image runtime and leaves no artifact", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-cancel-"));
    const controller = new AbortController();
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      return Promise.reject(new DOMException("Cancelled", "AbortError"));
    });
    try {
      await expect(
        tool().execute(
          "cancel",
          { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
          controller.signal,
          undefined,
          context(root),
        ),
      ).rejects.toThrow("Cancelled");
      await expect(readFile(join(root, "out.png"))).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("cancels a pending response read and never writes cancelled evidence", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-read-cancel-"));
    const controller = new AbortController();
    const cancel = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        new ReadableStream<Uint8Array>(
          {
            pull() {
              controller.abort();
            },
            cancel,
          },
          { highWaterMark: 0 },
        ),
      ),
    );
    await expect(
      tool().execute(
        "read-cancel",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        controller.signal,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/abort/i);
    expect(cancel).toHaveBeenCalledTimes(1);
    await expect(readFile(join(root, "out.png"))).rejects.toThrow();
  });

  it("does not expose credential-bearing network or stream failures", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-safe-errors-"));
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("Bearer secret"))
      .mockResolvedValueOnce(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.error(new Error("Bearer secret"));
            },
          }),
        ),
      );
    for (const outputPath of ["network.png", "stream.png"]) {
      const result = tool().execute(
        "safe-errors",
        { operation: "generate", outputPath, prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      );
      await expect(result).rejects.not.toThrow(/secret/);
      await expect(readFile(join(root, outputPath))).rejects.toThrow();
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
    fetchMock.mockResolvedValueOnce(new Response("secret".repeat(100), { status: 500 }));
    await expect(
      tool().execute(
        "provider",
        { operation: "generate", outputPath: "new.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/Image generation failed \(500\)\./);
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
    ).rejects.toThrow(/Image generation failed \(500\)\./);
    expect(cancel).toHaveBeenCalledTimes(1);
    await expect(readFile(join(root, "error.png"))).rejects.toThrow();
  });

  it("forwards custom dimensions unchanged and isolates native image headers", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-custom-size-"));
    const input = {
      operation: "generate" as const,
      outputPath: "out.png",
      prompt: "mock-up",
      size: "1600x1024",
    };
    expect(Compile(tool().parameters).Check(input)).toBe(true);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ data: [{ b64_json: png(1600, 1024).toString("base64") }] }),
      );
    await tool().execute(
      "custom",
      input,
      undefined,
      undefined,
      context(root, {
        baseUrl: "https://untrusted.invalid/injection",
        authHeaders: {
          "CHATGPT-Account-ID": "resolved-account",
          "x-removed": null,
          "X-MODEL": "override",
        },
        modelHeaders: {
          "X-Removed": "old",
          "X-Model": "old",
          "OpenAI-Beta": "responses=experimental",
          Accept: "text/event-stream",
          "Content-Type": "multipart/form-data",
        },
      }),
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://chatgpt.com/backend-api/codex/images/generations",
    );
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(request?.body as string)).toEqual({
      model: "gpt-image-2",
      prompt: "mock-up",
      background: "opaque",
      quality: "auto",
      size: "1600x1024",
    });
    const headers = request?.headers as Headers;
    expect(headers.get("chatgpt-account-id")).toBe("resolved-account");
    expect(headers.get("x-model")).toBe("override");
    expect(headers.has("x-removed")).toBe(false);
    expect(headers.has("openai-beta")).toBe(false);
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("originator")).toBe("pi-frontend-developer");
    expect(headers.get("user-agent")).toContain("pi-frontend-developer");
    expect(headers.get("x-codex-image-turn-id")).toBeTruthy();
    expect(await readFile(join(root, "out.png"))).toEqual(png(1600, 1024));
  });

  it("rejects invalid sizes and unsupported controls before authentication", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-controls-"));
    const ctx = context(root);
    const authMock = vi.spyOn(ctx.modelRegistry, "getApiKeyAndHeaders");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    for (const controls of [
      { size: "1025x1024" },
      { size: "4000x2048" },
      { size: "3072x768" },
      { size: "512x512" },
      { size: "3840x3840" },
      { size: "garbage" },
      { maskPath: "mask.png" },
      { outputFormat: "jpeg" as const },
      { outputFormat: "webp" as const },
    ]) {
      await expect(
        tool().execute(
          "invalid",
          { operation: "generate", outputPath: "out.png", prompt: "mock-up", ...controls },
          undefined,
          undefined,
          ctx,
        ),
      ).rejects.toThrow(/size|PNG only|masks/i);
    }
    expect(authMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses bounded JWT account metadata when registry headers omit it", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-jwt-"));
    const token = `header.${Buffer.from(JSON.stringify({ "https://api.openai.com/auth": { chatgpt_account_id: "jwt-account" } })).toString("base64url")}.signature`;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ data: [{ b64_json: png().toString("base64") }] }));
    await tool().execute(
      "jwt",
      { operation: "generate", outputPath: "out.png", prompt: "mock-up", size: "auto" },
      undefined,
      undefined,
      context(root, { apiKey: token, authHeaders: {} }),
    );
    expect((fetchMock.mock.calls[0]?.[1]?.headers as Headers).get("chatgpt-account-id")).toBe(
      "jwt-account",
    );
    await expect(
      tool().execute(
        "bad-jwt",
        { operation: "generate", outputPath: "bad.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { authHeaders: {} }),
      ),
    ).rejects.toThrow(/account|login/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
    ).rejects.toThrow(/masks/);
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
    ).rejects.toThrow(/masks/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts JPEG and WebP references in the JSON edit images array", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "image-formats-"));
    await mkdir(join(root, ".pi"));
    await writeFile(
      join(root, ".pi/image-generation.json"),
      JSON.stringify({ provider: "openai-codex", model: "configured", imageModel: "gpt-image-2" }),
    );
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
        operation: "edit",
        outputFormat: "png",
        outputPath: "out.png",
        prompt: "mock-up",
        size: "1024x1536",
      },
      undefined,
      undefined,
      context(root, {
        trusted: true,
        find: vi.fn(() => ({
          api: "openai-codex-responses",
          baseUrl: "https://chatgpt.com/backend-api",
          id: "configured",
          provider: "openai-codex",
        })),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<
      string,
      unknown
    >;
    expect(body).toEqual({
      model: "gpt-image-2",
      prompt: "mock-up",
      background: "opaque",
      quality: "auto",
      size: "1024x1536",
      images: [
        { image_url: `data:image/jpeg;base64,${jpeg(1, 1).toString("base64")}` },
        { image_url: `data:image/webp;base64,${webp(1, 1).toString("base64")}` },
      ],
    });
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
    ).rejects.toThrow(/openai-codex/);
    await expect(
      tool().execute(
        "no-key",
        { operation: "generate", outputPath: "out.png", prompt: "mock-up" },
        undefined,
        undefined,
        context(root, { apiKey: null }),
      ),
    ).rejects.toThrow(/OAuth/);
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
