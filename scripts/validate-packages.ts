import { relative } from "node:path";

import {
  discoverProductionPackages,
  findForbiddenPackedPaths,
  loadFixturePackage,
  resolvePackageEntrypoints,
  validatePackage,
  validateRootAggregate,
  type PackageDescriptor,
} from "./lib/packages.ts";
import { describeFailure, npmInvocation, runCommand } from "./lib/process.ts";
import { validateReleaseConfiguration } from "./lib/releases.ts";
import { isRecord, repositoryRoot, stringArray, toPosixPath } from "./lib/repository.ts";

interface PackFile {
  readonly path: string;
}

function parsePackFiles(stdout: string): PackFile[] {
  const value = JSON.parse(stdout) as unknown;
  if (!Array.isArray(value) || value.length !== 1 || !isRecord(value[0])) {
    throw new Error("npm pack returned an unexpected JSON document.");
  }
  const files = value[0]["files"];
  if (!Array.isArray(files)) {
    throw new TypeError("npm pack did not report packed files.");
  }
  return files.map((file) => {
    if (!isRecord(file) || typeof file["path"] !== "string") {
      throw new TypeError("npm pack reported an invalid file entry.");
    }
    return { path: toPosixPath(file["path"]) };
  });
}

async function validatePackedContents(descriptor: PackageDescriptor): Promise<string[]> {
  const invocation = npmInvocation([
    "pack",
    "--dry-run",
    "--json",
    "--ignore-scripts",
    descriptor.root,
  ]);
  const result = await runCommand(invocation.command, invocation.arguments, {
    cwd: repositoryRoot,
    timeoutMs: 60_000,
  });
  if (result.code !== 0) {
    return [describeFailure(`npm pack ${relative(repositoryRoot, descriptor.root)}`, result)];
  }

  try {
    const packed = new Set(parsePackFiles(result.stdout).map((file) => file.path));
    const required = ["LICENSE", "README.md", "package.json"];
    if (descriptor.kind === "production") {
      required.push("CHANGELOG.md");
    }
    const pi = isRecord(descriptor.manifest["pi"]) ? descriptor.manifest["pi"] : undefined;
    for (const entrypoint of stringArray(pi?.["extensions"]) ?? []) {
      if (entrypoint.includes("*")) {
        for (const resolved of await resolvePackageEntrypoints(descriptor)) {
          required.push(toPosixPath(relative(descriptor.root, resolved)));
        }
      } else {
        required.push(entrypoint.replace(/^\.\//, ""));
      }
    }
    const missing = required
      .filter((path) => !packed.has(path))
      .map((path) => `${relative(repositoryRoot, descriptor.root)}: npm pack omits ${path}.`);
    const forbidden = findForbiddenPackedPaths([...packed]).map(
      (path) =>
        `${relative(repositoryRoot, descriptor.root)}: npm pack includes forbidden ${path}.`,
    );
    return [...missing, ...forbidden];
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
}

async function main(): Promise<void> {
  const packages = await discoverProductionPackages();
  const fixture = await loadFixturePackage();
  const descriptors = [...packages, fixture];
  const errors = [
    ...(await validateRootAggregate(packages)),
    ...(await validateReleaseConfiguration(packages)),
  ];
  for (const descriptor of descriptors) {
    errors.push(
      ...(await validatePackage(descriptor)),
      ...(await validatePackedContents(descriptor)),
    );
  }

  if (errors.length > 0) {
    throw new Error(`Package validation failed:\n- ${errors.join("\n- ")}`);
  }
  console.log(
    `Validated ${String(packages.length)} production package(s), release metadata, the root aggregate, and the private fixture.`,
  );
}

await main();
