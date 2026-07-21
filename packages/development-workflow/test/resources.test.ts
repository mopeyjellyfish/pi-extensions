import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validatePlanDocument } from "../src/artifacts.ts";

const root = join(import.meta.dirname, "..");

async function text(path: string): Promise<string> {
  return readFile(join(root, path), "utf8");
}

describe("development workflow package resources", () => {
  it("ships one extension, four skills, and six prompt templates", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await text("package.json")) as {
      files?: string[];
      pi?: { extensions?: string[]; prompts?: string[]; skills?: string[] };
    };
    expect(manifest.pi).toEqual({
      extensions: ["./src/index.ts"],
      prompts: ["./prompts"],
      skills: ["./skills"],
    });
    expect(manifest.files).toEqual(expect.arrayContaining(["src/", "skills/", "prompts/"]));
    expect(await readdir(join(root, "prompts"))).toEqual([
      "dev-debug.md",
      "dev-finish.md",
      "dev-grill.md",
      "dev-next.md",
      "dev-review.md",
      "dev-start.md",
    ]);
    expect(await readdir(join(root, "skills"))).toEqual([
      "pi-design-grill",
      "pi-development-workflow",
      "pi-quality-audit",
      "pi-systematic-debugging",
    ]);
  });

  it("keeps prompts thin and routes each one to the owning skill or ledger", async () => {
    expect.hasAssertions();
    const prompts = await readdir(join(root, "prompts"));
    for (const prompt of prompts) {
      const source = await text(`prompts/${prompt}`);
      expect(source.split("\n").length).toBeLessThan(15);
      expect(source).toMatch(/^---\ndescription:/u);
      expect(source).toMatch(
        /development_workflow|pi-development-workflow|pi-design-grill|pi-quality-audit|pi-systematic-debugging/u,
      );
      expect(source).not.toContain("# Problem\n");
      expect(source).not.toContain("# Rabbit Holes\n");
    }
  });

  it("defines Shape Up pitch, integrated slices, discovered work, TDD, review, and explicit shipping", async () => {
    expect.hasAssertions();
    const main = await text("skills/pi-development-workflow/SKILL.md");
    const pitch = await text("skills/pi-development-workflow/references/pitch.md");
    const slices = await text("skills/pi-development-workflow/references/slices.md");
    const build = await text("skills/pi-development-workflow/references/build.md");
    const ship = await text("skills/pi-development-workflow/references/review-and-ship.md");

    expect(main).toContain("name: pi-development-workflow");
    expect(main).toContain("Todo only for work discovered inside the active slice");
    expect(main).toContain("Question");
    expect(main).toContain("LSP");
    expect(main).toContain("web search");
    expect(main).toContain("GitHub");
    expect(main).toContain("Git conventions");
    expect(main).toContain("pi-subagents");
    expect(main).toContain("Worktrunk");
    expect(pitch).toMatch(/Problem[\s\S]*Appetite[\s\S]*Solution[\s\S]*Rabbit Holes[\s\S]*No-Gos/u);
    expect(pitch).toMatch(/rough, solved, and bounded/iu);
    expect(slices).toContain("first demonstrable slice");
    expect(slices).toContain("Reject horizontal phases");
    expect(build).toMatch(/RED[\s\S]*GREEN[\s\S]*REFACTOR/u);
    expect(ship).toContain("explicit user authorization");
    expect(ship).toContain("reduced assurance");
  });

  it("defines evidence-based design, quality, and debugging flows without numeric gates", async () => {
    expect.hasAssertions();
    const grill = await text("skills/pi-design-grill/SKILL.md");
    const audit = await text("skills/pi-quality-audit/SKILL.md");
    const debug = await text("skills/pi-systematic-debugging/SKILL.md");

    expect(grill).toContain("name: pi-design-grill");
    expect(grill).toMatch(/Problem[\s\S]*Appetite[\s\S]*Solution[\s\S]*Rabbit Holes[\s\S]*No-Gos/u);
    expect(grill).toContain("one decisive question at a time");
    expect(audit).toContain("name: pi-quality-audit");
    expect(audit).toContain("Never invent a numeric quality score");
    expect(audit).toContain("Clean Code metrics");
    expect(debug).toContain("name: pi-systematic-debugging");
    expect(debug).toMatch(
      /Reproduce[\s\S]*Triage[\s\S]*Isolate[\s\S]*hypotheses[\s\S]*root cause[\s\S]*RED[\s\S]*GREEN[\s\S]*Refactor[\s\S]*verification[\s\S]*review/iu,
    );
  });

  it("ships a plan template that passes the runtime artifact contract", async () => {
    expect.hasAssertions();
    expect(
      validatePlanDocument(await text("skills/pi-development-workflow/templates/plan.md")),
    ).toEqual({ id: "plan", valid: true });
  });

  it("documents artifact status ownership and the appetite circuit breaker", async () => {
    expect.hasAssertions();
    const readme = await text("README.md");
    expect(readme).toContain("Mutable state belongs only to the Pi session ledger");
    expect(readme).toContain("Deliberately excluded");
    expect(readme).toContain("hill charts");
    expect(readme).toContain("exhaustive upfront task plans");
    expect(readme).toContain("circuit extend 1d");
    expect(readme).toContain(
      "does not authorize commit, push, pull request, merge, release, publish, deploy",
    );
  });
});
