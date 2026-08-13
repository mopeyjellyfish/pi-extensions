import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const PITCH_HEADINGS = [
  "Executive summary",
  "Problem",
  "Appetite",
  "Research and prior art",
  "Solution",
  "Fixed decisions",
  "Rabbit holes",
  "No-gos",
  "Acceptance criteria",
];

describe("feature-flow resources", () => {
  it("guides one Git-native Shape Up flow", async () => {
    expect.hasAssertions();
    const [skill, pitch, plan, readme] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "skills", "shape", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "shape", "templates", "pitch.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "shape", "templates", "plan.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
    ]);

    expect(skill).toMatch(/Worktrunk[\s\S]*only\s+worktree lifecycle authority/iu);
    expect(skill).toMatch(
      /no usable brief[\s\S]*ask\s+the\s+human[\s\S]*before calling[^.]*`worktree` tool/iu,
    );
    expect(skill).toMatch(/initial questioning pass[\s\S]*before any worktree call/iu);
    expect(skill).toMatch(/`question` tool[\s\S]*one to four[^.]*in one call/iu);
    expect(skill).toMatch(/research[\s\S]*second questioning pass[\s\S]*create `pitch\.md`/iu);
    expect(skill).toMatch(
      /document field[\s\S]*complete pitch[\s\S]*explicit\s+human\s+approval/iu,
    );
    expect(skill).toContain('action: "status"');
    expect(skill).toContain('action: "list"');
    expect(skill).toContain("`feat/<slug>`");
    expect(skill).toMatch(/active path[\s\S]*worktree list[\s\S]*branch/iu);
    expect(skill).not.toContain("git branch --show-current");
    expect(skill).toMatch(/Whether the brief is specific or\s+broad/u);
    expect(skill).toContain('subagent({ action: "list" })');
    expect(skill).toMatch(/before[^.]*first delegation[^.]*live agent inventory/iu);
    expect(skill).toMatch(
      /prefer[^.]*`scout`[^.]*`researcher`[^.]*`context-builder`[^.]*`reviewer`/iu,
    );
    expect(skill).toMatch(/research stage[^.]*zero to three[^.]*specialists/iu);
    expect(skill).toMatch(/required review[^.]*one to three[^.]*specialists/iu);
    expect(skill).toMatch(/fresh context[^.]*asynchronous/iu);
    expect(skill).toMatch(/returned run identifier[^.]*results block synthesis/iu);
    expect(skill).toMatch(/do not poll or\s+sleep/iu);
    expect(skill).toMatch(/do not modify project or source files/iu);
    expect(skill).toMatch(/exclusive active writer lease/iu);
    expect(skill).toMatch(/controlling Shape agent[^.]*sole decision-maker/iu);
    expect(skill).toMatch(/non-tiny slice[\s\S]*one retained Sol writer with `context: "fresh"`/iu);
    expect(skill).toMatch(
      /parent reads[\s\S]*without editing while[\s\S]*writer holds the lease/iu,
    );
    expect(skill).toContain('runs.run(key, { resume: "<run-id>", task: "follow-up" })');
    expect(skill).toMatch(/latest\s+returned `runId`[^.]*further repair/iu);
    expect(skill).toMatch(/QA[^.]*never replaces formal review/iu);
    expect(skill).toMatch(/synthesize[^.]*before[^.]*decision[^.]*edit/iu);
    expect(skill).toMatch(
      /`subagent` tool[^.]*unavailable[\s\S]*research[^.]*record the gap[\s\S]*review[^.]*stop/iu,
    );
    expect(skill).toMatch(/child fails[^.]*status[\s\S]*retry once[^.]*narrower task/iu);
    expect(skill).toMatch(/inform the human[\s\S]*questions[\s\S]*pitch/iu);
    expect(skill).toMatch(/complete pitch[\s\S]*read-only review[\s\S]*human approval/iu);
    expect(skill).toMatch(/first unchecked slice[\s\S]*dirty[\s\S]*Git/iu);
    expect(skill).toMatch(/tests[\s\S]*required checks[\s\S]*read-only review/iu);
    expect(skill).toMatch(/`todo` tool[\s\S]*session[^.]*progress/iu);
    expect(skill).toContain("Shape <slug>: <checked>/<total> — <slice number> <outcome>");
    expect(skill).toMatch(/derive[^.]*checked[^.]*total[\s\S]*first unchecked slice/iu);
    expect(skill).toMatch(
      /no[^.]*prefix match[\s\S]*add[\s\S]*one[^.]*match[\s\S]*update[\s\S]*more than one[^.]*match[\s\S]*no todo mutation/iu,
    );
    expect(skill).toMatch(
      /no unrelated[^.]*`in_progress`[\s\S]*rolling item[^.]*`in_progress`[\s\S]*unrelated[^.]*active[\s\S]*`pending`[^.]*unchanged/iu,
    );
    expect(skill).toMatch(
      /300 characters[\s\S]*preserve[^.]*progress[^.]*current-slice prefix[\s\S]*truncate[^.]*outcome[^.]*blocked/iu,
    );
    expect(skill).toMatch(
      /todo state[^.]*tool output[^.]*`\/todos`[\s\S]*widget[^.]*status line[^.]*opportunistic/iu,
    );
    expect(skill).toMatch(/plan creation[\s\S]*plan changes[\s\S]*resume[\s\S]*slice completion/iu);
    expect(skill).toMatch(/blocked[^.]*suffix[\s\S]*remove[^.]*resumes/iu);
    expect(skill).toMatch(
      /all slices[^.]*checked[\s\S]*<total>\/<total> — complete[\s\S]*`completed`/iu,
    );
    expect(skill).toMatch(/todo mutation fails[\s\S]*stop[^.]*reconciliation[\s\S]*retry/iu);
    expect(skill).toMatch(/accepted\s+pitch[^.]*intent[\s\S]*current\s+`plan\.md`[^.]*slice/iu);
    expect(skill).toMatch(/Git[^.]*history[^.]*resume evidence/iu);
    expect(skill).toMatch(/best-effort[^.]*instruction/iu);
    expect(skill).not.toMatch(/high-water|Next slice number|stale managed|retired number/iu);
    expect(skill).toMatch(/resolve a material base\s+choice with the human/iu);
    expect(skill).toMatch(
      /never infer[^.]*commit[^.]*push[^.]*open a pull request[^.]*merge[^.]*publish[^.]*deploy[^.]*remove a\s+worktree[^.]*destructive cleanup/iu,
    );
    expect(skill).toMatch(/material change[\s\S]*stop the\s+writer[\s\S]*status: draft/iu);
    expect(skill).toMatch(
      /full\s+pitch[\s\S]*every affected plan slice[\s\S]*independent pitch review[\s\S]*complete revised pitch[\s\S]*fresh human approval/iu,
    );
    expect(skill).toMatch(/fresh human approval[\s\S]*status: accepted/iu);
    expect(skill).toMatch(
      /changed\s+contract invalidates the old writer context[\s\S]*new self-contained task\s+capsule[\s\S]*one new Sol writer with `context: "fresh"`/iu,
    );
    expect(skill).toMatch(/Do not resume the retained writer after a material change/iu);
    expect(skill).not.toMatch(/feature-flow\.mjs|index\.json|sha-?256|banking|Feature-Slice/iu);
    expect(readme).toMatch(/aggregate\s+package[\s\S]*not a standalone/iu);
    expect(readme).toMatch(/research stage[^.]*zero to three[\s\S]*review[^.]*one to three/iu);
    expect(readme).toMatch(/controlling Shape parent[^.]*sole decision-maker/iu);
    expect(readme).toMatch(/exclusive\s+writer lease[\s\S]*one\s+retained Sol writer/iu);
    expect(readme).toMatch(/material intent change[\s\S]*whole-document human approval/iu);
    expect(readme).toMatch(
      /retained writer[^.]*routine repair[^.]*then a fresh\s+formal reviewer/iu,
    );
    expect(readme).toContain("pi install npm:pi-subagents");
    expect(readme).toContain("pi install git:github.com/mopeyjellyfish/pi-extensions");
    expect(`${skill}\n${readme}`).not.toMatch(/shape\/(?:<slug>|\*)/u);

    expect(pitch).toMatch(/^---\nstatus: draft\n---/u);
    expect(pitch.match(/^## .+$/gmu)?.map((heading) => heading.slice(3))).toEqual(PITCH_HEADINGS);
    expect(plan).toContain("## [ ] 001 — Observable vertical outcome");
    expect(plan).toMatch(/first unchecked slice/iu);
    expect(plan).toMatch(/`todo` tool[\s\S]*checked[^.]*total[\s\S]*rolling/iu);
    expect(plan).not.toMatch(/Next slice number|high-water|retired number/iu);
    expect(plan).not.toMatch(/depends_on|evidence|banking|estimate/iu);
    expect(readme).toMatch(/rolling[^.]*session todo/iu);
    expect(readme).toMatch(/preserv[^.]*unrelated todos/iu);
    expect(readme).toMatch(/widget[^.]*status line[^.]*opportunistic/iu);
    expect(readme).toMatch(/best-effort[^.]*plan\.md/iu);
  });

  it("expands one /shape prompt with or without a brief", async () => {
    expect.hasAssertions();
    const prompt = await readFile(join(PACKAGE_ROOT, "prompts", "shape.md"), "utf8");
    const piPromptTemplates = (await import(
      pathToFileURL(
        join(
          REPOSITORY_ROOT,
          "node_modules",
          "@earendil-works",
          "pi-coding-agent",
          "dist",
          "core",
          "prompt-templates.js",
        ),
      ).href
    )) as {
      loadPromptTemplates(options: {
        cwd: string;
        agentDir: string;
        promptPaths: string[];
        includeDefaults: boolean;
      }): { name: string; content: string }[];
      expandPromptTemplate(text: string, templates: { name: string; content: string }[]): string;
    };
    const templates = piPromptTemplates.loadPromptTemplates({
      cwd: PACKAGE_ROOT,
      agentDir: PACKAGE_ROOT,
      promptPaths: [join(PACKAGE_ROOT, "prompts")],
      includeDefaults: false,
    });

    expect(prompt).toContain(
      "${ARGUMENTS:-Ask the user for a feature brief before any worktree action.}",
    );
    expect(piPromptTemplates.expandPromptTemplate("/shape", templates)).toContain(
      "Ask the user for a feature brief before any worktree action.",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/shape add resumable uploads", templates),
    ).toContain("add resumable uploads");
  });

  it("packs only the skill, prompt, and two templates", async () => {
    expect.hasAssertions();
    const packageManifest = JSON.parse(
      await readFile(join(PACKAGE_ROOT, "package.json"), "utf8"),
    ) as { files: string[]; pi: { skills: string[]; prompts: string[] } };
    const rootManifest = JSON.parse(
      await readFile(join(REPOSITORY_ROOT, "package.json"), "utf8"),
    ) as { pi: { skills: string[]; prompts: string[] } };
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const packedPaths = packed[0]?.files.map(({ path }) => path) ?? [];

    expect(packageManifest.pi).toEqual({ skills: ["./skills"], prompts: ["./prompts"] });
    expect(packageManifest.files).not.toContain("scripts/feature-flow.mjs");
    expect(rootManifest.pi.skills).toContain("./packages/*/skills");
    expect(rootManifest.pi.prompts).toEqual(["./packages/*/prompts"]);
    expect(await readdir(join(PACKAGE_ROOT, "skills"))).toEqual(["shape"]);
    expect(await readdir(join(PACKAGE_ROOT, "prompts"))).toEqual(["shape.md"]);
    expect(packedPaths).toEqual(
      expect.arrayContaining([
        "README.md",
        "prompts/shape.md",
        "skills/shape/SKILL.md",
        "skills/shape/templates/pitch.md",
        "skills/shape/templates/plan.md",
      ]),
    );
    expect(
      packedPaths.some(
        (path) =>
          path.startsWith("scripts/") ||
          path.startsWith("test/") ||
          path.startsWith("docs/") ||
          path.includes("/references/") ||
          path.endsWith("templates/index.json"),
      ),
    ).toBe(false);
  });
});
