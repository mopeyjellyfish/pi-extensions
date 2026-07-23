import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validatePitchDocument, validatePlanDocument } from "../src/artifacts.ts";

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
    const philosophy = await text("skills/pi-development-workflow/references/philosophy.md");
    const pitch = await text("skills/pi-development-workflow/references/pitch.md");
    const specTemplate = await text("skills/pi-development-workflow/templates/spec.md");
    const researchTemplate = await text("skills/pi-development-workflow/templates/research.md");
    const slices = await text("skills/pi-development-workflow/references/slices.md");
    const build = await text("skills/pi-development-workflow/references/build.md");
    const ship = await text("skills/pi-development-workflow/references/review-and-ship.md");
    const modelRouting = await text("skills/pi-development-workflow/references/model-routing.md");
    const sliceTemplate = await text("skills/pi-development-workflow/templates/vertical-slice.md");

    expect(main).toContain("name: pi-development-workflow");
    expect(main).toContain("Todo only for work discovered inside the active slice");
    expect(main).toContain("Research before interviewing");
    expect(main).toContain("Record fresh `research` evidence for every workflow");
    expect(main).toContain("Question");
    expect(main).toContain("LSP");
    expect(main).toContain("web search");
    expect(main).toContain("GitHub");
    expect(main).toContain("Git conventions");
    expect(main).toContain("pi-subagents");
    expect(main).toContain("Worktrunk");
    expect(main).toMatch(/Worktrunk[\s\S]*before starting or adopting the ledger/iu);
    expect(main).toContain("reopen the revised questions with its continuation ID");
    expect(main).toMatch(/After Plan approval[\s\S]*mainly autonomously/iu);
    expect(main).toContain("Do not add routine checkpoints");
    expect(main).toContain("why the problem deserves investment");
    expect(main).toContain("adapts Shape Up's fixed-time appetite");
    expect(main).toContain("Without LSP");
    expect(main).toContain("Without web search");
    expect(main).toContain("references/philosophy.md");
    expect(main).toContain("Discover, Build, and Review advance");
    expect(main).toContain(
      "Only the researched Pitch and first-slice Plan require direct user approval",
    );
    expect(main).toMatch(
      /raw idea[\s\S]*set boundaries[\s\S]*rough out[\s\S]*de-risk[\s\S]*write the pitch[\s\S]*approve/iu,
    );
    expect(philosophy).toMatch(/agent-native Shape Up/iu);
    expect(philosophy).toMatch(/betting table[\s\S]*not copy/iu);
    expect(philosophy).toMatch(/research[\s\S]*change the pitch/iu);
    expect(philosophy).toMatch(
      /Shape Up defines Appetite as a fixed-time[\s\S]*deliberately diverges/iu,
    );
    expect(philosophy).toMatch(
      /continue to the next well-scoped slice[\s\S]*stop the autonomous Build/iu,
    );
    expect(philosophy).toMatch(
      /deep modules[\s\S]*information hiding[\s\S]*errors out of existence/iu,
    );
    expect(philosophy).toMatch(/Single Responsibility[\s\S]*Boy Scout[\s\S]*F\.I\.R\.S\.T\./iu);
    expect(philosophy).toMatch(/grep-friendly[\s\S]*structured JSON[\s\S]*expected shape/iu);
    expect(philosophy).toMatch(/Gherkin[\s\S]*only when/iu);
    expect(philosophy).toContain("https://basecamp.com/shapeup");
    expect(philosophy).toContain("https://web.stanford.edu/~ouster/cgi-bin/book.php");
    expect(philosophy).toContain(
      "https://akitaonrails.com/en/2026/04/20/clean-code-for-ai-agents/",
    );
    expect(philosophy).not.toContain("94% quality");
    expect(pitch).toMatch(/Problem[\s\S]*Appetite[\s\S]*Solution[\s\S]*Rabbit Holes[\s\S]*No-Gos/u);
    expect(pitch).toMatch(/rough, solved, and bounded/iu);
    expect(pitch).toContain("missing capability");
    expect(pitch).toContain("agent-investment envelope");
    expect(pitch).toContain("why this problem is worth investment");
    expect(pitch).toContain("After each batch");
    expect(pitch).toContain("mandatory wall-clock backstop");
    expect(pitch).toContain("Read and research before interviewing");
    expect(pitch).toMatch(/Context surface[\s\S]*Change depth[\s\S]*Validation burden/u);
    expect(specTemplate).toContain("missing capability");
    expect(specTemplate).toContain("### Research Basis");
    expect(specTemplate).toContain("### Why This Is Worth the Investment");
    expect(specTemplate).toContain("### Agent Investment");
    expect(specTemplate).toContain("### Scope Control");
    expect(specTemplate).toContain("### Fixed Floors");
    expect(specTemplate).toContain("### Agent Discretion");
    expect(validatePitchDocument(specTemplate)).toEqual({ id: "PITCH-001", valid: true });
    expect(researchTemplate).toContain("schema: dev-workflow/research-v1");
    expect(researchTemplate).toContain("Repository Evidence");
    expect(researchTemplate).toContain("Findings and Pitch Implications");
    expect(researchTemplate).toContain("not a browsing diary");
    expect(slices).toContain("first demonstrable slice");
    expect(slices).toContain("Reject horizontal phases");
    expect(slices).toContain("without another approval or routine checkpoint");
    expect(build).toMatch(/RED[\s\S]*GREEN[\s\S]*REFACTOR/u);
    expect(build).toContain("without routine human checkpoints");
    expect(ship).toContain("explicit user authorization");
    expect(ship).toContain("/dev-workflow authorize <action>");
    expect(ship).toContain("/dev-workflow cancel authorization");
    expect(ship).toContain("/dev-workflow finish");
    expect(ship).toContain("reduced assurance");
    expect(main).toMatch(/sole orchestrator[\s\S]*explicitly select/iu);
    expect(modelRouting).toContain("openai-codex/gpt-5.6-sol:high");
    expect(modelRouting).toContain("openai-codex/gpt-5.6-luna:low");
    expect(modelRouting).toContain("openai-codex/gpt-5.6-terra:low");
    expect(modelRouting).toContain("openai-codex/gpt-5.6-terra:medium");
    expect(modelRouting).toContain("openai-codex/gpt-5.6-terra:high");
    const plannerProfile = modelRouting
      .split("\n")
      .find((line) => line.startsWith("| Pitch/spec/slice planner"));
    expect(plannerProfile).toContain("gpt-5.6-sol:high");
    expect(plannerProfile).toContain("Sol xhigh");
    expect(modelRouting).toMatch(/worker[\s\S]*medium by default[\s\S]*high/iu);
    const workerProfile = modelRouting.split("\n").find((line) => line.startsWith("| Worker"));
    expect(workerProfile).toContain("revalidated");
    expect(workerProfile).toContain("gpt-5.6-sol:medium");
    expect(modelRouting).toContain("openai-codex/gpt-5.6-sol:medium");
    expect(modelRouting).toMatch(
      /Terra medium[\s\S]*Terra high[\s\S]*Sol medium[\s\S]*do not use Terra xhigh/iu,
    );
    expect(modelRouting).not.toContain("openai-codex/gpt-5.6-terra:xhigh");
    expect(modelRouting).toMatch(/reviewer[\s\S]*gpt-5\.6-sol:high[\s\S]*one reviewer per slice/iu);
    const oracleProfile = modelRouting.split("\n").find((line) => line.startsWith("| Oracle"));
    expect(oracleProfile).toContain("gpt-5.6-sol:high");
    expect(oracleProfile).toContain("Forked");
    expect(oracleProfile).toContain("Sol xhigh");
    expect(modelRouting).toMatch(/fresh[\s\S]*pitch[\s\S]*active slice/iu);
    expect(modelRouting).toContain("https://developers.openai.com/api/docs/guides/latest-model");
    expect(modelRouting).toContain("https://developers.openai.com/api/docs/guides/reasoning");
    expect(slices).toMatch(/plan for a Terra worker/iu);
    expect(build).toMatch(/Luna low[\s\S]*Terra low/iu);
    expect(build).toMatch(/Terra medium[\s\S]*Terra high[\s\S]*Sol medium/iu);
    expect(build).toMatch(/Sol planner or Oracle[\s\S]*explicitly revalidated/iu);
    expect(build).toContain("Do not use Terra xhigh");
    expect(ship).toMatch(/one fresh Sol high reviewer[\s\S]*active slice/iu);
    expect(ship).toMatch(/accepted fixes[\s\S]*cap Terra at high[\s\S]*Sol medium/iu);
    expect(sliceTemplate).toContain("## Execution Profile");
    expect(sliceTemplate).toContain("Worker effort: medium");
    expect(sliceTemplate).toContain("Next tier: Terra high");
    expect(sliceTemplate).toContain("Conceptual failure: Return to Sol planning");
    expect(sliceTemplate).toMatch(/Sol medium[\s\S]*explicitly revalidates/iu);
  });

  it("defines evidence-based design, quality, and debugging flows without numeric gates", async () => {
    expect.hasAssertions();
    const grill = await text("skills/pi-design-grill/SKILL.md");
    const grillQuestions = await text("skills/pi-design-grill/references/questions.md");
    const audit = await text("skills/pi-quality-audit/SKILL.md");
    const debug = await text("skills/pi-systematic-debugging/SKILL.md");
    const debugLoop = await text("skills/pi-systematic-debugging/references/debug-loop.md");

    expect(grill).toContain("name: pi-design-grill");
    expect(grill).toMatch(/Problem[\s\S]*Appetite[\s\S]*Solution[\s\S]*Rabbit Holes[\s\S]*No-Gos/u);
    expect(grill).toMatch(/Question tool[\s\S]*2–4 related questions[\s\S]*batch/iu);
    expect(grill).toContain("recommended answer");
    expect(grillQuestions).toContain("missing capability");
    expect(grillQuestions).toContain("decision dependencies");
    expect(grillQuestions).toContain("Research basis");
    expect(grillQuestions).toContain("agent-investment");
    expect(grillQuestions).toContain("calendar estimate");
    expect(audit).toContain("name: pi-quality-audit");
    expect(audit).toContain("Never invent a numeric quality score");
    expect(audit).toContain("Clean Code metrics");
    expect(debug).toContain("name: pi-systematic-debugging");
    expect(debug).toMatch(
      /feedback loop[\s\S]*Reproduce[\s\S]*minimise[\s\S]*hypotheses[\s\S]*Instrument[\s\S]*regression test[\s\S]*RED[\s\S]*GREEN[\s\S]*verification[\s\S]*review/iu,
    );
    expect(debugLoop).toMatch(
      /Phase 1[\s\S]*red-capable[\s\S]*Phase 2[\s\S]*Phase 3[\s\S]*3–5 ranked[\s\S]*Phase 4[\s\S]*one variable at a time[\s\S]*\[DEBUG-[\s\S]*Phase 5[\s\S]*correct seam/iu,
    );
  });

  it("ships a compact plan template that links rather than duplicates pitch boundaries", async () => {
    expect.hasAssertions();
    const planTemplate = await text("skills/pi-development-workflow/templates/plan.md");
    expect(validatePlanDocument(planTemplate)).toEqual({ id: "plan", valid: true });
    expect(planTemplate).toContain("Pitch and boundaries");
    expect(planTemplate).not.toContain("## Appetite");
    expect(planTemplate).not.toContain("## No-Gos");
  });

  it("documents artifact status ownership and the appetite circuit breaker", async () => {
    expect.hasAssertions();
    const readme = await text("README.md");
    expect(readme).toContain("Mutable state belongs only to the Pi session ledger");
    expect(readme).toContain("Deliberately excluded");
    expect(readme).toContain("hill charts");
    expect(readme).toContain("exhaustive upfront task plans");
    expect(readme).toContain("qualitative agent-investment envelope");
    expect(readme).toContain("For non-trivial work, resolve the workspace first");
    expect(readme).toContain("Discovery then reads repository truth");
    expect(readme).toContain("Problem contains the mandatory Research Basis");
    expect(readme).toContain("mandatory wall-clock backstop");
    expect(readme).toContain("/dev-workflow backstop 2d");
    expect(readme).toContain("wall-clock backstop continues to elapse");
    expect(readme).toContain("Circuit commands are available only after the backstop expires");
    expect(readme).toContain("Discover, Build, and Review advance automatically");
    expect(readme).toContain("/dev-workflow approve pitch");
    expect(readme).toContain("/dev-workflow approve plan");
    expect(readme).toContain("/dev-workflow authorize commit");
    expect(readme).toContain("/dev-workflow cancel authorization");
    expect(readme).toContain("/dev-workflow finish");
    expect(readme).toContain("stops only when a pitch/No-Go boundary would change");
    expect(readme).not.toContain("/dev-workflow approve discover");
    expect(readme).not.toContain("/dev-workflow approve build");
    expect(readme).not.toContain("/dev-workflow approve review");
    expect(readme).toContain("circuit extend 1d");
    expect(readme).not.toContain("when appetite expires");
    expect(readme).not.toContain("appetite warnings");
    expect(readme).toContain(
      "does not authorize commit, push, pull request, merge, release, publish, deploy",
    );
  });
});
