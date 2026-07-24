import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../scripts/lib/repository.ts";

describe("aggregate subagent resources", () => {
  it("ships Ponytail-aware worker and reviewer overrides", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8")) as {
      readonly pi?: {
        readonly subagents?: { readonly agents?: unknown };
      };
    };

    expect(manifest.pi?.subagents?.agents).toEqual(["./agents"]);
    const agentFiles = await readdir(join(repositoryRoot, "agents"));
    expect(agentFiles.sort((left, right) => left.localeCompare(right))).toEqual([
      "reviewer.md",
      "worker.md",
    ]);

    const [worker, reviewer] = await Promise.all([
      readFile(join(repositoryRoot, "agents", "worker.md"), "utf8"),
      readFile(join(repositoryRoot, "agents", "reviewer.md"), "utf8"),
    ]);
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
