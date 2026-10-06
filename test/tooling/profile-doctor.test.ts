import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { diagnoseProfile, resolveAgentDir } from "../../scripts/lib/profile-doctor.ts";

const config = {
  toolDescriptionMode: "compact",
  asyncByDefault: false,
  forceTopLevelAsync: false,
  maxSubagentDepth: 1,
  globalConcurrencyLimit: 3,
  parallel: { maxTasks: 4, concurrency: 3 },
  scheduledRuns: { enabled: false },
};

const unshadowedBuiltInAgentNames = ["delegate", "oracle", "scout"] as const;

describe("profile doctor", () => {
  it("accepts extra user agents without changing supplied files", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "profile-doctor-"));
    try {
      const settingsPath = join(root, "settings.json");
      const configPath = join(root, "config.json");
      const settings = JSON.stringify({
        subagents: { disableBuiltins: true, agents: { extra: { model: "custom" } } },
      });
      await writeFile(settingsPath, settings);
      await writeFile(configPath, JSON.stringify(config));
      expect(await diagnoseProfile(settingsPath, configPath)).toEqual([]);
      expect(await readFile(settingsPath, "utf8")).toBe(settings);
      expect(await readFile(configPath, "utf8")).toBe(JSON.stringify(config));
      await writeFile(settingsPath, '{"subagents":{"disableBuiltins":false}}');
      expect(await diagnoseProfile(settingsPath, configPath)).toEqual([
        expect.objectContaining({ path: "$.subagents.disableBuiltins", severity: "error" }),
      ]);
      await writeFile(settingsPath, "{");
      expect(await diagnoseProfile(settingsPath, configPath)).toEqual([
        expect.objectContaining({
          path: "$",
          severity: "error",
          message: "Read a valid JSON object from this file. Check that it exists and is readable.",
        }),
      ]);
      await writeFile(settingsPath, '{"subagents":{"disableBuiltins":true}}');
      await writeFile(configPath, "{}");
      expect(await diagnoseProfile(settingsPath, configPath)).toContainEqual(
        expect.objectContaining({ path: "$.toolDescriptionMode", severity: "recommendation" }),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it.each(unshadowedBuiltInAgentNames)(
    "recommends discovery verification for a possible custom %s override that can bypass bulk disabling",
    async (role) => {
      expect.hasAssertions();
      const root = await mkdtemp(join(tmpdir(), "profile-doctor-"));
      try {
        const settingsPath = join(root, "settings.json");
        const configPath = join(root, "config.json");
        await writeFile(
          settingsPath,
          JSON.stringify({
            subagents: {
              disableBuiltins: true,
              agentOverrides: { [role]: { model: "custom" } },
            },
          }),
        );
        await writeFile(configPath, JSON.stringify(config));

        const diagnostic = (await diagnoseProfile(settingsPath, configPath)).find(
          (item) => item.path === `$.subagents.agentOverrides.${role}`,
        );
        expect(diagnostic).toMatchObject({
          file: settingsPath,
          severity: "recommendation",
        });
        expect(diagnostic?.message).not.toMatch(/Remove this override|set disabled to true/);
        expect(diagnostic?.message).toContain("covers only the six private roles");
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
  );

  it("allows packaged-role, explicitly disabled built-in, and user-agent overrides", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "profile-doctor-"));
    try {
      const settingsPath = join(root, "settings.json");
      const configPath = join(root, "config.json");
      await writeFile(
        settingsPath,
        JSON.stringify({
          subagents: {
            disableBuiltins: true,
            agentOverrides: {
              advisor: { model: "custom" },
              worker: { model: "custom" },
              researcher: { model: "custom" },
              reviewer: { model: "custom" },
              scout: { disabled: true, model: "custom" },
              "custom-agent": { model: "custom" },
            },
          },
        }),
      );
      await writeFile(configPath, JSON.stringify(config));

      expect(await diagnoseProfile(settingsPath, configPath)).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it("reports stale user shadowing and effective project overrides through pinned discovery", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "profile-discovery-"));
    const agentDir = join(root, "user");
    const cwd = join(root, "project");
    try {
      vi.stubEnv("HOME", root);
      vi.stubEnv("PI_OFFLINE", "1");
      vi.stubEnv("PI_CODING_AGENT_DIR", agentDir);
      vi.stubEnv("PI_SUBAGENT_EXTRA_AGENT_DIRS", "");
      await mkdir(agentDir, { recursive: true });
      await mkdir(join(root, ".agents"));
      await mkdir(join(cwd, "agents"), { recursive: true });
      await mkdir(join(cwd, ".pi"));
      const settingsPath = join(agentDir, "settings.json");
      const configPath = join(root, "config.json");
      const settings = '{"subagents":{"disableBuiltins":true}}';
      await writeFile(settingsPath, settings);
      await writeFile(configPath, JSON.stringify(config));
      await writeFile(
        join(cwd, "package.json"),
        JSON.stringify({ pi: { subagents: { agents: ["./agents"] } } }),
      );
      for (const [name, thinking] of Object.entries({
        worker: "high",
        researcher: "low",
        utility: "low",
        qa: "medium",
        reviewer: "medium",
        git: "medium",
      })) {
        await writeFile(
          join(cwd, "agents", `${name}.md`),
          `---\nname: ${name}\ndescription: Synthetic role\nmodel: openai-codex/gpt-6.1-sol\nthinking: ${thinking}\n---\nRole instructions\n`,
        );
      }
      const stalePath = join(root, ".agents", "worker.md");
      const stale =
        "---\nname: worker\ndescription: Stale role\nmodel: openai-codex/gpt-6-astra:medium\nthinking: high\n---\nOld instructions\n";
      await writeFile(stalePath, stale);
      await writeFile(
        join(root, ".agents", "extra.md"),
        "---\nname: extra\ndescription: Extra role\nmodel: custom\n---\nExtra instructions\n",
      );
      const diagnostics = await diagnoseProfile(settingsPath, configPath, cwd);
      expect(diagnostics).toEqual([
        expect.objectContaining({
          file: stalePath,
          path: "$.effectiveAgents.worker",
          severity: "error",
        }),
      ]);
      expect(diagnostics[0]?.message).toContain("user");
      expect(diagnostics[0]?.message).toContain("openai-codex/gpt-6-astra");
      expect(diagnostics[0]?.message).toContain("medium");
      expect(diagnostics[0]?.message).toContain("openai-codex/gpt-6.1-sol");
      expect(diagnostics[0]?.message).toContain("Rename or update");
      expect(await readFile(stalePath, "utf8")).toBe(stale);
      expect(await readFile(settingsPath, "utf8")).toBe(settings);
      await writeFile(
        stalePath,
        stale.replace("openai-codex/gpt-6-astra:medium", "openai-codex/gpt-6.1-sol:high"),
      );
      expect(await diagnoseProfile(settingsPath, configPath, cwd)).toEqual([
        expect.objectContaining({ file: stalePath, severity: "recommendation" }),
      ]);
      await rm(stalePath);
      expect(await diagnoseProfile(settingsPath, configPath, cwd)).toEqual([]);
      await writeFile(
        join(cwd, ".pi", "settings.json"),
        '{"subagents":{"agentOverrides":{"reviewer":{"thinking":"low"}}}}',
      );
      expect(await diagnoseProfile(settingsPath, configPath, cwd)).toEqual([]); // Explicit frontmatter wins.
      const reviewerPath = join(cwd, "agents", "reviewer.md");
      await writeFile(
        reviewerPath,
        (await readFile(reviewerPath, "utf8")).replace("thinking: medium\n", ""),
      );
      const overridden = await diagnoseProfile(settingsPath, configPath, cwd);
      expect(overridden).toEqual([
        expect.objectContaining({ path: "$.effectiveAgents.reviewer", severity: "error" }),
      ]);
      expect(overridden[0]?.message).toContain("thinking=low");
      expect(overridden[0]?.message).toContain(join(cwd, ".pi", "settings.json"));
    } finally {
      vi.unstubAllEnvs();
      await rm(root, { recursive: true, force: true });
    }
  });

  it("still rejects disabling a packaged role", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "profile-doctor-"));
    try {
      const settingsPath = join(root, "settings.json");
      const configPath = join(root, "config.json");
      await writeFile(
        settingsPath,
        JSON.stringify({
          subagents: { disableBuiltins: true, agentOverrides: { worker: { disabled: true } } },
        }),
      );
      await writeFile(configPath, JSON.stringify(config));
      expect(await diagnoseProfile(settingsPath, configPath)).toEqual([
        expect.objectContaining({
          severity: "error",
          path: "$.subagents.agentOverrides.worker.disabled",
        }),
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("agent directory resolution", () => {
  it.each([
    [undefined, "/home/test/.pi/agent"],
    ["", "/home/test/.pi/agent"],
    [" ".repeat(3), " ".repeat(3)],
    ["~", "/home/test"],
    ["~/custom", "/home/test/custom"],
    ["/absolute/custom", "/absolute/custom"],
    ["file:///tmp/pi-agent", fileURLToPath("file:///tmp/pi-agent")],
  ])("resolves %j like Pi", (configured, expected) => {
    expect.hasAssertions();
    expect(resolveAgentDir(configured, "/home/test")).toBe(expected);
  });
});
