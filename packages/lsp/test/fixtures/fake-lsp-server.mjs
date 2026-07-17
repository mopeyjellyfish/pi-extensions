import { spawn } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

let buffer = Buffer.alloc(0);
const documents = new Map();
let nextServerRequestId = 100;
let lastCodeActionUri;

function log(method) {
  if (process.env.FAKE_LSP_LOG) appendFileSync(process.env.FAKE_LSP_LOG, `${method}\n`);
}

if (process.env.FAKE_IGNORE_SIGTERM) {
  process.on("SIGTERM", () => {
    log("SIGTERM");
  });
}

if (process.env.FAKE_CHILD_PID_FILE) {
  const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    stdio: "ignore",
  });
  writeFileSync(process.env.FAKE_CHILD_PID_FILE, String(child.pid));
  child.unref();
}

function send(message) {
  const body = Buffer.from(JSON.stringify(message));
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function serverRequest(method, params) {
  log(method);
  send({ id: nextServerRequestId, jsonrpc: "2.0", method, params });
  nextServerRequestId += 1;
}

function diagnosticsFor(text) {
  return text.includes("BROKEN")
    ? [
        {
          code: "FAKE1",
          message: "synthetic failure",
          range: {
            end: { character: 6, line: 0 },
            start: { character: 0, line: 0 },
          },
          severity: 1,
          source: "fake",
        },
      ]
    : [];
}

function publish(uri, version, text) {
  if (process.env.FAKE_NO_DIAGNOSTICS) return;
  const diagnostics = diagnosticsFor(text);
  const publishedVersion = process.env.FAKE_STALE_VERSION ? Math.max(0, version - 1) : version;
  const params = {
    diagnostics,
    uri,
    ...(process.env.FAKE_UNVERSIONED ? {} : { version: publishedVersion }),
  };
  const delay = Number(process.env.FAKE_DIAGNOSTIC_DELAY_MS ?? "0");
  if (delay > 0) {
    setTimeout(() => {
      send({ jsonrpc: "2.0", method: "textDocument/publishDiagnostics", params });
    }, delay);
  } else {
    send({ jsonrpc: "2.0", method: "textDocument/publishDiagnostics", params });
  }
}

function initializeResult() {
  let textDocumentSync = { change: 1, openClose: true, save: { includeText: false } };
  if (process.env.FAKE_INCREMENTAL) {
    textDocumentSync = { change: 2, openClose: true, save: { includeText: true } };
  } else if (process.env.FAKE_INCREMENTAL_NO_OPEN) {
    textDocumentSync = { change: 2, openClose: false, save: false };
  } else if (process.env.FAKE_DISABLED_SYNC) {
    textDocumentSync = { change: 0, openClose: false, save: false };
  } else if (process.env.FAKE_NUMERIC_SYNC) {
    textDocumentSync = 1;
  }
  const renameGlob = process.env.FAKE_RENAME_GLOB ?? "**/*";
  const renamePattern = {
    glob: renameGlob,
    ...(process.env.FAKE_RENAME_IGNORE_CASE ? { options: { ignoreCase: true } } : {}),
  };
  return {
    capabilities: {
      codeActionProvider: process.env.FAKE_NO_CODE_ACTION
        ? undefined
        : process.env.FAKE_FALSE_CODE_ACTION
          ? false
          : { resolveProvider: Boolean(process.env.FAKE_CODE_ACTION_RESOLVE) },
      ...(process.env.FAKE_NO_QUERY
        ? {}
        : {
            callHierarchyProvider: true,
            declarationProvider: true,
            definitionProvider: true,
            documentSymbolProvider: true,
            hoverProvider: true,
            implementationProvider: true,
            referencesProvider: true,
            renameProvider: process.env.FAKE_NO_SYMBOL_RENAME
              ? undefined
              : process.env.FAKE_NO_PREPARE_RENAME
                ? true
                : { prepareProvider: true },
            typeDefinitionProvider: true,
            typeHierarchyProvider: true,
            workspaceSymbolProvider: true,
          }),
      ...(process.env.FAKE_PULL_DIAGNOSTICS
        ? {
            diagnosticProvider: {
              identifier: "fake",
              interFileDependencies: true,
              workspaceDiagnostics: Boolean(process.env.FAKE_WORKSPACE_DIAGNOSTICS),
            },
          }
        : {}),
      ...(process.env.FAKE_POSITION_ENCODING
        ? { positionEncoding: process.env.FAKE_POSITION_ENCODING }
        : {}),
      textDocumentSync,
      ...(process.env.FAKE_NO_RENAME
        ? {}
        : {
            workspace: {
              fileOperations: {
                didRename: { filters: [{ pattern: renamePattern }] },
                willRename: { filters: [{ pattern: renamePattern }] },
              },
            },
          }),
    },
  };
}

function exerciseClientRequests() {
  serverRequest("workspace/configuration", { items: [{ section: "fake" }] });
  serverRequest("workspace/workspaceFolders", null);
  serverRequest("window/workDoneProgress/create", { token: "fake" });
  serverRequest("workspace/applyEdit", { edit: { changes: {} } });
  serverRequest("client/registerCapability", {
    registrations: process.env.FAKE_DYNAMIC_RENAME
      ? [
          {
            id: "rename",
            method: "workspace/willRenameFiles",
            registerOptions: {
              filters: [{ scheme: "file", pattern: { glob: "**/*.{ts,tsx}" } }],
            },
          },
        ]
      : [],
  });
  if (process.env.FAKE_DYNAMIC_QUERY) {
    serverRequest("client/registerCapability", {
      registrations: [{ id: "hover", method: "textDocument/hover", registerOptions: {} }],
    });
  }
  if (process.env.FAKE_DYNAMIC_CODE_ACTION) {
    serverRequest("client/registerCapability", {
      registrations: [
        {
          id: "code-action",
          method: "textDocument/codeAction",
          registerOptions: { resolveProvider: true },
        },
      ],
    });
  }
  if (process.env.FAKE_DYNAMIC_SYMBOL_RENAME) {
    serverRequest("client/registerCapability", {
      registrations: [
        {
          id: "symbol-rename",
          method: "textDocument/rename",
          registerOptions: process.env.FAKE_DYNAMIC_PREPARE_RENAME ? { prepareProvider: true } : {},
        },
      ],
    });
  }
  if (process.env.FAKE_CLIENT_EDGE_REQUESTS) {
    serverRequest("workspace/configuration", {});
    serverRequest("client/registerCapability", { registrations: [{}] });
    serverRequest("client/registerCapability", {});
  }
  serverRequest("client/unregisterCapability", { unregisterations: [] });
  if (process.env.FAKE_DIAGNOSTIC_REFRESH) {
    setTimeout(() => {
      serverRequest("workspace/diagnostic/refresh", null);
    }, 50);
  }
  if (process.env.FAKE_UNREGISTER_RENAME) {
    setTimeout(() => {
      serverRequest("client/unregisterCapability", {
        unregisterations: [{ id: "rename", method: "workspace/willRenameFiles" }],
      });
    }, 50);
  }
}

function handle(message) {
  const method = message.method;
  if (method) log(method);
  switch (method) {
    case "initialize": {
      const workspaceCapabilities = message.params.capabilities.workspace;
      if (workspaceCapabilities.workspaceEdit.resourceOperations) log("BAD_RESOURCE_OPERATIONS");
      if (workspaceCapabilities.workspaceEdit.documentChanges !== true) {
        log("MISSING_DOCUMENT_CHANGES");
      }
      if (
        workspaceCapabilities.fileOperations.didCreate ||
        workspaceCapabilities.fileOperations.didDelete ||
        workspaceCapabilities.fileOperations.willCreate ||
        workspaceCapabilities.fileOperations.willDelete
      ) {
        log("BAD_FILE_OPERATION_CAPABILITIES");
      }
      if (process.env.FAKE_STDERR) process.stderr.write("fake server stderr\n");
      if (process.env.FAKE_INITIALIZE_ERROR) {
        send({
          error: { code: -32_603, message: "initialize failed" },
          id: message.id,
          jsonrpc: "2.0",
        });
      } else {
        const respond = () => {
          send({ id: message.id, jsonrpc: "2.0", result: initializeResult() });
        };
        const initializeDelay = Number(process.env.FAKE_INITIALIZE_DELAY_MS ?? "0");
        if (initializeDelay > 0) setTimeout(respond, initializeDelay);
        else respond();
      }
      break;
    }
    case "initialized": {
      exerciseClientRequests();
      break;
    }
    case "shutdown": {
      if (!process.env.FAKE_NO_SHUTDOWN_RESPONSE) {
        send({ id: message.id, jsonrpc: "2.0", result: null });
      }
      break;
    }
    case "exit": {
      if (!process.env.FAKE_IGNORE_EXIT) process.stdin.destroy();
      break;
    }
    case "textDocument/didOpen": {
      const doc = message.params.textDocument;
      log(`didOpenLanguage:${String(doc.languageId)}`);
      documents.set(doc.uri, { text: doc.text, version: doc.version });
      publish(doc.uri, doc.version, doc.text);
      break;
    }
    case "textDocument/didChange": {
      const doc = message.params.textDocument;
      const text = message.params.contentChanges.at(-1)?.text ?? "";
      documents.set(doc.uri, { text, version: doc.version });
      log(`didChangeVersion:${String(doc.version)}`);
      publish(doc.uri, doc.version, text);
      break;
    }
    case "textDocument/diagnostic": {
      if (message.params.previousResultId && !process.env.FAKE_FORCE_FULL_DIAGNOSTICS) {
        send({
          id: message.id,
          jsonrpc: "2.0",
          result: { kind: "unchanged", resultId: `${message.params.previousResultId}-next` },
        });
        break;
      }
      const uri = message.params.textDocument.uri;
      const document = documents.get(uri) ?? { text: "", version: 0 };
      const relatedFile = process.env.FAKE_RELATED_DIAGNOSTIC_FILE;
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: {
          items: diagnosticsFor(document.text),
          kind: "full",
          ...(relatedFile
            ? {
                relatedDocuments: {
                  [pathToFileURL(relatedFile).href]: {
                    items: diagnosticsFor("BROKEN"),
                    kind: "full",
                    resultId: "related-1",
                  },
                },
              }
            : {}),
          resultId: `document-${String(document.version)}`,
        },
      });
      break;
    }
    case "workspace/diagnostic": {
      const previous = new Map(
        message.params.previousResultIds.map((item) => [item.uri, item.value]),
      );
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: {
          items: [...documents].map(([uri, document]) => {
            const previousResultId = previous.get(uri);
            return previousResultId && !process.env.FAKE_FORCE_FULL_DIAGNOSTICS
              ? {
                  kind: "unchanged",
                  resultId: `${String(previousResultId)}-next`,
                  uri,
                  version: document.version,
                }
              : {
                  items: diagnosticsFor(document.text),
                  kind: "full",
                  resultId: `workspace-${String(document.version)}`,
                  uri,
                  version: document.version,
                };
          }),
        },
      });
      break;
    }
    case "textDocument/prepareCallHierarchy":
    case "textDocument/prepareTypeHierarchy": {
      const uri = message.params.textDocument.uri;
      const rootCount = Number(process.env.FAKE_HIERARCHY_ROOTS ?? "1");
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: Array.from({ length: rootCount }, (_, index) => ({
          detail: "fixture",
          kind: 12,
          name: `rootSymbol${String(index)}`,
          range: {
            end: { character: 13, line: 0 },
            start: { character: 6, line: 0 },
          },
          selectionRange: {
            end: { character: 13, line: 0 },
            start: { character: 6, line: 0 },
          },
          uri,
        })),
      });
      break;
    }
    case "callHierarchy/incomingCalls":
    case "callHierarchy/outgoingCalls": {
      const target = {
        ...message.params.item,
        name: method === "callHierarchy/incomingCalls" ? "caller" : "callee",
      };
      const resultCount = Number(process.env.FAKE_HIERARCHY_RESULTS ?? "1");
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: Array.from({ length: resultCount }, () =>
          method === "callHierarchy/incomingCalls"
            ? { from: target, fromRanges: [message.params.item.selectionRange] }
            : { fromRanges: [message.params.item.selectionRange], to: target },
        ),
      });
      break;
    }
    case "typeHierarchy/subtypes":
    case "typeHierarchy/supertypes": {
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: [
          {
            ...message.params.item,
            kind: 5,
            name: method === "typeHierarchy/subtypes" ? "ChildType" : "ParentType",
          },
        ],
      });
      break;
    }
    case "textDocument/codeAction": {
      const uri = message.params.textDocument.uri;
      lastCodeActionUri = uri;
      const document = documents.get(uri) ?? { text: "", version: 1 };
      const requestedKind = message.params.context.only?.[0] ?? "quickfix";
      const baseEdit = {
        documentChanges: [
          {
            edits: [
              {
                newText:
                  requestedKind === "source.organizeImports" ? "// organized\n" : "fixedName",
                range:
                  requestedKind === "source.organizeImports"
                    ? {
                        end: { character: 0, line: 0 },
                        start: { character: 0, line: 0 },
                      }
                    : {
                        end: { character: 13, line: 0 },
                        start: { character: 6, line: 0 },
                      },
              },
            ],
            textDocument: { uri, version: document.version },
          },
        ],
      };
      const action = {
        ...(process.env.FAKE_CODE_ACTION_COMMAND
          ? { command: { command: "fake.command", title: "Run command" } }
          : {}),
        ...(process.env.FAKE_CODE_ACTION_DISABLED
          ? {
              disabled: {
                reason: process.env.FAKE_CODE_ACTION_LONG_DISABLED
                  ? "x".repeat(2048)
                  : "disabled by fixture",
              },
            }
          : {}),
        ...(process.env.FAKE_CODE_ACTION_UNRESOLVED ? {} : { edit: baseEdit }),
        ...(process.env.FAKE_CODE_ACTION_UNRESOLVED && !process.env.FAKE_CODE_ACTION_NO_DATA
          ? { data: { uri } }
          : {}),
        isPreferred: true,
        kind: process.env.FAKE_CODE_ACTION_KIND ?? requestedKind,
        title: process.env.FAKE_CODE_ACTION_EMPTY_TITLE
          ? ""
          : requestedKind === "source.organizeImports"
            ? "Organize Imports"
            : "Replace oldName",
      };
      const returnedAction = process.env.FAKE_CODE_ACTION_AS_COMMAND
        ? { command: "fake.command", title: "Legacy command" }
        : action;
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: process.env.FAKE_CODE_ACTION_EMPTY
          ? null
          : process.env.FAKE_CODE_ACTION_LATE_DUPLICATE
            ? [
                returnedAction,
                ...Array.from({ length: 31 }, (_, index) => ({
                  ...action,
                  title: `Other action ${String(index)}`,
                })),
                returnedAction,
              ]
            : process.env.FAKE_CODE_ACTION_DUPLICATE
              ? [returnedAction, returnedAction]
              : [returnedAction],
      });
      break;
    }
    case "codeAction/resolve": {
      const uri = message.params.data?.uri ?? lastCodeActionUri;
      const document = documents.get(uri) ?? { version: 1 };
      const edit = {
        documentChanges: [
          {
            edits: [
              {
                newText: "fixedName",
                range: {
                  end: { character: 13, line: 0 },
                  start: { character: 6, line: 0 },
                },
              },
            ],
            textDocument: { uri, version: document.version },
          },
        ],
      };
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: {
          ...message.params,
          ...(process.env.FAKE_CODE_ACTION_RESOLVED_COMMAND
            ? { command: { command: "fake.command", title: "Run command" } }
            : {}),
          ...(process.env.FAKE_CODE_ACTION_RESOLVED_NO_EDIT ? {} : { edit }),
          title: process.env.FAKE_CODE_ACTION_CHANGED_TITLE
            ? "Changed title"
            : message.params.title,
        },
      });
      break;
    }
    case "textDocument/prepareRename": {
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: process.env.FAKE_PREPARE_RENAME_NULL
          ? null
          : {
              placeholder: "oldName",
              range: {
                end: { character: 13, line: 0 },
                start: { character: 6, line: 0 },
              },
            },
      });
      break;
    }
    case "textDocument/rename": {
      const uri = message.params.textDocument.uri;
      const document = documents.get(uri) ?? { text: "", version: 1 };
      const annotationId = process.env.FAKE_RENAME_ANNOTATION_CONFIRM ? "confirm" : undefined;
      const response = {
        id: message.id,
        jsonrpc: "2.0",
        result: {
          ...(annotationId
            ? {
                changeAnnotations: {
                  [annotationId]: { label: "Confirm rename", needsConfirmation: true },
                },
              }
            : {}),
          documentChanges: [
            {
              edits: [
                {
                  ...(annotationId ? { annotationId } : {}),
                  newText: message.params.newName,
                  range: {
                    end: { character: 13, line: 0 },
                    start: { character: 6, line: 0 },
                  },
                },
                {
                  newText: message.params.newName,
                  range: {
                    end: { character: 23, line: 0 },
                    start: { character: 16, line: 0 },
                  },
                },
              ],
              textDocument: { uri, version: document.version },
            },
            ...(process.env.FAKE_RENAME_SECOND_URI
              ? [
                  {
                    edits: [
                      {
                        newText: "N",
                        range: {
                          end: { character: 1, line: 0 },
                          start: { character: 0, line: 0 },
                        },
                      },
                    ],
                    textDocument: { uri: process.env.FAKE_RENAME_SECOND_URI, version: null },
                  },
                ]
              : []),
          ],
        },
      };
      const renameDelay = Number(process.env.FAKE_RENAME_DELAY_MS ?? "0");
      const respond = () => send(response);
      if (renameDelay > 0) setTimeout(respond, renameDelay);
      else respond();
      break;
    }
    case "textDocument/declaration":
    case "textDocument/definition":
    case "textDocument/implementation":
    case "textDocument/typeDefinition": {
      const uri = message.params.textDocument.uri;
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: [
          {
            targetRange: {
              end: { character: 12, line: 4 },
              start: { character: 0, line: 4 },
            },
            targetSelectionRange: {
              end: { character: 5, line: 4 },
              start: { character: 0, line: 4 },
            },
            targetUri: uri,
          },
        ],
      });
      break;
    }
    case "textDocument/references": {
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: [
          {
            range: {
              end: { character: 8, line: 2 },
              start: { character: 2, line: 2 },
            },
            uri: message.params.textDocument.uri,
          },
        ],
      });
      break;
    }
    case "textDocument/hover": {
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: process.env.FAKE_HOVER_NULL
          ? null
          : { contents: { kind: "markdown", value: "```ts\\nconst value: number\\n```" } },
      });
      break;
    }
    case "textDocument/documentSymbol": {
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: [
          {
            children: [
              {
                kind: 12,
                name: "method",
                range: {
                  end: { character: 1, line: 3 },
                  start: { character: 0, line: 2 },
                },
                selectionRange: {
                  end: { character: 8, line: 2 },
                  start: { character: 2, line: 2 },
                },
              },
            ],
            kind: 5,
            name: "Example",
            range: {
              end: { character: 1, line: 5 },
              start: { character: 0, line: 0 },
            },
            selectionRange: {
              end: { character: 13, line: 0 },
              start: { character: 6, line: 0 },
            },
          },
        ],
      });
      break;
    }
    case "workspace/symbol": {
      if (process.env.FAKE_WORKSPACE_SYMBOL_ERROR) {
        send({
          error: { code: -32_603, message: "workspace symbol failed" },
          id: message.id,
          jsonrpc: "2.0",
        });
        break;
      }
      const uri = pathToFileURL(process.env.FAKE_WORKSPACE_SYMBOL_FILE ?? process.cwd()).href;
      send({
        id: message.id,
        jsonrpc: "2.0",
        result: [
          {
            containerName: "workspace",
            kind: 12,
            location: {
              range: {
                end: { character: 8, line: 1 },
                start: { character: 0, line: 1 },
              },
              uri,
            },
            name: `symbol:${String(message.params.query)}`,
          },
        ],
      });
      break;
    }
    case "workspace/willRenameFiles": {
      const importFile = process.env.FAKE_IMPORT_FILE;
      let result = null;
      if (process.env.FAKE_EDIT_RENAMED_FILE) {
        result = {
          changes: {
            [message.params.files[0].oldUri]: [
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
      } else if (importFile && !process.env.FAKE_RENAME_NULL) {
        result = {
          changes: {
            [pathToFileURL(importFile).href]: [
              {
                newText: "./new",
                range: {
                  end: { character: 28, line: 0 },
                  start: { character: 23, line: 0 },
                },
              },
            ],
          },
        };
      }
      if (process.env.FAKE_NO_RENAME_RESPONSE) break;
      const respond = () => {
        send({ id: message.id, jsonrpc: "2.0", result });
        if (process.env.FAKE_EXIT_AFTER_WILL_RENAME) process.stdin.destroy();
      };
      const delay = Number(process.env.FAKE_RENAME_DELAY_MS ?? "0");
      if (delay > 0) setTimeout(respond, delay);
      else respond();
      break;
    }
    case "workspace/didRenameFiles": {
      if (process.env.FAKE_DID_RENAME_EXIT) process.stdin.destroy();
      break;
    }
    default: {
      break;
    }
  }
}

function drain() {
  for (;;) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;
    const header = buffer.subarray(0, headerEnd).toString("ascii");
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) throw new Error("Missing Content-Length header.");
    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + length) return;
    const body = buffer.subarray(bodyStart, bodyStart + length).toString("utf8");
    buffer = buffer.subarray(bodyStart + length);
    handle(JSON.parse(body));
  }
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  drain();
});
