import { mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { applyWorkspaceEdit } from "../src/workspace-edit.ts";

import type { WorkspaceEdit } from "vscode-languageserver-protocol";

describe("workspace edits", () => {
  it("applies UTF-16 text edits and can roll them back", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-edit-"));
    const file = join(root, "imports.ts");
    const secondFile = join(root, "secondary.ts");
    await writeFile(file, 'export { value } from "./old";\nconst face = "😀";\n');
    await writeFile(secondFile, "old\n");
    const edit: WorkspaceEdit = {
      changes: {
        [pathToFileURL(file).href]: [
          {
            newText: "./new",
            range: {
              end: { character: 28, line: 0 },
              start: { character: 23, line: 0 },
            },
          },
          {
            newText: "ok",
            range: {
              end: { character: 16, line: 1 },
              start: { character: 14, line: 1 },
            },
          },
        ],
        [pathToFileURL(secondFile).href]: [
          {
            newText: "new",
            range: {
              end: { character: 3, line: 0 },
              start: { character: 0, line: 0 },
            },
          },
        ],
      },
    };

    const transaction = await applyWorkspaceEdit(edit, root);
    expect(await readFile(file, "utf8")).toBe(
      'export { value } from "./new";\nconst face = "ok";\n',
    );
    expect(await readFile(secondFile, "utf8")).toBe("new\n");
    expect(transaction.changedFiles).toEqual([file, secondFile]);

    await transaction.rollback();
    expect(await readFile(file, "utf8")).toBe(
      'export { value } from "./old";\nconst face = "😀";\n',
    );
    expect(await readFile(secondFile, "utf8")).toBe("old\n");
  });

  it("rejects edits outside the workspace and overlapping edits", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-safe-"));
    const outside = join(tmpdir(), `outside-${String(Date.now())}.ts`);
    await writeFile(outside, "outside");

    await expect(
      applyWorkspaceEdit(
        {
          changes: {
            [pathToFileURL(outside).href]: [
              {
                newText: "x",
                range: {
                  end: { character: 1, line: 0 },
                  start: { character: 0, line: 0 },
                },
              },
            ],
          },
        },
        root,
      ),
    ).rejects.toThrow("outside the LSP workspace");

    const inside = join(root, "inside.ts");
    await writeFile(inside, "abcdef");
    await expect(
      applyWorkspaceEdit(
        {
          changes: {
            [pathToFileURL(inside).href]: [
              {
                newText: "x",
                range: {
                  end: { character: 4, line: 0 },
                  start: { character: 1, line: 0 },
                },
              },
              {
                newText: "y",
                range: {
                  end: { character: 5, line: 0 },
                  start: { character: 3, line: 0 },
                },
              },
            ],
          },
        },
        root,
      ),
    ).rejects.toThrow("overlapping text edits");
  });

  it("rejects resource operations returned by a rename preflight", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-resource-"));
    await expect(
      applyWorkspaceEdit(
        {
          documentChanges: [
            {
              kind: "rename",
              newUri: pathToFileURL(join(root, "new.ts")).href,
              oldUri: pathToFileURL(join(root, "old.ts")).href,
            },
          ],
        },
        root,
      ),
    ).rejects.toThrow("resource operations");
  });

  it("supports textDocument edits and keeps no-op preflights in the rename transaction", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-document-edit-"));
    const file = join(root, "document.ts");
    await writeFile(file, "before\n");
    const callback = vi.fn().mockResolvedValue(undefined);
    const transaction = await applyWorkspaceEdit(
      {
        documentChanges: [
          {
            edits: [
              {
                newText: "after",
                range: {
                  end: { character: 6, line: 0 },
                  start: { character: 0, line: 0 },
                },
              },
            ],
            textDocument: { uri: pathToFileURL(file).href, version: null },
          },
        ],
      },
      root,
      callback,
    );
    expect(callback).toHaveBeenCalledWith([file]);
    await expect(readFile(file, "utf8")).resolves.toBe("after\n");
    await transaction.rollback();
    await transaction.rollback();
    await expect(readFile(file, "utf8")).resolves.toBe("before\n");

    const noOp = vi.fn().mockResolvedValue(undefined);
    const noOpTransaction = await applyWorkspaceEdit(null, root, noOp);
    expect(noOp).toHaveBeenCalledWith([]);
    await expect(noOpTransaction.rollback()).resolves.toBeUndefined();
  });

  it("rejects unverifiable versions and canonicalizes alias queue targets", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-alias-edit-"));
    const file = join(root, "target.ts");
    const alias = join(root, "alias.ts");
    await writeFile(file, "abcd\n");
    await symlink(file, alias);

    await expect(
      applyWorkspaceEdit(
        {
          documentChanges: [
            {
              edits: [],
              textDocument: { uri: pathToFileURL(file).href, version: 1 },
            },
          ],
        },
        root,
      ),
    ).rejects.toThrow("versioned document edit");

    const transaction = await applyWorkspaceEdit(
      {
        changes: {
          [pathToFileURL(alias).href]: [
            {
              newText: "B",
              range: {
                end: { character: 2, line: 0 },
                start: { character: 1, line: 0 },
              },
            },
          ],
          [pathToFileURL(file).href]: [
            {
              newText: "A",
              range: {
                end: { character: 1, line: 0 },
                start: { character: 0, line: 0 },
              },
            },
          ],
        },
      },
      root,
    );
    await expect(readFile(file, "utf8")).resolves.toBe("ABcd\n");
    expect(transaction.changedFiles).toEqual([file]);
    await transaction.rollback();
    await expect(readFile(file, "utf8")).resolves.toBe("abcd\n");
  });

  it("restores semantic edits when the guarded filesystem operation fails", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-callback-rollback-"));
    const file = join(root, "imports.ts");
    await writeFile(file, "old\n");
    await expect(
      applyWorkspaceEdit(
        {
          changes: {
            [pathToFileURL(file).href]: [
              {
                newText: "new",
                range: {
                  end: { character: 3, line: 0 },
                  start: { character: 0, line: 0 },
                },
              },
            ],
          },
        },
        root,
        () => Promise.reject(new Error("rename failed")),
      ),
    ).rejects.toThrow("rename failed");
    await expect(readFile(file, "utf8")).resolves.toBe("old\n");
  });

  it("rejects malformed ranges, non-file URIs, excessive edits, and large files", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-lsp-invalid-edit-"));
    const file = join(root, "file.ts");
    await writeFile(file, "abc\n");
    const editFor = (start: { character: number; line: number }, end = start) => ({
      changes: {
        [pathToFileURL(file).href]: [{ newText: "x", range: { end, start } }],
      },
    });
    await expect(applyWorkspaceEdit(editFor({ character: -1, line: 0 }), root)).rejects.toThrow(
      "invalid character",
    );
    await expect(applyWorkspaceEdit(editFor({ character: 0, line: -1 }), root)).rejects.toThrow(
      "invalid line",
    );
    await expect(applyWorkspaceEdit(editFor({ character: 9, line: 0 }), root)).rejects.toThrow(
      "end of a line",
    );
    await expect(applyWorkspaceEdit(editFor({ character: 0, line: 9 }), root)).rejects.toThrow(
      "end of a file",
    );
    await expect(
      applyWorkspaceEdit(
        {
          changes: {
            [pathToFileURL(file).href]: [
              {
                newText: "x",
                range: {
                  end: { character: 1, line: 0 },
                  start: { character: 2, line: 0 },
                },
              },
            ],
          },
        },
        root,
      ),
    ).rejects.toThrow("reversed range");
    await expect(
      applyWorkspaceEdit(
        {
          changes: {
            "https://example.com/file.ts": [],
          },
        },
        root,
      ),
    ).rejects.toThrow("non-file URI");
    await expect(
      applyWorkspaceEdit(
        {
          changes: {
            [pathToFileURL(file).href]: Array.from({ length: 513 }, () => ({
              newText: "",
              range: {
                end: { character: 0, line: 0 },
                start: { character: 0, line: 0 },
              },
            })),
          },
        },
        root,
      ),
    ).rejects.toThrow("512 edit limit");
    await expect(
      applyWorkspaceEdit(
        {
          changes: {
            [pathToFileURL(file).href]: [
              {
                newText: "x".repeat(2 * 1024 * 1024 + 1),
                range: {
                  end: { character: 0, line: 0 },
                  start: { character: 0, line: 0 },
                },
              },
            ],
          },
        },
        root,
      ),
    ).rejects.toThrow("inserts more than");
    await expect(readFile(file, "utf8")).resolves.toBe("abc\n");

    const expanded = join(root, "expanded.ts");
    await writeFile(expanded, "x".repeat(1024 * 1024));
    await expect(
      applyWorkspaceEdit(
        {
          changes: {
            [pathToFileURL(expanded).href]: [
              {
                newText: "y".repeat(1024 * 1024 + 1),
                range: {
                  end: { character: 0, line: 0 },
                  start: { character: 0, line: 0 },
                },
              },
            ],
          },
        },
        root,
      ),
    ).rejects.toThrow("produces a file larger");
    await expect(readFile(expanded, "utf8")).resolves.toHaveLength(1024 * 1024);

    const large = join(root, "large.ts");
    await writeFile(large, "x".repeat(2 * 1024 * 1024 + 1));
    await expect(
      applyWorkspaceEdit(
        {
          changes: { [pathToFileURL(large).href]: [] },
        },
        root,
      ),
    ).rejects.toThrow("larger than");
  });
});
