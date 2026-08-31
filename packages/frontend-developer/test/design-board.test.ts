import { access, mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import frontendDeveloperExtension from "../src/index.ts";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+3MxZ5wAAAABJRU5ErkJggg==",
  "base64",
);

interface ToolResult {
  readonly content: readonly { text: string; type: "text" }[];
  readonly details: Record<string, unknown>;
}

interface DesignBoardTool {
  readonly name: string;
  readonly parameters: { readonly additionalProperties?: boolean };
  execute(
    id: string,
    input: Record<string, unknown>,
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<ToolResult>;
}

interface Harness {
  readonly entries: { customType: string; data: unknown; type: "custom" }[];
  readonly exec: ReturnType<typeof vi.fn>;
  readonly messages: { message: Record<string, unknown>; options?: Record<string, unknown> }[];
  readonly sessionStart: ((event: { reason: string }, ctx: ExtensionContext) => Promise<void>)[];
  readonly sessionShutdown: ((event: {
    reason: "quit" | "reload" | "new" | "resume" | "fork";
  }) => Promise<void>)[];
  readonly tool: DesignBoardTool;
}

function register(execResult?: {
  code: number;
  killed: boolean;
  stderr: string;
  stdout: string;
}): Harness {
  const tools: DesignBoardTool[] = [];
  const entries: Harness["entries"] = [];
  const messages: Harness["messages"] = [];
  const sessionStart: Harness["sessionStart"] = [];
  const sessionShutdown: Harness["sessionShutdown"] = [];
  const result = execResult ?? { code: 0, killed: false, stderr: "", stdout: "" };
  const exec = vi.fn(() => Promise.resolve(result));
  frontendDeveloperExtension({
    appendEntry(customType: string, data: unknown) {
      entries.push({ customType, data, type: "custom" });
    },
    exec,
    on(event: string, handler: never) {
      if (event === "session_start") sessionStart.push(handler);
      if (event === "session_shutdown") sessionShutdown.push(handler);
    },
    registerTool(value: DesignBoardTool) {
      tools.push(value);
    },
    sendMessage(message: Record<string, unknown>, options?: Record<string, unknown>) {
      messages.push({ message, ...(options === undefined ? {} : { options }) });
    },
  } as unknown as ExtensionAPI);
  const tool = tools.find((value) => value.name === "design_board");
  if (!tool) throw new Error("design_board was not registered");
  return { entries, exec, messages, sessionShutdown, sessionStart, tool };
}

function context(
  cwd: string,
  branch: readonly unknown[] = [],
  mode: "json" | "print" | "rpc" | "tui" = "print",
): ExtensionContext {
  return {
    cwd,
    mode,
    sessionManager: { getBranch: () => branch },
  } as unknown as ExtensionContext;
}

async function images(root: string): Promise<void> {
  await mkdir(join(root, "evidence"));
  await writeFile(join(root, "evidence", "calm.png"), PNG);
  await writeFile(join(root, "evidence", "bold.png"), PNG);
}

function presentation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    action: "present",
    directions: [
      {
        description: "Quiet & focused",
        id: "calm",
        imagePath: "evidence/calm.png",
        label: "Calm <focus>",
      },
      {
        description: "Fast and dense",
        id: "bold",
        imagePath: "evidence/bold.png",
        label: "Bold utility",
      },
    ],
    feedbackMode: "board",
    liveSiteUrl: "http://127.0.0.1:3000",
    recommendedDirectionId: "calm",
    title: "Dashboard directions",
    ...overrides,
  };
}

function formValues(html: string): { token: string; version: string } {
  const token = /name="token" type="hidden" value="([^"]+)"/u.exec(html)?.[1];
  const version = /name="version" type="hidden" value="([^"]+)"/u.exec(html)?.[1];
  if (!token || !version) throw new Error("Board form values were missing");
  return { token, version };
}

async function postFeedback(
  url: string,
  values: Record<string, string>,
  options: { contentType?: string; origin?: string } = {},
): Promise<Response> {
  return fetch(new URL("feedback", url), {
    body: new URLSearchParams(values),
    headers: {
      "content-type": options.contentType ?? "application/x-www-form-urlencoded",
      ...(options.origin === undefined ? {} : { origin: options.origin }),
    },
    method: "POST",
    redirect: "manual",
  });
}

async function close(harness: Harness, root: string): Promise<void> {
  await harness.tool.execute("close", { action: "close" }, undefined, undefined, context(root));
}

async function rawStatus(url: string, host: string): Promise<number> {
  const parsed = new URL(url);
  return new Promise<number>((resolveStatus, reject) => {
    const call = request(
      {
        headers: { host },
        hostname: parsed.hostname,
        method: "GET",
        path: parsed.pathname,
        port: parsed.port,
      },
      (response) => {
        response.resume();
        response.once("end", () => {
          resolveStatus(response.statusCode ?? 0);
        });
      },
    );
    call.once("error", reject);
    call.end();
  });
}

describe("design_board", () => {
  it("presents and updates an escaped image-backed board at one machine-verified URL", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-"));
    await images(root);
    const harness = register();
    expect(harness.tool.parameters.additionalProperties).toBe(false);

    const first = await harness.tool.execute(
      "present",
      presentation(),
      undefined,
      undefined,
      context(root),
    );
    expect(first.details).toMatchObject({ reachable: true, state: "open", version: 1 });
    const url = String(first.details["url"]);
    const response = await fetch(url);
    const markup = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(markup).toContain("Calm &lt;focus&gt;");
    expect(markup).toContain("Quiet &amp; focused");
    expect(markup).toContain("Recommended");
    expect(markup).toContain("http://127.0.0.1:3000/");
    expect(markup).toContain('class="review-header"');
    expect(markup).toContain('class="comparison"');
    expect(markup).toContain('class="decision-strip feedback"');
    expect(markup).toContain("select the strongest direction");
    expect(markup).not.toContain("return to the CLI");
    expect(markup).toContain('class="direction recommended-direction"');
    expect(markup).toContain("Revision 01");
    expect(markup).toContain("2 directions");
    expect(markup).toMatch(/object-fit:\s*contain/u);
    expect(markup).toContain("@media(prefers-color-scheme:dark)");
    expect(markup).toContain("@media(prefers-reduced-motion:reduce)");
    expect(markup).toContain("input:focus-visible");
    expect(markup).toContain('popover="" id="viewer-1"');
    expect(markup).toMatch(
      /popovertarget="viewer-1"[^>]+aria-label="View full size: Calm &lt;focus&gt;"/u,
    );
    expect(markup).toMatch(/popovertargetaction="hide"[^>]+aria-label="Close full-size view/u);
    expect(markup).not.toContain("autofocus");
    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain(".viewer:has(input:checked) img");
    expect(await fetch(new URL("image/calm", url))).toMatchObject({ ok: true });

    const update = presentation({ title: "Refined dashboard directions" });
    Reflect.deleteProperty(update, "liveSiteUrl");
    const second = await harness.tool.execute(
      "update",
      update,
      undefined,
      undefined,
      context(root),
    );
    expect(second.details).toMatchObject({ reachable: true, url, version: 2 });
    expect(await (await fetch(url)).text()).toContain("http://127.0.0.1:3000/");
    expect(harness.entries.at(-1)?.data).toMatchObject({ state: "open", version: 2 });
    await close(harness, root);
  });

  it("renders collision-proof accessible viewers for every direction", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-viewers-"));
    await images(root);
    const harness = register();
    const longLabel = "Long direction label ".repeat(8).slice(0, 160);
    const presented = await harness.tool.execute(
      "present",
      presentation({
        directions: [
          { id: "x", imagePath: "evidence/calm.png", label: longLabel },
          { id: "x-actual-size", imagePath: "evidence/bold.png", label: "Suffix collision" },
        ],
        recommendedDirectionId: "x",
      }),
      undefined,
      undefined,
      context(root),
    );
    const markup = await (await fetch(String(presented.details["url"]))).text();

    expect(markup.match(/popover=""/gu)).toHaveLength(2);
    expect(markup).toContain('id="viewer-1"');
    expect(markup).toContain('id="viewer-2"');
    expect(markup).toContain('id="viewer-1-size"');
    expect(markup).toContain('id="viewer-2-size"');
    expect(markup).toContain("grid-template-rows:auto minmax(0,1fr)");
    expect(markup).toContain(".viewer:popover-open{display:grid}");
    expect(markup).toContain('class="viewer-toolbar"');
    expect(markup).toContain('class="viewer-actions"');
    expect(markup).not.toContain("1120px");
    expect(markup).not.toContain("cursor:grab");
    await close(harness, root);
  });

  it("defaults to a full-width CLI feedback board without browser form controls", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-cli-"));
    await images(root);
    const harness = register();
    const input = presentation();
    Reflect.deleteProperty(input, "feedbackMode");
    const presented = await harness.tool.execute(
      "present",
      input,
      undefined,
      undefined,
      context(root),
    );
    const markup = await (await fetch(String(presented.details["url"]))).text();

    expect(presented.details).toMatchObject({ feedbackMode: "cli" });
    expect(markup).toContain('class="board-form cli-board"');
    expect(markup.match(/popover=""/gu)).toHaveLength(2);
    expect(markup).not.toContain("<form");
    expect(markup).not.toMatch(/<input[^>]+name="directionId"/u);
    expect(markup).not.toContain('class="decision-strip feedback"');
    const url = String(presented.details["url"]);
    expect(await postFeedback(url, {}, { origin: new URL(url).origin })).toMatchObject({
      status: 404,
    });
    const update = presentation({ title: "Retained CLI mode" });
    Reflect.deleteProperty(update, "feedbackMode");
    const updated = await harness.tool.execute(
      "update",
      update,
      undefined,
      undefined,
      context(root),
    );
    expect(updated.details).toMatchObject({ feedbackMode: "cli", version: 2 });
    expect(await (await fetch(url)).text()).not.toContain("<form");
    await close(harness, root);
  });

  it("records one bounded same-origin feedback submission and wakes Pi as a follow-up", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-feedback-"));
    await images(root);
    const harness = register();
    const presented = await harness.tool.execute(
      "present",
      presentation(),
      undefined,
      undefined,
      context(root),
    );
    const url = String(presented.details["url"]);
    const markup = await (await fetch(url)).text();
    const values = formValues(markup);
    const body = new URLSearchParams({
      directionId: "calm",
      notes: "Keep the focal hierarchy; reduce the chrome.",
      ...values,
    });
    const feedbackUrl = new URL("feedback", url);
    const submission = await fetch(feedbackUrl, {
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: new URL(url).origin,
      },
      method: "POST",
      redirect: "manual",
    });
    expect(submission.status).toBe(303);
    const status = await harness.tool.execute(
      "status",
      { action: "status" },
      undefined,
      undefined,
      context(root),
    );
    expect(status.details["feedback"]).toEqual({
      directionId: "calm",
      notes: "Keep the focal hierarchy; reduce the chrome.",
      source: "untrusted-local-design-feedback",
      version: 1,
    });
    expect(harness.messages.at(-1)).toMatchObject({
      message: { customType: "design_board_feedback", display: true },
      options: { deliverAs: "followUp", triggerTurn: true },
    });
    expect(
      await fetch(feedbackUrl, {
        body,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          origin: new URL(url).origin,
        },
        method: "POST",
        redirect: "manual",
      }),
    ).toMatchObject({ status: 409 });
    await close(harness, root);
  });

  it("rejects path escape, malformed images, remote sites, invalid hosts and cross-origin posts", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-security-"));
    await images(root);
    const harness = register();
    await expect(
      harness.tool.execute(
        "escape",
        presentation({
          directions: [
            { id: "one", imagePath: "../secret.png", label: "One" },
            { id: "two", imagePath: "../secret.png", label: "Two" },
          ],
        }),
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/project or board artifact directory/iu);
    await writeFile(join(root, "evidence", "bad.png"), "not an image");
    await expect(
      harness.tool.execute(
        "malformed",
        presentation({
          directions: [
            { id: "one", imagePath: "evidence/bad.png", label: "One" },
            { id: "two", imagePath: "evidence/bold.png", label: "Two" },
          ],
        }),
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/valid PNG/iu);
    await expect(
      harness.tool.execute(
        "remote",
        presentation({ liveSiteUrl: "https://example.com" }),
        undefined,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/localhost/iu);

    const presented = await harness.tool.execute(
      "present",
      presentation(),
      undefined,
      undefined,
      context(root),
    );
    const url = String(presented.details["url"]);
    expect(await rawStatus(url, "evil.example")).toBe(403);
    const markup = await (await fetch(url)).text();
    const response = await fetch(new URL("feedback", url), {
      body: new URLSearchParams({ directionId: "calm", notes: "Like it", ...formValues(markup) }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "http://evil.example",
      },
      method: "POST",
    });
    expect(response.status).toBe(403);
    await close(harness, root);
  });

  it("accepts board-temp captures, restores open branch state, and cleans up on quit", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-restore-"));
    await images(root);
    const first = register();
    const closed = await first.tool.execute(
      "status",
      { action: "status" },
      undefined,
      undefined,
      context(root),
    );
    const artifactDirectory = String(closed.details["artifactDirectory"]);
    const tempImage = join(artifactDirectory, "capture.png");
    await writeFile(tempImage, PNG);
    const presented = await first.tool.execute(
      "present",
      presentation({
        directions: [
          { id: "capture", imagePath: tempImage, label: "Rendered capture" },
          { id: "bold", imagePath: "evidence/bold.png", label: "Bold utility" },
        ],
        recommendedDirectionId: "capture",
      }),
      undefined,
      undefined,
      context(root),
    );
    const previousUrl = String(presented.details["url"]);
    await first.sessionShutdown[0]?.({ reason: "reload" });
    await expect(fetch(previousUrl)).rejects.toThrow();

    const branch = [...first.entries];
    const second = register();
    await second.sessionStart[0]?.({ reason: "reload" }, context(root, branch));
    const restored = await second.tool.execute(
      "status",
      { action: "status" },
      undefined,
      undefined,
      context(root, branch),
    );
    expect(restored.details).toMatchObject({ reachable: true, state: "open", version: 1 });
    await second.sessionShutdown[0]?.({ reason: "quit" });
    await expect(access(artifactDirectory)).rejects.toThrow();
  });

  it("does not spawn a URL opener outside local TUI mode and respects cancellation", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-open-"));
    await images(root);
    const harness = register();
    await harness.tool.execute("present", presentation(), undefined, undefined, context(root));
    const opened = await harness.tool.execute(
      "open",
      { action: "open" },
      undefined,
      undefined,
      context(root, [], "print"),
    );
    expect(opened.details).toMatchObject({ opened: false, reachable: true });
    expect(harness.exec).not.toHaveBeenCalled();
    const controller = new AbortController();
    controller.abort();
    await expect(
      harness.tool.execute(
        "status",
        { action: "status" },
        controller.signal,
        undefined,
        context(root),
      ),
    ).rejects.toThrow(/abort/iu);
    await close(harness, root);
  });

  it("validates direction shape, image formats, allowed roots, recommendation, and site URLs", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-inputs-"));
    const outside = await mkdtemp(join(tmpdir(), "design-board-outside-"));
    await images(root);
    await writeFile(join(root, "evidence", "photo.jpg"), Buffer.from([255, 216, 255, 217]));
    await writeFile(
      join(root, "evidence", "sample.webp"),
      Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")]),
    );
    await writeFile(join(root, "evidence", "large.png"), Buffer.alloc(10 * 1024 * 1024 + 1));
    await writeFile(join(outside, "outside.png"), PNG);
    await symlink(join(outside, "outside.png"), join(root, "evidence", "linked.png"));
    const harness = register();
    const execute = (input: Record<string, unknown>) =>
      harness.tool.execute("validate", input, undefined, undefined, context(root));

    await expect(execute({ action: "present" })).rejects.toThrow(/requires/iu);
    await expect(
      execute(
        presentation({
          directions: [{ id: "one", imagePath: "evidence/calm.png", label: "One" }],
        }),
      ),
    ).rejects.toThrow(/two to eight/iu);
    await expect(
      execute(
        presentation({
          directions: Array.from({ length: 9 }, (_, index) => ({
            id: `direction-${String(index)}`,
            imagePath: index % 2 === 0 ? "evidence/calm.png" : "evidence/bold.png",
            label: `Direction ${String(index + 1)}`,
          })),
        }),
      ),
    ).rejects.toThrow(/two to eight/iu);
    await expect(
      execute(
        presentation({
          directions: [
            { id: "same", imagePath: "evidence/calm.png", label: "One" },
            { id: "same", imagePath: "evidence/bold.png", label: "Two" },
          ],
        }),
      ),
    ).rejects.toThrow(/unique/iu);
    await expect(
      execute(
        presentation({
          directions: [
            { id: "one", imagePath: "evidence/calm.png", label: "" },
            { id: "two", imagePath: "evidence/bold.png", label: "Two" },
          ],
        }),
      ),
    ).rejects.toThrow(/labels/iu);
    await expect(
      execute(
        presentation({
          directions: [
            {
              description: "x".repeat(501),
              id: "one",
              imagePath: "evidence/calm.png",
              label: "One",
            },
            { id: "two", imagePath: "evidence/bold.png", label: "Two" },
          ],
        }),
      ),
    ).rejects.toThrow(/descriptions/iu);
    await expect(
      execute(
        presentation({
          directions: [
            { id: "one", imagePath: "evidence/linked.png", label: "One" },
            { id: "two", imagePath: "evidence/bold.png", label: "Two" },
          ],
        }),
      ),
    ).rejects.toThrow(/artifact directory/iu);
    await expect(
      execute(
        presentation({
          directions: [
            { id: "one", imagePath: "evidence/large.png", label: "One" },
            { id: "two", imagePath: "evidence/bold.png", label: "Two" },
          ],
        }),
      ),
    ).rejects.toThrow(/too large/iu);
    await expect(execute(presentation({ recommendedDirectionId: "missing" }))).rejects.toThrow(
      /must be present/iu,
    );
    await expect(
      execute(presentation({ liveSiteUrl: "http://user:pass@localhost:3000" })),
    ).rejects.toThrow(/unauthenticated/iu);

    const result = await execute({
      action: "present",
      directions: [
        { id: "photo", imagePath: "evidence/photo.jpg", label: "Photo" },
        { id: "sample", imagePath: "evidence/sample.webp", label: "Sample" },
      ],
      recommendedDirectionId: "photo",
      title: "Format directions",
    });
    const markup = await (await fetch(String(result.details["url"]))).text();
    expect(markup).not.toContain("Open the separate live site");
    expect(markup).not.toContain("<p>Fast and dense</p>");
    expect(
      (await fetch(new URL("image/photo", String(result.details["url"])))).headers.get(
        "content-type",
      ),
    ).toBe("image/jpeg");
    expect(
      (await fetch(new URL("image/sample", String(result.details["url"])))).headers.get(
        "content-type",
      ),
    ).toBe("image/webp");
    await close(harness, root);
  });

  it("bounds every local HTTP route and feedback failure before accepting feedback", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-http-"));
    await images(root);
    const harness = register();
    const presented = await harness.tool.execute(
      "present",
      presentation(),
      undefined,
      undefined,
      context(root),
    );
    const url = String(presented.details["url"]);
    const origin = new URL(url).origin;
    const values = formValues(await (await fetch(url)).text());
    expect(await fetch(new URL("/favicon.ico", url))).toMatchObject({ status: 204 });
    expect(await fetch(`${origin}/outside`)).toMatchObject({ status: 403 });
    expect(await fetch(new URL("unknown", url))).toMatchObject({ status: 404 });
    expect(await fetch(new URL("image/missing", url))).toMatchObject({ status: 404 });
    expect(await fetch(url, { method: "PUT" })).toMatchObject({ status: 404 });
    expect(
      await postFeedback(url, { directionId: "calm", notes: "Like it", ...values }),
    ).toMatchObject({
      status: 403,
    });
    expect(
      await postFeedback(
        url,
        { directionId: "calm", notes: "Like it", ...values },
        { contentType: "application/json", origin },
      ),
    ).toMatchObject({ status: 415 });
    expect(
      await postFeedback(
        url,
        { directionId: "calm", notes: "Like it", token: "bad", version: values.version },
        { origin },
      ),
    ).toMatchObject({ status: 403 });
    expect(
      await postFeedback(
        url,
        {
          directionId: "calm",
          notes: "Like it",
          token: "é".repeat(values.token.length),
          version: values.version,
        },
        { origin },
      ),
    ).toMatchObject({ status: 403 });
    expect(
      await postFeedback(
        url,
        { directionId: "calm", notes: "Like it", token: values.token, version: "99" },
        { origin },
      ),
    ).toMatchObject({ status: 409 });
    expect(
      await postFeedback(url, { directionId: "missing", notes: "Like it", ...values }, { origin }),
    ).toMatchObject({ status: 400 });
    expect(
      await postFeedback(url, { directionId: "calm", notes: " ", ...values }, { origin }),
    ).toMatchObject({ status: 400 });
    expect(
      await postFeedback(
        url,
        { directionId: "calm", notes: "x".repeat(2001), ...values },
        { origin },
      ),
    ).toMatchObject({ status: 400 });
    expect(
      await postFeedback(
        url,
        { directionId: "calm", notes: "x".repeat(9000), ...values },
        { origin },
      ),
    ).toMatchObject({ status: 500 });

    const accepted = await postFeedback(
      url,
      { directionId: "bold", notes: "Preserve the hierarchy.", ...values },
      { origin },
    );
    expect(accepted.status).toBe(303);
    const saved = await (await fetch(url)).text();
    expect(saved).toContain("Feedback saved for bold");
    expect(saved).toContain("Preserve the hierarchy.");
    await close(harness, root);
  });

  it("rejects feedback that became stale while its request body was still arriving", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-concurrent-"));
    await images(root);
    const harness = register();
    const presented = await harness.tool.execute(
      "present",
      presentation(),
      undefined,
      undefined,
      context(root),
    );
    const url = String(presented.details["url"]);
    const parsed = new URL(url);
    const values = formValues(await (await fetch(url)).text());
    const payload = new URLSearchParams({
      directionId: "calm",
      notes: "This submission should become stale.",
      ...values,
    }).toString();
    const call = request({
      headers: {
        "content-length": Buffer.byteLength(payload),
        "content-type": "application/x-www-form-urlencoded",
        origin: parsed.origin,
      },
      hostname: parsed.hostname,
      method: "POST",
      path: `${parsed.pathname}feedback`,
      port: parsed.port,
    });
    const responseStatus = new Promise<number>((resolveStatus, reject) => {
      call.once("response", (response) => {
        response.resume();
        response.once("end", () => {
          resolveStatus(response.statusCode ?? 0);
        });
      });
      call.once("error", reject);
    });
    call.write(payload.slice(0, 8));
    await new Promise<void>((resolveTurn) => {
      setImmediate(resolveTurn);
    });
    const update = presentation({ recommendedDirectionId: "bold", title: "Concurrent update" });
    Reflect.deleteProperty(update, "liveSiteUrl");
    const updated = await harness.tool.execute(
      "update",
      update,
      undefined,
      undefined,
      context(root),
    );
    call.end(payload.slice(8));
    expect(await responseStatus).toBe(409);
    expect(updated.details).toMatchObject({ feedback: undefined, version: 2 });
    expect(await (await fetch(url)).text()).toContain("Concurrent update");
    expect(harness.messages).toHaveLength(0);
    await close(harness, root);
  });

  it("reissues a blocked restored URL and handles empty, closed, mismatched, and failed state", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-state-"));
    const otherRoot = await mkdtemp(join(tmpdir(), "design-board-other-"));
    await images(root);
    const first = register();
    const presented = await first.tool.execute(
      "present",
      presentation(),
      undefined,
      undefined,
      context(root),
    );
    const previousUrl = new URL(String(presented.details["url"]));
    await first.sessionShutdown[0]?.({ reason: "reload" });
    const blocker = createServer();
    await new Promise<void>((resolveListen) =>
      blocker.listen(Number(previousUrl.port), "127.0.0.1", resolveListen),
    );
    const branch = [...first.entries];
    const legacyState = branch.at(-1)?.data;
    if (legacyState && typeof legacyState === "object") {
      Reflect.deleteProperty(legacyState, "feedbackMode");
    }
    const restored = register();
    await restored.sessionStart[0]?.({ reason: "reload" }, context(root, branch));
    const status = await restored.tool.execute(
      "status",
      { action: "status" },
      undefined,
      undefined,
      context(root, branch),
    );
    expect(status.details["url"]).not.toBe(previousUrl.href);
    expect(status.details).toMatchObject({ feedbackMode: "cli" });
    expect(await (await fetch(String(status.details["url"]))).text()).not.toContain("<form");
    expect(
      restored.messages.some(({ message }) => message["customType"] === "design_board_url_changed"),
    ).toBe(true);
    await new Promise<void>((resolveClose) => {
      blocker.close(() => {
        resolveClose();
      });
    });
    await close(restored, root);

    const closedBranch = [...restored.entries];
    const closed = register();
    await closed.sessionStart[0]?.({ reason: "resume" }, context(root, closedBranch));
    expect(
      await closed.tool.execute(
        "status",
        { action: "status" },
        undefined,
        undefined,
        context(root, closedBranch),
      ),
    ).toMatchObject({ details: { reachable: false, state: "closed" } });

    const empty = register();
    await empty.sessionStart[0]?.(
      { reason: "startup" },
      context(root, [null, {}, { customType: "wrong", data: {}, type: "custom" }]),
    );
    expect(empty.messages).toHaveLength(0);

    const openState = branch.at(-1);
    const mismatched = register();
    await mismatched.sessionStart[0]?.({ reason: "resume" }, context(otherRoot, [openState]));
    expect(mismatched.messages).toHaveLength(0);

    const failed = register();
    const broken = structuredClone(openState) as { data: { directions: { imagePath: string }[] } };
    const firstDirection = broken.data.directions[0];
    if (!firstDirection) throw new Error("Restored direction was missing");
    firstDirection.imagePath = join(root, "missing.png");
    await failed.sessionStart[0]?.({ reason: "resume" }, context(root, [broken]));
    expect(
      failed.messages.some(
        ({ message }) => message["customType"] === "design_board_restore_failed",
      ),
    ).toBe(true);
    await restored.sessionShutdown[0]?.({ reason: "quit" });
  });

  it("opens reachable boards in TUI mode and reports opener failures or a closed board", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-tui-open-"));
    await images(root);
    const success = register();
    await success.tool.execute("present", presentation(), undefined, undefined, context(root));
    const opened = await success.tool.execute(
      "open",
      { action: "open" },
      undefined,
      undefined,
      context(root, [], "tui"),
    );
    expect(opened.details["opened"]).toBe(true);
    expect(success.exec).toHaveBeenCalledOnce();
    await close(success, root);

    const failure = register({ code: 1, killed: false, stderr: "no opener", stdout: "" });
    await failure.tool.execute("present", presentation(), undefined, undefined, context(root));
    const notOpened = await failure.tool.execute(
      "open",
      { action: "open" },
      undefined,
      undefined,
      context(root, [], "tui"),
    );
    expect(notOpened.details).toMatchObject({ openReason: "no opener", opened: false });
    await close(failure, root);
    expect(
      await failure.tool.execute(
        "open",
        { action: "open" },
        undefined,
        undefined,
        context(root, [], "tui"),
      ),
    ).toMatchObject({ details: { reachable: false, state: "closed" } });
  });
  it("serves a full-width comparison grid and bottom decision strip", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "design-board-comparison-"));
    await images(root);
    const cli = register();
    const cliInput = presentation();
    Reflect.deleteProperty(cliInput, "feedbackMode");
    const cliResult = await cli.tool.execute(
      "present",
      cliInput,
      undefined,
      undefined,
      context(root),
    );
    const cliMarkup = await (await fetch(String(cliResult.details["url"]))).text();
    expect.soft(cliMarkup).toContain('class="directions-section"');
    expect.soft(cliMarkup).toContain('class="direction-grid"');
    expect
      .soft(cliMarkup.indexOf('class="directions-heading"'))
      .toBeLessThan(cliMarkup.indexOf('class="direction-grid"'));
    await close(cli, root);

    const board = register();
    const boardResult = await board.tool.execute(
      "present",
      presentation(),
      undefined,
      undefined,
      context(root),
    );
    const boardMarkup = await (await fetch(String(boardResult.details["url"]))).text();
    expect.soft(boardMarkup).toContain('<fieldset class="directions"><legend>');
    expect.soft(boardMarkup).toContain('class="direction-grid"');
    expect.soft(boardMarkup).toContain('class="decision-strip feedback"');
    expect
      .soft(boardMarkup.indexOf('class="direction-grid"'))
      .toBeLessThan(boardMarkup.indexOf('class="decision-strip feedback"'));
    expect.soft(boardMarkup).toContain(".decision-strip{position:sticky;bottom:");
    expect.soft(boardMarkup).not.toContain("grid-template-columns:minmax(0,72fr)");
    await close(board, root);
  });
});
