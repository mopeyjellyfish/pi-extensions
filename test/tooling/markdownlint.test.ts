import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../scripts/lib/repository.ts";

const generatedChangelog = /^packages\/[^/]+\/CHANGELOG\.md$/u;
const markdownlintControlComment = /<!--\s*markdownlint(?:-[a-z]+)?\b/iu;

describe("Markdown lint configuration", () => {
  it("keeps markdownlint controls out of tracked source Markdown", async () => {
    expect.hasAssertions();
    const paths = execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "--", "*.md"],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
      },
    )
      .split("\n")
      // Skip tracked entries deleted in this worktree because lint targets existing worktree content.
      .filter(
        (path) =>
          path !== "" && existsSync(join(repositoryRoot, path)) && !generatedChangelog.test(path),
      );
    const sources = await Promise.all(
      paths.map(async (path) => ({
        path,
        source: await readFile(join(repositoryRoot, path), "utf8"),
      })),
    );

    expect(
      sources
        .filter(({ source }) => markdownlintControlComment.test(source))
        .map(({ path }) => path),
    ).toEqual([]);
  });

  it("scopes prompt frontmatter exceptions to MD041", async () => {
    expect.hasAssertions();
    const module = (await import(
      pathToFileURL(join(repositoryRoot, ".markdownlint-cli2.mjs")).href
    )) as {
      default: {
        config: Record<string, unknown>;
        overrides: { combine?: string; config: Record<string, unknown>; filter: string }[];
      };
    };

    expect(module.default.config["MD041"]).toBeUndefined();
    expect(module.default.overrides).toContainEqual({
      filter: "packages/*/prompts/*.md",
      config: { MD041: false },
      combine: "merge",
    });
  });
});
