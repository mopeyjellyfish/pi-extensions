import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (root) => rm(root, { force: true, recursive: true })),
  );
});

describe("development launcher", () => {
  it("activates toolchains, reuses a matching setup fingerprint, and execs Pi arguments", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-dev-test-"));
    temporaryRoots.push(root);
    const home = join(root, "home");
    const log = join(root, "log");
    await mkdir(join(root, "scripts"));
    await Promise.all([
      writeFile(join(root, ".nvmrc"), "v24.18.0\n"),
      writeFile(join(root, ".gvmrc"), "gvm use go1.26.5\n"),
      writeFile(join(root, "package-lock.json"), "lock\n"),
      writeFile(join(root, "package.json"), "{}\n"),
      writeFile(join(root, "scripts", "dev.sh"), await readFile("scripts/dev.sh", "utf8")),
      writeFile(join(root, "nvm.sh"), `nvm() { echo nvm:$* >> ${JSON.stringify(log)}; }\n`),
      writeFile(join(root, "scripts", "gvm"), `gvm() { echo gvm >> ${JSON.stringify(log)}; }\n`),
      writeFile(
        join(root, "npm"),
        `#!/bin/sh\nif [ "$1" = ci ]; then mkdir -p node_modules; fi\necho npm:$* >> ${JSON.stringify(log)}\n`,
      ),
    ]);
    await chmod(join(root, "scripts", "dev.sh"), 0o755);
    await chmod(join(root, "npm"), 0o755);
    const environment = {
      ...process.env,
      HOME: home,
      NVM_DIR: root,
      GVM_ROOT: root,
      PATH: `${root}:${process.env["PATH"] ?? ""}`,
    };

    await execFileAsync("bash", ["scripts/dev.sh", "--profile", "root"], {
      cwd: root,
      env: environment,
    });
    await execFileAsync("bash", ["scripts/dev.sh", "--profile", "root"], {
      cwd: root,
      env: environment,
    });
    await writeFile(join(root, "package-lock.json"), "changed\n");
    await execFileAsync("bash", ["scripts/dev.sh", "--profile", "root"], {
      cwd: root,
      env: environment,
    });

    const lines = (await readFile(log, "utf8")).trim().split("\n");
    expect(lines).toEqual([
      "nvm:use",
      "gvm",
      "npm:ci --ignore-scripts --no-audit --no-fund",
      "npm:exec -- pi --no-extensions --no-skills --no-prompt-templates --no-themes -e . --profile root",
      "nvm:use",
      "gvm",
      "npm:exec -- pi --no-extensions --no-skills --no-prompt-templates --no-themes -e . --profile root",
      "nvm:use",
      "gvm",
      "npm:ci --ignore-scripts --no-audit --no-fund",
      "npm:exec -- pi --no-extensions --no-skills --no-prompt-templates --no-themes -e . --profile root",
    ]);

    expect(
      (await readFile(join(root, "node_modules", ".pi-setup-fingerprint"), "utf8")).trim(),
    ).toMatch(/^[\da-f]{64}$/u);
    await expect(
      readFile(join(root, ".pi", "npm", "setup-fingerprint"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
