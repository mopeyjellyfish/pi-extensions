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

  it("rejects tautological tests during TDD and code review", async () => {
    expect.hasAssertions();
    const [tdd, review] = await Promise.all([
      read("skills/test-driven-development/SKILL.md"),
      read("skills/code-review/SKILL.md"),
    ]);

    for (const resource of [tdd, review]) {
      expect(resource).toContain("Tautological tests are harmful.");
    }
    expect(tdd).toMatch(
      /independent\s+expected\s+value[\s\S]*plausible\s+wrong\s+implementation/iu,
    );
    expect(tdd).toMatch(
      /derives[\s\S]*expected\s+value[\s\S]*calling[\s\S]*implementation\s+under\s+test[\s\S]*same\s+algorithm[\s\S]*production\s+helper[\s\S]*rewrite\s+or\s+remove/iu,
    );
    expect(review).toMatch(/expected\s+value[\s\S]*implementation\s+under\s+test/iu);
    expect(review).toMatch(/same\s+algorithm[\s\S]*production\s+helper[\s\S]*not\s+evidence/iu);
    expect(review).toMatch(/plausible\s+wrong\s+implementation/iu);
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
    expect(justDoIt.replaceAll(/\s+/gu, " ")).toContain(
      "Do not run independent QA, a Reviewer, or formal review for this route.",
    );
    expect(justDoIt).toMatch(/return to `developing-changes`[\s\S]*security or migration/iu);
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
        "skills/improve-codebase-architecture/HTML-REPORT.md",
        "skills/improve-codebase-architecture/scripts/report-server.js",
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
    const [skill, deepening, designItTwice, notice, readme] = await Promise.all([
      read("skills/codebase-design/SKILL.md"),
      read("skills/codebase-design/DEEPENING.md"),
      read("skills/codebase-design/DESIGN-IT-TWICE.md"),
      read("THIRD_PARTY_NOTICES.md"),
      read("README.md"),
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
    expect(skill).toMatch(
      /## Go routing[\s\S]*target-repository standards remain first[\s\S]*`go` by its installed name[\s\S]*applicable `cobra-viper`[\s\S]*evidence[\s\S]*depth[\s\S]*locality[\s\S]*leverage/iu,
    );
    expect(skill).toMatch(
      /## Go routing[\s\S]*Go terms[\s\S]*module[\s\S]*package[\s\S]*API[\s\S]*interface type/iu,
    );
    const testability = skill.slice(
      skill.indexOf("## Designing for testability"),
      skill.indexOf("## Relationships"),
    );
    const hardToTestExample = testability.indexOf("// Hard to test");
    const compositionRoot = testability.indexOf(
      "A composition root may construct concrete dependencies;",
    );
    const returnResults = testability.indexOf("2. **Return results, don't produce side effects.**");
    const compositionRootQualifier = testability.slice(compositionRoot, returnResults);
    expect(hardToTestExample).toBeGreaterThanOrEqual(0);
    expect(compositionRoot).toBeGreaterThan(hardToTestExample);
    expect(returnResults).toBeGreaterThan(compositionRoot);
    expect(compositionRootQualifier).toContain(
      "this does not require\n   a seam or injected interface.",
    );
    expect(skill).toMatch(
      /small[\s\S]*consumer-defined[\s\S]*real\s+interchangeable\s+behavior[\s\S]*do not create[\s\S]*layer-named `ports` or `adapters` packages/iu,
    );
    const goRouting = skill.slice(skill.indexOf("## Go routing"));
    expect(goRouting).toMatch(/Do not create\s+layer-named `ports` or `adapters` packages\./u);
    expect(goRouting).not.toMatch(
      /layer-named `ports` or `adapters` packages\s+(?:unless|if|when)\b/iu,
    );
    expect(goRouting).toMatch(
      /justified interface[\s\S]*consuming package[\s\S]*location selected by applicable Go guidance/iu,
    );
    expect(skill).toMatch(/## Glossary[\s\S]*For Go work[\s\S]*Go routing/iu);
    expect(deepening).toMatch(
      /Dependency categories[\s\S]*For Go work[\s\S]*Go routing[\s\S]*1\. In-process/iu,
    );
    expect(deepening).toMatch(
      /in-process execution[\s\S]*does not prove[\s\S]*responsibilities belong together/iu,
    );
    expect(deepening).toMatch(/delete old tests only when redundant/iu);
    expect(designItTwice).toMatch(
      /Before presenting Go alternatives[\s\S]*discard[\s\S]*generic repositories[\s\S]*services[\s\S]*layer-named packages[\s\S]*up-front interfaces/iu,
    );
    expect(readme).toMatch(
      /`codebase-design`[\s\S]*target-repository standards[\s\S]*first[\s\S]*installed `go`/iu,
    );
  });

  it("ships a safe, evidence-backed architecture discovery route", async () => {
    expect.hasAssertions();
    const [skill, prompt, notice, readme, guide] = await Promise.all([
      read("skills/improve-codebase-architecture/SKILL.md"),
      read("prompts/improve.md"),
      read("THIRD_PARTY_NOTICES.md"),
      read("README.md"),
      read("skills/improve-codebase-architecture/HTML-REPORT.md"),
    ]);

    expect(skill).toMatch(
      /optional scope[\s\S]*module[\s\S]*subsystem[\s\S]*pain point[\s\S]*change-history area/iu,
    );
    expect(skill).toMatch(/nearest domain context[\s\S]*architecture decisions/iu);
    expect(skill).toMatch(/hot spots[\s\S]*callers[\s\S]*tests[\s\S]*change history/iu);
    expect(skill).toMatch(/`codebase-design`/u);
    expect(skill).toContain("[HTML-REPORT.md](HTML-REPORT.md)");
    expect(skill).toMatch(/OS temp directory[\s\S]*report-server\.js[\s\S]*loopback URL/iu);
    expect(skill).toMatch(
      /rank[\s\S]*current friction[\s\S]*involved files[\s\S]*proposed deeper module[\s\S]*locality[\s\S]*leverage[\s\S]*test effect[\s\S]*decision conflicts[\s\S]*strength/iu,
    );
    expect(skill).toMatch(/before[\s\S]*after[\s\S]*visual/iu);
    expect(skill).toMatch(/`question` tool call[\s\S]*tool is unavailable[\s\S]*conversation/iu);
    expect(skill).toMatch(/Shape[\s\S]*planning[\s\S]*direct parent/iu);
    expect(skill).toMatch(/discovery and report generation[\s\S]*read-only/iu);
    expect(prompt).toMatch(/`improve-codebase-architecture` skill/iu);
    expect(prompt).toMatch(/\$\{ARGUMENTS:-/u);
    expect(prompt).toMatch(/argument-hint:\s*"\[low\|medium\|high\|max\] \[optional scope\]"/u);
    expect(readme).toMatch(/`\/improve/iu);
    expect(notice).toMatch(
      /skills\/improve-codebase-architecture\/SKILL\.md[\s\S]*adapted[\s\S]*068b6e0c62393147daf03530149cdce209c93da8/iu,
    );
    expect(notice).toMatch(/HTML-REPORT\.md[\s\S]*321658273cb1d20b76026717d027d505790106d4/iu);

    expect(guide).toMatch(/<!doctype html>[\s\S]*<main[\s\S]*report-data/iu);
    expect(guide).toContain("https://cdn.tailwindcss.com/3.4.17");
    expect(guide).toContain("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs");
    expect(guide).toMatch(/securityLevel:\s*["']strict["']/u);
    expect(guide).toMatch(/<pre[^>]*class=["'][^"']*mermaid/iu);
    expect(guide).toMatch(/Mermaid only[\s\S]*graph-shaped[\s\S]*inline SVG/iu);
    expect(guide).toMatch(
      /Problem[\s\S]*Proposed change[\s\S]*Expected wins[\s\S]*Delivery notes/iu,
    );
    expect(guide).toMatch(/prefers-color-scheme/iu);
    expect(guide).toMatch(/localStorage[\s\S]*Toggle color theme/iu);
    expect(guide).toContain("prefers-reduced-motion");
    expect(guide).toMatch(/@media print[\s\S]*semantic fallback/iu);
    expect(guide).toMatch(/no supported findings/iu);
    expect(guide).toMatch(/stale or\s+expired report/iu);
    expect(guide).toMatch(
      /Declared coverage[\s\S]*Depth[\s\S]*Files[\s\S]*Modules[\s\S]*Tests[\s\S]*History[\s\S]*Found[\s\S]*Excluded/iu,
    );
    expect(guide).toMatch(/data-candidate-id[\s\S]*indexEntry\.hidden/iu);
    expect(guide).toMatch(/controls\[name\]\?\.value[\s\S]*control\?\.addEventListener/iu);
    expect(guide).toMatch(/@media print[\s\S]*data-theme="dark"[\s\S]*--muted:\s*#555555/iu);
  });

  it("defines appetite-aware live architecture discovery and triage", async () => {
    expect.hasAssertions();
    const [skill, readme, guide] = await Promise.all([
      read("skills/improve-codebase-architecture/SKILL.md"),
      read("README.md"),
      read("skills/improve-codebase-architecture/HTML-REPORT.md"),
    ]);

    expect(skill).toContain("improvement depth");
    expect(skill).toMatch(
      /accepted improvement depths are\s+`low`,\s+`medium`,\s+`high`,\s+and\s+`max`/u,
    );
    expect(skill).toMatch(/Offer `low`, `medium`, `high`, and `max`[\s\S]*recommend `medium`/u);
    expect(skill).toMatch(
      /If `question` is unavailable, use `medium` only for an unanswered\s+Improvement\s+depth/iu,
    );
    expect(skill).toMatch(
      /leading level token[^.]*without regard to letter case[\s\S]*normalize[^.]*lowercase/iu,
    );
    expect(skill).toMatch(/level-only[^.]*adaptive quick start/iu);
    expect(skill).toMatch(
      /scope that starts with a\s+reserved\s+token, give an explicit level[\s\S]*`medium low latency\s+path`/iu,
    );
    expect(skill).toMatch(
      /optional scope can name a\s+module, package, subsystem, vertical feature\s+slice, architecture pattern, test surface, pain point, or change-history area/iu,
    );
    expect(skill).toMatch(
      /`low`[\s\S]*three independent, reversible quick wins[\s\S]*public-contract changes[\s\S]*migrations[\s\S]*cross-package redesign/iu,
    );
    expect(skill).toMatch(
      /`medium`[\s\S]*direct dependencies[\s\S]*callers[\s\S]*tests[\s\S]*history/iu,
    );
    expect(skill).toMatch(/`high`[\s\S]*adjacent modules[\s\S]*alternatives[\s\S]*coordination/iu);
    expect(skill).toMatch(
      /`max`[\s\S]*coverage[\s\S]*exclusions[\s\S]*cross-package[\s\S]*migration/iu,
    );
    expect(skill).toMatch(/do not[\s\S]*force[^.]*finding[\s\S]*no supported improvement/iu);
    expect(skill).toMatch(/improvement depth[\s\S]*not[\s\S]*`codebase-design`[\s\S]*Depth/iu);

    expect(skill).toMatch(
      /one initial\s+`question` tool call[\s\S]*Improvement depth[\s\S]*Where should this review focus[\s\S]*What should this review prepare for/iu,
    );
    expect(skill).toMatch(
      /separate\s+single-select questions only for the unanswered dimensions/iu,
    );
    expect(skill).toMatch(
      /specific scope[^.]*lacks Improvement\s+depth or Outcome[^.]*no orientation/iu,
    );
    expect(skill).toMatch(/skips or cancels[\s\S]*stop before\s+discovery/iu);
    expect(skill).toMatch(
      /Find improvements[\s\S]*level-appropriate[\s\S]*evidence-backed[\s\S]*focus/iu,
    );
    expect(skill).toMatch(
      /user-supplied[\s\S]*specific area[\s\S]*authoritative[^.]*do not ask Focus or broaden it/iu,
    );
    expect(skill).toMatch(/Work now[\s\S]*Prepare issues[\s\S]*Both[\s\S]*Report only/iu);
    expect(skill).toMatch(
      /explicit test[^.]*ordinary scope[\s\S]*dedicated[\s\S]*test-analysis subagent[\s\S]*`low`[\s\S]*direct\s+parent remains the default[\s\S]*evidence only[\s\S]*parent[\s\S]*recommendation[\s\S]*subagent[\s\S]*unavailable[\s\S]*direct-parent fallback/iu,
    );
    expect(skill).toMatch(
      /Test-analysis lanes and external\s+lookups share one support-action budget[\s\S]*`low`[\s\S]*one[\s\S]*`medium`[\s\S]*two[\s\S]*`high`[\s\S]*four[\s\S]*`max`[\s\S]*bounded waves/iu,
    );
    expect(skill).toMatch(/`low`[\s\S]*direct\s+parent by default[\s\S]*specific evidence gap/iu);
    expect(skill).toMatch(
      /parent remains the orchestrator[\s\S]*ordinary support[\s\S]*evidence only[\s\S]*do not orchestrate/iu,
    );
    expect(skill).toMatch(
      /target-repository standards[\s\S]*installed `go`[\s\S]*`cobra-viper`[^.]*commands, flags, or CLI configuration[\s\S]*`test-driven-development`[\s\S]*generic guidance/iu,
    );
    expect(skill).toMatch(
      /all test work[\s\S]*resolve `test-driven-development`[\s\S]*test-effectiveness method/iu,
    );
    expect(skill).toMatch(/public seams[\s\S]*falsifiability[\s\S]*plausible wrong behavior/iu);
    expect(skill).toMatch(/independent\s+expected values/iu);
    expect(skill).toMatch(/Coverage and test count are signals, not proof/iu);
    expect(skill).toMatch(
      /holistic suite[\s\S]*commands[\s\S]*shards[\s\S]*setup[\s\S]*cache[\s\S]*retries[\s\S]*hot cases[\s\S]*measured/iu,
    );
    expect(skill).toMatch(
      /branch and base refs[\s\S]*compatible CI runs[\s\S]*workflow[\s\S]*matrix[\s\S]*runner/iu,
    );
    expect(skill).toMatch(/exact refs and SHAs[\s\S]*sample size[\s\S]*confounders/iu);
    expect(skill).toMatch(
      /GitHub[\s\S]*`gh run list`[\s\S]*`gh run view`[\s\S]*`gh run download`[\s\S]*REST `GET`[\s\S]*non-served[\s\S]*remove downloaded artifacts/iu,
    );
    expect(skill).toMatch(/Never dispatch, rerun, cancel, approve, or edit[\s\S]*workflow/iu);
    expect(skill).toMatch(/bounded, non-destructive, and\s+repository-documented/iu);
    expect(skill).toMatch(
      /Record command, cache state, runtime,\s+instrumentation[\s\S]*shuffle[\s\S]*race or coverage mode[\s\S]*parallelism/iu,
    );
    expect(skill).toMatch(
      /Ask before an unclear[\s\S]*external effect[\s\S]*do not automatically run[\s\S]*integration or end-to-end tests[\s\S]*mutate external systems/iu,
    );
    expect(skill).toMatch(
      /For Go tests[\s\S]*structured JSON events[\s\S]*benchmarks[\s\S]*profiles[\s\S]*fuzzing[\s\S]*race detection[\s\S]*`testing\/synctest`[\s\S]*official Go release notes[\s\S]*gap/iu,
    );
    expect(skill).toMatch(
      /target-repository[\s\S]*official[\s\S]*canonical maintainer[\s\S]*Go team[\s\S]*spf13[\s\S]*secondary[\s\S]*evidence\s+gap/iu,
    );
    expect(skill).toMatch(/faster but weaker suite as an improvement/iu);
    expect(guide).toMatch(
      /effectiveness risk[\s\S]*suite timing boundary[\s\S]*hot cases[\s\S]*branch.base comparison[\s\S]*failure.isolation[\s\S]*evidence gaps[\s\S]*report-data/iu,
    );
    expect(guide).toMatch(
      /Omit both the \*\*Test evidence\*\* section and the `testEvidence`[\s\S]*where test evidence does not apply/iu,
    );
    expect(skill).toMatch(
      /Work now[^.]*up to three[\s\S]*Prepare issues[^.]*all supported[\s\S]*Report only[^.]*stops/iu,
    );
    expect(skill).toMatch(
      /AskClaude[^.]*at most once[\s\S]*Deepen[^.]*does not call AskClaude again/iu,
    );
    expect(skill).toMatch(/two-hour default[\s\S]*`100`[\s\S]*`7200000`/iu);

    expect(skill).toMatch(
      /selected improvement depth[\s\S]*scanned scope[\s\S]*coverage[\s\S]*exclusions[\s\S]*evidence strength[\s\S]*impact[\s\S]*reversibility[\s\S]*overlap[\s\S]*integration points[\s\S]*route[\s\S]*reason/iu,
    );
    expect(skill).toMatch(/stable\s+candidate\s+IDs[\s\S]*atomic[\s\S]*rename/iu);
    expect(skill).toMatch(
      /OS cleanup removed the artifact[\s\S]*new unique temp[\s\S]*new path and URL[\s\S]*old URL/iu,
    );
    expect(skill).toMatch(/Action[\s\S]*Track[\s\S]*Won't do[\s\S]*Deepen/iu);
    expect(skill).toMatch(/Action[\s\S]*`implement`[\s\S]*`planning-changes`[\s\S]*Shape/iu);
    expect(skill).toMatch(/Herdr-or-equivalent[\s\S]*current-session[\s\S]*isolated worktree/iu);
    expect(skill).toMatch(
      /Track[^.]*queues[\s\S]*exact bounded draft set[\s\S]*batch confirmation/iu,
    );
    expect(skill).toMatch(/changed\s+draft or target[\s\S]*new confirmation/iu);
    expect(skill).toMatch(/browser controls[\s\S]*never[\s\S]*implementation[\s\S]*issue/iu);

    expect(skill).toMatch(
      /same behavior[\s\S]*shared setup[\s\S]*assertions[\s\S]*target language/iu,
    );
    expect(skill).toMatch(
      /target-repository[\s\S]*standards[\s\S]*installed `go`[\s\S]*before generic[\s\S]*each capable lane[\s\S]*evidence only[\s\S]*unmet method[\s\S]*omit/iu,
    );
    expect(skill).toMatch(/Cobra[\s\S]*Viper[\s\S]*commands, flags, or CLI[\s\S]*configuration/iu);
    expect(skill).toMatch(
      /unrelated toolchain evidence[\s\S]*does not activate[\s\S]*bare `go\.mod`/iu,
    );

    expect(readme).toMatch(
      /Improvement\s+depth, Focus, or Outcome[\s\S]*one initial `question` call/iu,
    );
    expect(readme).toMatch(
      /Find\s+improvements[\s\S]*level-appropriate[\s\S]*user-\s*supplied\s+focus[\s\S]*authoritative/iu,
    );
    expect(readme).toMatch(/Mermaid[\s\S]*graph-shaped[\s\S]*HTML,\s+CSS, and inline SVG/iu);
    expect(readme).toMatch(
      /Action[\s\S]*Track[\s\S]*batch confirmation[\s\S]*Herdr-or-equivalent/iu,
    );
    expect(readme).toMatch(
      /High and max[\s\S]*AskClaude second opinion[\s\S]*Deepen does not call it\s+again[\s\S]*honest fallbacks/iu,
    );
    expect(readme).toMatch(
      /target-repository standards[\s\S]*installed `go`[\s\S]*table-driven subtests/iu,
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

  it("routes small fixes through immediate commit and push without review", async () => {
    expect.hasAssertions();
    const [router, implement, justDoIt, readme, rootReadme] = await Promise.all([
      read("skills/developing-changes/SKILL.md"),
      read("skills/implement/SKILL.md"),
      read("skills/just-do-it/SKILL.md"),
      read("README.md"),
      readFile(join(REPOSITORY_ROOT, "README.md"), "utf8"),
    ]);
    const compactRouter = router.replaceAll(/\s+/gu, " ");
    const compactJustDoIt = justDoIt.replaceAll(/\s+/gu, " ");

    expect(router).toMatch(
      /just[- ]do[- ]it[\s\S]*implement now[\s\S]*plan first[\s\S]*Shape then plan/iu,
    );
    expect(router).toMatch(
      /uncertainty[\s\S]*reversib(?:ility|le)[\s\S]*risk[\s\S]*affected boundar(?:y|ies)[\s\S]*coordination/iu,
    );
    expect(router).toMatch(/not[\s\S]*file count alone/iu);
    expect(router).toMatch(/one focused question[\s\S]*material boundary/iu);
    expect(compactRouter).toContain(
      "Use `just-do-it` for a small, bounded fix during active work when the requested outcome and objective check are clear.",
    );
    expect(router).toMatch(
      /`shape`[\s\S]*`planning-changes`[\s\S]*unavailable[\s\S]*direct parent[\s\S]*pitch[\s\S]*slice plan/iu,
    );
    expect(justDoIt).toMatch(/worktree setup[\s\S]*first/iu);
    expect(compactJustDoIt).toContain(
      "Reuse the current task worktree and branch when they are safe for this request. Otherwise, create or activate an isolated task worktree.",
    );
    expect(justDoIt).toMatch(/direct parent[^.]*default/iu);
    expect(justDoIt).toMatch(/exactly one fresh `worker`[^.]*only when/iu);
    expect(compactJustDoIt).toContain(
      "Accept a bounded fix, small breakage, cleanup, or obvious follow-up with a clear objective check.",
    );
    expect(compactJustDoIt).toContain(
      "Do not run independent QA, a Reviewer, or formal review for this route.",
    );
    expect(compactJustDoIt).toContain(
      "After verification, commit the change and push the current named branch.",
    );
    expect(compactJustDoIt).toContain(
      "Do not open or update a pull request unless the user asks for it.",
    );
    expect(justDoIt).toMatch(
      /does not authorize[\s\S]*merge[\s\S]*deploy[\s\S]*plain[\s\S]*force[\s\S]*cleanup/iu,
    );
    expect(implement).toMatch(
      /complete accepted plan[\s\S]*dependency order[\s\S]*without replanning/iu,
    );
    expect(implement).toMatch(/planned parallel lanes[\s\S]*worktrees/iu);
    expect(implement).toMatch(
      /risk\s+determines[^.]*formal review[\s\S]*stable completed delivery unit/iu,
    );
    expect(implement).toMatch(
      /publication starts only after[\s\S]*`commit`[\s\S]*then[\s\S]*`open-pr`/iu,
    );
    expect(implement).toMatch(/planned stack[\s\S]*`gh stack`[\s\S]*fail closed/iu);
    expect(implement.replaceAll(/\s+/gu, " ")).toContain(
      "Start planned independent ready delivery units in parallel only when they have isolated worktrees, sole writers, non-overlapping ownership, and complete dependencies.",
    );
    expect(implement.replaceAll(/\s+/gu, " ")).toContain(
      "For a planned ready parallel lane set, start one fixed-role Worker per independent delivery unit concurrently.",
    );
    expect(implement.replaceAll(/\s+/gu, " ")).toContain(
      "Publish independent delivery units as sibling standalone pull requests from their accepted common base.",
    );
    expect(implement.replaceAll(/\s+/gu, " ")).toContain(
      "Publish each sequential dependency chain in dependency and stack order through `open-pr` and `gh stack`.",
    );
    expect(implement.replaceAll(/\s+/gu, " ")).toContain(
      "For a mixed plan, preserve every independent lane and dependent chain from the accepted topology.",
    );
    expect(readme.replaceAll(/\s+/gu, " ")).toContain(
      "Independent delivery units can run in parallel and publish as sibling standalone pull requests; sequential dependency chains publish as ordered GitHub stacks.",
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
      /checkpointed implementation[^.]*no final publication prompt[\s\S]*committed and published[\s\S]*next planned\s+unit[\s\S]*Continue[\s\S]*Review next unit[\s\S]*Discuss[\s\S]*same checkpoint[\s\S]*plan completion/iu,
    );
  });

  it("automatically publishes a verified bounded implementation unit", async () => {
    expect.hasAssertions();
    const [implementText, prompt, readme, rootReadme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("prompts/implement.md"),
      read("README.md"),
      readFile(join(REPOSITORY_ROOT, "README.md"), "utf8"),
    ]);
    const implement = implementText.replaceAll(/\s+/gu, " ");

    expect(implement).toMatch(
      /direct bounded implementation request[\s\S]*accepted plan[\s\S]*named task branch[\s\S]*delivery unit[\s\S]*commit[\s\S]*normal push[\s\S]*creates or updates the ready pull request/iu,
    );
    expect(implement).toMatch(
      /tests[\s\S]*required gates[\s\S]*selected review[\s\S]*accepted repairs[\s\S]*invalidated evidence[\s\S]*`commit`[\s\S]*then[\s\S]*`open-pr`/iu,
    );
    expect(implement).toMatch(
      /checkpointed and accept-all[\s\S]*commit[\s\S]*then[\s\S]*open-pr[\s\S]*without[^.]*final publication question/iu,
    );
    expect(implement).toMatch(
      /complete work evidence[\s\S]*not a publication approval prompt[\s\S]*continue directly to Publication[\s\S]*without requesting user acceptance/iu,
    );
    expect(implement).toMatch(
      /checkpointed[\s\S]*only[\s\S]*next[- ]delivery[- ]unit checkpoint/iu,
    );
    expect(implement).toMatch(
      /local-only[\s\S]*no push[\s\S]*no PR[\s\S]*local commit[\s\S]*prevents[\s\S]*every remote mutation/iu,
    );
    expect(implement).toMatch(/no commit[\s\S]*prevents[\s\S]*dependent publication action/iu);
    expect(implement).toMatch(
      /Apply each recorded opt-out[\s\S]*no commit[\s\S]*skip `commit` and `open-pr`[\s\S]*local-only[\s\S]*no push[\s\S]*no PR[\s\S]*skip `open-pr`[\s\S]*no remote mutation/iu,
    );
    expect(implement).toMatch(
      /publication failure[\s\S]*preserve[\s\S]*local evidence[\s\S]*stop[\s\S]*diagnosis/iu,
    );
    expect(implement).toMatch(
      /never authorizes merge[\s\S]*release[\s\S]*deployment[\s\S]*cleanup[\s\S]*branch deletion[\s\S]*plain force push[\s\S]*unrelated changes/iu,
    );
    expect(implement).toMatch(
      /installed `commit` and `open-pr`[\s\S]*unavailable[\s\S]*preserve[\s\S]*local evidence/iu,
    );
    expect(implement).not.toMatch(/Accept and publish/iu);
    expect(implement).not.toMatch(/git commit|git push|gh pr create/iu);
    expect(prompt).toMatch(
      /implements[\s\S]*verifies[\s\S]*reviews when selected[\s\S]*commits[\s\S]*pushes[\s\S]*opens or updates a ready pull request by default/iu,
    );
    for (const documentation of [readme, rootReadme]) {
      expect(documentation).toMatch(/by default/iu);
      expect(documentation).toMatch(
        /commit[\s\S]*push[\s\S]*open\w*\s+or\s+update[\s\S]*ready\s+pull request/iu,
      );
      for (const optOut of ["local-only", "no commit", "no push", "no PR"]) {
        expect(documentation).toContain(optOut);
      }
      expect(documentation).not.toMatch(/Accept and publish/iu);
    }
  });

  it("uses accepted accept-all authority without removing verification or safety pauses", async () => {
    expect.hasAssertions();
    const [implement, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(
      /whole-plan approval[^.]*accept-all\s+authority[^.]*named accepted plan/iu,
    );
    expect(implement).toMatch(/checkpointed[^.]*only[^.]*next delivery unit/iu);
    expect(implement).toMatch(
      /accept-all[^.]*every named delivery unit[\s\S]*tests[\s\S]*required gates[\s\S]*risk-selected assurance[\s\S]*commit[\s\S]*authorized publication/iu,
    );
    expect(implement).toMatch(/accept-all[^.]*without[^.]*routine questions/iu);
    expect(implement).toMatch(
      /pause[^.]*setup[^.]*test[^.]*check[^.]*commit[^.]*publication failure[^.]*material review findings[^.]*material forecast variance[^.]*scope[^.]*delivery boundaries[^.]*dependencies[^.]*authority/iu,
    );
    expect(implement).toMatch(
      /accept-all[^.]*never authorizes merge[^.]*release[^.]*deployment[^.]*destructive\s+cleanup[^.]*unrelated\s+changes/iu,
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
      /Publication follows tests[\s\S]*required gates[\s\S]*risk-selected assurance[\s\S]*accepted repairs[\s\S]*invalidated evidence/iu,
    );
  });

  it("expands the /implement, /next-issue, /debug, /improve, and /just-do-it prompts", async () => {
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
    const expandedImplement = piPromptTemplates.expandPromptTemplate(
      "/implement tighten retry limit",
      templates,
    );
    expect(expandedImplement).toContain("tighten retry limit");
    expect(expandedImplement).toMatch(
      /implements[\s\S]*verifies[\s\S]*reviews when selected[\s\S]*commits[\s\S]*pushes[\s\S]*opens or updates a ready pull request/iu,
    );
    const nextIssueDefault = piPromptTemplates.expandPromptTemplate("/next-issue", templates);
    expect(nextIssueDefault).toContain("current repository queue");
    expect(nextIssueDefault).toMatch(/`ticket-workflow`[\s\S]*status route/iu);
    expect(
      piPromptTemplates.expandPromptTemplate("/next-issue project 12 area runtime", templates),
    ).toContain("project 12 area runtime");
    expect(piPromptTemplates.expandPromptTemplate("/debug", templates)).toContain(
      "diagnosing-bugs",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/debug export crashes after sign-in", templates),
    ).toContain("export crashes after sign-in");
    const improveDefault = piPromptTemplates.expandPromptTemplate("/improve", templates);
    expect(improveDefault).toMatch(
      /adaptive intake[\s\S]*Improvement depth[\s\S]*Focus[\s\S]*Outcome/iu,
    );
    expect(improveDefault).not.toContain("Use medium improvement depth");
    expect(piPromptTemplates.expandPromptTemplate("/improve checkout flow", templates)).toContain(
      "checkout flow",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/improve HIGH checkout flow", templates),
    ).toContain("HIGH checkout flow");
    const improveHigh = piPromptTemplates.expandPromptTemplate("/improve high", templates);
    expect(improveHigh).toContain("improvement request:\nhigh");
    expect(improveHigh).not.toContain("Use medium improvement depth");
    expect(
      piPromptTemplates.expandPromptTemplate("/improve medium low latency path", templates),
    ).toContain("medium low latency path");
    expect(piPromptTemplates.expandPromptTemplate("/just-do-it", templates)).toContain(
      "Ask only for the bounded request",
    );
    const justDoIt = piPromptTemplates.expandPromptTemplate(
      "/just-do-it fix the broken retry assertion",
      templates,
    );
    expect(justDoIt).toContain("fix the broken retry assertion");
    expect(justDoIt).toContain("`just-do-it` skill");
    expect(justDoIt.replaceAll(/\s+/gu, " ")).toContain(
      "Execute it immediately, verify it, commit it, and push the current branch.",
    );
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
    expect(implement).toMatch(/`react-best-practices`[^.]*only when[^.]*target uses[\s\S]*React/iu);
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
    const [implement, diagnosis, review] = [entries[4], entries[2], entries[8]];

    for (const entry of entries) {
      expect(entry).toMatch(/Go source[\s\S]*Go module[\s\S]*Go-specific work/iu);
      expect(entry).toMatch(/resolve[^.]*`go`[^.]*installed name/iu);
      expect(entry).toMatch(/Cobra[\s\S]*Viper[\s\S]*CLI/iu);
      expect(entry).toMatch(/unmet method[\s\S]*target-repository Go standards/iu);
      expect(entry).toMatch(/unrelated[^.]*toolchain[^.]*does not activate/iu);
    }
    expect(diagnosis?.slice(diagnosis.indexOf("\n## Pi debug additions\n"))).toMatch(/Go source/iu);
    expect(implement).toMatch(/Review mode: fixed-diff code/iu);
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
    expect(justDoIt.replaceAll(/\s+/gu, " ")).toContain(
      "Do not run independent QA, a Reviewer, or formal review for this route.",
    );
    expect(reviewer).toMatch(/do not run QA gates/iu);
  });

  it("ships provider-neutral ticket intake and next-ticket routing", async () => {
    expect.hasAssertions();
    const [implement, workflow, implementPrompt, nextIssuePrompt, readme, rootReadme] =
      await Promise.all([
        read("skills/implement/SKILL.md"),
        read("skills/ticket-workflow/SKILL.md"),
        read("prompts/implement.md"),
        read("prompts/next-issue.md"),
        read("README.md"),
        readFile(join(REPOSITORY_ROOT, "README.md"), "utf8"),
      ]);
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const paths = packed[0]?.files.map(({ path }) => path) ?? [];

    expect(paths).toEqual(
      expect.arrayContaining(["skills/ticket-workflow/SKILL.md", "prompts/next-issue.md"]),
    );
    expect(implementPrompt).toMatch(/ticket URL or key[\s\S]*`ticket-workflow`/iu);
    expect(nextIssuePrompt).toMatch(
      /`ticket-workflow`[\s\S]*\[optional tracker, project,\s*repository, or area scope\]/iu,
    );
    expect(implement).toMatch(/ticket URL or key[\s\S]*untrusted[\s\S]*durable Intent/iu);
    expect(implement).toMatch(
      /ticket-backed[\s\S]*`ticket-workflow`[\s\S]*normal bounded implementation/iu,
    );
    expect(workflow).toMatch(
      /provider-neutral[\s\S]*capability[\s\S]*authenticate[\s\S]*one[\s\S]*target/iu,
    );
    expect(workflow).toMatch(/missing[\s\S]*capability|capability[\s\S]*unavailable/iu);
    expect(workflow).toMatch(/do not\s+silently\s+switch trackers/iu);
    expect(workflow).toMatch(/untrusted[\s\S]*never[\s\S]*instructions/iu);
    expect(workflow).toMatch(
      /explicit project or repository[\s\S]*repository-configured project[\s\S]*current repository(?:'s)? issue/iu,
    );
    expect(workflow).toMatch(/read[\s\S]*policy once per run[\s\S]*durable handoff/iu);
    expect(workflow).toMatch(
      /exclude[\s\S]*blocked[\s\S]*in-progress[\s\S]*unclassified[\s\S]*draft[\s\S]*pull-request/iu,
    );
    expect(workflow).toMatch(
      /needs-shape[\s\S]*needs-plan[\s\S]*ready[\s\S]*priority[\s\S]*oldest[\s\S]*stable ticket ID/iu,
    );
    expect(workflow).toMatch(
      /needs-shape[\s\S]*Shape[\s\S]*needs-plan[\s\S]*`planning-changes`[\s\S]*ready[\s\S]*`implement`/iu,
    );
    expect(workflow).toMatch(/status:blocked[\s\S]*stop[\s\S]*named prerequisite/iu);
    expect(workflow).toMatch(/required route[\s\S]*unavailable[\s\S]*direct\s+parent/iu);
    expect(workflow).toMatch(
      /worktree[\s\S]*before[\s\S]*in-progress[\s\S]*substantive route work/iu,
    );
    expect(workflow).toMatch(
      /prior route status[\s\S]*durable handoff[\s\S]*re-read[\s\S]*verify/iu,
    );
    expect(workflow).toMatch(/not[\s\S]*atomic/iu);
    expect(workflow).toMatch(
      /resume[\s\S]*explicit request[\s\S]*branch[\s\S]*pull request[\s\S]*run evidence/iu,
    );
    expect(workflow).toMatch(
      /keep[^.]*in progress[\s\S]*Shape[\s\S]*planning[\s\S]*implementation[\s\S]*review[\s\S]*do not[^.]*done[^.]*close[^.]*pull request/iu,
    );
    expect(workflow).toMatch(/private[\s\S]*public[\s\S]*fail closed[\s\S]*partial mutation/iu);
    for (const resource of [workflow, implement, implementPrompt, nextIssuePrompt]) {
      expect(resource).not.toMatch(/pi-extensions|packages\/|\/(?:Users|home|tmp)\//iu);
    }
    for (const guide of [readme, rootReadme]) {
      expect(guide).toMatch(/`\/implement[\s\S]*ticket/iu);
      expect(guide).toMatch(/\/next-issue[\s\S]*in-progress/iu);
    }
  });

  it("classifies /improve issue drafts from one repository-first policy", async () => {
    expect.hasAssertions();
    const [improve, workflow, readme, rootReadme] = await Promise.all([
      read("skills/improve-codebase-architecture/SKILL.md"),
      read("skills/ticket-workflow/SKILL.md"),
      read("README.md"),
      readFile(join(REPOSITORY_ROOT, "README.md"), "utf8"),
    ]);

    expect(improve).toMatch(/Track[\s\S]*`ticket-workflow`[\s\S]*exact[ -]set/iu);
    expect(improve).toMatch(
      /Track[\s\S]*priority[\s\S]*route status[\s\S]*privacy state[\s\S]*create nothing\s+yet/iu,
    );
    expect(improve).not.toMatch(/gh project|gh issue|GitHub Projects/iu);
    expect(workflow).toMatch(
      /CONTRIBUTING\.md[\s\S]*repository instructions[\s\S]*native\s+fields[\s\S]*existing\s+(?:repository\s+)?labels[\s\S]*fallback/iu,
    );
    expect(workflow).toMatch(
      /once per resolved tracker, project, and repository per run[\s\S]*reuse[\s\S]*candidate drafts[\s\S]*handoffs/iu,
    );
    expect(workflow).toMatch(/one priority and exactly one route status/iu);
    expect(workflow).toMatch(/one\s+repository-defined area/iu);
    expect(workflow).toMatch(/bounded implementation[\s\S]*status:ready/iu);
    expect(workflow).toMatch(/coordinated clear\s+work[\s\S]*status:needs-plan/iu);
    expect(workflow).toMatch(/unresolved[\s\S]*status:needs-shape/iu);
    expect(workflow).toMatch(/named prerequisite[\s\S]*status:blocked/iu);
    expect(workflow).toMatch(/meta[\s\S]*only[\s\S]*backlog coordination/iu);
    expect(workflow).toMatch(
      /priority:p1[\s\S]*B60205[\s\S]*Highest priority: correctness risk or foundational work[\s\S]*priority:p2[\s\S]*FBCA04[\s\S]*Important next work or a bounded ready improvement[\s\S]*priority:p3[\s\S]*C2E0C6[\s\S]*Valuable work to defer until higher-leverage items[\s\S]*status:ready[\s\S]*0E8A16[\s\S]*Triaged and ready for implementation[\s\S]*status:needs-shape[\s\S]*D876E3[\s\S]*Needs an accepted Shape pitch before planning[\s\S]*status:needs-plan[\s\S]*5319E7[\s\S]*Needs a delivery plan before implementation[\s\S]*status:blocked[\s\S]*B60205[\s\S]*Sequenced after named prerequisite issues[\s\S]*status:in-progress[\s\S]*1D76DB[\s\S]*An agent is actively working on this issue[\s\S]*meta[\s\S]*EDEDED[\s\S]*Backlog tracking and coordination/iu,
    );
    expect(workflow).toMatch(/never invent\s+a fallback area/iu);
    expect(workflow).toMatch(
      /existing equivalent native priority or status field[\s\S]*policy permits/iu,
    );
    expect(workflow).toMatch(/fallback labels are missing[\s\S]*separate exact-set confirmation/iu);
    expect(workflow).toMatch(/never rename or delete shared labels/iu);
    expect(workflow).toMatch(
      /resolved tracker[\s\S]*repository[\s\S]*optional project[\s\S]*title[\s\S]*body[\s\S]*fields[\s\S]*labels[\s\S]*area[\s\S]*priority[\s\S]*route status[\s\S]*grouping[\s\S]*privacy state[\s\S]*before[\s\S]*confirmation/iu,
    );
    expect(workflow).toMatch(
      /verify[\s\S]*issue creation[\s\S]*before[\s\S]*project placement[\s\S]*every later[\s\S]*mutation[\s\S]*partial success[\s\S]*blindly retry/iu,
    );
    expect(workflow).toMatch(
      /do not\s+place an issue[\s\S]*the request or repository policy resolves\s+one/iu,
    );
    expect(workflow).toMatch(/private[\s\S]*public[\s\S]*fail closed/iu);
    for (const guide of [readme, rootReadme]) {
      expect(guide).toMatch(
        /`\/improve[\s\S]*repository[ -]first[\s\S]*fallback[\s\S]*confirmation/iu,
      );
    }
  });
});
