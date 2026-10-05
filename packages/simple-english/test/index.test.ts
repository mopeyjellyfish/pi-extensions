import { describe, expect, it } from "vitest";

import simpleEnglishExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

interface BeforeAgentStartResult {
  readonly systemPrompt?: string;
}

type BeforeAgentStartHandler = (
  event: {
    readonly systemPrompt: string;
    systemPromptOptions: { sections: Record<string, string> };
  },
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
  it("preserves the host prompt and other sections across repeated events", async () => {
    expect.hasAssertions();
    const handler = createHarness();
    const event = {
      systemPrompt: "Host contract",
      systemPromptOptions: { sections: { other: "Other guidance" } as Record<string, string> },
    };
    expect(await handler(event, {} as ExtensionContext)).toBeUndefined();
    const first = { ...event.systemPromptOptions.sections };
    expect(first["pi-simple-english-output-guidance"]).toContain("Simplified Technical English");
    await handler(event, {} as ExtensionContext);
    expect(event.systemPrompt).toBe("Host contract");
    expect(event.systemPromptOptions.sections).toEqual(first);
    expect(event.systemPromptOptions.sections["other"]).toBe("Other guidance");
  });
});
