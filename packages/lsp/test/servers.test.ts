import { chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_SERVER_DEFINITIONS,
  findServerDefinitions,
  findWorkspaceRoot,
  isPathInside,
  languageKey,
  resolveServerCommand,
} from "../src/servers.ts";

describe("server registry", () => {
  it("routes common language families without fragmenting TypeScript clients", () => {
    expect.hasAssertions();
    const typescript = findServerDefinitions("src/example.tsx")[0];
    const javascript = findServerDefinitions("src/example.jsx")[0];
    expect(typescript?.id).toBe("typescript");
    expect(javascript?.id).toBe("typescript");
    expect(typescript?.languageIds[".tsx"]).toBe("typescriptreact");

    for (const path of [
      "main.py",
      "main.go",
      "main.rs",
      "main.c",
      "main.cpp",
      "main.java",
      "main.cs",
      "main.rb",
      "main.php",
      "main.lua",
      "main.swift",
      "main.kt",
      "main.ex",
      "main.sh",
      "main.yaml",
      "main.json",
      "main.vue",
      "main.svelte",
      "Dockerfile",
    ]) {
      expect(findServerDefinitions(path)).not.toHaveLength(0);
    }
    expect(new Set(DEFAULT_SERVER_DEFINITIONS.map((server) => server.id)).size).toBe(
      DEFAULT_SERVER_DEFINITIONS.length,
    );
    expect(languageKey("Dockerfile")).toBe("Dockerfile");
    expect(findServerDefinitions("unknown.xyz")).toEqual([]);
  });

  it("selects the nearest root marker", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-root-"));
    const nested = join(root, "packages", "app", "src");
    await mkdir(nested, { recursive: true });
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(join(root, "packages", "app", "tsconfig.json"), "{}");

    await expect(
      findWorkspaceRoot(join(nested, "index.ts"), ["tsconfig.json", "package.json"], root),
    ).resolves.toBe(join(root, "packages", "app"));
    await expect(findWorkspaceRoot(join(nested, "index.ts"), ["missing"], root)).resolves.toBe(
      root,
    );

    const csharp = join(root, "csharp");
    const csharpSource = join(csharp, "src");
    await mkdir(csharpSource, { recursive: true });
    await writeFile(join(csharp, "Example.sln"), "");
    await expect(
      findWorkspaceRoot(join(csharpSource, "Program.cs"), ["*.sln", "*.csproj"], root),
    ).resolves.toBe(csharp);

    const outside = await mkdtemp(join(tmpdir(), "pi-lsp-outside-root-"));
    await writeFile(join(outside, "package.json"), "{}");
    await expect(
      findWorkspaceRoot(join(outside, "index.ts"), ["package.json"], root),
    ).resolves.toBe(root);
    expect(isPathInside("C:\\Repo", "c:\\repo\\src", "win32")).toBe(true);
    expect(isPathInside("C:\\Repo", "C:\\Other", "win32")).toBe(false);
  });

  it("prefers trusted project-local binaries and otherwise searches PATH", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-command-"));
    const localBin = join(root, "node_modules", ".bin");
    const pathBin = join(root, "path-bin");
    await mkdir(localBin, { recursive: true });
    await mkdir(pathBin, { recursive: true });
    const local = join(localBin, "typescript-language-server");
    const global = join(pathBin, "typescript-language-server");
    await writeFile(local, "#!/bin/sh\n");
    await writeFile(global, "#!/bin/sh\n");
    await chmod(local, 0o755);
    await chmod(global, 0o755);
    const definition = DEFAULT_SERVER_DEFINITIONS.find((server) => server.id === "typescript");
    expect(definition).toBeDefined();
    if (definition === undefined) throw new Error("TypeScript definition missing.");

    await expect(
      resolveServerCommand(definition, root, true, { PATH: pathBin }),
    ).resolves.toMatchObject({ command: local });
    const nestedRoot = join(root, "packages", "app");
    await mkdir(nestedRoot, { recursive: true });
    await expect(
      resolveServerCommand(definition, nestedRoot, true, { PATH: "" }, process.platform, root),
    ).resolves.toMatchObject({ command: local });
    await expect(
      resolveServerCommand(definition, root, false, { PATH: pathBin }),
    ).resolves.toMatchObject({ command: global });
    await expect(
      resolveServerCommand(definition, root, false, { PATH: "" }),
    ).resolves.toBeUndefined();

    const absoluteDefinition = {
      ...definition,
      commands: [{ args: ["--stdio"], command: global }],
    };
    await expect(
      resolveServerCommand(absoluteDefinition, root, false, { PATH: "" }),
    ).resolves.toMatchObject({
      args: ["--stdio"],
      command: global,
    });

    const windowsBin = join(root, "windows-bin");
    await mkdir(windowsBin);
    const windowsShim = join(windowsBin, "typescript-language-server.cmd");
    await writeFile(windowsShim, "@echo off\r\n");
    await chmod(windowsShim, 0o755);
    await expect(
      resolveServerCommand(definition, root, false, { PATH: windowsBin, PATHEXT: ".CMD" }, "win32"),
    ).resolves.toMatchObject({ command: windowsShim });
  });
});
