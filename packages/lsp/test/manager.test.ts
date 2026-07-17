import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";

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

async function waitForCondition(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (condition()) return;
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 10));
  }
  throw new Error("Timed out waiting for condition.");
}

function firstStatusMessage(manager: LspManager): string | undefined {
  return manager.status()[0]?.message;
}

async function waitForLog(path: string, needle: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      if ((await readFile(path, "utf8")).includes(needle)) return;
    } catch {
      // The fixture creates its log lazily.
    }
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 10));
  }
  throw new Error(`Timed out waiting for ${needle}.`);
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
    await manager.warmFile(imports);

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

  it("serves bounded semantic navigation, hover, and symbol queries", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-query-manager-"));
    const file = join(root, "example.ts");
    await writeFile(
      file,
      "class Example {\n  value = 1;\n  method() {}\n}\nconst use = Example;\n",
    );
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_WORKSPACE_SYMBOL_FILE: file },
      trusted: true,
    });

    for (const operation of [
      "declaration",
      "definition",
      "implementation",
      "typeDefinition",
    ] as const) {
      const outcome = await manager.query({ column: 7, line: 1, operation, path: file });
      expect(outcome.items[0]).toMatchObject({ line: 5, path: file });
    }
    const references = await manager.query({
      column: 7,
      includeDeclaration: false,
      line: 1,
      operation: "references",
      path: file,
    });
    expect(references.items[0]).toMatchObject({ line: 3, path: file });
    const hover = await manager.query({ column: 7, line: 1, operation: "hover", path: file });
    expect(hover.hover).toContain("const value: number");
    const symbols = await manager.query({ operation: "documentSymbols", path: file });
    expect(symbols.items).toMatchObject([
      { kind: "class", name: "Example" },
      { containerName: "Example", kind: "function", name: "method" },
    ]);
    const hierarchyCases = [
      ["callHierarchyIncoming", "caller", "incomingCall:function"],
      ["callHierarchyOutgoing", "callee", "outgoingCall:function"],
      ["typeHierarchySubtypes", "ChildType", "subtype:class"],
      ["typeHierarchySupertypes", "ParentType", "supertype:class"],
    ] as const;
    for (const [operation, name, kind] of hierarchyCases) {
      const hierarchy = await manager.query({ column: 7, line: 1, operation, path: file });
      expect(hierarchy.items[0]).toMatchObject({ kind, name, path: file });
    }
    const selectedWorkspace = await manager.query({
      operation: "workspaceSymbols",
      path: file,
      query: "Example",
    });
    expect(selectedWorkspace.items[0]).toMatchObject({ name: "symbol:Example", path: file });
    const runningWorkspace = await manager.query({
      operation: "workspaceSymbols",
      query: "Example",
    });
    expect(runningWorkspace.items).toHaveLength(1);
    await expect(
      manager.query({ column: 99, line: 1, operation: "definition", path: file }),
    ).rejects.toThrow("UTF-16");
    await expect(manager.query({ operation: "documentSymbols" })).rejects.toThrow(
      "requires a path",
    );
    await expect(manager.query({ operation: "hover", path: file })).rejects.toThrow(
      "requires line and column",
    );
    await expect(manager.query({ operation: "workspaceSymbols" })).rejects.toThrow(
      "requires a query string",
    );
    await expect(
      manager.query({ column: 7, line: 1, operation: "references", path: file }),
    ).resolves.toMatchObject({ items: [{ kind: "references" }] });
    const large = join(root, "large.ts");
    await writeFile(large, "x".repeat(2 * 1024 * 1024 + 1));
    await expect(manager.query({ operation: "documentSymbols", path: large })).rejects.toThrow(
      "exceeds",
    );
    const unsupportedFile = join(root, "notes.unknown");
    await writeFile(unsupportedFile, "text\n");
    await expect(
      manager.query({ operation: "documentSymbols", path: unsupportedFile }),
    ).rejects.toThrow("No installed LSP server");
    const outside = join(tmpdir(), `pi-lsp-query-outside-${String(Date.now())}.ts`);
    await writeFile(outside, "text\n");
    await expect(manager.query({ operation: "documentSymbols", path: outside })).rejects.toThrow(
      "trusted project",
    );
    const aborted = new AbortController();
    aborted.abort();
    await expect(
      manager.query({ operation: "documentSymbols", path: file }, aborted.signal),
    ).rejects.toThrow("aborted");
    await manager.shutdown();

    const unsupported = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_NO_QUERY: "1" },
      trusted: true,
    });
    await expect(
      unsupported.query({ column: 1, line: 1, operation: "definition", path: file }),
    ).rejects.toThrow("does not support");
    await expect(
      unsupported.query({
        column: 1,
        line: 1,
        operation: "callHierarchyIncoming",
        path: file,
      }),
    ).rejects.toThrow("does not support");
    await unsupported.shutdown();

    const boundedHierarchy = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_HIERARCHY_RESULTS: "205" },
      trusted: true,
    });
    const boundedCalls = await boundedHierarchy.query({
      column: 1,
      line: 1,
      operation: "callHierarchyIncoming",
      path: file,
    });
    expect(boundedCalls.items).toHaveLength(200);
    expect(boundedCalls.omitted).toBe(5);
    await boundedHierarchy.shutdown();

    const excessiveRoots = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_HIERARCHY_ROOTS: "9" },
      trusted: true,
    });
    await expect(
      excessiveRoots.query({
        column: 1,
        line: 1,
        operation: "typeHierarchySubtypes",
        path: file,
      }),
    ).rejects.toThrow("exceeds the 8 root limit");
    await excessiveRoots.shutdown();

    const nullHover = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_HOVER_NULL: "1" },
      trusted: true,
    });
    await expect(
      nullHover.query({ column: 1, line: 1, operation: "hover", path: file }),
    ).resolves.toMatchObject({ items: [] });
    await nullHover.shutdown();

    const idle = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    await expect(idle.query({ operation: "workspaceSymbols", query: "Example" })).rejects.toThrow(
      "No running language server",
    );
    await idle.shutdown();

    const untrusted = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: false,
    });
    await expect(
      untrusted.query({ operation: "workspaceSymbols", query: "Example" }),
    ).rejects.toThrow("trusted project");
    await untrusted.shutdown();
  });

  it("validates pull diagnostics, caches unchanged reports, and falls back to push", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-validation-manager-"));
    const file = join(root, "example.ts");
    const related = join(root, "related.ts");
    const log = join(root, "server.log");
    await writeFile(file, "BROKEN\n");
    await writeFile(related, "BROKEN\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DIAGNOSTIC_REFRESH: "1",
        FAKE_LSP_LOG: log,
        FAKE_PULL_DIAGNOSTICS: "1",
        FAKE_RELATED_DIAGNOSTIC_FILE: related,
        FAKE_WORKSPACE_DIAGNOSTICS: "1",
      },
      trusted: true,
    });

    const first = await manager.validate({ paths: [file], scope: "document", severity: "error" });
    expect(first.diagnostics.map((group) => group.path)).toEqual([file, related]);
    const unchanged = await manager.validate({
      paths: [file],
      scope: "document",
      severity: "error",
    });
    expect(unchanged.diagnostics).toHaveLength(1);
    await new Promise<void>((resolveDelay) => {
      setTimeout(resolveDelay, 75);
    });
    const refreshed = await manager.validate({
      paths: [file],
      scope: "document",
      severity: "warning",
    });
    expect(refreshed.diagnostics).not.toHaveLength(0);
    const workspace = await manager.validate({
      paths: [file],
      scope: "workspace",
      severity: "all",
    });
    expect(workspace.diagnostics[0]).toMatchObject({ path: file });
    const workspaceUnchanged = await manager.validate({
      scope: "workspace",
      severity: "all",
    });
    expect(workspaceUnchanged.diagnostics[0]).toMatchObject({ path: file });
    expect(await readFile(log, "utf8")).toContain("workspace/diagnostic/refresh");
    await manager.shutdown();

    const push = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      diagnosticWaitMs: 500,
      env: { ...process.env, FAKE_UNVERSIONED: "1" },
      trusted: true,
    });
    const pushed = await push.validate({ paths: [file], scope: "document", severity: "error" });
    expect(pushed.diagnostics[0]).toMatchObject({ path: file });
    await expect(
      push.validate({ paths: [], scope: "document", severity: "error" }),
    ).rejects.toThrow("at least one path");
    await expect(
      push.validate({
        paths: Array.from({ length: 33 }, (_, index) => join(root, `${String(index)}.ts`)),
        scope: "document",
        severity: "error",
      }),
    ).rejects.toThrow("at most 32");
    await push.shutdown();

    const idle = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    await expect(idle.validate({ scope: "workspace", severity: "error" })).rejects.toThrow(
      "workspace diagnostics",
    );
    await idle.shutdown();
  });

  it("lists and applies only fresh text-edit code actions", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-code-action-manager-"));
    const file = join(root, "action.ts");
    await writeFile(file, "const oldName = oldName;\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    const listed = await manager.codeAction({
      kind: "quickfix",
      mode: "list",
      path: file,
    });
    expect(listed).toMatchObject({
      actions: [
        {
          applicable: true,
          isPreferred: true,
          kind: "quickfix",
          title: "Replace oldName",
        },
      ],
      applied: false,
    });
    const applied = await manager.codeAction({
      column: 7,
      kind: "quickfix",
      line: 1,
      mode: "apply",
      path: file,
      title: "Replace oldName",
    });
    expect(applied).toMatchObject({ applied: true, changes: [{ editCount: 1 }] });
    await expect(readFile(file, "utf8")).resolves.toBe("const fixedName = oldName;\n");
    await expect(
      manager.codeAction({
        kind: "source.organizeImports",
        mode: "apply",
        path: file,
        title: "Organize Imports",
      }),
    ).resolves.toMatchObject({ applied: true });
    await expect(readFile(file, "utf8")).resolves.toContain("// organized\n");
    await expect(
      manager.codeAction({ kind: "quickfix", mode: "apply", path: file }),
    ).rejects.toThrow("exact title");
    await expect(
      manager.codeAction({ column: 1, kind: "quickfix", mode: "list", path: file }),
    ).rejects.toThrow("line and column together");
    await expect(
      manager.codeAction({ endLine: 1, kind: "quickfix", mode: "list", path: file }),
    ).rejects.toThrow("require a start position");
    await expect(
      manager.codeAction({
        column: 1,
        endLine: 1,
        kind: "quickfix",
        line: 1,
        mode: "list",
        path: file,
      }),
    ).rejects.toThrow("must be provided together");
    await expect(
      manager.codeAction({
        column: 5,
        endColumn: 2,
        endLine: 1,
        kind: "quickfix",
        line: 1,
        mode: "list",
        path: file,
      }),
    ).rejects.toThrow("must not be reversed");
    await manager.shutdown();

    await writeFile(file, "const oldName = oldName;\n");
    const resolving = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_CODE_ACTION_NO_DATA: "1",
        FAKE_CODE_ACTION_RESOLVE: "1",
        FAKE_CODE_ACTION_UNRESOLVED: "1",
      },
      trusted: true,
    });
    await expect(
      resolving.codeAction({
        kind: "quickfix",
        mode: "apply",
        path: file,
        title: "Replace oldName",
      }),
    ).resolves.toMatchObject({ applied: true });
    await expect(readFile(file, "utf8")).resolves.toBe("const fixedName = oldName;\n");
    await resolving.shutdown();

    await writeFile(file, "const oldName = oldName;\n");
    const disabled = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_CODE_ACTION_DISABLED: "1",
        FAKE_CODE_ACTION_LONG_DISABLED: "1",
      },
      trusted: true,
    });
    const disabledList = await disabled.codeAction({
      kind: "quickfix",
      mode: "list",
      path: file,
    });
    expect(disabledList.actions[0]?.disabledReason).toHaveLength(512);
    let disabledError: unknown;
    try {
      await disabled.codeAction({
        kind: "quickfix",
        mode: "apply",
        path: file,
        title: "Replace oldName",
      });
    } catch (error) {
      disabledError = error;
    }
    expect(disabledError).toBeInstanceOf(Error);
    expect((disabledError as Error).message.length).toBeLessThan(600);
    await disabled.shutdown();

    const commanded = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_CODE_ACTION_COMMAND: "1" },
      trusted: true,
    });
    const commandList = await commanded.codeAction({
      kind: "quickfix",
      mode: "list",
      path: file,
    });
    expect(commandList.actions).toMatchObject([{ applicable: false }]);
    await expect(
      commanded.codeAction({
        kind: "quickfix",
        mode: "apply",
        path: file,
        title: "Replace oldName",
      }),
    ).rejects.toThrow("containing commands");
    await commanded.shutdown();

    const duplicate = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_CODE_ACTION_LATE_DUPLICATE: "1" },
      trusted: true,
    });
    await expect(
      duplicate.codeAction({
        kind: "quickfix",
        mode: "apply",
        path: file,
        title: "Replace oldName",
      }),
    ).rejects.toThrow("more than one matching title");
    await duplicate.shutdown();

    const legacyCommand = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_CODE_ACTION_AS_COMMAND: "1" },
      trusted: true,
    });
    await expect(
      legacyCommand.codeAction({ kind: "quickfix", mode: "list", path: file }),
    ).resolves.toMatchObject({ actions: [] });
    await legacyCommand.shutdown();

    const wrongKind = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_CODE_ACTION_KIND: "refactor.extract" },
      trusted: true,
    });
    await expect(
      wrongKind.codeAction({ kind: "quickfix", mode: "list", path: file }),
    ).resolves.toMatchObject({ actions: [] });
    await expect(
      wrongKind.codeAction({
        kind: "quickfix",
        mode: "apply",
        path: file,
        title: "Replace oldName",
      }),
    ).rejects.toThrow("No matching supported");
    await wrongKind.shutdown();

    const namespacedKind = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_CODE_ACTION_KIND: "source.organizeImports.custom" },
      trusted: true,
    });
    await expect(
      namespacedKind.codeAction({
        kind: "source.organizeImports",
        mode: "list",
        path: file,
      }),
    ).resolves.toMatchObject({ actions: [{ kind: "source.organizeImports.custom" }] });
    await namespacedKind.shutdown();

    const oversizedKind = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_CODE_ACTION_KIND: `quickfix.${"x".repeat(200)}` },
      trusted: true,
    });
    await expect(
      oversizedKind.codeAction({ kind: "quickfix", mode: "list", path: file }),
    ).resolves.toMatchObject({ actions: [] });
    await oversizedKind.shutdown();

    const unresolved = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_CODE_ACTION_UNRESOLVED: "1" },
      trusted: true,
    });
    await expect(
      unresolved.codeAction({
        kind: "quickfix",
        mode: "apply",
        path: file,
        title: "Replace oldName",
      }),
    ).rejects.toThrow("does not contain a text edit");
    await unresolved.shutdown();

    const changedResolve = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_CODE_ACTION_CHANGED_TITLE: "1",
        FAKE_CODE_ACTION_RESOLVE: "1",
        FAKE_CODE_ACTION_UNRESOLVED: "1",
      },
      trusted: true,
    });
    await expect(
      changedResolve.codeAction({
        kind: "quickfix",
        mode: "apply",
        path: file,
        title: "Replace oldName",
      }),
    ).rejects.toThrow("changed its title");
    await changedResolve.shutdown();

    const emptyResolve = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_CODE_ACTION_RESOLVE: "1",
        FAKE_CODE_ACTION_RESOLVED_NO_EDIT: "1",
        FAKE_CODE_ACTION_UNRESOLVED: "1",
      },
      trusted: true,
    });
    await expect(
      emptyResolve.codeAction({
        kind: "quickfix",
        mode: "apply",
        path: file,
        title: "Replace oldName",
      }),
    ).rejects.toThrow("did not resolve to a text edit");
    await emptyResolve.shutdown();

    const unsupported = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_FALSE_CODE_ACTION: "1" },
      trusted: true,
    });
    await expect(
      unsupported.codeAction({ kind: "quickfix", mode: "list", path: file }),
    ).rejects.toThrow("does not support textDocument/codeAction");
    await unsupported.shutdown();

    const untrusted = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: false,
    });
    await expect(
      untrusted.codeAction({ kind: "quickfix", mode: "list", path: file }),
    ).rejects.toThrow("trusted project");
  });

  it("creates and deletes files through semantic lifecycle transactions", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-file-lifecycle-"));
    const related = join(root, "catalog.ts");
    const target = join(root, "created.ts");
    const log = join(root, "lifecycle.log");
    await writeFile(related, "old\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_LIFECYCLE_EDIT_FILE: related,
        FAKE_LSP_LOG: log,
      },
      trusted: true,
    });
    await manager.warmFile(related);
    const created = await manager.createFile(target, "BROKEN\n");
    expect(created).toMatchObject({ operation: "created", path: target });
    await expect(readFile(target, "utf8")).resolves.toBe("BROKEN\n");
    await expect(readFile(related, "utf8")).resolves.toBe("new\n");
    expect(created.changedFiles).toEqual(expect.arrayContaining([related, target]));

    const deleted = await manager.deleteFile(target);
    expect(deleted).toMatchObject({ operation: "deleted", path: target });
    await expect(access(target)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(related, "utf8")).resolves.toBe("old\n");
    const lifecycleCalls = (await readFile(log, "utf8")).split("\n");
    expect(lifecycleCalls.indexOf("workspace/willCreateFiles")).toBeLessThan(
      lifecycleCalls.indexOf("workspace/didCreateFiles"),
    );
    expect(lifecycleCalls.indexOf("workspace/willDeleteFiles")).toBeLessThan(
      lifecycleCalls.indexOf("workspace/didDeleteFiles"),
    );
    await expect(manager.createFile(target, "x".repeat(2 * 1024 * 1024 + 1))).rejects.toThrow(
      "exceeds",
    );
    await writeFile(target, "existing\n");
    await expect(manager.createFile(target, "new\n")).rejects.toThrow("already exists");
    await rm(target);
    await expect(manager.createFile(join(related, "child.ts"), "new\n")).rejects.toThrow(
      "existing parent directory",
    );
    const directoryTarget = join(root, "directory.ts");
    await mkdir(directoryTarget);
    await expect(manager.deleteFile(directoryTarget)).rejects.toThrow("files only");
    await expect(manager.createFile(join(root, "unknown.ext"), "new\n")).rejects.toThrow(
      "No installed LSP server",
    );
    const outsideCreate = join(tmpdir(), `pi-lsp-create-outside-${String(Date.now())}.ts`);
    const outsideDelete = join(tmpdir(), `pi-lsp-delete-outside-${String(Date.now())}.ts`);
    await writeFile(outsideDelete, "outside\n");
    await expect(manager.createFile(outsideCreate, "outside\n")).rejects.toThrow("trusted project");
    await expect(manager.deleteFile(outsideDelete)).rejects.toThrow("trusted project");
    await manager.shutdown();

    const unsupported = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_NO_FILE_LIFECYCLE: "1" },
      trusted: true,
    });
    await expect(unsupported.createFile(target, "content\n")).rejects.toThrow(
      "does not support workspace/willCreateFiles",
    );
    await writeFile(target, "content\n");
    await expect(unsupported.deleteFile(target)).rejects.toThrow(
      "does not support workspace/willDeleteFiles",
    );
    await unsupported.shutdown();

    const warningPath = join(root, "warning.ts");
    const warningManager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_EXIT_AFTER_WILL_LIFECYCLE: "1",
        FAKE_LIFECYCLE_NULL: "1",
      },
      trusted: true,
    });
    const warning = await warningManager.createFile(warningPath, "content\n");
    expect(warning.warning).toContain("creation committed");
    await expect(readFile(warningPath, "utf8")).resolves.toBe("content\n");
    await warningManager.shutdown();

    const warningDeletePath = join(root, "warning-delete.ts");
    await writeFile(warningDeletePath, "content\n");
    const warningDeleteManager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_EXIT_AFTER_WILL_LIFECYCLE: "1",
        FAKE_LIFECYCLE_NULL: "1",
      },
      trusted: true,
    });
    const deleteWarning = await warningDeleteManager.deleteFile(warningDeletePath);
    expect(deleteWarning.warning).toContain("deletion committed");
    await expect(access(warningDeletePath)).rejects.toMatchObject({ code: "ENOENT" });
    await warningDeleteManager.shutdown();

    const racedDeletePath = join(root, "raced-delete.ts");
    const raceLog = join(root, "lifecycle-race.log");
    await writeFile(racedDeletePath, "original\n");
    const racedDeleteManager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_LIFECYCLE_DELAY_MS: "100",
        FAKE_LIFECYCLE_NULL: "1",
        FAKE_LSP_LOG: raceLog,
      },
      trusted: true,
    });
    const racedDelete = racedDeleteManager.deleteFile(racedDeletePath);
    await waitForLog(raceLog, "workspace/willDeleteFiles");
    await writeFile(racedDeletePath, "concurrent\n");
    await expect(racedDelete).rejects.toThrow("changed after willDeleteFiles");
    await expect(readFile(racedDeletePath, "utf8")).resolves.toBe("concurrent\n");
    await racedDeleteManager.shutdown();

    const safeParent = join(root, "safe-parent");
    const outsideParent = await mkdtemp(join(tmpdir(), "pi-lsp-create-escape-"));
    const escapedCreatePath = join(safeParent, "escaped.ts");
    const createRaceLog = join(root, "create-race.log");
    await mkdir(safeParent);
    const escapedCreateManager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_LIFECYCLE_DELAY_MS: "100",
        FAKE_LIFECYCLE_NULL: "1",
        FAKE_LSP_LOG: createRaceLog,
      },
      trusted: true,
    });
    const escapedCreate = escapedCreateManager.createFile(escapedCreatePath, "content\n");
    await waitForLog(createRaceLog, "workspace/willCreateFiles");
    await rm(safeParent, { recursive: true });
    await symlink(outsideParent, safeParent);
    await expect(escapedCreate).rejects.toThrow("escaped");
    await expect(access(join(outsideParent, "escaped.ts"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await escapedCreateManager.shutdown();

    const untrusted = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: false,
    });
    await expect(untrusted.createFile(join(root, "no.ts"), "content\n")).rejects.toThrow(
      "trusted project",
    );
    await expect(untrusted.deleteFile(target)).rejects.toThrow("trusted project");
  });

  it("previews and applies version-validated semantic symbol renames", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-symbol-rename-manager-"));
    const file = join(root, "symbol.ts");
    await writeFile(file, "const oldName = oldName;\n");
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: true,
    });
    const preview = await manager.renameSymbol({
      column: 7,
      dryRun: true,
      line: 1,
      newName: "newName",
      path: file,
    });
    expect(preview).toMatchObject({ applied: false, changes: [{ editCount: 2 }] });
    await expect(readFile(file, "utf8")).resolves.toBe("const oldName = oldName;\n");

    const applied = await manager.renameSymbol({
      column: 7,
      dryRun: false,
      line: 1,
      newName: "newName",
      path: file,
    });
    expect(applied.applied).toBe(true);
    await expect(readFile(file, "utf8")).resolves.toBe("const newName = newName;\n");
    await expect(
      manager.renameSymbol({ column: 1, dryRun: true, line: 1, newName: "", path: file }),
    ).rejects.toThrow("non-empty name");
    await manager.shutdown();

    const raceFile = join(root, "race.ts");
    const raceLog = join(root, "race.log");
    await writeFile(raceFile, "const oldName = oldName;\n");
    const racing = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_LSP_LOG: raceLog,
        FAKE_RENAME_DELAY_MS: "100",
      },
      trusted: true,
    });
    const staleRename = racing.renameSymbol({
      column: 7,
      dryRun: false,
      line: 1,
      newName: "newName",
      path: raceFile,
    });
    await waitForLog(raceLog, "textDocument/rename");
    await writeFile(raceFile, "const external = oldName;\n");
    await expect(staleRename).rejects.toThrow("snapshot is stale");
    await expect(readFile(raceFile, "utf8")).resolves.toBe("const external = oldName;\n");
    await racing.shutdown();

    const closedFile = join(root, "closed.ts");
    await writeFile(closedFile, "note\n");
    await writeFile(raceFile, "const oldName = oldName;\n");
    const unversioned = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_RENAME_SECOND_URI: pathToFileURL(closedFile).href },
      trusted: true,
    });
    await expect(
      unversioned.renameSymbol({
        column: 7,
        dryRun: false,
        line: 1,
        newName: "newName",
        path: raceFile,
      }),
    ).rejects.toThrow("unversioned document that cannot be validated");
    await expect(readFile(closedFile, "utf8")).resolves.toBe("note\n");
    await expect(readFile(raceFile, "utf8")).resolves.toBe("const oldName = oldName;\n");
    await unversioned.shutdown();

    const confirmation = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_RENAME_ANNOTATION_CONFIRM: "1" },
      trusted: true,
    });
    await expect(
      confirmation.renameSymbol({
        column: 7,
        dryRun: false,
        line: 1,
        newName: "again",
        path: file,
      }),
    ).rejects.toThrow("interactive confirmation");
    await confirmation.shutdown();

    const rejectedPrepare = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_PREPARE_RENAME_NULL: "1" },
      trusted: true,
    });
    await expect(
      rejectedPrepare.renameSymbol({
        column: 7,
        dryRun: true,
        line: 1,
        newName: "again",
        path: file,
      }),
    ).rejects.toThrow("cannot be renamed");
    await expect(
      rejectedPrepare.renameSymbol({
        column: 7,
        dryRun: true,
        line: 1,
        newName: "x".repeat(257),
        path: file,
      }),
    ).rejects.toThrow("at most 256");
    await rejectedPrepare.shutdown();

    const untrusted = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      trusted: false,
    });
    await expect(
      untrusted.renameSymbol({
        column: 7,
        dryRun: true,
        line: 1,
        newName: "again",
        path: file,
      }),
    ).rejects.toThrow("trusted project");

    const withoutPrepare = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_NO_PREPARE_RENAME: "1" },
      trusted: true,
    });
    await expect(
      withoutPrepare.renameSymbol({
        column: 7,
        dryRun: true,
        line: 1,
        newName: "again",
        path: file,
      }),
    ).resolves.toMatchObject({ applied: false });
    await withoutPrepare.shutdown();

    const unavailable = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_NO_SYMBOL_RENAME: "1" },
      trusted: true,
    });
    await expect(
      unavailable.renameSymbol({
        column: 7,
        dryRun: true,
        line: 1,
        newName: "again",
        path: file,
      }),
    ).rejects.toThrow("does not support textDocument/rename");
    await unavailable.shutdown();
  });

  it("forwards bounded dynamically registered watched-file events", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-watched-files-"));
    const source = join(root, "source.ts");
    const log = join(root, "lsp.log");
    await writeFile(source, "source\n");
    let listener: ((eventType: string, filename: Buffer | string | null) => void) | undefined;
    const close = vi.fn();
    const manager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DYNAMIC_WATCHED_FILES: "1",
        FAKE_LSP_LOG: log,
        FAKE_WATCHER_GLOB: "*.ts",
      },
      trusted: true,
      watchFactory: (_workspaceRoot, nextListener) => {
        listener = nextListener;
        return { close };
      },
    });
    await manager.warmFile(source);
    await waitForCondition(() => listener !== undefined);
    const emit = listener;
    if (emit === undefined) throw new Error("Watcher listener missing.");

    const changed = join(root, "changed.ts");
    await writeFile(changed, "changed\n");
    emit("change", "changed.ts");
    await waitForLog(log, `watched:2:${pathToFileURL(changed).href}`);

    const created = join(root, "created.ts");
    await writeFile(created, "created\n");
    emit("rename", Buffer.from("created.ts"));
    await waitForLog(log, `watched:1:${pathToFileURL(created).href}`);

    await rm(created);
    emit("rename", "created.ts");
    await waitForLog(log, `watched:3:${pathToFileURL(created).href}`);
    emit("change", null);
    emit("change", "ignored.js");
    emit("change", "../outside.ts");
    const outsideTarget = join(tmpdir(), `pi-lsp-watched-outside-${String(Date.now())}.ts`);
    const escapingLink = join(root, "escaping.ts");
    await writeFile(outsideTarget, "outside\n");
    await symlink(outsideTarget, escapingLink);
    emit("change", "escaping.ts");
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 75));
    expect(await readFile(log, "utf8")).not.toContain(pathToFileURL(escapingLink).href);
    expect(firstStatusMessage(manager)).toBeUndefined();
    emit("change", "shutdown.ts");
    await manager.shutdown();
    expect(close).toHaveBeenCalledOnce();

    const unregisterClose = vi.fn();
    const unregistering = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DYNAMIC_WATCHED_FILES: "1",
        FAKE_UNREGISTER_WATCHED_FILES: "1",
        FAKE_WATCHER_GLOB: "*.ts",
      },
      trusted: true,
      watchFactory: () => ({ close: unregisterClose }),
    });
    await unregistering.warmFile(source);
    await waitForCondition(() => unregisterClose.mock.calls.length > 0);
    await unregistering.shutdown();
    expect(unregisterClose).toHaveBeenCalledOnce();

    const nested = join(root, "nested");
    await mkdir(nested);
    const nestedFile = join(nested, "nested.ts");
    await writeFile(nestedFile, "nested\n");
    let relativeListener:
      ((eventType: string, filename: Buffer | string | null) => void) | undefined;
    const relativeManager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DYNAMIC_WATCHED_FILES: "1",
        FAKE_LSP_LOG: log,
        FAKE_WATCHER_BASE_OBJECT: "1",
        FAKE_WATCHER_BASE_URI: pathToFileURL(nested).href,
        FAKE_WATCHER_GLOB: "*.ts",
        FAKE_WATCHER_OMIT_KIND: "1",
      },
      trusted: true,
      watchFactory: (_workspaceRoot, nextListener) => {
        nextListener("change", "nested/nested.ts");
        relativeListener = nextListener;
        return { close: vi.fn() };
      },
    });
    await relativeManager.warmFile(source);
    await waitForCondition(() => relativeListener !== undefined);
    relativeListener?.("change", "nested/nested.ts");
    await waitForLog(log, `watched:2:${pathToFileURL(nestedFile).href}`);
    await relativeManager.shutdown();

    let deleteListener: ((eventType: string, filename: Buffer | string | null) => void) | undefined;
    const deleteOnly = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DYNAMIC_WATCHED_FILES: "1",
        FAKE_LSP_LOG: log,
        FAKE_WATCHER_GLOB: "*.ts",
        FAKE_WATCHER_KIND: "4",
      },
      trusted: true,
      watchFactory: (_workspaceRoot, nextListener) => {
        deleteListener = nextListener;
        return { close: vi.fn() };
      },
    });
    await deleteOnly.warmFile(source);
    await waitForCondition(() => deleteListener !== undefined);
    const deletedOnlyFile = join(root, "deleted-only.ts");
    deleteListener?.("change", "deleted-only.ts");
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 75));
    expect(await readFile(log, "utf8")).not.toContain(pathToFileURL(deletedOnlyFile).href);
    deleteListener?.("rename", "deleted-only.ts");
    await waitForLog(log, `watched:3:${pathToFileURL(deletedOnlyFile).href}`);
    await deleteOnly.shutdown();

    let watcherError: ((error: Error) => void) | undefined;
    const errorClose = vi.fn();
    const asynchronousFailure = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_DYNAMIC_WATCHED_FILES: "1" },
      trusted: true,
      watchFactory: () => ({
        close: errorClose,
        onError: (listener) => {
          watcherError = listener;
        },
      }),
    });
    await asynchronousFailure.warmFile(source);
    await waitForCondition(() => watcherError !== undefined);
    watcherError?.(new Error("asynchronous watcher failure"));
    watcherError?.(new Error("stale watcher failure"));
    await waitForCondition(
      () =>
        firstStatusMessage(asynchronousFailure)?.includes("asynchronous watcher failure") === true,
    );
    expect(errorClose).toHaveBeenCalledOnce();
    await asynchronousFailure.shutdown();

    let batchListener: ((eventType: string, filename: Buffer | string | null) => void) | undefined;
    const batchManager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DYNAMIC_WATCHED_FILES: "1",
        FAKE_LSP_LOG: log,
        FAKE_WATCHER_GLOB: "*.ts",
      },
      trusted: true,
      watchFactory: (_workspaceRoot, nextListener) => {
        batchListener = nextListener;
        return { close: vi.fn() };
      },
    });
    await batchManager.warmFile(source);
    await waitForCondition(() => batchListener !== undefined);
    for (let index = 0; index < 129; index += 1) {
      batchListener?.("change", `batch-${String(index)}.ts`);
    }
    await waitForLog(log, "watchedBatch:128");
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 100));
    expect((await readFile(log, "utf8")).split("\n")).toContain("watchedBatch:1");
    expect(firstStatusMessage(batchManager)).toBeUndefined();
    await batchManager.shutdown();

    const futureBase = join(root, "future", "generated");
    const futureClose = vi.fn();
    let futureCreated = false;
    const futureManager = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DYNAMIC_WATCHED_FILES: "1",
        FAKE_WATCHER_BASE_URI: pathToFileURL(futureBase).href,
      },
      trusted: true,
      watchFactory: () => {
        futureCreated = true;
        return { close: futureClose };
      },
    });
    await futureManager.warmFile(source);
    await waitForCondition(() => futureCreated);
    expect(firstStatusMessage(futureManager)).toBeUndefined();
    await futureManager.shutdown();
    expect(futureClose).toHaveBeenCalledOnce();

    const noPatterns = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DYNAMIC_WATCHED_FILES: "1",
        FAKE_WATCHER_COUNT: "0",
      },
      trusted: true,
      watchFactory: () => {
        throw new Error("must not watch empty patterns");
      },
    });
    await noPatterns.warmFile(source);
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 50));
    expect(firstStatusMessage(noPatterns)).toBeUndefined();
    await noPatterns.shutdown();

    const unavailable = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: { ...process.env, FAKE_DYNAMIC_WATCHED_FILES: "1" },
      trusted: true,
      watchFactory: () => {
        throw new Error("recursive watching unavailable");
      },
    });
    await unavailable.warmFile(source);
    await waitForCondition(
      () => firstStatusMessage(unavailable)?.includes("recursive watching unavailable") === true,
    );
    expect(unavailable.status()[0]?.state).toBe("running");
    await unavailable.shutdown();

    for (const [env, message] of [
      [{ FAKE_MALFORMED_WATCHER_OPTIONS: "1" }, "malformed watcher options"],
      [{ FAKE_MALFORMED_WATCHER: "1" }, "malformed watcher"],
      [{ FAKE_WATCHER_GLOB: "" }, "invalid watcher glob"],
      [{ FAKE_WATCHER_KIND: "8" }, "invalid watcher kind"],
      [{ FAKE_WATCHER_BASE_URI: pathToFileURL(tmpdir()).href }, "escapes the workspace"],
    ] as const) {
      const invalid = new LspManager({
        cwd: root,
        definitions: [fakeDefinition()],
        env: { ...process.env, FAKE_DYNAMIC_WATCHED_FILES: "1", ...env },
        trusted: true,
        watchFactory: () => ({ close: vi.fn() }),
      });
      await invalid.warmFile(source);
      await waitForCondition(() => firstStatusMessage(invalid)?.includes(message) === true);
      expect(firstStatusMessage(invalid)).toContain(message);
      await invalid.shutdown();
    }

    const excessive = new LspManager({
      cwd: root,
      definitions: [fakeDefinition()],
      env: {
        ...process.env,
        FAKE_DYNAMIC_WATCHED_FILES: "1",
        FAKE_WATCHER_COUNT: "33",
      },
      trusted: true,
      watchFactory: () => {
        throw new Error("must not create watcher");
      },
    });
    await excessive.warmFile(source);
    await waitForCondition(
      () => firstStatusMessage(excessive)?.includes("32 pattern limit") === true,
    );
    expect(firstStatusMessage(excessive)).toContain("pattern limit");
    await excessive.shutdown();
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
    await manager.warmFile(imports);

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
