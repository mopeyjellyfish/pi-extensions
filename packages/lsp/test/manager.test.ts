import { access, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LspManager } from "../src/manager.ts";

import type { ServerDefinition } from "../src/servers.ts";

const fixture = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "fake-lsp-server.mjs");

function fakeDefinition(): ServerDefinition {
  return {
    commands: [{ args: [fixture], command: process.execPath }],
    extensions: [".ts"],
    id: "fake",
    installHint: "install fake",
    languageIds: { ".ts": "typescript" },
    name: "Fake LSP",
    rootMarkers: ["package.json"],
  };
}

describe("LspManager semantic rename", () => {
  it("applies willRenameFiles edits before moving and sends didRenameFiles", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-"));
    const oldPath = join(root, "old.ts");
    const newPath = join(root, "new.ts");
    const imports = join(root, "imports.ts");
    const log = join(root, "server.log");
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(oldPath, "BROKEN\n");
    await writeFile(imports, 'export { value } from "./old";\n');
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_IMPORT_FILE: imports, FAKE_LSP_LOG: log },
      trusted: true,
    });

    const outcome = await manager.renameFile(oldPath, newPath);
    await expect(access(oldPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(newPath, "utf8")).resolves.toBe("BROKEN\n");
    await expect(readFile(imports, "utf8")).resolves.toBe('export { value } from "./new";\n');
    expect(outcome.changedFiles).toEqual([imports]);
    expect(outcome.serverName).toBe("Fake LSP");
    expect(outcome.diagnostics.flatMap((group) => group.diagnostics)).toMatchObject([
      { code: "FAKE1" },
    ]);

    const calls = (await readFile(log, "utf8")).trim().split("\n");
    expect(calls.indexOf("workspace/willRenameFiles")).toBeLessThan(
      calls.indexOf("workspace/didRenameFiles"),
    );
    await manager.shutdown();
  });

  it("does not start language servers for untrusted workspaces", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-untrusted-manager-"));
    const file = join(root, "example.ts");
    await writeFile(file, "BROKEN\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: false,
    });
    await manager.warmFile(file);
    expect(manager.status()).toEqual([]);
    await manager.shutdown();
  });

  it("reports only diagnostics introduced after a warmed baseline", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-delta-manager-"));
    const file = join(root, "example.ts");
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(file, "clean\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    await manager.warmFile(file);
    const snapshot = await manager.snapshot(file);
    expect(snapshot?.text).toBe("clean\n");
    await expect(manager.diagnoseMutation(file, "BROKEN\n", snapshot)).resolves.toMatchObject([
      { code: "FAKE1" },
    ]);
    expect(manager.status()).toMatchObject([{ id: "fake", state: "running" }]);
    await manager.shutdown();
  });

  it("caches unavailable and failed server routes", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-unavailable-"));
    const file = join(root, "example.ts");
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(file, "clean\n");
    const unavailableDefinitions = [
      {
        ...fakeDefinition(),
        commands: [{ args: [], command: "definitely-not-a-real-zulu-lsp-command" }],
        id: "zulu",
        name: "Zulu LSP",
      },
      {
        ...fakeDefinition(),
        commands: [{ args: [], command: "definitely-not-a-real-alpha-lsp-command" }],
        id: "alpha",
        name: "Alpha LSP",
      },
    ];
    const unavailable = new LspManager({
      cwd: root,
      definitions: unavailableDefinitions,
      env: { PATH: "" },
      trusted: true,
    });
    await unavailable.warmFile(file);
    await unavailable.warmFile(file);
    expect(unavailable.status()).toMatchObject([
      { message: "install fake", name: "Alpha LSP", state: "unavailable" },
      { message: "install fake", name: "Zulu LSP", state: "unavailable" },
    ]);
    await unavailable.shutdown();

    const failed = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_INITIALIZE_ERROR: "1" },
      trusted: true,
    });
    await expect(failed.warmFile(file)).rejects.toThrow("initialize failed");
    await expect(failed.warmFile(file)).resolves.toBeUndefined();
    expect(failed.status()).toMatchObject([{ state: "failed" }]);
    await failed.shutdown();
  });

  it("never routes outside the trusted root or through an escaping symlink", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-trusted-root-"));
    const outside = await mkdtemp(join(tmpdir(), "pi-lsp-outside-root-"));
    const outsideFile = join(outside, "example.ts");
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(join(outside, "package.json"), "{}");
    await writeFile(outsideFile, "BROKEN\n");
    await symlink(outside, join(root, "linked"));
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    await manager.warmFile(outsideFile);
    await manager.warmFile(join(root, "linked", "example.ts"));
    expect(manager.status()).toEqual([]);
    await expect(manager.renameFile(outsideFile, join(outside, "new.ts"))).rejects.toThrow(
      "trusted project",
    );
    await manager.shutdown();
  });

  it("fails closed for unsafe rename shapes and unavailable servers", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-rename-errors-"));
    const file = join(root, "example.ts");
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(file, "clean\n");
    const unavailable = new LspManager({
      cwd: root,
      definitions: [{ ...fakeDefinition(), commands: [] }],
      trusted: true,
    });
    await expect(unavailable.renameFile(file, join(root, "new.ts"))).rejects.toThrow(
      "No installed LSP server",
    );
    await unavailable.shutdown();

    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    await expect(manager.renameFile(file, file)).rejects.toThrow("identical");
    const directory = join(root, "directory.ts");
    await mkdir(directory);
    await expect(manager.renameFile(directory, join(root, "new.ts"))).rejects.toThrow("files only");
    const destination = join(root, "existing.ts");
    await writeFile(destination, "existing\n");
    await expect(manager.renameFile(file, destination)).rejects.toThrow("already exists");
    await manager.shutdown();
  });

  it("short-circuits unsupported, oversized, and unstarted document operations", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-shortcuts-"));
    const file = join(root, "example.ts");
    const unsupported = join(root, "notes.unknown");
    await writeFile(file, "clean\n");
    await writeFile(unsupported, "clean\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    await expect(manager.snapshot(file)).resolves.toBeUndefined();
    await expect(manager.snapshot(unsupported)).resolves.toBeUndefined();
    await expect(
      manager.diagnoseMutation(file, "x".repeat(2 * 1024 * 1024 + 1), undefined),
    ).resolves.toEqual([]);
    await expect(manager.diagnoseMutation(unsupported, "clean\n", undefined)).resolves.toEqual([]);
    await expect(manager.renameFile(file, file)).rejects.toThrow("identical");
    await expect(manager.renameFile(unsupported, join(root, "renamed.unknown"))).rejects.toThrow(
      `No installed LSP server is available for ${unsupported}.`,
    );
    await writeFile(file, "x".repeat(2 * 1024 * 1024 + 1));
    await manager.warmFile(file);
    expect(manager.status()).toEqual([]);
    await manager.shutdown();
  });

  it("shares starts, matches configured filenames, and enforces one detected workspace", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-routing-"));
    const nested = join(root, "nested");
    await mkdir(nested);
    await writeFile(join(nested, "package.json"), "{}");
    const first = join(nested, "first.ts");
    const second = join(nested, "second.ts");
    await writeFile(first, "clean\n");
    await writeFile(second, "clean\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    await Promise.all([manager.warmFile(first), manager.warmFile(second)]);
    expect(manager.status()).toHaveLength(1);
    await expect(manager.renameFile(first, join(root, "outside.ts"))).rejects.toThrow(
      "one detected workspace",
    );
    await manager.shutdown();

    const dockerfile = join(root, "Dockerfile");
    await writeFile(dockerfile, "FROM scratch\n");
    const filenameManager = new LspManager({
      cwd: root,
      definitions: [
        {
          ...fakeDefinition(),
          extensions: [],
          filenames: ["Dockerfile"],
          languageIds: { Dockerfile: "dockerfile" },
        },
      ],
      trusted: true,
    });
    await filenameManager.warmFile(dockerfile);
    expect(filenameManager.status()[0]?.state).toBe("running");
    await filenameManager.shutdown();
  });

  it("skips definitions without a language mapping", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-language-"));
    const file = join(root, "example.ts");
    await writeFile(file, "clean\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [{ ...fakeDefinition(), languageIds: {} }],
      trusted: true,
    });
    await manager.warmFile(file);
    expect(manager.status()).toEqual([]);
    await manager.shutdown();
  });

  it("establishes delayed warm baselines and suppresses unwarmed deltas", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-baseline-"));
    const warmed = join(root, "warmed.ts");
    const unwarmed = join(root, "unwarmed.ts");
    await writeFile(warmed, "BROKEN\n");
    await writeFile(unwarmed, "BROKEN\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      diagnosticWaitMs: 500,
      env: { ...process.env, FAKE_DIAGNOSTIC_DELAY_MS: "100" },
      trusted: true,
    });

    await Promise.all([manager.warmFile(warmed), manager.warmFile(warmed)]);
    const snapshot = await manager.snapshot(warmed);
    expect(snapshot?.diagnostics).toMatchObject([{ code: "FAKE1" }]);
    await expect(manager.diagnoseMutation(warmed, "BROKEN\n", snapshot)).resolves.toEqual([]);
    const superseded = manager.diagnoseMutation(warmed, "BROKEN\n", snapshot);
    await new Promise<void>((resolveDelay) => {
      setTimeout(() => {
        resolveDelay();
      }, 10);
    });
    const latest = manager.diagnoseMutation(warmed, "BROKEN\n", snapshot);
    await expect(superseded).rejects.toThrow(/abort/i);
    await expect(latest).resolves.toEqual([]);

    await expect(manager.snapshot(unwarmed)).resolves.toBeUndefined();
    await expect(manager.diagnoseMutation(unwarmed, "BROKEN\n", undefined)).resolves.toEqual([]);
    await manager.shutdown();

    const noPublication = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      diagnosticWaitMs: 100,
      env: { ...process.env, FAKE_NO_DIAGNOSTICS: "1" },
      trusted: true,
    });
    await noPublication.warmFile(warmed);
    await expect(noPublication.snapshot(warmed)).resolves.toBeUndefined();
    await expect(noPublication.diagnoseMutation(warmed, "BROKEN\n", undefined)).resolves.toEqual(
      [],
    );
    await noPublication.shutdown();
  });

  it("restores semantic edits before a failed rename can be retried", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-retry-"));
    const oldPath = join(root, "old.ts");
    const invalidPath = join(oldPath, "nested.ts");
    const newPath = join(root, "new.ts");
    const imports = join(root, "imports.ts");
    await writeFile(oldPath, "clean\n");
    await writeFile(imports, 'export { value } from "./old";\n');
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_IMPORT_FILE: imports },
      trusted: true,
    });

    await expect(manager.renameFile(oldPath, invalidPath)).rejects.toThrow();
    await expect(readFile(imports, "utf8")).resolves.toBe('export { value } from "./old";\n');
    const outcome = await manager.renameFile(oldPath, newPath);
    expect(outcome.changedFiles).toEqual([imports]);
    await expect(readFile(imports, "utf8")).resolves.toBe('export { value } from "./new";\n');
    await manager.shutdown();
  });

  it("retries a healthy shared startup after the first caller is cancelled", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-start-cancel-"));
    const file = join(root, "example.ts");
    await writeFile(file, "clean\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_INITIALIZE_DELAY_MS: "100" },
      trusted: true,
    });
    const controller = new AbortController();
    const started = Date.now();
    const cancelled = manager.warmFile(file, controller.signal);
    const shared = manager.warmFile(file);
    setTimeout(() => {
      controller.abort();
    }, 10);
    await expect(cancelled).rejects.toThrow(/abort/i);
    expect(Date.now() - started).toBeLessThan(80);
    await expect(shared).resolves.toBeUndefined();
    await expect(manager.warmFile(file)).resolves.toBeUndefined();
    expect(manager.status()).toMatchObject([{ state: "running" }]);
    await manager.shutdown();
  });

  it("supports same-file alias renames through an intermediate path", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-case-rename-"));
    const oldPath = join(root, "Original.ts");
    const aliasPath = join(root, "original.ts");
    await writeFile(oldPath, "clean\n");
    try {
      await symlink(oldPath, aliasPath);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
      // A case-insensitive filesystem already resolves the alias to the source file.
    }
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_RENAME_NULL: "1" },
      trusted: true,
    });
    await manager.renameFile(oldPath, aliasPath);
    expect(await readdir(root)).toContain("original.ts");
    await expect(readFile(aliasPath, "utf8")).resolves.toBe("clean\n");
    await manager.shutdown();
  });

  it("uses the destination language identity and rejects unsupported suffixes", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-language-rename-"));
    const oldPath = join(root, "old.ts");
    const newPath = join(root, "new.js");
    const log = join(root, "server.log");
    await writeFile(oldPath, "clean\n");
    const definition = fakeDefinition();
    const manager = new LspManager({
      cwd: root,
      definitions: [
        {
          ...definition,
          extensions: [".js", ".ts"],
          languageIds: { ".js": "javascript", ".ts": "typescript" },
        },
      ],
      env: { ...process.env, FAKE_LSP_LOG: log, FAKE_RENAME_NULL: "1" },
      trusted: true,
    });
    await manager.renameFile(oldPath, newPath);
    expect(await readFile(log, "utf8")).toContain("didOpenLanguage:javascript");
    await manager.shutdown();

    const unsupportedPath = join(root, "unsupported.ts");
    await writeFile(unsupportedPath, "clean\n");
    const unsupported = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    await expect(
      unsupported.renameFile(unsupportedPath, join(root, "unsupported.py")),
    ).rejects.toThrow("preserve one language-server workspace");
    await unsupported.shutdown();
  });

  it("keeps server state current when rename preflight edits the renamed file", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-manager-source-edit-"));
    const oldPath = join(root, "old.ts");
    const newPath = join(root, "new.ts");
    await writeFile(oldPath, "old\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_EDIT_RENAMED_FILE: "1" },
      trusted: true,
    });
    const outcome = await manager.renameFile(oldPath, newPath);
    expect(outcome.warning).toBeUndefined();
    await expect(readFile(newPath, "utf8")).resolves.toBe("new\n");
    await expect(manager.snapshot(newPath)).resolves.toMatchObject({ text: "new\n" });
    await manager.shutdown();
  });

  it("returns committed renames with warnings when didRenameFiles fails", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-rename-warning-"));
    const oldPath = join(root, "old.ts");
    const newPath = join(root, "new.ts");
    const imports = join(root, "imports.ts");
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(oldPath, "clean\n");
    await writeFile(imports, 'export { value } from "./old";\n');
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_EXIT_AFTER_WILL_RENAME: "1",
        FAKE_IMPORT_FILE: imports,
      },
      trusted: true,
    });
    await manager.warmFile(imports);
    const outcome = await manager.renameFile(oldPath, newPath);
    expect(outcome.warning).toContain("rename committed");
    await expect(readFile(newPath, "utf8")).resolves.toBe("clean\n");
    await expect(manager.snapshot(imports)).resolves.toBeUndefined();
    await manager.shutdown();
  });
});
