import { spawn } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

let buffer = Buffer.alloc(0);
const documents = new Map();
let nextServerRequestId = 100;

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

function publish(uri, version, text) {
  if (process.env.FAKE_NO_DIAGNOSTICS) return;
  const diagnostics = text.includes("BROKEN")
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
  return {
    capabilities: {
      textDocumentSync,
      ...(process.env.FAKE_NO_RENAME
        ? {}
        : {
            workspace: {
              fileOperations: {
                didRename: { filters: [{ pattern: { glob: "**/*" } }] },
                willRename: { filters: [{ pattern: { glob: "**/*" } }] },
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
      ? [{ id: "rename", method: "workspace/willRenameFiles", registerOptions: {} }]
      : [],
  });
  if (process.env.FAKE_CLIENT_EDGE_REQUESTS) {
    serverRequest("workspace/configuration", {});
    serverRequest("client/registerCapability", { registrations: [{}] });
    serverRequest("client/registerCapability", {});
  }
  serverRequest("client/unregisterCapability", { unregisterations: [] });
}

function handle(message) {
  const method = message.method;
  if (method) log(method);
  switch (method) {
    case "initialize": {
      const workspaceCapabilities = message.params.capabilities.workspace;
      if (workspaceCapabilities.workspaceEdit.resourceOperations) log("BAD_RESOURCE_OPERATIONS");
      if (
        workspaceCapabilities.fileOperations.didCreate ||
        workspaceCapabilities.fileOperations.didDelete ||
        workspaceCapabilities.fileOperations.willCreate ||
        workspaceCapabilities.fileOperations.willDelete ||
        workspaceCapabilities.fileOperations.dynamicRegistration
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
