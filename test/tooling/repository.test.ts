import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  findGoModules,
  readJsonFile,
  repositoryRoot,
  toPosixPath,
} from "../../scripts/lib/repository.ts";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (root) => {
      await rm(root, { force: true, recursive: true });
    }),
  );
});

describe("repository discovery", () => {
  it("loads the live repository aggregate for project-local Pi development", async () => {
    expect.hasAssertions();
    await expect(readJsonFile(join(repositoryRoot, ".pi", "settings.json"))).resolves.toEqual({
      packages: [".."],
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
    const ignoredModule = join(root, "node_modules", "dependency", "go.mod");
    await mkdir(join(realModule, ".."), { recursive: true });
    await mkdir(join(ignoredModule, ".."), { recursive: true });
    await writeFile(realModule, "module example.invalid/sample\n", "utf8");
    await writeFile(ignoredModule, "module example.invalid/dependency\n", "utf8");

    await expect(findGoModules(root)).resolves.toEqual([realModule]);
  });
});
