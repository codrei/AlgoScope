// Chapters split a run into the parts of the algorithm ("Pass 2 of 5", "Merge [0..2]",
// "push(10)"), so a student can see where they are and jump between parts.
import type { Step, Trace } from '../engine/trace';
import { chapterFor, chapterOnce, hasChapters, type RunInfo } from './captions';

export interface Chapter {
  /** trace step index where the chapter starts */
  start: number;
  label: string;
}

/** Built-in examples: the labels from captions.ts. Other code: operations called from main, or rounds of the main loop. */
export function chaptersFor(trace: Trace, exampleId: string | null, info: RunInfo = {}): Chapter[] {
  if (exampleId && hasChapters(exampleId)) {
    const ch = fromLabels(trace.steps, (st, i) => chapterFor(exampleId, st, i, info), chapterOnce(exampleId));
    if (ch.length >= 2) return ch;
  }
  const calls = callChapters(trace.steps);
  if (calls.length >= 3) return calls;
  const loop = loopChapters(trace.steps);
  return loop.length >= 2 ? loop : [];
}

/** A step that leaves a loop or a function: the loop variable is already past the end there. */
function leaving(st: Step): boolean {
  return st.kind === 'return' || st.kind === 'end' || (st.kind === 'check' && /exit loop|loop finished/.test(st.text));
}

/**
 * once: a label that already had a chapter does not start a new one. Recursive algorithms come back
 * to a call that already ran (merge sort's split, a DFS vertex); that is not a new part.
 */
function fromLabels(steps: Step[], label: (st: Step, i: number) => string | null, once = false): Chapter[] {
  const out: Chapter[] = [];
  const seen = new Set<string>();
  steps.forEach((st, i) => {
    if (leaving(st)) return;
    const l = label(st, i);
    if (!l || (out.length && out[out.length - 1].label === l) || (once && seen.has(l))) return;
    out.push({ start: i, label: l });
    seen.add(l);
  });
  return out;
}

/** push(&s, 10) → push(10); insertEnd(Node #2, 20) → insertEnd(20): leave out the structure itself */
function callLabel(text: string): string {
  const m = /^(?:CALL|NEW) ([\w.]+)\((.*)\)$/.exec(text);
  if (!m) return text.replace(/^(CALL|NEW) /, '').slice(0, 32);
  const args = m[2] ? m[2].split(/,\s*/).filter((a) => !/^(\w+ #\d+|null|None|nullptr|NULL|&\w+|\[.*|this|self)$/.test(a.trim())) : [];
  return `${m[1].replace(/^.*\./, '')}(${args.join(', ')})`.slice(0, 32);
}

/** Each function called straight from main (or from the top level in Python) is one operation: push(10), pop()... */
function callChapters(steps: Step[]): Chapter[] {
  const depths = steps.filter((s) => s.kind !== 'start' && s.kind !== 'end' && s.frames.length > 0).map((s) => s.frames.length);
  if (!depths.length) return [];
  const entry = Math.min(...depths);
  const out: Chapter[] = [];
  steps.forEach((st, i) => {
    if (st.kind === 'call' && st.frames.length === entry + 1) {
      out.push({ start: i, label: callLabel(st.text) });
    }
  });
  return out;
}

/** Rounds of the outermost loop of the function where most of the work happens: "i = 0", "i = 1"... */
function loopChapters(steps: Step[]): Chapter[] {
  // the busiest function (by frame id, so recursion does not mix calls together)
  const work = new Map<number, number>();
  for (const st of steps) {
    const f = st.frames[st.frames.length - 1];
    if (f) work.set(f.fid, (work.get(f.fid) ?? 0) + 1);
  }
  const busiest = [...work.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (busiest === undefined) return [];
  // loop checks in that function, per line; the first loop in the function is the outer one
  const checks = new Map<number, number[]>();
  steps.forEach((st, i) => {
    const f = st.frames[st.frames.length - 1];
    if (!f || f.fid !== busiest || st.kind !== 'check' || !/^(CHECK|WHILE|FOR) .*→ true/.test(st.text.replace(/^.*?(CHECK|WHILE)/, '$1'))) return;
    const list = checks.get(st.ln) ?? [];
    list.push(i);
    checks.set(st.ln, list);
  });
  const loops = [...checks.entries()].filter(([, l]) => l.length >= 2).sort((a, b) => a[0] - b[0]);
  if (!loops.length) return [];
  const [, rounds] = loops[0];
  return rounds.map((i, k) => {
    const st = steps[i];
    const v = /(?:CHECK|WHILE) \(?([A-Za-z_]\w*)/.exec(st.text)?.[1];
    const f = st.frames[st.frames.length - 1];
    const val = v ? f.vars.find(([n]) => n === v)?.[1] : undefined;
    const numeric = val && val.t === 'p' && /^-?\d+(\.\d+)?$/.test(val.s);
    return { start: i, label: numeric ? `${v} = ${val.s}` : `Round ${k + 1}` };
  });
}

/** Chapter positions in the steps the controls move through (key steps or every line). */
export function chapterPositions(chapters: Chapter[], view: number[]): { pos: number; label: string }[] {
  const out: { pos: number; label: string }[] = [];
  for (const c of chapters) {
    const p = view.findIndex((i) => i >= c.start);
    if (p < 0) continue;
    // a key-steps view may skip the chapter's first line; never point before an earlier chapter
    if (out.length && p <= out[out.length - 1].pos) {
      if (out[out.length - 1].pos === p) out[out.length - 1] = { pos: p, label: c.label };
      continue;
    }
    out.push({ pos: p, label: c.label });
  }
  return out;
}
