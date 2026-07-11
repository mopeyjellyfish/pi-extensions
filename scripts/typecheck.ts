import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverProductionPackages } from "./lib/packages.ts";
import { describeFailure, runCommand } from "./lib/process.ts";
import { pathExists, repositoryRoot } from "./lib/repository.ts";

const typescriptModulePath = fileURLToPath(import.meta.resolve("typescript"));
const typescriptCliPath = resolve(dirname(typescriptModulePath), "../bin/tsc");

async function checkProject(project: string, label: string): Promise<void> {
  const result = await runCommand(
    process.execPath,
    [typescriptCliPath, "--noEmit", "-p", project],
    {
      cwd: repositoryRoot,
      env: process.env,
      timeoutMs: 120_000,
    },
  );
  if (result.code !== 0) {
    throw new Error(describeFailure(`tsc -p ${label}`, result));
  }
}

async function main(): Promise<void> {
  await checkProject("tsconfig.json", "tsconfig.json");
  const packages = await discoverProductionPackages();
  let checkedPackages = 0;
  for (const descriptor of packages) {
    const projectPath = join(descriptor.root, "tsconfig.json");
    if (!pathExists(projectPath)) {
      continue;
    }
    const project = relative(repositoryRoot, projectPath);
    await checkProject(project, project);
    checkedPackages += 1;
  }
  console.log(`Type-checked root tooling and ${String(checkedPackages)} TypeScript package(s).`);
}

await main();
