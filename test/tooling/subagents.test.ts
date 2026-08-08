import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../scripts/lib/repository.ts";

function frontmatterField(agent: string, key: string): string | undefined {
  const frontmatter = agent.split("---", 2)[1] ?? "";
  return frontmatter
    .split("\n")
    .find((line) => line.startsWith(`${key}: `))
    ?.slice(key.length + 2);
}

function expectAgentSkills(
  agents: ReadonlyMap<string, string>,
  expected: Readonly<Record<string, string | undefined>>,
): void {
  for (const [name, skills] of Object.entries(expected)) {
    expect(frontmatterField(agents.get(name) ?? "", "skills")).toBe(skills);
  }
}

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
      "planner.md": { model: "openai-codex/gpt-5.6-luna", thinking: "high" },
      "reviewer.md": { model: "openai-codex/gpt-5.6-luna", thinking: "medium" },
      "researcher.md": { model: "openai-codex/gpt-5.6-luna", thinking: "high" },
      "scout.md": { model: "openai-codex/gpt-5.6-luna", thinking: "low" },
      "worker.md": { model: "openai-codex/gpt-5.6-luna", thinking: "medium" },
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
      /require FFF's\s+`tools-and-ui` \(default\) or `tools-only` mode; FFF's\s+`override` mode[\s\S]*not compatible/iu,
    );
    expect(readme).toContain("validated with `pi-subagents` 0.43.0");
    expect(readme).toMatch(/Historical feature records[^.]*version used/iu);
    expect(readme).toContain("`planner` and `context-builder` are repository-owned");
    expect(readme).toContain("Roles load skills selectively");
    expect(readme).toMatch(/Per-run and\s+chain-step model\s+overrides take precedence/u);
    expect(readme).toMatch(
      /`subagents\.agentOverrides` can fill\s+fields[^.]*unset[^.]*cannot replace explicit\s+frontmatter fields/u,
    );

    for (const name of agentFileNames) {
      const agent = agents.get(name) ?? "";
      const tools = agent
        .split("\n")
        .find((line) => line.startsWith("tools: "))
        ?.slice("tools: ".length)
        .split(", ");
      expect(tools).toEqual(expectedTools[name]);
      expect(frontmatterField(agent, "model")).toBe(expectedExecutionProfiles[name].model);
      expect(frontmatterField(agent, "thinking")).toBe(expectedExecutionProfiles[name].thinking);
      expect(frontmatterField(agent, "inheritSkills")).toBe("false");
    }

    const expectedSkills = {
      "advisor.md": "domain-modeling",
      "context-builder.md": "domain-modeling, writing-for-agents",
      "delegate.md": undefined,
      "oracle.md": "domain-modeling",
      "planner.md": "domain-modeling, writing-for-agents",
      "reviewer.md": "ponytail-review, reviewing-changes",
      "researcher.md": "writing-for-agents",
      "scout.md": undefined,
      "worker.md": "ponytail, diagnosing-bugs",
    } as const;
    expectAgentSkills(agents, expectedSkills);

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
    expect(worker).toContain("skills: ponytail, diagnosing-bugs");
    expect(worker).toContain(
      "Apply `diagnosing-bugs` only when the assigned task is bug diagnosis or an unexplained regression",
    );
    expect(worker).toContain("Before any coding task, read and apply the `ponytail` skill.");
    expect(worker).toContain(
      "do not run `ponytail-review` or `ponytail-audit` unless the task explicitly asks for it",
    );
    expect(reviewer).toContain("skills: ponytail-review, reviewing-changes");
    expect(reviewer).toContain("read and apply `reviewing-changes`");
    expect(reviewer).toContain(
      "Read and apply the `ponytail-review` skill only when the task explicitly requests a simplicity or over-engineering review",
    );
    expect(reviewer).toMatch(
      /do not run the whole-repository `ponytail-audit` unless the task explicitly requests it/iu,
    );
  });
});
