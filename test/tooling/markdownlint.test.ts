import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import { repositoryRoot } from "../../scripts/lib/repository.ts";

const execFileAsync = promisify(execFile);
const temporaryRoots: string[] = [];

async function fixture(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "pi-markdownlint-"));
  temporaryRoots.push(root);
  await Promise.all(
    [".markdownlint.jsonc", ".markdownlintignore"].map(async (file) =>
      copyFile(join(repositoryRoot, file), join(root, file)),
    ),
  );
  await Promise.all(
    Object.entries(files).map(async ([file, content]) => {
      const path = join(root, file);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }),
  );
  return root;
}

async function lint(root: string): Promise<{ stdout: string; stderr: string }> {
  const manifest = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8")) as {
    scripts: { markdownlint: string };
  };
  return execFileAsync("sh", ["-c", manifest.scripts.markdownlint], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${join(repositoryRoot, "node_modules", ".bin")}:${process.env["PATH"] ?? ""}`,
    },
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (root) => rm(root, { force: true, recursive: true })),
  );
});

describe("Markdown lint configuration", () => {
  it("preserves rule settings and all excluded paths", async () => {
    expect.hasAssertions();
    const ignoredPaths = [
      "nested/node_modules/example/README.md",
      "coverage/report.md",
      ".pi-subagents/report.md",
      ".pi/subagents/report.md",
      "packages/example/CHANGELOG.md",
      "packages/grafana-skills/skills/example/SKILL.md",
      "packages/go/skills/go/SKILL.md",
      "packages/go/skills/cobra-viper/SKILL.md",
      "packages/go/skills/go-spec-reviewer/SKILL.md",
      "packages/frontend-developer/skills/react-best-practices/SKILL.md",
      "packages/frontend-developer/skills/react-native-skills/SKILL.md",
      "packages/frontend-developer/skills/react-view-transitions/SKILL.md",
    ];
    const root = await fixture({
      ...Object.fromEntries(ignoredPaths.map((path) => [path, "invalid markdown   \n"])),
      "README.md": `# Example\n\n${"Long text ".repeat(20).trim()}\n\n<div>HTML</div>\n\n## First\n\n### Shared\n\n## Second\n\n### Shared\n`,
      "packages/example/prompts/example.md": "---\ndescription: Example\n---\n\nPrompt text.\n",
    });
    await expect(lint(root)).resolves.toEqual({ stdout: "", stderr: "" });
  });

  it("requires a first heading outside prompts", async () => {
    expect.hasAssertions();
    const root = await fixture({
      "README.md": "Text without a heading.\n",
      "packages/example/prompts/example.md": "Prompt text.\n",
    });
    await expect(lint(root)).rejects.toThrow("README.md:1 error MD041");
  });

  it("lints hidden Markdown files", async () => {
    expect.hasAssertions();
    const root = await fixture({
      "README.md": "# Example\n",
      ".guidance/notes.md": "Text without a heading.\n",
      "packages/example/prompts/example.md": "Prompt text.\n",
    });
    await expect(lint(root)).rejects.toThrow(".guidance/notes.md:1 error MD041");
  });

  it("keeps other rules enabled for prompts", async () => {
    expect.hasAssertions();
    const root = await fixture({
      "README.md": "# Example\n",
      "packages/example/prompts/example.md": "Prompt text.   \n",
    });
    await expect(lint(root)).rejects.toThrow(
      /packages\/example\/prompts\/example\.md:1:\d+ error MD009/u,
    );
  });
});
