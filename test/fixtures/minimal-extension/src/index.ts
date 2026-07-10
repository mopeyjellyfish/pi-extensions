import { appendFileSync } from "node:fs";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

function record(stage: string): void {
  const marker = process.env["PI_EXTENSIONS_SMOKE_MARKER"];
  if (marker !== undefined) {
    appendFileSync(marker, `${stage}\n`, "utf8");
  }
}

export default function minimalExtension(pi: ExtensionAPI): void {
  record("factory");
  pi.on("session_start", () => {
    record("session_start");
  });
  pi.on("session_shutdown", () => {
    record("session_shutdown");
  });
  pi.registerCommand("fixture-health", {
    description: "Report that the private smoke fixture loaded.",
    handler: (_arguments, context) => {
      context.ui.notify("Fixture loaded", "info");
      return Promise.resolve();
    },
  });
}
