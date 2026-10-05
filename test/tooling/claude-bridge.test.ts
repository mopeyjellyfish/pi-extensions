import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { normalizeContext } from "@earendil-works/pi-ai";
import { getBuiltinModel } from "@earendil-works/pi-ai/providers/all";
import { Type } from "typebox";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  ExtensionAPI,
  ExtensionFactory,
  ProviderConfig,
} from "@earendil-works/pi-coding-agent";

interface SdkRequest {
  options: {
    systemPrompt: { append?: string };
    mcpServers?: Record<string, unknown>;
  };
}

const boundary = vi.hoisted(() => ({
  query: vi.fn<(request: SdkRequest) => unknown>(),
  servers: [] as unknown[],
}));
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({ query: boundary.query }));
// Isolate the user's global and project config filesystem boundary.
vi.mock("../../node_modules/pi-claude-bridge/src/config.ts", () => ({
  loadConfig: () => ({ startupNoticeShown: "2026-10-05", askClaude: { enabled: false } }),
  claudeCodeSettings: () => ({ autoMemoryEnabled: false }),
  markStartupNoticeShown: vi.fn(),
}));
// Replace the in-process MCP network endpoint, not the bridge's tool conversion.
vi.mock("../../node_modules/pi-claude-bridge/src/mcp-server.ts", () => ({
  createToolServer: (name: string, tools: unknown[]) => {
    const server = { name, tools };
    boundary.servers.push(server);
    return server;
  },
}));

let sessionRoot: string | undefined;
afterEach(async () => {
  vi.unstubAllEnvs();
  if (sessionRoot) await rm(sessionRoot, { force: true, recursive: true });
});

describe("Claude bridge compatibility", () => {
  it("forwards transcript instructions and tools to the Claude provider", async () => {
    expect.hasAssertions();
    sessionRoot = await mkdtemp(join(tmpdir(), "pi-claude-compat-"));
    vi.stubEnv("CLAUDE_CONFIG_DIR", sessionRoot);
    const path = "../../node_modules/pi-claude-bridge/src/index.ts";
    const { default: factory } = (await import(path)) as { default: ExtensionFactory };
    let provider: ProviderConfig | undefined;
    const handlers = new Map<string, (event: unknown) => unknown>();
    await factory({
      on: (event: string, handler: (event: unknown) => unknown) => handlers.set(event, handler),
      registerProvider: (_name: string, config: ProviderConfig) => {
        provider = config;
      },
    } as unknown as ExtensionAPI);
    const prompt = "Keep the user's repository instructions.";
    handlers.get("before_agent_start")?.({
      systemPrompt: prompt,
      systemPromptOptions: { customPrompt: prompt, contextFiles: [], skills: [] },
    });
    boundary.query.mockImplementation(() => ({
      async *[Symbol.asyncIterator]() {
        await Promise.resolve();
        yield { type: "result", subtype: "success", result: "Forwarded.", usage: {} };
      },
      interrupt: () => Promise.resolve(),
      close: vi.fn(),
    }));
    const parameters = Type.Object({ path: Type.String() });
    const context = normalizeContext({
      systemPrompt: prompt,
      tools: [{ name: "inspect", description: "Inspect a file", parameters }],
      messages: [{ role: "user", content: "Inspect the file.", timestamp: 0 }],
    });
    expect(context).not.toHaveProperty("systemPrompt");
    expect(context).not.toHaveProperty("tools");
    if (!provider?.streamSimple) throw new Error("Claude provider was not registered.");
    try {
      const stream = provider.streamSimple(
        getBuiltinModel("anthropic", "claude-sonnet-4-6"),
        context,
      );
      expect((await stream.result()).stopReason).toBe("stop");
      const request = boundary.query.mock.calls[0]?.[0];
      expect(request?.options.systemPrompt.append).toContain(prompt);
      expect(request?.options.mcpServers?.["custom-tools"]).toBe(boundary.servers[0]);
      expect(boundary.servers).toMatchObject([
        { tools: [{ name: "inspect", description: "Inspect a file", inputSchema: parameters }] },
      ]);
    } finally {
      await handlers.get("session_shutdown")?.({});
    }
  });
});
