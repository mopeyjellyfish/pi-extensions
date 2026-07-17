import { describe, expect, it } from "vitest";

import {
  normalizeDocumentSymbols,
  normalizeHover,
  normalizeIncomingCalls,
  normalizeLocations,
  normalizeOutgoingCalls,
  normalizeTypeHierarchy,
  normalizeWorkspaceSymbols,
  queryMethod,
  queryNeedsPosition,
  renderQueryOutcome,
  toLspPosition,
} from "../src/query.ts";

import type {
  CallHierarchyItem,
  DocumentSymbol,
  Hover,
  Location,
  LocationLink,
  SymbolInformation,
  WorkspaceSymbol,
} from "vscode-languageserver-protocol";

describe("LSP query normalization", () => {
  it("validates one-based UTF-16 positions", () => {
    expect.hasAssertions();
    expect(toLspPosition("a😀b\r\nnext", 1, 4)).toEqual({ character: 3, line: 0 });
    expect(() => toLspPosition("one", 0, 1)).toThrow("line");
    expect(() => toLspPosition("one", 1, 0)).toThrow("column");
    expect(() => toLspPosition("one", 2, 1)).toThrow("end of the file");
    expect(() => toLspPosition("one", 1, 9)).toThrow("UTF-16");
    expect(queryNeedsPosition("definition")).toBe(true);
    expect(queryNeedsPosition("documentSymbols")).toBe(false);
    expect(queryMethod("typeDefinition")).toBe("textDocument/typeDefinition");
    expect(queryMethod("callHierarchyIncoming")).toBe("textDocument/prepareCallHierarchy");
    expect(queryMethod("typeHierarchySubtypes")).toBe("textDocument/prepareTypeHierarchy");
  });

  it("normalizes locations and location links", () => {
    expect.hasAssertions();
    const location: Location = {
      range: {
        end: { character: 5, line: 2 },
        start: { character: 1, line: 2 },
      },
      uri: "file:///tmp/example.ts",
    };
    const link: LocationLink = {
      targetRange: {
        end: { character: 9, line: 4 },
        start: { character: 0, line: 4 },
      },
      targetSelectionRange: {
        end: { character: 4, line: 4 },
        start: { character: 2, line: 4 },
      },
      targetUri: "file:///tmp/target.ts",
    };
    expect(normalizeLocations(location, "definition")).toMatchObject([
      { column: 2, kind: "definition", line: 3, path: "/tmp/example.ts" },
    ]);
    expect(normalizeLocations([link], "implementation")).toMatchObject([
      { column: 3, kind: "implementation", line: 5, path: "/tmp/target.ts" },
    ]);
    expect(normalizeLocations(null, "references")).toEqual([]);
    expect(
      normalizeLocations(
        {
          range: location.range,
          uri: "not a valid URI",
        },
        "declaration",
      ),
    ).toMatchObject([{ path: "not a valid URI" }]);
  });

  it("normalizes hierarchical, flat, and workspace symbols", () => {
    expect.hasAssertions();
    const hierarchical: DocumentSymbol[] = [
      {
        children: [
          {
            kind: 12,
            name: "run",
            range: {
              end: { character: 1, line: 3 },
              start: { character: 0, line: 1 },
            },
            selectionRange: {
              end: { character: 5, line: 1 },
              start: { character: 2, line: 1 },
            },
          },
        ],
        kind: 5,
        name: "Example",
        range: {
          end: { character: 1, line: 4 },
          start: { character: 0, line: 0 },
        },
        selectionRange: {
          end: { character: 7, line: 0 },
          start: { character: 0, line: 0 },
        },
      },
    ];
    expect(normalizeDocumentSymbols(hierarchical, "/tmp/example.ts")).toMatchObject([
      { kind: "class", name: "Example" },
      { containerName: "Example", kind: "function", name: "run" },
    ]);

    const flat: SymbolInformation[] = [
      {
        containerName: "Example",
        kind: 13,
        location: {
          range: {
            end: { character: 5, line: 2 },
            start: { character: 1, line: 2 },
          },
          uri: "file:///tmp/example.ts",
        },
        name: "value",
      },
    ];
    expect(normalizeDocumentSymbols(flat, "/tmp/ignored.ts")).toMatchObject([
      { containerName: "Example", kind: "variable", path: "/tmp/example.ts" },
    ]);
    const flatLocation = flat[0]?.location;
    if (flatLocation === undefined) throw new Error("Flat symbol fixture missing.");
    expect(
      normalizeDocumentSymbols(
        [
          {
            kind: 99 as SymbolInformation["kind"],
            location: flatLocation,
            name: "unknown",
          },
        ],
        "/tmp/ignored.ts",
      ),
    ).toMatchObject([{ kind: "kind-99" }]);

    const workspace: WorkspaceSymbol[] = [
      {
        kind: 12,
        location: { uri: "custom:generated" },
        name: "generated",
      },
    ];
    expect(normalizeWorkspaceSymbols(workspace)).toEqual([
      { kind: "function", name: "generated", path: "custom:generated" },
    ]);
    expect(
      normalizeWorkspaceSymbols([
        {
          containerName: "Example",
          kind: 13,
          location: flatLocation,
          name: "value",
        },
      ]),
    ).toMatchObject([{ containerName: "Example", line: 3, name: "value" }]);
    expect(normalizeWorkspaceSymbols(null)).toEqual([]);

    const hierarchyItem: CallHierarchyItem = {
      detail: "Example",
      kind: 12,
      name: "run",
      range: flatLocation.range,
      selectionRange: flatLocation.range,
      uri: flatLocation.uri,
    };
    expect(
      normalizeIncomingCalls([{ from: hierarchyItem, fromRanges: [flatLocation.range] }]),
    ).toMatchObject([{ containerName: "Example", kind: "incomingCall:function", name: "run" }]);
    expect(
      normalizeOutgoingCalls([{ fromRanges: [flatLocation.range], to: hierarchyItem }]),
    ).toMatchObject([{ kind: "outgoingCall:function", name: "run" }]);
    expect(normalizeTypeHierarchy([hierarchyItem], "supertype")).toMatchObject([
      { kind: "supertype:function", name: "run" },
    ]);
    expect(normalizeTypeHierarchy(null, "subtype")).toEqual([]);
  });

  it("sanitizes hover text and renders bounded results", () => {
    expect.hasAssertions();
    const hover: Hover = {
      contents: ["type info\u{0}", { language: "ts", value: "const value: number" }],
    };
    expect(normalizeHover(hover)).toContain("const value: number");
    expect(normalizeHover({ contents: { kind: "plaintext", value: "plain type" } })).toBe(
      "plain type",
    );
    expect(normalizeHover({ contents: "\u{0}\u{1}" })).toBeUndefined();
    expect(normalizeHover(null)).toBeUndefined();
    const rendered = renderQueryOutcome("/tmp", {
      hover: "type info",
      items: [
        {
          column: 2,
          containerName: "Example",
          kind: "function",
          line: 3,
          name: "run",
          path: "/tmp/example.ts",
        },
      ],
      omitted: 2,
      operation: "hover",
      serverNames: ["Fake LSP"],
    });
    expect(rendered).toContain("example.ts:3:2");
    expect(rendered).toContain("2 additional results omitted");
    const empty = renderQueryOutcome("/tmp", {
      items: [
        { kind: "symbol", name: "relative", path: "relative.ts" },
        { kind: "symbol", name: "outside", path: "/outside/example.ts" },
        { kind: "symbol", name: "no-path" },
      ],
      omitted: 1,
      operation: "workspaceSymbols",
      serverNames: [],
    });
    expect(empty).toContain("relative.ts");
    expect(empty).toContain("/outside/example.ts");
    expect(empty).toContain("1 additional result omitted");
    expect(
      renderQueryOutcome("/tmp", {
        items: [],
        omitted: 0,
        operation: "documentSymbols",
        serverNames: ["Fake LSP"],
      }),
    ).toContain("No results");
  });
});
