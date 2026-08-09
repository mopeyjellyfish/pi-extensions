import { describe, expect, it } from "vitest";

import simpleEnglishExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface BeforeAgentStartResult {
  readonly systemPrompt?: string;
}

type BeforeAgentStartHandler = (
  event: { readonly systemPrompt: string },
  context: ExtensionContext,
) => BeforeAgentStartResult | Promise<BeforeAgentStartResult | undefined> | undefined;

function createHarness(): BeforeAgentStartHandler {
  let handler: BeforeAgentStartHandler | undefined;
  const pi = {
    on(name: string, candidate: BeforeAgentStartHandler) {
      if (name === "before_agent_start") handler = candidate;
    },
  } as unknown as ExtensionAPI;
  simpleEnglishExtension(pi);
  if (handler === undefined) throw new Error("before_agent_start handler was not registered");
  return handler;
}

describe("pi-simple-english extension", () => {
  it("tells the agent to write clear human-facing prose without losing information", async () => {
    expect.hasAssertions();
    const handler = createHarness();
    const base = "Base system prompt with exact contracts.";

    for (const mode of ["tui", "print"] as const) {
      const result = await handler({ systemPrompt: base }, { mode } as ExtensionContext);
      const prompt = result?.systemPrompt ?? "";
      expect(prompt.startsWith(base)).toBe(true);
      expect(prompt).toContain("pragmatic Simplified Technical English");
      expect(prompt).toContain("By default");
      expect(prompt).not.toContain("for all human-facing prose");
      expect(prompt).toMatch(
        /explicit user and project requirements[^.]*language[^.]*tone[^.]*format/iu,
      );
      expect(prompt).toContain("Do not omit or weaken technical information");
      expect(prompt).toMatch(/uncertainty.*tradeoffs.*necessary detail/iu);
      expect(prompt).toMatch(/code.*identifiers.*commands.*paths.*URLs.*quotations/iu);
      expect(prompt).toContain("normative contract words");
      expect(prompt).toContain("required document structure");
      expect(prompt).toMatch(/Technical accuracy and user intent have priority over style/iu);
    }
  });

  it("does not duplicate guidance when another loaded copy already added it", async () => {
    expect.hasAssertions();
    const handler = createHarness();
    const first = await handler({ systemPrompt: "Base" }, {} as ExtensionContext);
    const second = await handler(
      { systemPrompt: first?.systemPrompt ?? "" },
      {} as ExtensionContext,
    );

    const prompt = second?.systemPrompt ?? first?.systemPrompt ?? "";
    expect(prompt.match(/pragmatic Simplified Technical English/gu)).toHaveLength(1);
  });
});
