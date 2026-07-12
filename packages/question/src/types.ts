export interface QuestionOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly preview?: string;
}

export interface QuestionDefinition {
  readonly id: string;
  readonly header: string;
  readonly question: string;
  readonly multiSelect?: boolean;
  readonly options: readonly QuestionOption[];
}

export interface QuestionInput {
  readonly continuationId?: string;
  readonly questions: readonly QuestionDefinition[];
}

export interface QuestionDraft {
  readonly selectedIds: readonly string[];
  readonly custom?: string;
  readonly notes: Readonly<Record<string, string>>;
}

export interface QuestionnaireState {
  readonly tab: number;
  readonly cursorByQuestion: Readonly<Record<string, number>>;
  readonly drafts: Readonly<Record<string, QuestionDraft>>;
  readonly complete: boolean;
}

export interface AnswerSelection {
  readonly optionId: string;
  readonly label: string;
  readonly note?: string;
}

export interface QuestionAnswer {
  readonly questionId: string;
  readonly selections: readonly AnswerSelection[];
  readonly custom?: string;
}

export type QuestionResultStatus = "submitted" | "redirected" | "cancelled" | "unavailable";

export interface ContinuationOptionSignature {
  readonly id: string;
  readonly semanticHash: string;
}

export interface ContinuationQuestionSignature {
  readonly id: string;
  readonly semanticHash: string;
  readonly options: readonly ContinuationOptionSignature[];
}

export interface ContinuationSnapshot {
  readonly questions: readonly ContinuationQuestionSignature[];
}

export interface QuestionResultDetails {
  readonly status: QuestionResultStatus;
  readonly answers: readonly QuestionAnswer[];
  readonly continuationId?: string;
  readonly continuedFrom?: string;
  readonly redirect?: string;
  readonly snapshot?: ContinuationSnapshot;
  readonly reason?: "abort" | "escape" | "no_ui";
}

export type QuestionAction =
  | { readonly kind: "tab"; readonly tab: number }
  | { readonly kind: "cursor"; readonly index: number }
  | { readonly kind: "select"; readonly optionId: string }
  | { readonly kind: "toggle"; readonly optionId: string }
  | { readonly kind: "other"; readonly text: string }
  | { readonly kind: "note"; readonly optionId: string; readonly text: string }
  | { readonly kind: "next" };
