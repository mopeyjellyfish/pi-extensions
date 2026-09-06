import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../scripts/lib/repository.ts";

describe("Markdown lint configuration", () => {
  it("scopes prompt frontmatter exceptions to MD041", async () => {
    expect.hasAssertions();
    const module = (await import(
      pathToFileURL(join(repositoryRoot, ".markdownlint-cli2.mjs")).href
    )) as {
      default: {
        config: Record<string, unknown>;
        overrides: { combine?: string; config: Record<string, unknown>; filter: string }[];
      };
    };

    expect(module.default.config["MD041"]).toBeUndefined();
    expect(module.default.overrides).toContainEqual({
      filter: "packages/*/prompts/*.md",
      config: { MD041: false },
      combine: "merge",
    });
  });
});
