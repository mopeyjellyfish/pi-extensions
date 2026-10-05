import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

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
        expect(diagnostic?.message).toContain("cannot verify effective agent discovery");
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
