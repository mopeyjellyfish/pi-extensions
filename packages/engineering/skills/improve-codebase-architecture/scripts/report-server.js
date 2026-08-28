#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { createServer, request } from "node:http";
import { chmod, readFile, rm, stat, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { spawn } from "node:child_process";

const MAX_AGE = 2 * 60 * 60 * 1000;
const SERVER_MARKER = "pi-blueprint-ledger";
const START_ATTEMPTS = 200;
const TERMINATE_ATTEMPTS = 20;
const args = process.argv.slice(2);
const command = args.shift();
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
};
const absolute = (value, name) =>
  value && isAbsolute(value)
    ? resolve(value)
    : (fail(`${name} must be an absolute path`), undefined);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const terminate = async (child) => {
  if (child.exitCode !== null) return;
  child.kill();
  for (let attempt = 0; attempt < TERMINATE_ATTEMPTS && child.exitCode === null; attempt += 1) {
    await sleep(25);
  }
  if (child.exitCode === null) {
    child.kill("SIGKILL");
    for (let attempt = 0; attempt < TERMINATE_ATTEMPTS && child.exitCode === null; attempt += 1) {
      await sleep(25);
    }
  }
};

async function start() {
  const report = absolute(option("--report"), "--report");
  const statePath = absolute(option("--state"), "--state");
  if (!report || !statePath) return;
  const maxAge = Number(option("--max-age-ms") ?? MAX_AGE);
  if (!Number.isInteger(maxAge) || maxAge < 100 || maxAge > MAX_AGE) {
    fail(`--max-age-ms must be an integer from 100 to ${String(MAX_AGE)}`);
    return;
  }
  try {
    const reportInfo = await stat(report);
    if (!reportInfo.isFile()) throw new Error("not a file");
  } catch {
    fail("report does not exist");
    return;
  }
  try {
    const state = JSON.parse(await readFile(statePath, "utf8"));
    if (Date.parse(state.expiresAt) > Date.now()) {
      fail("state path already belongs to a live report server");
      return;
    }
    await rm(statePath, { force: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
      fail("state path is not reusable");
      return;
    }
  }
  const child = spawn(
    process.execPath,
    [
      process.argv[1],
      "serve",
      "--report",
      report,
      "--state",
      statePath,
      "--max-age-ms",
      String(maxAge),
    ],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
  for (let attempt = 0; attempt < START_ATTEMPTS; attempt += 1) {
    try {
      const state = JSON.parse(await readFile(statePath, "utf8"));
      process.stdout.write(
        `${JSON.stringify({ report: state.report, url: state.url, expiresAt: state.expiresAt, statePath })}\n`,
      );
      return;
    } catch {
      await sleep(25);
    }
  }
  await terminate(child);
  await rm(statePath, { force: true });
  fail("report server did not start");
}

async function stop() {
  const statePath = absolute(option("--state"), "--state");
  if (!statePath) return;
  let state;
  try {
    state = JSON.parse(await readFile(statePath, "utf8"));
  } catch {
    return;
  }
  try {
    await new Promise((resolveStop, reject) => {
      const url = new URL(state.shutdownUrl);
      const req = request(
        {
          hostname: "127.0.0.1",
          port: url.port,
          path: url.pathname,
          method: "POST",
          headers: { "x-report-secret": state.secret },
        },
        (response) =>
          response.statusCode === 204 && response.headers["x-pi-report-server"] === SERVER_MARKER
            ? resolveStop()
            : reject(new Error("shutdown rejected")),
      );
      req.setTimeout(500, () => req.destroy(new Error("report server unreachable")));
      req.on("error", reject);
      req.end();
    });
    await rm(statePath, { force: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ECONNREFUSED") {
      await rm(statePath, { force: true });
      return;
    }
    fail(`report server unreachable; state expires ${state.expiresAt}`);
  }
}

async function serve() {
  const report = absolute(option("--report"), "--report");
  const statePath = absolute(option("--state"), "--state");
  const maxAge = Number(option("--max-age-ms"));
  if (!report || !statePath || !Number.isInteger(maxAge)) return;
  const token = randomBytes(24).toString("base64url");
  const secret = randomBytes(24).toString("base64url");
  const reportPath = `/report/${token}`;
  const eventPath = `/events/${token}`;
  const shutdownPath = `/shutdown/${token}`;
  const clients = new Set();
  let signature = "";
  let poll;
  let expiryTimer;
  let closePromise;
  const close = () => {
    if (closePromise) return closePromise;
    clearInterval(poll);
    clearTimeout(expiryTimer);
    for (const client of clients) client.end();
    clients.clear();
    closePromise = (async () => {
      await new Promise((resolveClose) => server.close(resolveClose));
      await rm(statePath, { force: true });
    })();
    return closePromise;
  };
  const server = createServer(async (req, response) => {
    const headers = {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    };
    if (req.url === reportPath && req.method === "GET") {
      try {
        const html = await readFile(report, "utf8");
        const reloadScript = `<script>new EventSource(${JSON.stringify(eventPath)}).onmessage=()=>location.reload()</script>`;
        const servedHtml = html.includes("</body>")
          ? html.replace("</body>", `${reloadScript}</body>`)
          : `${html}${reloadScript}`;
        response.writeHead(200, { ...headers, "Content-Type": "text/html; charset=utf-8" });
        response.end(servedHtml);
      } catch {
        response.writeHead(503, headers);
        response.end("Report unavailable");
      }
      return;
    }
    if (req.url === eventPath && req.method === "GET") {
      response.writeHead(200, {
        ...headers,
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
      });
      response.write(": connected\n\n");
      clients.add(response);
      req.on("close", () => clients.delete(response));
      return;
    }
    if (
      req.url === shutdownPath &&
      req.method === "POST" &&
      req.headers["x-report-secret"] === secret
    ) {
      response.writeHead(204, { ...headers, "X-Pi-Report-Server": SERVER_MARKER });
      response.end();
      void close();
      return;
    }
    response.writeHead(404, headers);
    response.end("Not found");
  });
  poll = setInterval(async () => {
    try {
      const info = await stat(report);
      const next = `${info.mtimeMs}:${info.size}`;
      if (signature && signature !== next)
        for (const client of clients) client.write("data: reload\n\n");
      signature = next;
    } catch {
      // Atomic replacement can briefly hide the report; retain the last complete response.
    }
  }, 100);
  server.listen(0, "127.0.0.1", async () => {
    const address = server.address();
    if (!address || typeof address === "string") return;
    const base = `http://127.0.0.1:${address.port}`;
    const expiresAt = new Date(Date.now() + maxAge).toISOString();
    try {
      const info = await stat(report);
      signature = `${info.mtimeMs}:${info.size}`;
      const state = {
        report,
        url: `${base}${reportPath}`,
        eventUrl: `${base}${eventPath}`,
        shutdownUrl: `${base}${shutdownPath}`,
        secret,
        expiresAt,
        statePath,
      };
      await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
      await chmod(statePath, 0o600);
      expiryTimer = setTimeout(() => void close(), maxAge);
      expiryTimer.unref();
    } catch {
      await close();
    }
  });
}

switch (command) {
  case "start":
    await start();
    break;
  case "stop":
    await stop();
    break;
  case "serve":
    await serve();
    break;
  default:
    fail("use start or stop");
}
