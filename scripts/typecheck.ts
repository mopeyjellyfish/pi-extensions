import { join, relative } from "node:path";

import { discoverProductionPackages } from "./lib/packages.ts";
import { describeFailure, resolveExecutable, runCommand } from "./lib/process.ts";
import { repositoryRoot } from "./lib/repository.ts";

async function checkProject(project: string, label: string): Promise<void> {
  const result = await runCommand(
    resolveExecutable("tsc", "node-shim"),
    ["--noEmit", "-p", project],
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
  for (const descriptor of packages) {
    const project = relative(repositoryRoot, join(descriptor.root, "tsconfig.json"));
    await checkProject(project, project);
  }
  console.log(`Type-checked root tooling and ${String(packages.length)} production package(s).`);
}

await main();
