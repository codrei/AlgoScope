// The recorded execution: one Step per highlighted line, replayed by the visualizer.
import type { Lang } from './ir';
import type { ArrKind } from './values';

export type SnapVal =
  | { t: 'p'; s: string; n?: number }
  | { t: 'r'; id: number }
  | { t: 'ptr'; s: string; id?: number; idx?: number }
  | { t: 'null' };

export interface HeapArr {
  kind: 'arr';
  id: number;
  arrKind: ArrKind;
  items: SnapVal[];
}

export interface HeapObj {
  kind: 'obj';
  id: number;
  cls: string;
  fields: [string, SnapVal][];
}

export interface HeapMap {
  kind: 'map';
  id: number;
  isSet: boolean;
  entries: [SnapVal, SnapVal][];
}

export type HeapItem = HeapArr | HeapObj | HeapMap;

export interface FrameSnap {
  /** function name, or "Global" */
  name: string;
  /** line currently running in this frame */
  ln: number;
  vars: [string, SnapVal][];
  /** index variable names per array variable, e.g. { arr: ['j'] } */
  indexVars: Record<string, string[]>;
  /** frame id, stable across steps for the same call */
  fid: number;
}

export type TouchRole = 'read' | 'write' | 'compare' | 'swap';

export interface Touch {
  id: number;
  idx: number;
  role: TouchRole;
}

export type StepKind =
  | 'start'
  | 'assign'
  | 'check'
  | 'compare'
  | 'swap'
  | 'write'
  | 'call'
  | 'return'
  | 'print'
  | 'info'
  | 'end'
  | 'error';

export interface Counts {
  compares: number;
  swaps: number;
  reads: number;
  writes: number;
  calls: number;
}

export interface Step {
  ln: number;
  kind: StepKind;
  /** narration shown under the array ("COMPARE arr[0] (5) > arr[1] (1) → true") */
  text: string;
  frames: FrameSnap[];
  heap: Record<number, HeapItem>;
  /** length of the program output at this step */
  out: number;
  touches: Touch[];
  counts: Counts;
}

export interface Trace {
  lang: Lang;
  steps: Step[];
  stdout: string;
  error?: { msg: string; line: number };
  /** the program was stopped at the step limit */
  truncated?: boolean;
}
