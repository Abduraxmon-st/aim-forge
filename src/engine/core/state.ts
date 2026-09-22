export type Phase =
  | "idle"
  | "loading"
  | "ready"
  | "countdown"
  | "running"
  | "paused"
  | "finished"
  | "aborted"
  | "error";
const transitions: Record<Phase, Phase[]> = {
  idle: ["loading", "aborted"],
  loading: ["ready", "error", "aborted"],
  ready: ["countdown", "aborted", "error"],
  countdown: ["running", "paused", "aborted", "error"],
  running: ["paused", "finished", "aborted", "error"],
  paused: ["countdown", "aborted", "error"],
  finished: [],
  aborted: [],
  error: ["aborted"],
};
export function canTransition(from: Phase, to: Phase) {
  return transitions[from].includes(to);
}
export class StateMachine {
  phase: Phase = "idle";
  transition(to: Phase) {
    if (!canTransition(this.phase, to))
      throw new Error(`Invalid transition ${this.phase} → ${to}`);
    this.phase = to;
  }
}
