export interface ChildProjection {
  readonly agent: string;
  readonly asyncControl?: boolean;
  readonly asyncDir: string;
  readonly index: number;
  readonly key: string;
  readonly outputPath: string;
  readonly runId: string;
  readonly sourceKind?: "session-jsonl" | "text";
  readonly state: string;
  readonly statusPath: string;
}

export interface ViewerDescriptor extends ChildProjection {
  readonly control?: {
    readonly endpoint: string;
    readonly token: string;
  };
  readonly ownerPid?: number;
  readonly version: 1;
}
