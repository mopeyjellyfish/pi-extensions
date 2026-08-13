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
      "qa.md": [
        "read",
        "ffgrep",
        "fffind",
        "ls",
        "bash",
        "write",
        "playwright_browser",
        "lsp_query",
        "lsp_validate",
        "intercom",
      ],
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
      "advisor.md": { model: undefined, thinking: undefined },
      "context-builder.md": { model: "openai-codex/gpt-5.6-sol", thinking: "medium" },
      "delegate.md": { model: undefined, thinking: undefined },
      "oracle.md": { model: "openai-codex/gpt-5.6-sol", thinking: "max" },
      "planner.md": { model: "openai-codex/gpt-5.6-sol", thinking: "high" },
      "qa.md": { model: "openai-codex/gpt-5.6-luna", thinking: "medium" },
      "reviewer.md": { model: "openai-codex/gpt-5.6-sol", thinking: "high" },
      "researcher.md": { model: "openai-codex/gpt-5.6-sol", thinking: "medium" },
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
    const repositoryGuidance = await readFile(join(repositoryRoot, "AGENTS.md"), "utf8");
    const readme = await readFile(join(repositoryRoot, "README.md"), "utf8");
    expect(readme).toMatch(
      /require FFF's\s+`tools-and-ui` \(default\) or `tools-only` mode; FFF's\s+`override` mode[\s\S]*not compatible/iu,
    );
    expect(readme).toContain("validated with `pi-subagents` 0.43.0");
    expect(readme).toMatch(/Historical feature records[^.]*version used/iu);
    expect(readme).toContain("`planner`, `context-builder`, and `qa` are");
    expect(readme).toContain("Parent agents and explicitly permitted fanout subagents can select");
    expect(readme).toContain("Roles load skills selectively");
    expect(readme).toMatch(/Per-run and\s+chain-step model\s+overrides take precedence/u);
    expect(readme).toContain("openai-codex/gpt-5.6-sol:high");
    expect(readme).toContain("openai-codex/gpt-5.6-luna:medium");
    expect(readme).toContain("`qa` uses `openai-codex/gpt-5.6-luna` at `medium`");
    expect(readme).toContain("`advisor` and `delegate` inherit the parent model");
    expect(readme).toContain("/run advisor[model=anthropic/<opus-model-id>:high]");
    expect(readme).toContain("`pi --list-models` or Pi's `/model` selector");
    expect(readme).toContain("This configuration does not start the advisor automatically.");
    expect(readme).toMatch(
      /Shape[\s\S]*`planning-changes`[\s\S]*`implement`[\s\S]*`developing-changes`/u,
    );
    expect(readme).toMatch(/`\/develop` as the adaptive[\s\S]*`\/plan`[\s\S]*`\/implement`/u);
    expect(readme).toMatch(/Small\s+fixes skip Shape[^.]*same quality gate/u);
    expect(readme).toMatch(/intended failing test[^.]*public\s+seam/u);
    expect(readme).toMatch(/selects the direct or retained executor[^.]*diagnoses a bug/u);
    expect(readme).toMatch(/formal review always uses fresh context/u);
    expect(readme).toMatch(/QA[^.]*never replaces review/u);
    expect(readme).toMatch(/`\/develop` blocks[^.]*Git aggregate[^.]*`pi-subagents`/iu);
    expect(readme).toMatch(
      /Tiny direct edits[^.]*sequential[^.]*low-risk[^.]*locally understandable[^.]*cheap to validate/iu,
    );
    expect(readme).toMatch(
      /fresh retained Sol writer[\s\S]*same retained writer[\s\S]*formal review always uses fresh context/iu,
    );
    expect(readme).toMatch(/exclusive active writer lease/iu);
    expect(readme).toContain("`docs/qa/plans/`");
    expect(readme).toContain("`docs/qa/runs/`");
    expect(readme).toMatch(/latest\s+compatible evidence[^.]*unchanged discovery/iu);
    expect(readme).not.toContain("openai-codex/gpt-5.6-terra");
    expect(readme).toContain("https://developers.openai.com/api/docs/guides/latest-model");
    expect(readme).toMatch(/parallelize[^.]*independent[^.]*read-only/iu);
    expect(readme).toMatch(/one writer[^.]*worktree/iu);
    expect(readme).toMatch(/formal child review[^.]*Sol reviewer/iu);
    expect(readme).toMatch(/failed Luna[^.]*Sol[^.]*`medium`/iu);
    expect(readme).toContain("Do not increase Luna reasoning to handle complexity.");
    expect(readme).toContain("Promote the run to Sol");
    expect(readme).toContain("`subagents.agentOverrides` can replace `description`");
    expect(readme).toMatch(
      /Other override fields fill\s+values[^.]*unset[^.]*cannot replace explicit\s+frontmatter values/u,
    );
    expect(repositoryGuidance).toContain("Use Luna at `low` for fast, bounded scout work.");
    expect(repositoryGuidance).toContain("Use Luna at `medium` for the `qa` agent");
    expect(repositoryGuidance).toMatch(
      /Use Sol at `medium` for context building[^.]*normal worker/u,
    );
    expect(repositoryGuidance).toContain('model: "openai-codex/gpt-5.6-luna:medium"');
    expect(repositoryGuidance).toContain('model: "openai-codex/gpt-5.6-sol:high"');
    expect(repositoryGuidance).toContain("Every formal review uses one Sol `high` reviewer");
    expect(repositoryGuidance).toContain("Let `advisor` inherit the parent model");
    expect(repositoryGuidance).toContain("Reserve Sol at `max` for `oracle` decisions.");
    expect(repositoryGuidance).not.toContain("Terra");
    expect(agents.get("qa.md")).toContain("Use one owned browser session for the run.");
    expect(agents.get("qa.md")).toContain("Do not route `playwright-cli` through Bash");
    expect(agents.get("qa.md")).toContain("action=close");

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
      "qa.md": "writing-for-agents",
      "reviewer.md": "ponytail-review, reviewing-changes, engineering-practices",
      "researcher.md": "writing-for-agents",
      "scout.md": undefined,
      "worker.md": "ponytail, diagnosing-bugs, test-driven-development, engineering-practices",
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
    const qa = agents.get("qa.md") ?? "";
    const reviewer = agents.get("reviewer.md") ?? "";
    expect(frontmatterField(worker, "description")).toMatch(
      /Sol.*medium.*Luna.*speed.*Sol.*high.*security.*concurrency.*protocol.*provider-transport.*cross-package.*expensive-validation/iu,
    );
    expect(frontmatterField(qa, "description")).toMatch(/Luna.*repeatable.*end-to-end/iu);
    expect(frontmatterField(qa, "acceptanceRole")).toBe("read-only");
    expect(frontmatterField(qa, "output")).toBeUndefined();
    expect(frontmatterField(qa, "defaultReads")).toBe("plan.md");
    expect(frontmatterField(reviewer, "description")).toMatch(/independent.*Sol.*high/iu);
    expect(qa).toContain("skills: writing-for-agents");
    expect(qa).toContain("docs/qa/plans/<target>.md");
    expect(qa).toContain("docs/qa/runs/<target>/<timestamp>-<revision>.md");
    expect(qa).toContain("docs/qa/evidence/<target>/<timestamp>-<revision>/");
    expect(qa).toMatch(/Use multiple plan files/iu);
    expect(qa).toMatch(/latest comparable run[\s\S]*unresolved failures/iu);
    expect(qa).toMatch(/full or exhaustive request always runs every applicable scenario/iu);
    expect(qa).toMatch(/filename-safe UTC/iu);
    expect(qa).toMatch(/Do not overwrite prior run evidence/iu);
    expect(qa).toMatch(/Do not repeat exploratory inventory/iu);
    expect(qa).toMatch(/Do not commit large generated traces, videos, or logs/iu);
    expect(qa).toMatch(/For websites[\s\S]*For CLIs[\s\S]*For other software/iu);
    expect(qa).toMatch(/severity.*reproduction.*expected behavior.*actual behavior.*evidence/iu);
    expect(qa).toMatch(
      /reusable plans[^.]*only when[^.]*caller requests[^.]*plan will recur[^.]*historical comparison/iu,
    );
    expect(qa).toMatch(/One-shot QA[^.]*creates no `docs\/qa\/` files/iu);
    expect(qa).toMatch(
      /For durable QA[\s\S]*`docs\/qa\/evidence\/[^`]+`[\s\S]*one-shot QA[\s\S]*temporary artifact[^.]*create no `docs\/qa\/` files/iu,
    );
    expect(qa).toMatch(/material-delta handoff/iu);
    expect(qa).toMatch(/Do not paste raw logs/iu);
    expect(qa).toMatch(/does not replace a fresh formal review/iu);
    expect(qa).toContain("Do not modify product or source files");
    expect(qa).toMatch(/rerun the exact failing scenario after a fix/iu);
    expect(qa).toContain("Use one owned browser session for the run.");
    expect(qa).toMatch(/Do not route `playwright-cli` through Bash[^.]*durable ownership/iu);
    expect(qa).toContain("playwright-cli list --all --json");
    expect(qa).toMatch(/Never rely on `close-all` from a sibling checkout/iu);
    expect(qa).toMatch(/targeted cleanup fails[^.]*tell the user[^.]*owned session remains/iu);
    expect(qa).toContain("Do not run `kill-all`.");
    expect(worker).toMatch(
      /return only material deltas[^:]*: outcome[^.]*changed files[^.]*changed contracts or facts[^.]*invalidated assumptions[^.]*exact evidence paths[^.]*residual risks[^.]*decisions required/iu,
    );
    expect(worker).toMatch(/Do not paste raw logs/iu);
    expect(worker).toContain(
      "skills: ponytail, diagnosing-bugs, test-driven-development, engineering-practices",
    );
    expect(worker).toContain(
      "Apply `diagnosing-bugs` only when the assigned task is bug diagnosis or an unexplained regression",
    );
    expect(worker).toContain("Before any coding task, read and apply the `ponytail` skill.");
    expect(worker).toMatch(
      /read and apply `test-driven-development`[^.]*behavioral code[\s\S]*read and apply `engineering-practices`/iu,
    );
    expect(worker).toContain(
      "do not run `ponytail-review` or `ponytail-audit` unless the task explicitly asks for it",
    );
    expect(reviewer).toContain("skills: ponytail-review, reviewing-changes, engineering-practices");
    expect(reviewer).toContain("read and apply `reviewing-changes`");
    expect(reviewer).toMatch(/read and apply `engineering-practices`[\s\S]*concrete evidence/iu);
    expect(reviewer).toContain(
      "Read and apply the `ponytail-review` skill only when the task explicitly requests a simplicity or over-engineering review",
    );
    expect(reviewer).toMatch(
      /do not run the whole-repository `ponytail-audit` unless the task explicitly requests it/iu,
    );
  });
});
