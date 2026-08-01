import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../scripts/lib/repository.ts";

describe("aggregate subagent resources", () => {
  it("ships FFF/LSP-aware code-agent overrides", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8")) as {
      readonly dependencies?: Readonly<Record<string, unknown>>;
      readonly pi?: {
        readonly extensions?: readonly string[];
        readonly subagents?: { readonly agents?: unknown };
      };
    };
    const expectedTools = {
      "advisor.md": [
        "read",
        "ffgrep",
        "fffind",
        "ls",
        "bash",
        "lsp_query",
        "lsp_validate",
        "intercom",
      ],
      "context-builder.md": [
        "read",
        "ffgrep",
        "fffind",
        "ls",
        "bash",
        "write",
        "web_search",
        "lsp_query",
        "lsp_validate",
        "intercom",
      ],
      "delegate.md": [
        "read",
        "ffgrep",
        "fffind",
        "ls",
        "bash",
        "edit",
        "write",
        "lsp_query",
        "lsp_validate",
        "lsp_code_action",
        "lsp_rename_symbol",
        "lsp_create_file",
        "lsp_delete_file",
        "lsp_rename_file",
        "contact_supervisor",
      ],
      "oracle.md": [
        "read",
        "ffgrep",
        "fffind",
        "ls",
        "bash",
        "lsp_query",
        "lsp_validate",
        "intercom",
      ],
      "planner.md": ["read", "ffgrep", "fffind", "ls", "lsp_query", "lsp_validate", "intercom"],
      "reviewer.md": [
        "read",
        "ffgrep",
        "fffind",
        "ls",
        "bash",
        "edit",
        "write",
        "lsp_query",
        "lsp_validate",
        "lsp_code_action",
        "lsp_rename_symbol",
        "lsp_create_file",
        "lsp_delete_file",
        "lsp_rename_file",
        "intercom",
      ],
      "researcher.md": ["read", "write", "web_search", "intercom"],
      "scout.md": [
        "read",
        "ffgrep",
        "fffind",
        "ls",
        "bash",
        "write",
        "lsp_query",
        "lsp_validate",
        "intercom",
      ],
      "worker.md": [
        "read",
        "ffgrep",
        "fffind",
        "ls",
        "bash",
        "edit",
        "write",
        "lsp_query",
        "lsp_validate",
        "lsp_code_action",
        "lsp_rename_symbol",
        "lsp_create_file",
        "lsp_delete_file",
        "lsp_rename_file",
        "contact_supervisor",
      ],
    } as const;
    const expectedExecutionProfiles = {
      "advisor.md": { model: "openai-codex/gpt-5.6-sol", thinking: "max" },
      "context-builder.md": { model: "openai-codex/gpt-5.6-luna", thinking: "high" },
      "delegate.md": { model: undefined, thinking: undefined },
      "oracle.md": { model: "openai-codex/gpt-5.6-sol", thinking: "max" },
      "planner.md": { model: "openai-codex/gpt-5.6-sol", thinking: "high" },
      "reviewer.md": { model: "openai-codex/gpt-5.6-sol", thinking: "xhigh" },
      "researcher.md": { model: "openai-codex/gpt-5.6-luna", thinking: "high" },
      "scout.md": { model: "openai-codex/gpt-5.6-luna", thinking: "low" },
      "worker.md": { model: "openai-codex/gpt-5.6-sol", thinking: "medium" },
    } as const;
    const agentFileNames = Object.keys(expectedTools).sort((left, right) =>
      left.localeCompare(right),
    ) as (keyof typeof expectedTools)[];

    expect(manifest.dependencies?.["@ff-labs/pi-fff"]).toBeDefined();
    expect(manifest.pi?.extensions).toContain("./node_modules/@ff-labs/pi-fff/src/index.ts");
    expect(manifest.pi?.extensions).toContain("./packages/*/src/index.ts");
    expect(manifest.pi?.subagents?.agents).toEqual(["./agents"]);
    const agentFiles = await readdir(join(repositoryRoot, "agents"));
    expect(agentFiles.sort((left, right) => left.localeCompare(right))).toEqual(agentFileNames);

    const agentEntries = await Promise.all(
      agentFileNames.map(
        async (name) =>
          [name, await readFile(join(repositoryRoot, "agents", name), "utf8")] as const,
      ),
    );
    const agents = new Map(agentEntries);
    const readme = await readFile(join(repositoryRoot, "README.md"), "utf8");
    expect(readme).toMatch(
      /require FFF's `tools-and-ui` \(default\) or `tools-only` mode; FFF's\s+`override` mode[\s\S]*not compatible/iu,
    );
    expect(readme).toContain("synchronized with `pi-subagents` 0.38.0");
    expect(readme).toMatch(/Per-run and chain-step model\s+overrides take precedence/u);
    expect(readme).toMatch(
      /`subagents\.agentOverrides` cannot replace explicit\s+package frontmatter/u,
    );

    for (const name of agentFileNames) {
      const agent = agents.get(name) ?? "";
      const frontmatter = agent.split("---", 2)[1] ?? "";
      const field = (key: string) =>
        frontmatter
          .split("\n")
          .find((line) => line.startsWith(`${key}: `))
          ?.slice(key.length + 2);
      const tools = agent
        .split("\n")
        .find((line) => line.startsWith("tools: "))
        ?.slice("tools: ".length)
        .split(", ");
      expect(tools).toEqual(expectedTools[name]);
      expect(field("model")).toBe(expectedExecutionProfiles[name].model);
      expect(field("thinking")).toBe(expectedExecutionProfiles[name].thinking);
    }

    for (const name of agentFileNames.filter((name) => name !== "researcher.md")) {
      const agent = agents.get(name) ?? "";
      expect(agent).toContain("`fffind`");
      expect(agent).toContain("`ffgrep`");
      expect(agent).toContain("`lsp_query`");
      expect(agent).toContain("`lsp_validate`");
    }

    const researcher = agents.get("researcher.md") ?? "";
    expect(researcher).toContain("one focused, self-contained `query`");
    expect(researcher).not.toContain("fetch_content");
    expect(researcher).not.toContain("get_search_content");

    const worker = agents.get("worker.md") ?? "";
    const reviewer = agents.get("reviewer.md") ?? "";
    expect(worker).toContain("skills: ponytail");
    expect(worker).toContain("Before any coding task, read and apply the `ponytail` skill.");
    expect(worker).toContain(
      "do not run `ponytail-review` or `ponytail-audit` unless the task explicitly asks for it",
    );
    expect(reviewer).toContain("skills: ponytail-review");
    expect(reviewer).toContain("read and apply the `ponytail-review` skill");
    expect(reviewer).toContain(
      "do not run the whole-repository `ponytail-audit` unless the task explicitly requests it",
    );
  });
});
