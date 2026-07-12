import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

import webSearchExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface RegisteredTool {
  readonly description: string;
  readonly name: string;
  readonly parameters: {
    readonly properties?: {
      readonly query?: { readonly description?: string };
    };
  };
  readonly promptGuidelines?: readonly string[];
  readonly promptSnippet?: string;
  execute(
    id: string,
    input: { readonly query: string },
    signal: AbortSignal | undefined,
    update:
      | ((result: {
          readonly content: readonly { readonly text: string; readonly type: "text" }[];
          readonly details: Readonly<Record<string, unknown>>;
        }) => void)
      | undefined,
    context: ExtensionContext,
  ): Promise<{
    readonly content: { readonly text: string; readonly type: "text" }[];
    readonly details: {
      readonly api: string;
      readonly model: string;
      readonly provider: string;
      readonly sourceCount?: number;
      readonly sources: readonly { readonly title: string; readonly url: string }[];
      readonly truncated?: boolean;
      readonly visibleSourceCount?: number;
    };
  }>;
}

type ResolvedAuth =
  | {
      readonly apiKey?: string;
      readonly headers?: Record<string, string>;
      readonly ok: true;
    }
  | { readonly error: string; readonly ok: false };

interface RegistryMocks {
  readonly find: Mock<(provider: string, model: string) => unknown>;
  readonly getAuth: Mock<(model: unknown) => Promise<ResolvedAuth>>;
}

function sseResponse(events: readonly unknown[]): Response {
  return new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), {
    headers: { "content-type": "text/event-stream" },
    status: 200,
  });
}

function requestUrl(input: string | URL | Request): string {
  return typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
}

function requestJson(init: RequestInit | undefined): unknown {
  if (typeof init?.body !== "string") {
    throw new TypeError("Expected a JSON request body.");
  }
  return JSON.parse(init.body) as unknown;
}

function registerTool(): RegisteredTool {
  let tool: RegisteredTool | undefined;
  webSearchExtension({
    registerTool(definition: RegisteredTool) {
      tool = definition;
    },
  } as unknown as ExtensionAPI);
  if (tool === undefined) {
    throw new Error("web_search was not registered");
  }
  return tool;
}

function context(model: Record<string, unknown> | undefined): ExtensionContext {
  return {
    cwd: "/projects/example",
    isProjectTrusted: () => false,
    model,
    modelRegistry: {
      find: vi.fn(),
      getApiKeyAndHeaders: vi.fn(),
      getAvailable: vi.fn(() => []),
    },
  } as unknown as ExtensionContext;
}

function registryMocks(ctx: ExtensionContext): RegistryMocks {
  const registry = ctx.modelRegistry as unknown as {
    readonly find: RegistryMocks["find"];
    readonly getApiKeyAndHeaders: RegistryMocks["getAuth"];
  };
  return {
    find: registry.find,
    getAuth: registry.getApiKeyAndHeaders,
  };
}

function providerModel(api: string): Record<string, unknown> {
  switch (api) {
    case "anthropic-messages":
      return {
        api,
        baseUrl: "https://api.anthropic.com/v1",
        id: "claude-sonnet-5",
        maxTokens: 64_000,
        provider: "anthropic",
      };
    case "google-generative-ai":
      return {
        api,
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        id: "gemini-3-pro",
        provider: "google",
      };
    default:
      return {
        api,
        baseUrl: "https://api.openai.com/v1",
        id: "gpt-5.6",
        provider: "openai",
      };
  }
}

describe("pi-web-search extension", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers web_search and rejects a current model without native search", async () => {
    expect.hasAssertions();
    const tool = registerTool();
    expect(tool.name).toBe("web_search");
    expect(tool.promptSnippet).toContain("provider-native web search");
    expect(tool.promptGuidelines).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Use web_search /u)]),
    );
    expect(tool.parameters.properties?.query?.description).toMatch(/focused.*self-contained/iu);
    expect(tool.promptGuidelines).toEqual(
      expect.arrayContaining([expect.stringMatching(/one focused.*search again only/iu)]),
    );

    await expect(
      tool.execute(
        "search-1",
        { query: "current Pi release" },
        undefined,
        undefined,
        context({
          api: "openai-completions",
          id: "local-model",
          provider: "local",
        }),
      ),
    ).rejects.toThrow(/current model .* does not support native web search/iu);
  });

  it("searches with the current OpenAI Responses model and returns cited sources", async () => {
    expect.hasAssertions();
    const fetch = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      expect(requestUrl(input)).toBe("https://api.openai.com/v1/responses");
      expect(init?.headers).toEqual(expect.objectContaining({ authorization: "Bearer test-key" }));
      expect(requestJson(init)).toEqual(
        expect.objectContaining({
          input: "What is the current Pi release?",
          model: "gpt-5.6",
          reasoning: { effort: "low" },
          stream: true,
          tools: [{ type: "web_search" }],
        }),
      );
      return Promise.resolve(
        sseResponse([
          { type: "response.web_search_call.searching" },
          { type: "response.output_text.delta", delta: "Pi 0.80.6 is current." },
          {
            type: "response.output_text.annotation.added",
            annotation: {
              type: "url_citation",
              title: "Pi releases",
              url: "https://github.com/earendil-works/pi/releases",
            },
          },
          { type: "response.completed", response: { output: [] } },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const ctx = context({
      api: "openai-responses",
      baseUrl: "https://api.openai.com/v1",
      id: "gpt-5.6",
      provider: "openai",
      reasoning: true,
    });
    registryMocks(ctx).getAuth.mockResolvedValue({
      apiKey: "test-key",
      ok: true,
    });
    const updates: string[] = [];

    const result = await registerTool().execute(
      "search-2",
      { query: "What is the current Pi release?" },
      undefined,
      (update) => {
        updates.push(update.content[0]?.text ?? "");
      },
      ctx,
    );

    expect(fetch).toHaveBeenCalledOnce();
    expect(updates[0]).toBe("Searching the web with openai/gpt-5.6…");
    expect(result.content[0]?.text).toContain("Pi 0.80.6 is current.");
    expect(result.content[0]?.text).toContain("https://github.com/earendil-works/pi/releases");
    expect(result.details).toEqual(
      expect.objectContaining({
        api: "openai-responses",
        model: "gpt-5.6",
        provider: "openai",
        sources: [
          {
            title: "Pi releases",
            url: "https://github.com/earendil-works/pi/releases",
          },
        ],
      }),
    );
  });

  it("uses Pi's provider environment fallback for direct web-search requests", async () => {
    expect.hasAssertions();
    const previousKey = process.env["OPENAI_API_KEY"];
    process.env["OPENAI_API_KEY"] = "environment-key";
    try {
      vi.stubGlobal(
        "fetch",
        vi.fn((_input: string | URL | Request, init?: RequestInit) => {
          expect(new Headers(init?.headers).get("authorization")).toBe("Bearer environment-key");
          return Promise.resolve(
            sseResponse([{ delta: "Environment answer.", type: "response.output_text.delta" }]),
          );
        }),
      );
      const ctx = context(providerModel("openai-responses"));
      registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

      const result = await registerTool().execute(
        "search-environment-auth",
        { query: "Use environment auth" },
        undefined,
        undefined,
        ctx,
      );
      expect(result.content[0]?.text).toContain("Environment answer.");
    } finally {
      if (previousKey === undefined) {
        delete process.env["OPENAI_API_KEY"];
      } else {
        process.env["OPENAI_API_KEY"] = previousKey;
      }
    }
  });

  it("collects OpenAI citations and search sources from the completed response", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          sseResponse([
            { type: "response.output_text.delta", delta: "A sourced answer." },
            {
              type: "response.completed",
              response: {
                output: [
                  {
                    action: {
                      sources: [{ title: "Search result", url: "https://example.com/search" }],
                    },
                    type: "web_search_call",
                  },
                  {
                    content: [
                      {
                        annotations: [
                          {
                            title: "Cited result",
                            type: "url_citation",
                            url: "https://example.com/citation",
                          },
                        ],
                        type: "output_text",
                      },
                    ],
                    type: "message",
                  },
                ],
              },
            },
          ]),
        ),
      ),
    );
    const ctx = context({
      api: "openai-responses",
      baseUrl: "https://api.openai.com/v1",
      id: "gpt-5.6",
      provider: "openai",
    });
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    const result = await registerTool().execute(
      "search-completed",
      { query: "Use completed response sources" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.details.sources).toEqual([
      { title: "Search result", url: "https://example.com/search" },
      { title: "Cited result", url: "https://example.com/citation" },
    ]);
  });

  it("uses an explicitly configured web-search model instead of the conversation model", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-web-search-test-"));
    const configPath = join(directory, "web-search.json");
    const configuredModel = {
      api: "openai-responses",
      baseUrl: "https://search.example/v1",
      id: "search-model",
      provider: "search-provider",
    };
    const previousConfigPath = process.env["PI_WEB_SEARCH_CONFIG"];
    try {
      await writeFile(
        configPath,
        JSON.stringify({ model: "search-model", provider: "search-provider" }),
        "utf8",
      );
      process.env["PI_WEB_SEARCH_CONFIG"] = configPath;
      const fetch = vi.fn((_input: string | URL | Request, init?: RequestInit) => {
        expect(requestJson(init)).toEqual(expect.objectContaining({ model: "search-model" }));
        return Promise.resolve(
          sseResponse([{ type: "response.output_text.delta", delta: "Configured model answer." }]),
        );
      });
      vi.stubGlobal("fetch", fetch);
      const ctx = context({
        api: "openai-responses",
        baseUrl: "https://conversation.example/v1",
        id: "conversation-model",
        provider: "conversation-provider",
      });
      registryMocks(ctx).find.mockReturnValue(configuredModel);
      registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

      const result = await registerTool().execute(
        "search-3",
        { query: "Use the configured model" },
        undefined,
        undefined,
        ctx,
      );

      expect(registryMocks(ctx).find).toHaveBeenCalledWith("search-provider", "search-model");
      expect(result.details).toEqual(
        expect.objectContaining({ model: "search-model", provider: "search-provider" }),
      );
    } finally {
      if (previousConfigPath === undefined) {
        delete process.env["PI_WEB_SEARCH_CONFIG"];
      } else {
        process.env["PI_WEB_SEARCH_CONFIG"] = previousConfigPath;
      }
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("uses a trusted worktree's project-local model configuration", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-web-search-project-"));
    try {
      await mkdir(join(directory, ".pi"));
      await writeFile(
        join(directory, ".pi", "web-search.json"),
        JSON.stringify({ model: "claude-sonnet-5", provider: "anthropic" }),
        "utf8",
      );
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            sseResponse([
              {
                type: "content_block_delta",
                delta: { text: "Project model answer.", type: "text_delta" },
              },
            ]),
          ),
        ),
      );
      const ctx = context({
        api: "openai-responses",
        baseUrl: "https://api.openai.com/v1",
        id: "gpt-5.6",
        provider: "openai",
      });
      Object.assign(ctx, { cwd: directory, isProjectTrusted: () => true });
      registryMocks(ctx).find.mockReturnValue({
        api: "anthropic-messages",
        baseUrl: "https://api.anthropic.com",
        id: "claude-sonnet-5",
        maxTokens: 64_000,
        provider: "anthropic",
      });
      registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

      const result = await registerTool().execute(
        "search-project",
        { query: "Use this worktree's model" },
        undefined,
        undefined,
        ctx,
      );

      expect(registryMocks(ctx).find).toHaveBeenCalledWith("anthropic", "claude-sonnet-5");
      expect(result.details).toEqual(
        expect.objectContaining({ model: "claude-sonnet-5", provider: "anthropic" }),
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects invalid explicit configuration without contacting a provider", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "pi-web-search-invalid-"));
    const configPath = join(directory, "web-search.json");
    const previousConfigPath = process.env["PI_WEB_SEARCH_CONFIG"];
    try {
      await writeFile(configPath, JSON.stringify({ model: "gpt-5.6" }), "utf8");
      process.env["PI_WEB_SEARCH_CONFIG"] = configPath;
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);

      await expect(
        registerTool().execute(
          "search-invalid",
          { query: "Do not search" },
          undefined,
          undefined,
          context({
            api: "openai-responses",
            baseUrl: "https://api.openai.com/v1",
            id: "gpt-5.6",
            provider: "openai",
          }),
        ),
      ).rejects.toThrow(/expected only non-empty provider and model strings/iu);
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      if (previousConfigPath === undefined) {
        delete process.env["PI_WEB_SEARCH_CONFIG"];
      } else {
        process.env["PI_WEB_SEARCH_CONFIG"] = previousConfigPath;
      }
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("reports missing, malformed, unknown, and unsupported model selections", async () => {
    expect.hasAssertions();
    await expect(
      registerTool().execute(
        "search-no-model",
        { query: "No model" },
        undefined,
        undefined,
        context(undefined),
      ),
    ).rejects.toThrow("No current model is selected");

    const directory = await mkdtemp(join(tmpdir(), "pi-web-search-selection-"));
    const configPath = join(directory, "web-search.json");
    const previousConfigPath = process.env["PI_WEB_SEARCH_CONFIG"];
    process.env["PI_WEB_SEARCH_CONFIG"] = configPath;
    const ctx = context(providerModel("openai-responses"));
    try {
      await writeFile(configPath, "{", "utf8");
      await expect(
        registerTool().execute(
          "search-malformed",
          { query: "Malformed" },
          undefined,
          undefined,
          ctx,
        ),
      ).rejects.toThrow(/Invalid web search configuration/iu);

      await writeFile(configPath, "[]", "utf8");
      await expect(
        registerTool().execute("search-array", { query: "Array" }, undefined, undefined, ctx),
      ).rejects.toThrow("expected a JSON object");

      await writeFile(
        configPath,
        JSON.stringify({ model: "unknown", provider: "unknown" }),
        "utf8",
      );
      await expect(
        registerTool().execute("search-unknown", { query: "Unknown" }, undefined, undefined, ctx),
      ).rejects.toThrow("was not found");

      registryMocks(ctx).find.mockReturnValue({
        api: "openai-completions",
        id: "unsupported",
        provider: "local",
      });
      await expect(
        registerTool().execute(
          "search-unsupported",
          { query: "Unsupported" },
          undefined,
          undefined,
          ctx,
        ),
      ).rejects.toThrow("does not support native web search");
    } finally {
      if (previousConfigPath === undefined) {
        delete process.env["PI_WEB_SEARCH_CONFIG"];
      } else {
        process.env["PI_WEB_SEARCH_CONFIG"] = previousConfigPath;
      }
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("uses Gemini grounding when the current model uses Google Generative AI", async () => {
    expect.hasAssertions();
    const fetch = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      expect(requestUrl(input)).toBe(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro:streamGenerateContent?alt=sse",
      );
      expect(init?.headers).toEqual(expect.objectContaining({ "x-goog-api-key": "gemini-key" }));
      expect(requestJson(init)).toEqual({
        contents: [{ parts: [{ text: "Find Pi documentation" }], role: "user" }],
        tools: [{ google_search: {} }],
      });
      return Promise.resolve(
        sseResponse([
          {
            candidates: [
              {
                content: { parts: [{ text: "Pi documentation is available online." }] },
              },
            ],
          },
          {
            candidates: [
              {
                groundingMetadata: {
                  groundingChunks: [
                    {
                      web: {
                        title: "Pi documentation",
                        uri: "https://pi.dev/docs/latest",
                      },
                    },
                  ],
                  webSearchQueries: ["Pi documentation"],
                },
              },
            ],
          },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const ctx = context({
      api: "google-generative-ai",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      id: "gemini-3-pro",
      provider: "google",
    });
    registryMocks(ctx).getAuth.mockResolvedValue({
      apiKey: "gemini-key",
      ok: true,
    });

    const result = await registerTool().execute(
      "search-4",
      { query: "Find Pi documentation" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.content[0]?.text).toContain("Pi documentation is available online.");
    expect(result.content[0]?.text).toContain("https://pi.dev/docs/latest");
    expect(result.details).toEqual(
      expect.objectContaining({
        api: "google-generative-ai",
        model: "gemini-3-pro",
        provider: "google",
        sources: [{ title: "Pi documentation", url: "https://pi.dev/docs/latest" }],
      }),
    );
  });

  it("uses Anthropic server-side web search for an Anthropic Messages model", async () => {
    expect.hasAssertions();
    const fetch = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      expect(requestUrl(input)).toBe("https://api.anthropic.com/v1/messages");
      expect(init?.headers).toEqual(expect.objectContaining({ "x-api-key": "anthropic-key" }));
      expect(requestJson(init)).toEqual(
        expect.objectContaining({
          max_tokens: 4096,
          messages: [{ content: "Find Pi releases", role: "user" }],
          model: "claude-sonnet-5",
          stream: true,
          tools: [{ max_uses: 5, name: "web_search", type: "web_search_20250305" }],
        }),
      );
      return Promise.resolve(
        sseResponse([
          {
            type: "content_block_start",
            content_block: {
              id: "search_1",
              input: { query: "Pi releases" },
              name: "web_search",
              type: "server_tool_use",
            },
          },
          {
            type: "content_block_start",
            content_block: {
              content: [
                {
                  title: "Pi releases",
                  type: "web_search_result",
                  url: "https://github.com/earendil-works/pi/releases",
                },
              ],
              tool_use_id: "search_1",
              type: "web_search_tool_result",
            },
          },
          {
            type: "content_block_delta",
            delta: { text: "The latest Pi release is documented on GitHub.", type: "text_delta" },
          },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const ctx = context({
      api: "anthropic-messages",
      baseUrl: "https://api.anthropic.com",
      id: "claude-sonnet-5",
      maxTokens: 64_000,
      provider: "anthropic",
    });
    registryMocks(ctx).getAuth.mockResolvedValue({
      apiKey: "anthropic-key",
      ok: true,
    });

    const result = await registerTool().execute(
      "search-5",
      { query: "Find Pi releases" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.content[0]?.text).toContain("latest Pi release");
    expect(result.content[0]?.text).toContain("https://github.com/earendil-works/pi/releases");
    expect(result.details).toEqual(
      expect.objectContaining({
        api: "anthropic-messages",
        model: "claude-sonnet-5",
        provider: "anthropic",
      }),
    );
  });

  it("uses Anthropic OAuth headers for the newest Claude models", async () => {
    expect.hasAssertions();
    const fetch = vi.fn((_input: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBe("Bearer sk-ant-oat-test-token");
      expect(headers.get("anthropic-beta")).toContain("oauth-2025-04-20");
      expect(headers.get("user-agent")).toMatch(/^claude-cli\//u);
      expect(headers.get("x-app")).toBe("cli");
      expect(headers.has("x-api-key")).toBe(false);
      return Promise.resolve(
        sseResponse([
          {
            type: "content_block_delta",
            delta: { text: "Claude OAuth search answer.", type: "text_delta" },
          },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const ctx = context({
      api: "anthropic-messages",
      baseUrl: "https://api.anthropic.com",
      id: "claude-sonnet-5",
      maxTokens: 64_000,
      provider: "anthropic",
    });
    registryMocks(ctx).getAuth.mockResolvedValue({
      apiKey: "sk-ant-oat-test-token",
      ok: true,
    });

    const result = await registerTool().execute(
      "search-oauth",
      { query: "Search with Claude OAuth" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.content[0]?.text).toContain("Claude OAuth search answer.");
  });

  it("uses the Codex Responses endpoint and OAuth account headers", async () => {
    expect.hasAssertions();
    const token = `header.${Buffer.from(
      JSON.stringify({
        "https://api.openai.com/auth": { chatgpt_account_id: "account-123" },
      }),
    ).toString("base64url")}.signature`;
    const fetch = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      expect(requestUrl(input)).toBe("https://chatgpt.com/backend-api/codex/responses");
      expect(init?.headers).toEqual(
        expect.objectContaining({
          authorization: `Bearer ${token}`,
          "chatgpt-account-id": "account-123",
          originator: "codex_cli_rs",
        }),
      );
      expect(requestJson(init)).toEqual(
        expect.objectContaining({
          input: [
            {
              content: [{ text: "Search with Codex", type: "input_text" }],
              role: "user",
            },
          ],
          model: "gpt-5.3-codex",
          tool_choice: "required",
        }),
      );
      return Promise.resolve(
        sseResponse([
          { type: "response.output_text.delta", delta: "Codex search answer." },
          { type: "response.completed", response: { output: [] } },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const ctx = context({
      api: "openai-codex-responses",
      baseUrl: "https://chatgpt.com/backend-api",
      id: "gpt-5.3-codex",
      provider: "openai-codex",
    });
    registryMocks(ctx).getAuth.mockResolvedValue({
      apiKey: token,
      ok: true,
    });

    const result = await registerTool().execute(
      "search-6",
      { query: "Search with Codex" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.content[0]?.text).toContain("Codex search answer.");
    expect(result.details).toEqual(
      expect.objectContaining({
        api: "openai-codex-responses",
        model: "gpt-5.3-codex",
        provider: "openai-codex",
      }),
    );
  });

  it("accepts Codex bearer headers supplied by Pi without rewriting them", async () => {
    expect.hasAssertions();
    const token = `header.${Buffer.from(
      JSON.stringify({
        "https://api.openai.com/auth": { chatgpt_account_id: "unused-account" },
      }),
    ).toString("base64url")}.signature`;
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: string | URL | Request, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("authorization")).toBe(`Bearer ${token}`);
        expect(headers.get("chatgpt-account-id")).toBe("configured-account");
        expect(headers.get("originator")).toBe("configured-originator");
        return Promise.resolve(
          sseResponse([{ type: "response.output_text.delta", delta: "Header answer." }]),
        );
      }),
    );
    const ctx = context({
      api: "openai-codex-responses",
      baseUrl: "https://chatgpt.com/backend-api/codex",
      id: "gpt-5.3-codex",
      provider: "openai-codex",
    });
    registryMocks(ctx).getAuth.mockResolvedValue({
      headers: {
        Authorization: `Bearer ${token}`,
        "chatgpt-account-id": "configured-account",
        originator: "configured-originator",
      },
      ok: true,
    });

    const result = await registerTool().execute(
      "search-codex-headers",
      { query: "Use configured headers" },
      undefined,
      undefined,
      ctx,
    );
    expect(result.details.model).toBe("gpt-5.3-codex");
  });

  it("collects alternate citations while filtering unsafe and duplicate source URLs", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          sseResponse([
            {
              annotation: {
                type: "url_citation",
                url_citation: { title: "Nested\nsource", url: "https://example.com/nested" },
              },
              type: "response.output_text.annotation.added",
            },
            {
              annotation: { title: "Unsafe", type: "url_citation", url: "javascript:alert(1)" },
              type: "response.output_text.annotation.added",
            },
            {
              item: {
                action: {
                  sources: [
                    { title: "Duplicate", url: "https://example.com/nested" },
                    { title: "", url: "https://example.com/fallback" },
                    { title: "Broken", url: "not a url" },
                    { title: "Oversized", url: `https://example.com/${"x".repeat(2100)}` },
                  ],
                },
                type: "web_search_call",
              },
              type: "response.output_item.added",
            },
            { item: { type: "other" }, type: "response.output_item.done" },
            { response: { output: [] }, type: "response.done" },
            { type: "unknown" },
          ]),
        ),
      ),
    );
    const ctx = context(providerModel("openai-responses"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    const result = await registerTool().execute(
      "search-alternate",
      { query: "Collect sources" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.details.sources).toEqual([
      { title: "Nested source", url: "https://example.com/nested" },
      { title: "example.com", url: "https://example.com/fallback" },
    ]);
    expect(result.content[0]?.text).toContain("No answer was returned.");
  });

  it.each([
    ["openai-responses", "OpenAI"],
    ["google-generative-ai", "Google"],
    ["anthropic-messages", "Anthropic"],
  ])("surfaces bounded %s HTTP failures", async (api, provider) => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("provider denied", { status: 401 }))),
    );
    const ctx = context(providerModel(api));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    await expect(
      registerTool().execute("search-http-error", { query: "Fail" }, undefined, undefined, ctx),
    ).rejects.toThrow(new RegExp(`${provider} web search failed \\(401\\): provider denied`, "u"));
  });

  it.each(["openai-responses", "google-generative-ai", "anthropic-messages"])(
    "stops %s before fetch when Pi cannot resolve authentication",
    async (api) => {
      expect.hasAssertions();
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      const ctx = context(providerModel(api));
      registryMocks(ctx).getAuth.mockResolvedValue({ error: "No provider credential", ok: false });

      await expect(
        registerTool().execute(
          "search-auth-error",
          { query: "Do not fetch" },
          undefined,
          undefined,
          ctx,
        ),
      ).rejects.toThrow("No provider credential");
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["openai-responses", { error: { message: "OpenAI stream failed" }, type: "response.failed" }],
    ["google-generative-ai", { error: { message: "Google stream failed" } }],
    ["anthropic-messages", { error: { message: "Anthropic stream failed" }, type: "error" }],
  ])("surfaces %s streaming failures", async (api, event) => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(sseResponse([event]))),
    );
    const ctx = context(providerModel(api));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    await expect(
      registerTool().execute(
        "search-stream-error",
        { query: "Fail while streaming" },
        undefined,
        undefined,
        ctx,
      ),
    ).rejects.toThrow(/stream failed/iu);
  });

  it("surfaces Anthropic server-side web search tool errors", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          sseResponse([
            {
              content_block: {
                content: {
                  error_code: "too_many_requests",
                  type: "web_search_tool_result_error",
                },
                type: "web_search_tool_result",
              },
              type: "content_block_start",
            },
          ]),
        ),
      ),
    );
    const ctx = context(providerModel("anthropic-messages"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    await expect(
      registerTool().execute(
        "search-anthropic-tool-error",
        { query: "Hit the provider limit" },
        undefined,
        undefined,
        ctx,
      ),
    ).rejects.toThrow("Anthropic web search failed: too_many_requests");
  });

  it("reports an Anthropic paused search instead of returning an empty answer", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          sseResponse([{ delta: { stop_reason: "pause_turn" }, type: "message_delta" }]),
        ),
      ),
    );
    const ctx = context(providerModel("anthropic-messages"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    await expect(
      registerTool().execute(
        "search-anthropic-paused",
        { query: "Run a long search" },
        undefined,
        undefined,
        ctx,
      ),
    ).rejects.toThrow(/paused.*narrower.*retry/iu);
  });

  it("propagates cancellation while reading a provider stream", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(sseResponse([{ type: "unknown" }]))),
    );
    const ctx = context(providerModel("openai-responses"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });
    const controller = new AbortController();
    controller.abort(new Error("Stop searching"));

    await expect(
      registerTool().execute(
        "search-abort",
        { query: "Cancel" },
        controller.signal,
        undefined,
        ctx,
      ),
    ).rejects.toThrow("Stop searching");
  });

  it("handles SSE framing variants and bounded streaming updates", async () => {
    expect.hasAssertions();
    const raw = [
      "event: ping\n\n",
      "data:\n\n",
      "data: []\n\n",
      "data: [DONE]\n\n",
      'data: {"type":"response.output_text.annotation.added","annotation":{"type":"other"}}\n\n',
      'data: {"type":"response.output_text.annotation.added","annotation":{"type":"url_citation"}}\n\n',
      'data: {"type":"response.output_item.done","item":{"type":"message","content":[{"type":"other"}]}}\n\n',
      'data: {"type":"response.output_text.delta"}\n\n',
      'data: {"type":"response.output_text.delta","delta":"raw answer"}',
    ].join("");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(raw, { status: 200 }))),
    );
    const ctx = context(providerModel("openai-responses"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });
    const update = vi.fn();

    const result = await registerTool().execute(
      "search-framing",
      { query: "Read raw SSE" },
      undefined,
      update,
      ctx,
    );

    expect(result.content[0]?.text).toContain("raw answer");
    expect(update).toHaveBeenCalled();
  });

  it("rejects a successful provider response without a stream body", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))),
    );
    const ctx = context(providerModel("openai-responses"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    await expect(
      registerTool().execute("search-no-body", { query: "No body" }, undefined, undefined, ctx),
    ).rejects.toThrow("returned no response body");
  });

  it.each([
    [{ headers: {}, ok: true } satisfies ResolvedAuth, /No OAuth credential/iu],
    [
      { apiKey: "not-a-jwt", ok: true } satisfies ResolvedAuth,
      /Could not read the ChatGPT account ID/iu,
    ],
  ])("rejects unusable Codex authentication %#", async (auth, expected) => {
    expect.hasAssertions();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const ctx = context({
      api: "openai-codex-responses",
      baseUrl: "https://chatgpt.com/backend-api/codex/responses",
      id: "gpt-5.3-codex",
      provider: "openai-codex",
    });
    registryMocks(ctx).getAuth.mockResolvedValue(auth);

    await expect(
      registerTool().execute(
        "search-bad-codex-auth",
        { query: "Do not fetch" },
        undefined,
        undefined,
        ctx,
      ),
    ).rejects.toThrow(expected);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("handles alternate Gemini and Anthropic citation events", async () => {
    expect.hasAssertions();
    const responses = [
      sseResponse([
        {
          candidates: [
            {
              grounding_metadata: {
                grounding_chunks: [
                  { web: { uri: "https://example.com/google" } },
                  { web: { uri: "file:///unsafe" } },
                ],
              },
            },
          ],
        },
      ]),
      sseResponse([
        { content_block: { type: "text" }, type: "content_block_start" },
        {
          delta: {
            citation: { title: "Anthropic citation", url: "https://example.com/anthropic" },
            type: "citations_delta",
          },
          type: "content_block_delta",
        },
        {
          delta: { citation: {}, type: "citations_delta" },
          type: "content_block_delta",
        },
        { type: "message_stop" },
      ]),
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(responses.shift() ?? new Response(null))),
    );

    const google = context(providerModel("google-generative-ai"));
    registryMocks(google).getAuth.mockResolvedValue({
      headers: { "X-Goog-Api-Key": "configured-google" },
      ok: true,
    });
    const googleResult = await registerTool().execute(
      "search-google-alternate",
      { query: "Google alternate" },
      undefined,
      undefined,
      google,
    );

    const anthropic = context(providerModel("anthropic-messages"));
    registryMocks(anthropic).getAuth.mockResolvedValue({
      apiKey: "sk-ant-oat-existing",
      headers: {
        authorization: "Bearer existing",
        "anthropic-beta": "existing-beta",
        "user-agent": "configured-agent",
        "x-app": "configured-app",
      },
      ok: true,
    });
    const anthropicResult = await registerTool().execute(
      "search-anthropic-alternate",
      { query: "Anthropic alternate" },
      undefined,
      undefined,
      anthropic,
    );

    expect(googleResult.details.sources).toEqual([
      { title: "example.com", url: "https://example.com/google" },
    ]);
    expect(anthropicResult.details.sources).toEqual([
      { title: "Anthropic citation", url: "https://example.com/anthropic" },
    ]);
  });

  it("truncates oversized provider output within Pi tool limits", async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          sseResponse([
            { type: "response.output_text.delta", delta: "x".repeat(60_000) },
            {
              annotation: {
                title: "Required citation",
                type: "url_citation",
                url: "https://example.com/required-citation",
              },
              type: "response.output_text.annotation.added",
            },
          ]),
        ),
      ),
    );
    const ctx = context({
      api: "openai-responses",
      baseUrl: "https://api.openai.com/v1",
      id: "gpt-5.6",
      provider: "openai",
    });
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    const result = await registerTool().execute(
      "search-7",
      { query: "Return too much" },
      undefined,
      undefined,
      ctx,
    );

    expect(Buffer.byteLength(result.content[0]?.text ?? "", "utf8")).toBeLessThanOrEqual(51_200);
    expect(result.content[0]?.text).toContain("[Output truncated");
    expect(result.content[0]?.text).toContain("## Sources");
    expect(result.content[0]?.text).toContain("https://example.com/required-citation");
    expect(result.details.sourceCount).toBe(1);
    expect(result.details.visibleSourceCount).toBe(1);
    expect(result.details.truncated).toBe(true);
  });

  it("caps visible sources while retaining complete structured source details", async () => {
    expect.hasAssertions();
    const annotations = Array.from({ length: 25 }, (_, index) => ({
      annotation: {
        title: `Source ${String(index + 1)}`,
        type: "url_citation",
        url: `https://example.com/source-${String(index + 1)}`,
      },
      type: "response.output_text.annotation.added",
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          sseResponse([
            { delta: "Answer with many sources.", type: "response.output_text.delta" },
            ...annotations,
          ]),
        ),
      ),
    );
    const ctx = context(providerModel("openai-responses"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    const result = await registerTool().execute(
      "search-many-sources",
      { query: "Find many sources" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.content[0]?.text).toContain("5 additional sources omitted");
    expect(result.details.sourceCount).toBe(25);
    expect(result.details.visibleSourceCount).toBe(20);
    expect(result.details.sources).toHaveLength(25);
    expect(result.details.truncated).toBe(true);
  });

  it("uses singular wording when exactly one source is omitted", async () => {
    expect.hasAssertions();
    const annotations = Array.from({ length: 21 }, (_, index) => ({
      annotation: {
        title: `Source ${String(index + 1)}`,
        type: "url_citation",
        url: `https://example.com/source-${String(index + 1)}`,
      },
      type: "response.output_text.annotation.added",
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          sseResponse([
            { delta: "Answer with one hidden source.", type: "response.output_text.delta" },
            ...annotations,
          ]),
        ),
      ),
    );
    const ctx = context(providerModel("openai-responses"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    const result = await registerTool().execute(
      "search-one-omitted-source",
      { query: "Find twenty-one sources" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.content[0]?.text).toContain("1 additional source omitted");
    expect(result.details.visibleSourceCount).toBe(20);
    expect(result.details.truncated).toBe(true);
  });

  it("bounds the rendered source section even when source URLs are long", async () => {
    expect.hasAssertions();
    const annotations = Array.from({ length: 5 }, (_, index) => ({
      annotation: {
        title: `Long source ${String(index + 1)}`,
        type: "url_citation",
        url: `https://example.com/${String(index)}/${"a".repeat(2000)}`,
      },
      type: "response.output_text.annotation.added",
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          sseResponse([
            { delta: "Answer with long source URLs.", type: "response.output_text.delta" },
            ...annotations,
          ]),
        ),
      ),
    );
    const ctx = context(providerModel("openai-responses"));
    registryMocks(ctx).getAuth.mockResolvedValue({ ok: true });

    const result = await registerTool().execute(
      "search-long-source-urls",
      { query: "Find sources with long URLs" },
      undefined,
      undefined,
      ctx,
    );

    expect(result.details.sourceCount).toBe(5);
    expect(result.details.visibleSourceCount).toBeLessThan(5);
    expect(result.content[0]?.text).toMatch(/additional sources omitted/u);
    expect(Buffer.byteLength(result.content[0]?.text ?? "", "utf8")).toBeLessThan(8192);
  });
});
