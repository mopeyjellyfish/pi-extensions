import type { WorkflowPhase } from "./state.ts";

export type CheckpointPhase = Extract<WorkflowPhase, "discover" | "pitch" | "plan">;
export type CheckpointSelection = "refine" | "advance";

/** Exact package-independent input accepted by @mopeyjellyfish/pi-question. */
export function checkpointQuestion(
  phase: CheckpointPhase,
  checkpointId = `development-workflow-${phase}-checkpoint`,
): Record<string, unknown> {
  return {
    questions: [
      {
        header: `${phase[0]?.toUpperCase() ?? ""}${phase.slice(1)}`,
        id: checkpointId,
        options: [
          {
            description: `Stay in ${phase}; the agent will apply your feedback and present the revised artifact once it is ready.`,
            id: "refine",
            label: "Refine again",
          },
          {
            description: `Refresh the workspace and artifacts, record your approval, and continue immediately to the next stage.`,
            id: "advance",
            label: "Approve and continue",
          },
        ],
        question: `The ${phase} artifact and evidence are ready. Refine them again or approve and continue?`,
      },
    ],
  };
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function exactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  const actual = Object.keys(value);
  return (
    required.every((key) => actual.includes(key)) &&
    actual.every((key) => required.includes(key) || optional.includes(key))
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function questionId(question: unknown): string | undefined {
  const questions = asRecord(question)?.["questions"];
  if (!Array.isArray(questions) || questions.length !== 1) return undefined;
  const [definition] = questions as readonly unknown[];
  const id = asRecord(definition)?.["id"];
  return typeof id === "string" ? id : undefined;
}

export function isCheckpointQuestion(
  question: unknown,
  phase: CheckpointPhase,
  workflowId: string,
): boolean {
  const id = questionId(question);
  if (!id?.startsWith(`${workflowId}-${phase}-`)) return false;
  const suffix = id.slice(`${workflowId}-${phase}-`.length);
  return /^\d+$/u.test(suffix) && same(question, checkpointQuestion(phase, id));
}

function submittedAnswer(detailsValue: unknown): Record<string, unknown> | undefined {
  const details = asRecord(detailsValue);
  if (
    details === undefined ||
    !exactKeys(details, ["status", "answers"], ["continuedFrom"]) ||
    details["status"] !== "submitted"
  )
    return undefined;
  const continuedFrom = details["continuedFrom"];
  if (continuedFrom !== undefined && (typeof continuedFrom !== "string" || continuedFrom === ""))
    return undefined;
  const answers = details["answers"];
  if (!Array.isArray(answers) || answers.length !== 1) return undefined;
  const [answer] = answers as readonly unknown[];
  const record = asRecord(answer);
  return record !== undefined && exactKeys(record, ["questionId", "selections"])
    ? record
    : undefined;
}

function answerSelection(answer: Record<string, unknown>): Record<string, unknown> | undefined {
  const selections = answer["selections"];
  if (!Array.isArray(selections) || selections.length !== 1) return undefined;
  const [selection] = selections as readonly unknown[];
  const record = asRecord(selection);
  return record !== undefined && exactKeys(record, ["optionId", "label"]) ? record : undefined;
}

/** Rejects redirects, custom answers, notes, malformed answers, and unrelated results. */
export function checkpointSelection(
  event: unknown,
  phase: CheckpointPhase,
  question: unknown = checkpointQuestion(phase),
): CheckpointSelection | undefined {
  const record = asRecord(event);
  if (record?.["toolName"] !== "question" || !same(record["input"], question)) return undefined;
  const expectedId = questionId(question);
  const answer = submittedAnswer(record["details"]);
  if (expectedId === undefined || answer?.["questionId"] !== expectedId) return undefined;
  const selected = answerSelection(answer);
  if (selected?.["optionId"] === "refine" && selected["label"] === "Refine again") return "refine";
  if (selected?.["optionId"] === "advance" && selected["label"] === "Approve and continue")
    return "advance";
  return undefined;
}
