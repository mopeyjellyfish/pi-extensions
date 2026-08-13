import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { findGoModules, repositoryRoot, toPosixPath } from "../../scripts/lib/repository.ts";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (root) => {
      await rm(root, { force: true, recursive: true });
    }),
  );
});

describe("repository discovery", () => {
  it("does not auto-load the aggregate alongside a globally installed copy", async () => {
    expect.hasAssertions();
    await expect(access(join(repositoryRoot, ".pi", "settings.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("normalizes Windows path separators", () => {
    expect.hasAssertions();
    expect(toPosixPath("packages\\sample\\src\\index.ts")).toBe("packages/sample/src/index.ts");
  });

  it("finds nested Go modules while ignoring dependency directories", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-repository-test-"));
    temporaryRoots.push(root);
    const realModule = join(root, "packages", "sample", "go", "go.mod");
    const ignoredModules = [
      join(root, "node_modules", "dependency", "go.mod"),
      join(root, ".pi-subagents", "runs", "go.mod"),
      join(root, ".pi", "subagents", "runs", "go.mod"),
    ];
    await Promise.all(
      [realModule, ...ignoredModules].map(async (path) =>
        mkdir(join(path, ".."), { recursive: true }),
      ),
    );
    await writeFile(realModule, "module example.invalid/sample\n", "utf8");
    await Promise.all(
      ignoredModules.map(async (path) =>
        writeFile(path, "module example.invalid/ignored\n", "utf8"),
      ),
    );

    await expect(findGoModules(root)).resolves.toEqual([realModule]);
  });
});
