import { spawn } from "node:child_process";
import { mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const script = join(
  import.meta.dirname,
  "..",
  "skills",
  "improve-codebase-architecture",
  "scripts",
  "report-server.js",
);
const directories: string[] = [];
const activeStates = new Set<string>();

interface CommandResult {
  code: number | null;
  stderr: string;
  stdout: string;
}

interface StartupResult {
  expiresAt: string;
  report: string;
  statePath: string;
  url: string;
}

async function run(arguments_: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...arguments_]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      resolve({ code, stderr, stdout });
    });
  });
}

async function start(report: string, state: string, maxAge = 2000): Promise<StartupResult> {
  const result = await run([
    "start",
    "--report",
    report,
    "--state",
    state,
    "--max-age-ms",
    String(maxAge),
  ]);
  if (result.code !== 0) throw new Error(result.stderr || result.stdout);
  expect(result.code).toBe(0);
  expect(result.stdout.trim().split("\n")).toHaveLength(1);
  activeStates.add(state);
  return JSON.parse(result.stdout) as StartupResult;
}

async function stop(state: string): Promise<CommandResult> {
  const result = await run(["stop", "--state", state]);
  if (result.code === 0) activeStates.delete(state);
  return result;
}

async function waitUntil(check: () => Promise<boolean>, timeout = 1500): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("condition did not become true");
}

afterEach(async () => {
  await Promise.all([...activeStates].map(async (state) => stop(state)));
  activeStates.clear();
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("report-server CLI", () => {
  it("serves one tokenized loopback report and stops active clients idempotently", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "blueprint report "));
    directories.push(directory);
    const report = join(directory, "report.html");
    const state = join(directory, "state.json");
    const standalone = "<!doctype html><body><main>readable report</main></body>";
    await writeFile(report, standalone);

    const startup = await start(report, state);
    expect(startup.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/report\//u);
    expect(startup).not.toHaveProperty("secret");
    expect(startup).not.toHaveProperty("shutdownUrl");
    expect((await stat(state)).mode & 0o777).toBe(0o600);

    const duplicate = await run([
      "start",
      "--report",
      report,
      "--state",
      state,
      "--max-age-ms",
      "2000",
    ]);
    expect(duplicate.code).toBe(1);
    expect(duplicate.stderr).toContain("state path already belongs to a live report server");

    const response = await fetch(startup.url);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-type")).toMatch(/^text\/html/iu);
    const served = await response.text();
    expect(served).toContain("readable report");
    expect(served).toMatch(/new EventSource[\s\S]*onmessage/iu);
    expect(await readFile(report, "utf8")).toBe(standalone);
    expect((await fetch(new URL("/", startup.url))).status).toBe(404);

    const stateData = JSON.parse(await readFile(state, "utf8")) as { eventUrl: string };
    const events = await fetch(stateData.eventUrl);
    expect(events.headers.get("content-type")).toBe("text/event-stream");
    const reader = events.body?.getReader();
    await reader?.read();

    expect((await stop(state)).code).toBe(0);
    await expect(reader?.read()).resolves.toMatchObject({ done: true });
    await expect(stat(state)).rejects.toThrow();
    expect((await stop(state)).code).toBe(0);
  });

  it("notifies the injected reload client after an atomic replacement", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "blueprint report "));
    directories.push(directory);
    const report = join(directory, "report.html");
    const replacement = join(directory, "replacement.html");
    const state = join(directory, "state.json");
    await writeFile(report, "<!doctype html><body><main>before</main></body>");
    const startup = await start(report, state);
    const stateData = JSON.parse(await readFile(state, "utf8")) as { eventUrl: string };
    const events = await fetch(stateData.eventUrl);
    const reader = events.body?.getReader();
    await reader?.read();

    await writeFile(replacement, "<!doctype html><body><main>after</main></body>");
    await rename(replacement, report);
    const event = await reader?.read();
    expect(event?.value).toBeDefined();
    const eventBytes = event?.value as Uint8Array;
    expect(new TextDecoder().decode(eventBytes)).toBe("data: reload\n\n");

    const served = await (await fetch(startup.url)).text();
    expect(served).toContain("after");
    expect(served).toMatch(/new EventSource[\s\S]*onmessage/iu);
    expect(await readFile(report, "utf8")).not.toContain("EventSource");
    await reader?.cancel();
    expect((await stop(state)).code).toBe(0);
  });

  it("expires automatically and reports validation and unreachable-stop failures honestly", async () => {
    expect.hasAssertions();
    const directory = await mkdtemp(join(tmpdir(), "blueprint report "));
    directories.push(directory);
    const report = join(directory, "report.html");
    const state = join(directory, "state.json");
    await writeFile(report, "<!doctype html><body>expires</body>");

    const relative = await run(["start", "--report", "relative.html", "--state", state]);
    expect(relative.code).toBe(1);
    expect(relative.stderr).toContain("--report must be an absolute path");

    const missing = await run([
      "start",
      "--report",
      join(directory, "missing.html"),
      "--state",
      state,
    ]);
    expect(missing.code).toBe(1);
    expect(missing.stderr).toContain("report does not exist");

    const invalidLifetime = await run([
      "start",
      "--report",
      report,
      "--state",
      state,
      "--max-age-ms",
      "99",
    ]);
    expect(invalidLifetime.code).toBe(1);
    expect(invalidLifetime.stderr).toContain("--max-age-ms must be an integer from 100");

    const timeoutState = join(directory, "missing-parent", "state.json");
    const timedOut = await run([
      "start",
      "--report",
      report,
      "--state",
      timeoutState,
      "--max-age-ms",
      "2000",
    ]);
    expect(timedOut.code).toBe(1);
    expect(timedOut.stderr).toContain("report server did not start");
    await expect(stat(timeoutState)).rejects.toThrow();

    const startup = await start(report, state, 150);
    await waitUntil(async () => {
      try {
        await stat(state);
        return false;
      } catch {
        return true;
      }
    });
    activeStates.delete(state);
    await expect(fetch(startup.url)).rejects.toThrow();

    const closedServer = createServer();
    await new Promise<void>((resolve) => closedServer.listen(0, "127.0.0.1", resolve));
    const closedAddress = closedServer.address();
    if (!closedAddress || typeof closedAddress === "string")
      throw new Error("missing closed server address");
    await new Promise<void>((resolve, reject) => {
      closedServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    const staleState = join(directory, "stale.json");
    await writeFile(
      staleState,
      JSON.stringify({
        shutdownUrl: `http://127.0.0.1:${String(closedAddress.port)}/shutdown/token`,
        secret: "secret",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
      { mode: 0o600 },
    );
    expect((await stop(staleState)).code).toBe(0);
    await expect(stat(staleState)).rejects.toThrow();

    const hangingServer = createServer(() => {
      // Accept the connection without responding so stop must report its bounded timeout.
    });
    await new Promise<void>((resolve) => hangingServer.listen(0, "127.0.0.1", resolve));
    const address = hangingServer.address();
    if (!address || typeof address === "string") throw new Error("missing hanging server address");
    const unreachableState = join(directory, "unreachable.json");
    await writeFile(
      unreachableState,
      JSON.stringify({
        shutdownUrl: `http://127.0.0.1:${String(address.port)}/shutdown/token`,
        secret: "secret",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
      { mode: 0o600 },
    );
    const unreachable = await stop(unreachableState);
    expect(unreachable.code).toBe(1);
    expect(unreachable.stderr).toMatch(/unreachable[\s\S]*expires/iu);
    await expect(stat(unreachableState)).resolves.toBeDefined();
    await new Promise<void>((resolve, reject) => {
      hangingServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const unrelatedServer = createServer((_request, response) => {
      response.writeHead(204);
      response.end();
    });
    await new Promise<void>((resolve) => unrelatedServer.listen(0, "127.0.0.1", resolve));
    const unrelatedAddress = unrelatedServer.address();
    if (!unrelatedAddress || typeof unrelatedAddress === "string")
      throw new Error("missing unrelated server address");
    const unrelatedState = join(directory, "unrelated.json");
    await writeFile(
      unrelatedState,
      JSON.stringify({
        shutdownUrl: `http://127.0.0.1:${String(unrelatedAddress.port)}/shutdown/token`,
        secret: "secret",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
      { mode: 0o600 },
    );
    const unrelated = await stop(unrelatedState);
    expect(unrelated.code).toBe(1);
    expect(unrelated.stderr).toMatch(/unreachable[\s\S]*expires/iu);
    await expect(stat(unrelatedState)).resolves.toBeDefined();
    await new Promise<void>((resolve, reject) => {
      unrelatedServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });
});
