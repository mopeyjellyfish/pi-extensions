import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const read = (path: string) => readFile(join(PACKAGE_ROOT, path), "utf8");

describe("engineering resources", () => {
  it("routes root-profile work and review through fresh capability roles", async () => {
    expect.hasAssertions();
    const [implement, diagnosing, domainModeling, tdd, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("skills/diagnosing-bugs/SKILL.md"),
      read("skills/domain-modeling/SKILL.md"),
      read("skills/test-driven-development/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(/approved slice[\s\S]*bounded request[\s\S]*confirmed bug outcome/iu);
    expect(implement).toMatch(/`worker`[\s\S]*standard[\s\S]*plan-less[\s\S]*accepted hard/iu);
    expect(implement).toMatch(/`worker`[\s\S]*only configured\s+implementation child/iu);
    expect(implement).toMatch(/`reviewer`[\s\S]*fresh[\s\S]*read-only/iu);
    expect(implement).toMatch(
      /`reviewer`[\s\S]*worktree[\s\S]*fixed[- ]point[\s\S]*intent[\s\S]*diff[\s\S]*evidence/iu,
    );
    expect(implement).toMatch(/reviewer[^.]*unavailable[\s\S]*direct parent[^.]*`code-review`/iu);
    expect(implement).toMatch(
      /high-capability[\s\S]*explicit approval[\s\S]*evidence[\s\S]*expected benefit[\s\S]*bounded task/iu,
    );
    expect(implement).not.toMatch(/difficulty[\s\S]{0,120}automatic/iu);
    expect(implement).toMatch(/trivial[\s\S]*direct(ly)? as the parent|parent[\s\S]*trivial/iu);
    expect(implement).toMatch(/`worker`[\s\S]*fresh[\s\S]*foreground/iu);
    expect(implement).toMatch(/unavailable[\s\S]*direct parent/iu);
    expect(implement).toMatch(/repository instructions[\s\S]*Git\s+state[\s\S]*public contracts/iu);
    expect(implement).toMatch(
      /fresh worktree[\s\S]*repository-defined runtime[\s\S]*dependency setup[\s\S]*before[^.]*test/iu,
    );
    expect(implement).toMatch(/before[^.]*edit[\s\S]*isolated[^.]*worktree/iu);
    expect(implement).toMatch(/never[^.]*main[^.]*checkout/iu);
    expect(implement).toMatch(/same[^.]*worktree[\s\S]*pitch[\s\S]*plan/iu);
    expect(implement).toMatch(/no safe[^.]*available[^.]*stop[^.]*before[^.]*edit/iu);
    expect(implement).toMatch(/focused tests[\s\S]*required completion checks/iu);
    expect(implement).toMatch(/parallel-ready/iu);
    expect(implement).toMatch(/isolated worktree[\s\S]*sole\s+write ownership/iu);
    expect(implement).toMatch(/parent[\s\S]*synthesi[sz]e[\s\S]*verif/iu);
    expect(implement).toMatch(/do not add workers merely because[^.]*large/iu);
    expect(implement).toMatch(/complete work evidence[\s\S]*document/iu);
    expect(implement).toMatch(/Review[\s\S]*Revise[\s\S]*Deepen verification[\s\S]*Pause/iu);
    expect(readme).toMatch(/Worker[\s\S]*Reviewer[\s\S]*direct parent/iu);
    expect(readme).toMatch(/before[^.]*writ[\s\S]*isolated[^.]*worktree/iu);

    for (const resource of [diagnosing, domainModeling, tdd]) {
      expect(resource).toMatch(/before[^.]*writ[\s\S]*isolated[^.]*worktree/iu);
      expect(resource).toMatch(/never[\s\S]{0,120}main-branch checkout/iu);
      expect(resource).toMatch(/unavailable[^.]*stop[^.]*before[^.]*writ/iu);
    }

    expect(implement).toMatch(
      /runs\.all[\s\S]*agent:\s*["']qa["'][\s\S]*agent:\s*["']reviewer["']/iu,
    );
    expect(readme).toMatch(/QA[^.]*Reviewer[^.]*parallel|parallel[^.]*QA[^.]*Reviewer/iu);
    for (const resource of [implement, readme]) {
      expect(resource).not.toMatch(/writer lease|FFF|lsp_query/iu);
    }
  });

  it("pins fixed-role launch controls to agent profiles", async () => {
    expect.hasAssertions();
    const [implement, justDoIt, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("skills/just-do-it/SKILL.md"),
      read("README.md"),
    ]);
    const fixedWorkerArguments = [
      'agent: "worker"',
      'task: "<rendered Worker task contract>"',
      'cwd: "<active task worktree>"',
      "async: false",
    ].join("\n");

    expect(implement).toContain(fixedWorkerArguments);
    expect(implement).toMatch(/Pi's `subagent` tool[^.]*argument\s+object[^.]*workflowScript/iu);
    expect(implement).toMatch(
      /do not pass[^.]*`mode`[^.]*`model`[^.]*`thinking`[^.]*agent profile/iu,
    );
    expect(justDoIt).not.toContain(fixedWorkerArguments);
    expect(justDoIt).toMatch(/direct parent[^.]*default[\s\S]*Worker[^.]*only when/iu);
    expect(readme).toMatch(
      /fixed Worker[^.]*foreground[^.]*omit[^.]*mode[^.]*model[^.]*thinking[^.]*agent profile/iu,
    );
  });

  it("bounds implementation delegation, validation, and reporting without runtime caps", async () => {
    expect.hasAssertions();
    const [implementText, readmeText] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("README.md"),
    ]);
    const implement = implementText.replaceAll(/\s+/gu, " ");
    const readme = readmeText.replaceAll(/\s+/gu, " ");

    expect(implement).toMatch(
      /one worker attempt[\s\S]*selected QA[\s\S]*repair resumes[\s\S]*measurable progress/iu,
    );
    expect(implement).toMatch(/one review repair resume/iu);
    expect(implement).toMatch(/no fixed iteration, turn, tool, token, or cost limit/iu);
    expect(implement).toMatch(/stop[^.]*same failure[^.]*without new evidence/iu);
    expect(implement).toMatch(/QA[^.]*selected[\s\S]*aggregated defect packet/iu);
    expect(implement).toMatch(/partial[^.]*must not[^.]*automatic[^.]*retry/iu);
    expect(implement).toMatch(
      /Goal:[\s\S]*Public seam:[\s\S]*Allowed files:[\s\S]*Stop conditions:/iu,
    );
    expect(implement).toMatch(/do not impose hard turn, tool, token, or cost budgets/iu);
    expect(implement).toMatch(
      /parent owns[\s\S]*required completion gates[\s\S]*risk determines[^.]*formal review/iu,
    );
    expect(implement).toMatch(
      /tool calls[\s\S]*changed production[\s\S]*test LOC[\s\S]*review cycles/iu,
    );
    expect(readme).toMatch(/bounded worker[\s\S]*parent finalization/iu);
    expect(readme).toMatch(
      /green-path[^.]*without a QA model[\s\S]*QA and formal review[^.]*parallel/iu,
    );
  });

  it("uses invalidation-aware evidence for serial delivery units", async () => {
    expect.hasAssertions();
    const [implement, tdd, router, justDoIt, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("skills/test-driven-development/SKILL.md"),
      read("skills/developing-changes/SKILL.md"),
      read("skills/just-do-it/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(/serial\s+delivery unit[^.]*same writer[^.]*same worktree/iu);
    expect(implement).toMatch(
      /affected-boundary[\s\S]*integration[\s\S]*required completion gates/iu,
    );
    expect(implement).toMatch(/invalidation map[\s\S]*unchanged evidence[\s\S]*intermediate/iu);
    expect(implement).toMatch(
      /when (?:an accepted )?plan\s+exists[\s\S]*otherwise[\s\S]*changed surfaces/iu,
    );
    expect(tdd).toMatch(/when (?:a )?plan\s+exists[\s\S]*otherwise[\s\S]*changed surfaces/iu);
    expect(implement).toMatch(/complete gate once[\s\S]*frozen diff/iu);
    expect(implement).toMatch(
      /stable\s+completed delivery unit[\s\S]*one fixed[\s\S]*formal review/iu,
    );
    expect(implement).toMatch(/review repair resume[\s\S]*same retained Worker/iu);
    expect(implement).toMatch(/critical-path[^.]*parent-context[^.]*independent evidence/iu);
    expect(implement).toMatch(/materially\s+exceeds[\s\S]*forecast[\s\S]*pause/iu);
    expect(tdd).toMatch(/vertical behavior[^.]*red[^.]*green[^.]*refactor/iu);
    expect(tdd).toMatch(
      /new worktree[\s\S]*repository instructions[\s\S]*runtime[\s\S]*dependency setup[\s\S]*before[^.]*test/iu,
    );
    expect(tdd).toMatch(/setup failure[^.]*not[^.]*red proof/iu);
    expect(tdd).toMatch(
      /diagnose[^.]*failed test[^.]*before[^.]*rerun[\s\S]*same failure[\s\S]*stop/iu,
    );
    expect(router).toMatch(/one bounded delivery unit[\s\S]*no\s+forecast or topology overhead/iu);
    expect(justDoIt).toMatch(
      /one bounded delivery unit[\s\S]*no\s+forecast or topology overhead/iu,
    );
    expect(readme).toMatch(
      /validation ladder[\s\S]*affected-boundary[\s\S]*integration[\s\S]*stable-boundary/iu,
    );
    expect(readme).toMatch(
      /fresh worktree[\s\S]*runtime[\s\S]*dependency setup[\s\S]*first test/iu,
    );

    for (const resource of [implement, tdd, router, justDoIt]) {
      expect(resource).not.toMatch(
        /pi-extensions|packages\/|npm (?:run|test)|GitHub Actions|\bFable\b|\bSol\b|GPT-\d|Opus/iu,
      );
      expect(resource).not.toMatch(/\/(?:Users|home|tmp)\//u);
    }
  });

  it("composes coordinating skills through their specialized methods", async () => {
    expect.hasAssertions();
    const [implement, justDoIt, router, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("skills/just-do-it/SKILL.md"),
      read("skills/developing-changes/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(
      /behavioral implementation[\s\S]*load and\s+follow[\s\S]*`test-driven-development`/iu,
    );
    expect(implement).toMatch(
      /unavailable[\s\S]*direct parent[\s\S]*failing and passing proof[\s\S]*public seam/iu,
    );
    expect(implement).toMatch(
      /confirmed bug outcome[\s\S]*diagnosis evidence[\s\S]*regression seam/iu,
    );
    expect(implement).toMatch(
      /unconfirmed[\s\S]*load and\s+follow[\s\S]*`diagnosing-bugs`[\s\S]*before implementation/iu,
    );
    expect(implement).not.toContain("make the smallest relevant public-seam test fail");
    expect(implement).not.toContain("trace callers and sibling paths");
    expect(implement).toContain("complete work evidence");
    expect(implement).toMatch(/red and\s+green evidence/iu);
    expect(implement).toMatch(/explicit\s+test exception/iu);
    expect(implement).toMatch(/parent inspects\s+the final diff/iu);
    for (const concern of [
      "release",
      "dependency",
      "artifact hygiene",
      "security",
      "cancellation",
      "cleanup",
      "user-visible documentation",
    ]) {
      expect(implement).toContain(concern);
    }
    expect(implement).toMatch(/`reviewer`[\s\S]*load and\s+follow[\s\S]*`code-review`/iu);
    expect(justDoIt).toMatch(/does not mandate[^.]*QA[^.]*Reviewer/iu);
    expect(justDoIt).toMatch(/material risk[\s\S]*`reviewer`[\s\S]*`code-review`/iu);
    expect(router).toMatch(
      /reported[\s\S]*broken[\s\S]*unresolved cause[\s\S]*`diagnosing-bugs`/iu,
    );
    expect(router).toMatch(/confirmed bug outcome[\s\S]*`implement`/iu);
    expect(readme).toMatch(/`implement`[\s\S]*`test-driven-development`[\s\S]*`diagnosing-bugs`/iu);
  });

  it("keeps the focused optional skills and prompt templates installable", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await read("package.json")) as {
      files: string[];
      pi: Record<string, string[]>;
      dependencies?: unknown;
      peerDependencies?: unknown;
    };
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const paths = packed[0]?.files.map(({ path }) => path) ?? [];

    expect(manifest.pi).toEqual({ skills: ["./skills"], prompts: ["./prompts"] });
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.peerDependencies).toBeUndefined();
    expect(paths).toEqual(
      expect.arrayContaining([
        "skills/developing-changes/SKILL.md",
        "skills/implement/SKILL.md",
        "skills/just-do-it/SKILL.md",
        "skills/test-driven-development/SKILL.md",
        "skills/diagnosing-bugs/SKILL.md",
        "skills/diagnosing-bugs/scripts/hitl-loop.template.sh",
        "skills/code-review/SKILL.md",
        "skills/code-review/references/go.md",
        "skills/code-review/references/react.md",
        "skills/code-review/references/sql.md",
        "skills/code-review/references/typescript.md",
        "skills/codebase-design/DEEPENING.md",
        "skills/codebase-design/DESIGN-IT-TWICE.md",
        "prompts/debug.md",
        "prompts/implement.md",
        "prompts/just-do-it.md",
        "prompts/review-change.md",
      ]),
    );
    expect(paths).not.toContain("skills/reviewing-changes/SKILL.md");
    expect(paths).toEqual(
      expect.arrayContaining([
        "skills/improve-codebase-architecture/SKILL.md",
        "prompts/improve.md",
      ]),
    );
  });

  it("ships one integrated code review method and an evidence-based design vocabulary", async () => {
    expect.hasAssertions();
    const [skill, design, prompt, developing, notice, readme, skillDirectories] = await Promise.all(
      [
        read("skills/code-review/SKILL.md"),
        read("skills/codebase-design/SKILL.md"),
        read("prompts/review-change.md"),
        read("skills/developing-changes/SKILL.md"),
        read("THIRD_PARTY_NOTICES.md"),
        read("README.md"),
        readdir(join(PACKAGE_ROOT, "skills"), { withFileTypes: true }),
      ],
    );

    expect(skill).toMatch(/Pitch and plan[\s\S]*Standards[\s\S]*one read-only pass/iu);
    expect(skill).toMatch(/Do not spawn subagents[\s\S]*issue-tracker setup/iu);
    expect(skill).toMatch(/one read-only reviewer[\s\S]*direct parent/iu);
    expect(skill).not.toMatch(/\bSpec\b/u);
    expect(skill).toMatch(
      /accepted pitch[\s\S]*accepted plan[\s\S]*bounded request[\s\S]*issue[\s\S]*user-supplied intent/iu,
    );
    expect(skill).toMatch(
      /correctness[\s\S]*regression[\s\S]*security[\s\S]*performance[\s\S]*edge\s+cases[\s\S]*falsifiable\s+tests[\s\S]*architecture[\s\S]*maintainability/iu,
    );
    expect(skill).toMatch(
      /file and location[\s\S]*cited requirement[\s\S]*concrete consequence[\s\S]*confidence/iu,
    );
    expect(
      skillDirectories.filter((entry) => entry.isDirectory()).map(({ name }) => name),
    ).toContain("code-review");
    expect(skillDirectories.map(({ name }) => name)).not.toContain("reviewing-changes");
    expect(prompt).toMatch(/`code-review` skill/iu);
    expect(developing).toMatch(/`code-review`/iu);
    expect(readme).toMatch(/`code-review`/iu);
    expect(notice).toMatch(
      /skills\/code-review\/SKILL\.md[\s\S]*068b6e0c62393147daf03530149cdce209c93da8[\s\S]*adapted/iu,
    );
    expect(notice).toMatch(
      /skills\/codebase-design\/SKILL\.md[\s\S]*ee8bae40062cd6b435073368ed0c540f48c35862[\s\S]*adapted/iu,
    );

    for (const term of [
      "Module",
      "Interface",
      "Implementation",
      "Depth",
      "Seam",
      "Adapter",
      "Leverage",
      "Locality",
      "deletion test",
      "test surface",
    ]) {
      expect(design).toContain(term);
    }
    expect(design).toMatch(
      /one adapter[\s\S]*hypothetical seam[\s\S]*two adapters[\s\S]*real one/iu,
    );
  });

  it("reviews pitch and plan intent with applicable language references", async () => {
    expect.hasAssertions();
    const [skill, typescript, react, go, sql, prompt] = await Promise.all([
      read("skills/code-review/SKILL.md"),
      read("skills/code-review/references/typescript.md"),
      read("skills/code-review/references/react.md"),
      read("skills/code-review/references/go.md"),
      read("skills/code-review/references/sql.md"),
      read("prompts/review-change.md"),
    ]);
    expect(skill).toMatch(/accepted pitch[\s\S]*accepted plan[\s\S]*primary intent/iu);
    expect(skill).toMatch(/missing pitch or plan[\s\S]*state[^.]*unavailable evidence/iu);
    expect(skill).toMatch(/changed languages[\s\S]*frameworks[\s\S]*load only[^.]*references/iu);
    expect(skill).toMatch(/Repository instructions[\s\S]*always override general guidance/iu);
    expect(skill).not.toMatch(/\bSpec\b/u);
    expect(prompt).toMatch(/accepted pitch and plan/iu);

    for (const reference of [typescript, react, go, sql]) {
      expect(reference).toMatch(/review evidence/iu);
      expect(reference).toMatch(/repository[^.]*standards[^.]*override/iu);
      expect(reference).toMatch(/do not report[^.]*tooling/iu);
    }
    expect(typescript).toMatch(/strict[\s\S]*unknown[\s\S]*discriminated union/iu);
    expect(react).toMatch(/render purity[\s\S]*Hooks[\s\S]*effect cleanup[\s\S]*accessibility/iu);
    expect(go).toMatch(/error[\s\S]*context[\s\S]*goroutine[\s\S]*race/iu);
    expect(sql).toMatch(/NULL[\s\S]*cardinality[\s\S]*transaction[\s\S]*query plan/iu);
  });

  it("keeps the adapted design method, references, and local safeguards", async () => {
    expect.hasAssertions();
    const [skill, deepening, designItTwice, notice] = await Promise.all([
      read("skills/codebase-design/SKILL.md"),
      read("skills/codebase-design/DEEPENING.md"),
      read("skills/codebase-design/DESIGN-IT-TWICE.md"),
      read("THIRD_PARTY_NOTICES.md"),
    ]);

    for (const term of [
      "Module",
      "Interface",
      "Implementation",
      "Depth",
      "Seam",
      "Adapter",
      "Leverage",
      "Locality",
    ]) {
      expect(skill).toContain(term);
    }
    expect(skill).toMatch(
      /Glossary[\s\S]*Module[\s\S]*Locality[\s\S]*Deep vs shallow[\s\S]*Deep module[\s\S]*Shallow module[\s\S]*Principles/iu,
    );
    expect(skill).toMatch(
      /Designing for testability[\s\S]*Accept dependencies, don't create them[\s\S]*Return results, don't produce side effects[\s\S]*Small surface area/iu,
    );
    expect(skill).toMatch(
      /Relationships[\s\S]*Rejected framings[\s\S]*DEEPENING\.md[\s\S]*DESIGN-IT-TWICE\.md/iu,
    );
    expect(skill).toMatch(
      /repository evidence[\s\S]*speculative seams[\s\S]*forwarding-only layers[\s\S]*syntax-only deduplication/iu,
    );
    expect(deepening).toMatch(
      /Dependency categories[\s\S]*In-process[\s\S]*Local-substitutable[\s\S]*Remote but owned[\s\S]*True external/iu,
    );
    expect(deepening).toMatch(/replace, don't layer[\s\S]*interface is the test surface/iu);
    expect(designItTwice).toMatch(
      /ordinary child[^.]*not an orchestrator[\s\S]*selected parent[^.]*architecture judgment/iu,
    );
    expect(designItTwice).toMatch(
      /genuinely different[\s\S]*constraints[\s\S]*Interface[\s\S]*Usage example[\s\S]*Trade-offs/iu,
    );
    expect(designItTwice).toMatch(
      /Present and compare[\s\S]*depth[\s\S]*locality[\s\S]*seam placement[\s\S]*recommendation/iu,
    );
    expect(notice).toMatch(
      /ee8bae40062cd6b435073368ed0c540f48c35862[\s\S]*SKILL\.md[\s\S]*adapted[\s\S]*DEEPENING\.md[\s\S]*adapted[\s\S]*DESIGN-IT-TWICE\.md[\s\S]*adapted/iu,
    );
  });

  it("ships a safe, evidence-backed architecture discovery route", async () => {
    expect.hasAssertions();
    const [skill, prompt, notice, readme] = await Promise.all([
      read("skills/improve-codebase-architecture/SKILL.md"),
      read("prompts/improve.md"),
      read("THIRD_PARTY_NOTICES.md"),
      read("README.md"),
    ]);

    expect(skill).toMatch(
      /optional[\s\S]*module[\s\S]*subsystem[\s\S]*pain point[\s\S]*change-history scope/iu,
    );
    expect(skill).toMatch(/nearest domain context[\s\S]*architecture decisions/iu);
    expect(skill).toMatch(/one optional bounded Researcher handoff[\s\S]*direct parent/iu);
    expect(skill).toMatch(/hot-spot[\s\S]*caller scan/iu);
    expect(skill).toMatch(/`codebase-design`/u);
    expect(skill).toMatch(
      /ranked[\s\S]*current friction[\s\S]*involved files[\s\S]*proposed deeper module[\s\S]*locality[\s\S]*leverage[\s\S]*test effect[\s\S]*decision conflicts[\s\S]*strength/iu,
    );
    expect(skill).toMatch(/before[\s\S]*after[\s\S]*diagram/iu);
    expect(skill).toMatch(/`question`[\s\S]*select[\s\S]*tool is unavailable[\s\S]*conversation/iu);
    expect(skill).toMatch(/Shape[\s\S]*planning[\s\S]*Shape is unavailable[\s\S]*parent/iu);
    expect(skill).toMatch(/do not edit production code directly/iu);
    expect(prompt).toMatch(/`improve-codebase-architecture` skill/iu);
    expect(prompt).toMatch(/\$\{ARGUMENTS:-/u);
    expect(readme).toMatch(/`\/improve`/u);
    expect(notice).toMatch(
      /skills\/improve-codebase-architecture\/SKILL\.md[\s\S]*adapted[\s\S]*068b6e0c62393147daf03530149cdce209c93da8/iu,
    );
  });

  it("keeps the upstream debugging skill and HITL template verbatim with Pi additions", async () => {
    expect.hasAssertions();
    const [skill, template] = await Promise.all([
      read("skills/diagnosing-bugs/SKILL.md"),
      read("skills/diagnosing-bugs/scripts/hitl-loop.template.sh"),
    ]);
    const separator = "\n## Pi debug additions\n";
    const separatorIndex = skill.indexOf(separator);

    expect(separatorIndex).toBeGreaterThan(0);
    expect(createHash("sha256").update(skill.slice(0, separatorIndex)).digest("hex")).toBe(
      "573142d28dc5a4d931dd4a6faa3e615e731f8e9cc65d2dd4468045a2efd6148c",
    );
    expect(createHash("sha256").update(template).digest("hex")).toBe(
      "18ae07e1cc49b32c71767e241a6e8de4be74ef21d5e3b7e39034d9c7335f2d80",
    );
    expect(skill.slice(separatorIndex)).toMatch(/dedicated worktree/iu);
    expect(skill.slice(separatorIndex)).toMatch(/`question` tool/iu);
    expect(skill.slice(separatorIndex)).toMatch(/`test-driven-development` skill/iu);
  });

  it("routes change requests by impact and uncertainty and keeps delivery bounded", async () => {
    expect.hasAssertions();
    const [router, implement, justDoIt, readme, rootReadme] = await Promise.all([
      read("skills/developing-changes/SKILL.md"),
      read("skills/implement/SKILL.md"),
      read("skills/just-do-it/SKILL.md"),
      read("README.md"),
      readFile(join(REPOSITORY_ROOT, "README.md"), "utf8"),
    ]);

    expect(router).toMatch(
      /just[- ]do[- ]it[\s\S]*implement now[\s\S]*plan first[\s\S]*Shape then plan/iu,
    );
    expect(router).toMatch(
      /uncertainty[\s\S]*reversib(?:ility|le)[\s\S]*risk[\s\S]*affected boundar(?:y|ies)[\s\S]*coordination/iu,
    );
    expect(router).toMatch(/not[\s\S]*file count alone/iu);
    expect(router).toMatch(/one focused question[\s\S]*material boundary/iu);
    expect(router).toMatch(
      /`shape`[\s\S]*`planning-changes`[\s\S]*unavailable[\s\S]*direct parent[\s\S]*pitch[\s\S]*slice plan/iu,
    );
    expect(justDoIt).toMatch(/worktree setup[\s\S]*first/iu);
    expect(justDoIt).toMatch(/direct parent[^.]*default/iu);
    expect(justDoIt).toMatch(/exactly one fresh `worker`[^.]*only when/iu);
    expect(justDoIt).toMatch(
      /mechanical scope[\s\S]*objective check[\s\S]*setup evidence[\s\S]*delivery authority/iu,
    );
    expect(justDoIt).toMatch(
      /ambiguity[\s\S]*behavior design[\s\S]*security[\s\S]*migration[\s\S]*expanding scope/iu,
    );
    expect(justDoIt).toMatch(/Utility[\s\S]*QA[\s\S]*only when useful/iu);
    expect(justDoIt).toMatch(/material risk[\s\S]*reviewer/iu);
    expect(justDoIt).toMatch(/explicit\s+approval[\s\S]*higher-capability/iu);
    expect(justDoIt).toMatch(/named branch[\s\S]*`commit`[\s\S]*`open-pr`/iu);
    expect(justDoIt).toMatch(
      /not authorize[\s\S]*merge[\s\S]*deploy[\s\S]*plain[\s\S]*force[\s\S]*cleanup/iu,
    );
    expect(implement).toMatch(
      /complete accepted plan[\s\S]*dependency order[\s\S]*without replanning/iu,
    );
    expect(implement).toMatch(/planned parallel lanes[\s\S]*worktrees/iu);
    expect(implement).toMatch(
      /risk determines[^.]*formal review[\s\S]*stable completed delivery unit/iu,
    );
    expect(implement).toMatch(
      /Accept\s+and\s+publish[\s\S]*`commit`[\s\S]*`open-pr`[\s\S]*no\s+second\s+mutation\s+prompt/iu,
    );
    expect(implement).toMatch(/planned stack[\s\S]*`gh stack`[\s\S]*fail closed/iu);
    expect(implement.replaceAll(/\s+/gu, " ")).toContain(
      "When one accepted pitch has two or more delivery units, publish them in dependency and stack order through `open-pr` and `gh stack`.",
    );
    expect(readme.replaceAll(/\s+/gu, " ")).toContain(
      "Two or more delivery units from the same accepted pitch publish in dependency and stack order.",
    );
    expect(implement).not.toMatch(/git commit|git push|gh pr create/iu);
    for (const documentation of [readme, rootReadme]) {
      expect(documentation).toMatch(/`\/just-do-it`/u);
      expect(documentation).toMatch(/impact.?and.?uncertainty/iu);
    }
  });

  it("checkpoints complete accepted plans between published delivery units", async () => {
    expect.hasAssertions();
    const [implement, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(
      /accepted and committed,[\s\S]*authorized\s+publication\s+has\s+completed[\s\S]*summar(?:ize|izes) progress[\s\S]*next planned unit[\s\S]*observable outcome[\s\S]*dependencies[\s\S]*readiness[\s\S]*proof[\s\S]*checks[\s\S]*remaining plan progress/iu,
    );
    expect(implement).toMatch(
      /`question` tool[\s\S]*exactly[\s\S]*Continue[\s\S]*Review next unit[\s\S]*Discuss/iu,
    );
    expect(implement).toMatch(
      /Continue[\s\S]*next ready delivery unit[\s\S]*planned ready lane set[\s\S]*accepted dependency order[\s\S]*without\s+replanning/iu,
    );
    expect(implement).toMatch(
      /question[\s\S]*unavailable[\s\S]*human cancels[\s\S]*same three choices[\s\S]*conversation[\s\S]*wait[\s\S]*do not start[\s\S]*next unit/iu,
    );
    expect(implement).toMatch(
      /Review next unit[\s\S]*accepted pitch[\s\S]*plan[\s\S]*not duplicate[\s\S]*fixed formal review/iu,
    );
    expect(implement).toMatch(
      /Discuss[\s\S]*do not silently alter[\s\S]*scope[\s\S]*delivery boundaries[\s\S]*dependencies[\s\S]*authority[\s\S]*planning and approval\s+flow/iu,
    );
    expect(implement).toMatch(
      /Review next unit[\s\S]*Discuss[\s\S]*without an accepted plan change[\s\S]*same checkpoint/iu,
    );
    expect(implement).toMatch(
      /until no planned delivery units remain[\s\S]*report plan\s+completion/iu,
    );
    expect(implement).toMatch(
      /plan-less requests[\s\S]*single-unit plans[\s\S]*must not[\s\S]*next-unit prompt/iu,
    );
    expect(readme).toMatch(
      /accepted and committed,[\s\S]*authorized\s+publication\s+has\s+completed[\s\S]*next planned\s+unit[\s\S]*Continue[\s\S]*Review next unit[\s\S]*Discuss[\s\S]*same checkpoint[\s\S]*plan completion/iu,
    );
  });

  it("uses accepted accept-all authority without removing verification or safety pauses", async () => {
    expect.hasAssertions();
    const [implement, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(
      /whole-plan approval[^.]*accept-all authority[^.]*named accepted plan/iu,
    );
    expect(implement).toMatch(/checkpointed[^.]*retain[^.]*routine prompts/iu);
    expect(implement).toMatch(
      /accept-all[^.]*every named delivery unit[\s\S]*tests[\s\S]*required gates[\s\S]*risk-selected assurance[\s\S]*commit[\s\S]*authorized publication/iu,
    );
    expect(implement).toMatch(
      /accept-all[^.]*without[^.]*routine[^.]*Accept and publish[^.]*Continue questions/iu,
    );
    expect(implement).toMatch(
      /pause[^.]*setup[^.]*test[^.]*check[^.]*commit[^.]*publication failure[^.]*material review findings[^.]*material forecast variance[^.]*scope[^.]*delivery boundaries[^.]*dependencies[^.]*authority/iu,
    );
    expect(implement).toMatch(
      /accept-all[^.]*never authorizes merge[^.]*release[^.]*deployment[^.]*destructive\s+cleanup[^.]*unrelated\s+work/iu,
    );
    expect(implement).toMatch(
      /review repair resume[^.]*same retained Worker[\s\S]*writer reruns focused invalidated evidence[\s\S]*invalidated required gates[\s\S]*without starting a second full review/iu,
    );
    expect(implement).toMatch(
      /accept-all[^.]*pause[^.]*return control[^.]*before resolving[^.]*material finding/iu,
    );
    expect(implement).toMatch(
      /accepted\s+accept-all\s+execution[^.]*every\s+material\s+forecast\s+variance[^.]*returns?\s+control[^.]*delivery\s+boundaries[^.]*authority/iu,
    );
    expect(implement).toMatch(
      /checkpointed[^.]*fresh approval[^.]*only[^.]*delivery boundaries[^.]*authority/iu,
    );
    expect(readme).toMatch(/accept-all[^.]*whole-plan approval[^.]*checkpointed/iu);
    expect(readme).toMatch(
      /test[\s\S]*required gate[\s\S]*risk-selected assurance[\s\S]*commit[\s\S]*authorized publication/iu,
    );
  });

  it("expands the /implement, /debug, /improve, and /just-do-it prompts", async () => {
    expect.hasAssertions();
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

    expect(piPromptTemplates.expandPromptTemplate("/implement", templates)).toContain(
      "Ask for an approved slice",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/implement tighten retry limit", templates),
    ).toContain("tighten retry limit");
    expect(piPromptTemplates.expandPromptTemplate("/debug", templates)).toContain(
      "diagnosing-bugs",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/debug export crashes after sign-in", templates),
    ).toContain("export crashes after sign-in");
    expect(piPromptTemplates.expandPromptTemplate("/improve", templates)).toContain(
      "Infer a bounded scope",
    );
    expect(piPromptTemplates.expandPromptTemplate("/improve checkout flow", templates)).toContain(
      "checkout flow",
    );
    expect(piPromptTemplates.expandPromptTemplate("/just-do-it", templates)).toContain(
      "Ask only for the mechanical request",
    );
    const justDoIt = piPromptTemplates.expandPromptTemplate(
      "/just-do-it remove Y from all files",
      templates,
    );
    expect(justDoIt).toContain("remove Y from all files");
    expect(justDoIt).toContain("`just-do-it` skill");
  });

  it("preserves accepted frontend evidence through material UI implementation", async () => {
    expect.hasAssertions();
    const [router, implement, readme] = await Promise.all([
      read("skills/developing-changes/SKILL.md"),
      read("skills/implement/SKILL.md"),
      read("README.md"),
    ]);

    expect(router).toMatch(
      /bounded material UI[\s\S]*accepted frontend evidence[\s\S]*`implement`/iu,
    );
    expect(router).toMatch(/mechanical UI[\s\S]*direct/iu);
    expect(router).toMatch(/`implement`[^.]*unavailable[\s\S]*direct-parent fallback/iu);
    expect(implement).toMatch(/material UI[\s\S]*accepted\s+design\s+evidence/iu);
    expect(implement).toMatch(/`frontend-development`/u);
    expect(implement).toMatch(/`react-interface`[^.]*only when[^.]*target uses[\s\S]*React/iu);
    expect(implement).toMatch(/`visual-validation`[\s\S]*(?:mismatch ledger|honest unmet-proof)/iu);
    expect(implement).toMatch(/does not take design approval ownership/iu);
    expect(implement).toMatch(/frontend methods[\s\S]*unavailable[\s\S]*direct-parent fallback/iu);
    expect(readme).toMatch(/material UI evidence[\s\S]*frontend methods[\s\S]*`implement`/iu);
    expect(readme).toMatch(/mechanical UI[^.]*direct/iu);

    for (const resource of [router, implement]) {
      expect(resource).not.toMatch(/pi-extensions|packages\//iu);
    }
  });

  it("preserves complete intent and right-sized engineering contracts", async () => {
    expect.hasAssertions();
    const [implement, review, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("skills/code-review/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(
      /target-project context[\s\S]*every\s+named pitch[\s\S]*plan[\s\S]*request[\s\S]*later user decision/iu,
    );
    expect(implement).toMatch(
      /business reason[\s\S]*infer[\s\S]*ask the human[\s\S]*implementation spec[\s\S]*Worker task/iu,
    );
    expect(implement).toMatch(
      /business impact[\s\S]*reversibility[\s\S]*focused[\s\S]*module\s+boundaries[\s\S]*existing logic[\s\S]*underengineering[\s\S]*important invariants[\s\S]*overengineering[\s\S]*verification depth[\s\S]*proportionate concrete need/iu,
    );
    expect(review).toMatch(
      /target-project context[\s\S]*every\s+named pitch[\s\S]*plan[\s\S]*request[\s\S]*later user decision/iu,
    );
    expect(review).toMatch(
      /supplied work[\s\S]*right-sized[\s\S]*business impact[\s\S]*operational burden[\s\S]*concrete underengineering example[\s\S]*concrete overengineering example/iu,
    );
    expect(review).toMatch(
      /exclude speculation[\s\S]*tooling-handled\s+style preferences[\s\S]*unrelated pre-existing issues[\s\S]*drive-by improvements[\s\S]*practical-impact severity[\s\S]*smallest sufficient correction[\s\S]*never inflate severity/iu,
    );
    expect(review).toMatch(
      /Every finding must include:[\s\S]*smallest sufficient correction[\s\S]*primary agent[\s\S]*do not choose or implement/iu,
    );
    expect(readme).toMatch(/asks\s+the human[\s\S]*implementation spec[\s\S]*Worker\s+handoff/iu);
  });
  it("routes evidence-based Go work through Engineering entry skills", async () => {
    expect.hasAssertions();
    const entries = await Promise.all(
      [
        "developing-changes",
        "just-do-it",
        "diagnosing-bugs",
        "test-driven-development",
        "implement",
        "codebase-design",
        "domain-modeling",
        "improve-codebase-architecture",
        "code-review",
      ].map((name) => read(`skills/${name}/SKILL.md`)),
    );
    const [implement, justDoIt, diagnosis, review] = [
      entries[4],
      entries[1],
      entries[2],
      entries[8],
    ];

    for (const entry of entries) {
      expect(entry).toMatch(/Go source[\s\S]*Go module[\s\S]*Go-specific work/iu);
      expect(entry).toMatch(/resolve[^.]*`go`[^.]*installed name/iu);
      expect(entry).toMatch(/Cobra[\s\S]*Viper[\s\S]*CLI/iu);
      expect(entry).toMatch(/unmet method[\s\S]*target-repository Go standards/iu);
      expect(entry).toMatch(/unrelated[^.]*toolchain[^.]*does not activate/iu);
    }
    expect(diagnosis?.slice(diagnosis.indexOf("\n## Pi debug additions\n"))).toMatch(/Go source/iu);
    expect(implement).toMatch(/Review mode: fixed-diff code/iu);
    expect(justDoIt).toMatch(/Review mode: fixed-diff code/iu);
    expect(review).toMatch(
      /target-repository instructions[\s\S]*module contracts[\s\S]*Go and Cobra\/Viper[\s\S]*references\/go\.md/iu,
    );
    expect(review).toMatch(/practical[\s\S]*consequence[\s\S]*do not duplicate[^.]*tool/iu);
  });

  it("selects assurance by risk and joins independent read-only lanes on one frozen diff", async () => {
    expect.hasAssertions();
    const [router, implement, justDoIt, reviewer] = await Promise.all([
      read("skills/developing-changes/SKILL.md"),
      read("skills/implement/SKILL.md"),
      read("skills/just-do-it/SKILL.md"),
      readFile(join(REPOSITORY_ROOT, "agents", "reviewer.md"), "utf8"),
    ]);
    expect(router).toMatch(/assurance[^.]*risk[\s\S]*deterministic[^.]*green path/iu);
    expect(implement).toMatch(/mechanical[\s\S]*low-risk[\s\S]*direct focused verification/iu);
    expect(implement).toMatch(
      /runs\.all[\s\S]*agent:\s*["']qa["'][\s\S]*agent:\s*["']reviewer["']/iu,
    );
    expect(implement).toMatch(/one prioritized repair packet[\s\S]*retained Worker/iu);
    expect(implement).toMatch(/green command[\s\S]{0,80}does not require[\s\S]{0,40}model QA/iu);
    expect(justDoIt).toMatch(/direct parent[^.]*default[\s\S]*Worker[^.]*only when/iu);
    expect(justDoIt).not.toMatch(/completed unit[\s\S]*reviewer[\s\S]*must/iu);
    expect(reviewer).toMatch(/do not run QA gates/iu);
  });
});
