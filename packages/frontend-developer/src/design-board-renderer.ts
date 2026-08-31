export const MAX_NOTES_LENGTH = 2000;

type FeedbackMode = "cli" | "board";

interface RenderDirection {
  readonly description?: string;
  readonly id: string;
  readonly label: string;
}

interface RenderFeedback {
  readonly directionId: string;
  readonly notes: string;
}

export interface DesignBoardRenderInput {
  readonly directions: readonly RenderDirection[];
  readonly feedbackMode: FeedbackMode;
  readonly feedback?: RenderFeedback;
  readonly liveSiteUrl?: string;
  readonly path: string;
  readonly recommendedDirectionId: string;
  readonly title: string;
  readonly token: string;
  readonly version: number;
}
function escapeHtml(value: string): string {
  return value.replaceAll(
    /[&<>'"]/gu,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

export function renderDesignBoard(input: DesignBoardRenderInput): string {
  const { feedbackMode } = input;
  const directions = input.directions
    .map((direction, index) => {
      const checked = input.feedback?.directionId === direction.id ? " checked" : "";
      const recommended = direction.id === input.recommendedDirectionId;
      const description = direction.description
        ? `<span class="description">${escapeHtml(direction.description)}</span>`
        : "";
      const directionId = escapeHtml(direction.id);
      const imageUrl = `${input.path}image/${encodeURIComponent(direction.id)}`;
      const viewerId = `viewer-${String(index + 1)}`;
      const choiceId = `choice-${String(index + 1)}`;
      const actualSizeId = `${viewerId}-size`;
      const choice =
        feedbackMode === "board"
          ? `<label class="choice" for="${choiceId}"><input${checked} id="${choiceId}" name="directionId" required type="radio" value="${directionId}"><strong>${escapeHtml(direction.label)}</strong>${recommended ? '<span class="recommended">Recommended</span>' : ""}</label>`
          : `<div class="choice static-choice"><strong>${escapeHtml(direction.label)}</strong>${recommended ? '<span class="recommended">Recommended</span>' : ""}</div>`;
      return `<article class="direction${recommended ? " recommended-direction" : ""}"><span class="direction-number">${String(index + 1).padStart(2, "0")}</span><div class="specimen"><img alt="" src="${imageUrl}"><button class="view-full-size" type="button" popovertarget="${viewerId}" aria-label="View full size: ${escapeHtml(direction.label)}">View full size</button></div>${choice}${description}</article><div popover="" id="${viewerId}" class="viewer" role="region" aria-labelledby="${viewerId}-title"><div class="viewer-toolbar"><div class="viewer-title"><span class="eyebrow">Full-size evidence</span><h2 id="${viewerId}-title">${escapeHtml(direction.label)}</h2></div><div class="viewer-actions"><label class="viewer-size" for="${actualSizeId}"><input id="${actualSizeId}" type="checkbox"><span>100%</span></label><button class="close-viewer" type="button" popovertarget="${viewerId}" popovertargetaction="hide" aria-label="Close full-size view of ${escapeHtml(direction.label)}">Close</button></div></div><div class="viewer-viewport"><img alt="${escapeHtml(direction.label)} direction at full size" src="${imageUrl}"></div></div>`;
    })
    .join("\n");
  const site = input.liveSiteUrl
    ? `<a class="site" href="${escapeHtml(input.liveSiteUrl)}">Open the separate live site</a>`
    : "";
  const prior = input.feedback
    ? `<p class="saved" role="status">Feedback saved for ${escapeHtml(input.feedback.directionId)}.</p>`
    : "";
  const notes = escapeHtml(input.feedback?.notes ?? "");
  const summary =
    feedbackMode === "board"
      ? "Compare the visual evidence, select the strongest direction, then leave one clear instruction for the next iteration."
      : "Compare the visual evidence, then return to the CLI to choose a direction and explain what should carry forward.";
  const directionGroup =
    feedbackMode === "board"
      ? `<fieldset class="directions"><legend>Visual directions <span class="direction-count">${String(input.directions.length)} directions</span></legend>${directions}</fieldset>`
      : `<section class="directions" aria-labelledby="directions-heading"><h2 class="directions-heading" id="directions-heading">Visual directions <span class="direction-count">${String(input.directions.length)} directions</span></h2>${directions}</section>`;
  const comparison = `<section class="comparison"><p class="review-summary">${summary}</p>${directionGroup}</section>`;
  const content =
    feedbackMode === "board"
      ? `<form class="board-form" method="post" action="${input.path}feedback"><input name="token" type="hidden" value="${input.token}"><input name="version" type="hidden" value="${String(input.version)}">${comparison}<section class="decision-panel feedback" aria-labelledby="decision-title"><p class="eyebrow">Your decision</p><h2 id="decision-title">Carry one direction forward</h2><label for="notes"><strong>What should carry forward?</strong><textarea id="notes" maxlength="${String(MAX_NOTES_LENGTH)}" minlength="1" name="notes" required>${notes}</textarea></label><button type="submit">Submit feedback</button>${prior}</section></form>`
      : `<section class="board-form cli-board">${comparison}</section>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title><style>
:root{color-scheme:light dark;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:20px;--space-6:24px;--space-8:32px;--space-10:40px;--ink:#20262d;--muted:#66717d;--surface:#fff;--canvas:#f7f7f5;--line:#dce0e3;--blue:#2563d9;--success:#287852;font-family:ui-sans-serif,system-ui,sans-serif;background:var(--canvas);color:var(--ink)}@media(prefers-color-scheme:dark){:root{--ink:#f2f5f8;--muted:#aeb8c4;--surface:#1a212a;--canvas:#11161d;--line:#33404c;--blue:#7ba8ff;--success:#75c69d}}*{box-sizing:border-box}body{margin:0;background:var(--canvas);line-height:1.5}main{width:min(1520px,calc(100% - var(--space-8)));margin:0 auto;padding:0 0 var(--space-10)}.review-header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-6);min-height:64px;border-bottom:1px solid var(--line)}.review-header>div:first-child{display:flex;align-items:baseline;gap:var(--space-3)}.eyebrow,.review-count{color:var(--blue);font-size:.7rem;font-weight:800;letter-spacing:.1em;margin:0;text-transform:uppercase}.review-header h1{font-size:1.15rem;letter-spacing:-.025em;line-height:1.2;margin:0}.review-summary{color:var(--muted);font-size:1rem;margin:0 0 var(--space-4);max-width:42rem}.review-meta{display:flex;align-items:center;gap:var(--space-4);text-align:right}.site{color:var(--ink);font-weight:700;text-underline-offset:3px}.site:hover{color:var(--blue)}.board-form{display:grid;grid-template-columns:minmax(0,72fr) minmax(280px,28fr);gap:var(--space-8);align-items:start;margin-top:var(--space-8)}.comparison{min-width:0}.directions{border:0;border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:var(--space-6);margin:0;padding:var(--space-4) 0 0}.directions legend{font-weight:800;margin-bottom:var(--space-3);padding:0}.direction-count{color:var(--muted);font-size:.75rem;font-weight:500;margin-left:var(--space-2)}.direction{position:relative;display:grid;gap:var(--space-3);min-width:0}.specimen{position:relative;display:grid;overflow:hidden;border:1px solid var(--line);border-radius:var(--space-3);background:var(--surface);transition:border-color .15s ease,box-shadow .15s ease}.direction:hover .specimen{border-color:color-mix(in srgb,var(--blue) 55%,var(--line))}.direction:has(input:checked) .specimen{border-color:var(--blue);box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 28%,transparent)}.direction:has(input:focus-visible) .specimen{outline:3px solid var(--blue);outline-offset:3px}.direction-number{position:absolute;z-index:1;top:var(--space-3);left:var(--space-3);display:grid;place-items:center;width:28px;height:28px;border-radius:999px;background:var(--surface);color:var(--ink);font-size:.72rem;font-weight:800;box-shadow:0 1px 4px #0002}.recommended-direction .direction-number{background:var(--blue);color:#fff}.specimen img{width:100%;aspect-ratio:4/3;object-fit:contain}.view-full-size{position:absolute;right:var(--space-3);bottom:var(--space-3);border:1px solid color-mix(in srgb,var(--surface) 70%,transparent);border-radius:999px;background:var(--ink);color:var(--surface);font:inherit;font-size:.82rem;font-weight:800;padding:var(--space-2) var(--space-3);cursor:pointer}.choice{display:flex;align-items:center;gap:var(--space-2);padding:0 var(--space-1,4px);cursor:pointer}.choice input{width:20px;height:20px;margin:0;accent-color:var(--blue)}.choice strong{line-height:1.2}.recommended{margin-left:auto;color:var(--blue);font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.description{color:var(--muted);font-size:.9rem;padding:0 var(--space-1,4px)}.decision-panel{position:sticky;top:var(--space-4);display:grid;gap:var(--space-4);padding:var(--space-5);border:1px solid var(--line);border-radius:var(--space-3);background:var(--surface);box-shadow:0 8px 28px #0000000a}.decision-panel h2,.viewer h2{font-size:1rem;margin:0}.decision-panel label{display:grid;gap:var(--space-2);font-size:.9rem}.feedback textarea{width:100%;min-height:140px;resize:vertical;border:1px solid var(--line);border-radius:var(--space-2);background:var(--canvas);color:var(--ink);padding:var(--space-3);font:inherit}.feedback button,.close-viewer{border:0;border-radius:var(--space-2);padding:var(--space-3) var(--space-4);background:var(--ink);color:var(--surface);font:inherit;font-weight:800;cursor:pointer}.feedback button:hover,.close-viewer:hover,.view-full-size:hover{background:var(--blue)}.feedback button:active,.close-viewer:active,.view-full-size:active{transform:translateY(1px)}.saved{color:var(--success);font-size:.9rem;font-weight:700;margin:0}.viewer{display:grid;grid-template-rows:auto minmax(0,1fr);width:calc(100vw - var(--space-4));height:calc(100vh - var(--space-4));max-width:none;max-height:none;margin:auto;padding:0;border:1px solid var(--line);border-radius:var(--space-3);background:var(--surface);color:var(--ink);box-shadow:0 var(--space-8) calc(var(--space-10) * 2) #0006}.viewer::backdrop{background:#000b}.viewer-toolbar{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);min-height:56px;padding:var(--space-2) var(--space-3);border-bottom:1px solid var(--line)}.viewer-title{min-width:0}.viewer-title .eyebrow{display:block;margin-bottom:2px}.viewer-title h2{line-height:1.25;overflow-wrap:anywhere}.viewer-actions{display:flex;align-items:center;gap:var(--space-2);flex:0 0 auto}.viewer-size{display:flex;align-items:center;gap:6px;padding:var(--space-2);border-radius:var(--space-2);font-size:.85rem;font-weight:800;cursor:pointer}.viewer-size input{width:18px;height:18px;margin:0;accent-color:var(--blue)}.viewer-viewport{display:grid;place-items:center;width:100%;min-height:0;overflow:auto;background:var(--canvas)}.viewer img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}.viewer:has(input:checked) .viewer-viewport{place-items:start}.viewer:has(input:checked) img{max-width:none;max-height:none}.feedback button:focus-visible,.close-viewer:focus-visible,.view-full-size:focus-visible,.site:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--blue);outline-offset:3px}@media(max-width:760px){main{width:min(100% - var(--space-4),1520px)}.review-header{align-items:flex-start;min-height:auto;padding:var(--space-3) 0}.review-header>div:first-child{display:block}.review-header h1{margin-top:2px}.review-meta{align-items:flex-end;flex-direction:column;gap:var(--space-2)}.board-form{grid-template-columns:1fr;gap:var(--space-6);margin-top:var(--space-6)}.decision-panel{position:static}.directions{grid-template-columns:1fr}.viewer-toolbar{align-items:flex-start}.viewer-title .eyebrow{display:none}.viewer-actions{align-self:center}}
:root{--space-1:4px}.viewer{width:calc(100dvw - var(--space-4));height:calc(100dvh - var(--space-4))}
.directions-heading{grid-column:1/-1;font-size:1rem;font-weight:800;margin:0 0 var(--space-3)}.static-choice{cursor:default}
.cli-board{grid-template-columns:minmax(0,1fr)}
.viewer:not(:popover-open){display:none}.viewer:popover-open{display:grid}
@media(prefers-reduced-motion:reduce){.direction{transition:none}.direction:hover{transform:none}.feedback button:active,.close-viewer:active,.view-full-size:active{transform:none}}
</style></head><body><main><header class="review-header"><div><p class="eyebrow">Direction checkpoint</p><h1>${escapeHtml(input.title)}</h1></div><div class="review-meta"><p class="review-count">Revision ${String(input.version).padStart(2, "0")}</p>${site}</div></header>${content}</main></body></html>`;
}
