import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const MARKER = "<pi-simple-english-output-guidance>";
const GUIDANCE = `${MARKER}
By default, write human-facing prose in clear, pragmatic Simplified Technical English.

- Follow explicit user and project requirements for language, tone, style, and format.
- Do not omit or weaken technical information, requirements, uncertainty, tradeoffs, risks, or necessary detail.
- Preserve exact code, identifiers, commands, flags, paths, URLs, product and API names, quotations, citations, normative contract words, and required document structure.
- Prefer clear terms, active voice, short sentences, and one consistent term for each important concept.
- Keep short conversational replies natural. Technical accuracy and user intent have priority over style.
</pi-simple-english-output-guidance>`;

export default function simpleEnglishExtension(pi: ExtensionAPI): void {
  pi.on("before_agent_start", (event) => {
    if (event.systemPrompt.includes(MARKER)) return;
    return { systemPrompt: `${event.systemPrompt}\n\n${GUIDANCE}` };
  });
}
