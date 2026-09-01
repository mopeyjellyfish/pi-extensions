import { randomBytes, randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const MAX_REQUEST_BYTES = 8192;

const controlChannelSpecifier = ["pi-subagents", "control-channel"].join("/");
const controlChannel = (await import(controlChannelSpecifier)) as {
  readonly requestAsyncStop: (
    asyncDirectory: string,
    request?: {
      readonly childId?: string;
      readonly reason?: string;
      readonly source?: string;
      readonly targetIndex?: number;
      readonly ts?: number;
    },
  ) => string;
};
const requestAsyncStop = controlChannel.requestAsyncStop;

interface EventBus {
  emit(channel: string, value: unknown): void;
  on(channel: string, listener: (value: unknown) => void): () => void;
}

interface ControlTarget {
  readonly asyncDir?: string;
  readonly index: number;
  readonly runId: string;
}

export interface ControlBridge {
  readonly endpoint: string;
  bind(target: ControlTarget): { readonly endpoint: string; readonly token: string };
  close(): Promise<void>;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

async function rpc(
  events: EventBus,
  method: "resume" | "steer" | "stop",
  params: Record<string, unknown>,
): Promise<boolean> {
  const requestId = `pi-herdr-control-${randomUUID()}`;
  return new Promise((resolveRpc) => {
    let settled = false;
    const finish = (success: boolean): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolveRpc(success);
    };
    const unsubscribe = events.on(`subagents:rpc:v1:reply:${requestId}`, (value) => {
      const reply = record(value);
      if (reply?.["requestId"] === requestId && reply["version"] === 1) {
        finish(reply["success"] === true);
      }
    });
    const timer = setTimeout(() => {
      finish(false);
    }, 2000);
    timer.unref();
    events.emit("subagents:rpc:v1:request", {
      method,
      params,
      requestId,
      source: { extension: "@mopeyjellyfish/pi-herdr-subagents" },
      version: 1,
    });
  });
}

async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    size += value.byteLength;
    if (size > MAX_REQUEST_BYTES) throw new Error("Control request is too large.");
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function reply(response: ServerResponse, status: number, message: string): void {
  response.writeHead(status, {
    "content-length": Buffer.byteLength(message),
    "content-type": "text/plain; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(message);
}

type ControlAction = "resume" | "steer" | "stop";

interface ControlCommand {
  readonly action: ControlAction;
  readonly asyncDir?: string;
  readonly index?: number;
  readonly message?: string;
  readonly runId: string;
}

function controlAction(value: unknown): ControlAction | undefined {
  return value === "resume" || value === "steer" || value === "stop" ? value : undefined;
}

function controlIndex(value: unknown): number | undefined {
  return Number.isInteger(value) ? Number(value) : undefined;
}

function requiresMessage(action: ControlAction): boolean {
  return action === "resume" || action === "steer";
}

function matchesTarget(input: Record<string, unknown>, target: ControlTarget): boolean {
  const runId = text(input["runId"]);
  const asyncDir = text(input["asyncDir"]);
  const suppliedIndex = input["index"];
  return (
    (runId === undefined || runId === target.runId) &&
    (asyncDir === undefined || asyncDir === target.asyncDir) &&
    (suppliedIndex === undefined || controlIndex(suppliedIndex) === target.index)
  );
}

function controlCommand(value: unknown, target: ControlTarget): ControlCommand | undefined {
  const input = record(value);
  if (input === undefined || !matchesTarget(input, target)) return undefined;
  const action = controlAction(text(input["action"]));
  if (action === undefined) return undefined;
  const message = text(input["message"]);
  if (requiresMessage(action) && message === undefined) return undefined;
  return {
    action,
    ...(target.asyncDir === undefined ? {} : { asyncDir: target.asyncDir }),
    index: target.index,
    ...(message === undefined ? {} : { message }),
    runId: target.runId,
  };
}

async function executeControl(events: EventBus, command: ControlCommand): Promise<boolean> {
  const params: Record<string, unknown> = {
    id: command.runId,
    ...(command.index === undefined ? {} : { index: command.index }),
    ...(command.message === undefined ? {} : { message: command.message }),
  };
  const accepted = await rpc(events, command.action, params);
  if (accepted || command.action !== "stop" || command.asyncDir === undefined) return accepted;
  requestAsyncStop(command.asyncDir, {
    ...(command.index === undefined ? {} : { targetIndex: command.index }),
    reason: "Stopped from the Herdr transcript pane",
    source: "pi-herdr-subagents",
  });
  return true;
}

function authorizedTarget(
  request: IncomingMessage,
  capabilities: ReadonlyMap<string, ControlTarget>,
): ControlTarget | undefined {
  if (request.method !== "POST" || request.url !== "/control") return undefined;
  const authorization = request.headers.authorization;
  if (authorization?.startsWith("Bearer ") !== true) return undefined;
  return capabilities.get(authorization.slice("Bearer ".length));
}

async function handleControl(
  events: EventBus,
  capabilities: ReadonlyMap<string, ControlTarget>,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const target = authorizedTarget(request, capabilities);
  if (target === undefined) {
    reply(response, 403, "Forbidden");
    return;
  }
  try {
    const command = controlCommand(await body(request), target);
    if (command === undefined) {
      reply(response, 400, "Invalid control request");
      return;
    }
    const accepted = await executeControl(events, command);
    reply(response, accepted ? 202 : 409, accepted ? "Accepted" : "Unsupported");
  } catch (error) {
    reply(response, 400, error instanceof Error ? error.message : "Invalid control request");
  }
}

export async function createControlBridge(events: EventBus): Promise<ControlBridge> {
  const capabilities = new Map<string, ControlTarget>();
  const server = createServer((request, response) => {
    void handleControl(events, capabilities, request, response);
  });
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolveListen();
    });
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    server.close();
    throw new Error("The Herdr control bridge did not bind a loopback port.");
  }
  const endpoint = `http://127.0.0.1:${String(address.port)}/control`;
  return {
    endpoint,
    bind(target) {
      const token = randomBytes(32).toString("base64url");
      capabilities.set(token, target);
      return { endpoint, token };
    },
    close: () =>
      new Promise<void>((resolveClose, reject) => {
        capabilities.clear();
        server.closeIdleConnections();
        server.close((error) => {
          if (error === undefined) resolveClose();
          else reject(error);
        });
      }),
  };
}
