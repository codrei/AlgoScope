// Derived information computed from a whole trace (used by the visualizer).
import type { HeapArr, HeapItem, HeapObj, SnapVal, Step, Trace } from '../engine/trace';

export interface LockInfo {
  /** per index: the step after which the cell is in its final place (-1 = never decided) */
  lockedAt: number[];
}

/**
 * A cell is "locked" (green) once the algorithm is done with it: no more
 * compares or writes touch it, and the array ends up sorted. This matches the
 * way bubble/selection/insertion/merge/quick sort are taught.
 */
export function computeLocks(trace: Trace): Map<number, LockInfo> {
  const out = new Map<number, LockInfo>();
  const last = trace.steps[trace.steps.length - 1];
  if (!last) return out;
  const writes = new Map<number, number>();
  const lockedAt = new Map<number, number[]>();
  // an array that is only filled (each cell written once, no swaps) is not being sorted
  const cellWrites = new Map<number, Map<number, number>>();
  const swapped = new Set<number>();
  let anyCompare = false;
  trace.steps.forEach((s, si) => {
    for (const t of s.touches) {
      if (t.role === 'read') continue;
      if (t.role === 'compare') anyCompare = true;
      if (t.role === 'swap') swapped.add(t.id);
      if (t.role === 'write') {
        const m = cellWrites.get(t.id) ?? new Map<number, number>();
        m.set(t.idx, (m.get(t.idx) ?? 0) + 1);
        cellWrites.set(t.id, m);
      }
      if (t.role !== 'compare') writes.set(t.id, (writes.get(t.id) ?? 0) + 1);
      let arr = lockedAt.get(t.id);
      if (!arr) {
        arr = [];
        lockedAt.set(t.id, arr);
      }
      arr[t.idx] = si;
    }
  });
  for (const [id, at] of lockedAt) {
    if ((writes.get(id) ?? 0) < 2 || !anyCompare) continue;
    const rewrites = [...(cellWrites.get(id)?.values() ?? [])].some((c) => c >= 2);
    if (!swapped.has(id) && !rewrites) continue;
    const final = findFinal(trace, id);
    if (!final || final.items.length < 2 || !isSorted(final.items)) continue;
    const n = final.items.length;
    const res: number[] = [];
    for (let i = 0; i < n; i++) res.push(at[i] ?? -1);
    out.set(id, { lockedAt: res });
  }
  return out;
}

function findFinal(trace: Trace, id: number): HeapArr | undefined {
  for (let i = trace.steps.length - 1; i >= 0; i--) {
    const h = trace.steps[i].heap[id];
    if (h && h.kind === 'arr') return h;
  }
  return undefined;
}

function isSorted(items: SnapVal[]): boolean {
  // only real number arrays (not true/false flags) with a few different values
  if (items.some((v) => v.t !== 'p' || /^(true|false)$/i.test(v.s))) return false;
  const nums = items.map((v) => (v.t === 'p' && v.n !== undefined ? v.n : NaN));
  if (nums.some((x) => Number.isNaN(x))) return false;
  if (new Set(nums).size < 3) return false;
  let asc = true;
  let desc = true;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < nums[i - 1]) asc = false;
    if (nums[i] > nums[i - 1]) desc = false;
  }
  return asc || desc;
}

/** Steps at which the array became fully locked (for the SORTED badge). */
export function lockedCells(info: LockInfo | undefined, step: number, isLast: boolean): Set<number> {
  const s = new Set<number>();
  if (!info) return s;
  info.lockedAt.forEach((at, i) => {
    if (isLast || (at >= 0 && at < step)) s.add(i);
  });
  return s;
}

export interface StructRef {
  id: number;
  names: string[];
  item: HeapItem;
  /** markers from the fields of the struct/class that holds this array (top, front, rear) */
  fieldMarkers?: Map<number, string[]>;
  /** other fields of that struct/class, e.g. "count = 3" */
  info?: string;
  /** the part of the array in use: 0..top for a stack, front..rear for a queue */
  range?: { lo: number; hi: number };
}

/** Fields of a stack/queue struct that point into its array. */
const INDEX_FIELDS = new Set(['top', 'front', 'rear', 'head', 'tail', 'myFront', 'myBack', 'myTop', 'first', 'last', 'tos', 'f', 'r']);

/** A struct/class that holds arrays but no links to other objects (a STACK, a QUEUE...). */
function isRecord(step: Step, o: HeapObj): boolean {
  let arrays = 0;
  for (const [, v] of o.fields) {
    if (v.t === 'r' || (v.t === 'ptr' && v.id !== undefined)) {
      const h = step.heap[(v as { id: number }).id];
      if (h?.kind === 'obj') return false;
      if (h?.kind === 'arr') arrays++;
    }
  }
  return arrays > 0;
}

/** Structures to draw for a step: arrays, objects and maps referenced by variables. */
export function structuresFor(step: Step): { arrays: StructRef[]; objects: { roots: { name: string; id: number; label: boolean }[] }; maps: StructRef[] } {
  const seen = new Map<number, StructRef>();
  const order: StructRef[] = [];
  const objRoots: { name: string; id: number; label: boolean }[] = [];
  const nested = new Set<number>();
  // arrays referenced from other arrays are drawn inside their parent (2D grids)
  for (const h of Object.values(step.heap)) {
    if (h.kind === 'arr') for (const v of h.items) if (v.t === 'r' && step.heap[v.id]?.kind === 'arr') nested.add(v.id);
  }
  // pointer labels only for the current call and the outermost one (main / globals)
  const lastIdx = step.frames.length - 1;
  const baseIdx = step.frames.findIndex((f) => f.fid !== 0);
  step.frames.forEach((f, fi) => {
    const label = fi === lastIdx || fi === baseIdx || f.fid === 0;
    for (const [name, v] of f.vars) {
      const id = v.t === 'r' ? v.id : v.t === 'ptr' && v.id !== undefined && step.heap[v.id]?.kind === 'obj' ? v.id : undefined;
      if (id === undefined) continue;
      const item = step.heap[id];
      if (!item) continue;
      // Java/C# main(String[] args) is always empty: not worth drawing
      if (name === 'args' && item.kind === 'arr' && item.items.length === 0) continue;
      if (item.kind === 'obj') {
        if (isRecord(step, item)) {
          // draw the struct's arrays as arrays, with its index fields as markers
          const sep = v.t === 'ptr' ? '->' : '.';
          const scalars = item.fields.filter(([, x]) => x.t === 'p');
          for (const [fname, fv] of item.fields) {
            if (fv.t !== 'r' && fv.t !== 'ptr') continue;
            const aid = (fv as { id?: number }).id;
            const arr = aid !== undefined ? step.heap[aid] : undefined;
            if (!arr || arr.kind !== 'arr' || aid === undefined) continue;
            const label = `${name}${sep}${fname}`;
            const ex = seen.get(aid);
            if (ex) {
              if (!ex.names.includes(label)) ex.names.push(label);
              continue;
            }
            const fieldMarkers = new Map<number, string[]>();
            const info: string[] = [];
            for (const [sn, sv] of scalars) {
              if (sv.t !== 'p') continue;
              if (INDEX_FIELDS.has(sn) && sv.n !== undefined && Number.isInteger(sv.n) && sv.n >= 0 && sv.n < arr.items.length) {
                fieldMarkers.set(sv.n, [...(fieldMarkers.get(sv.n) ?? []), sn]);
              } else info.push(`${sn} = ${sv.s}`);
            }
            const num = (fname2: string) => {
              const f2 = scalars.find(([sn]) => sn === fname2)?.[1];
              return f2 && f2.t === 'p' && f2.n !== undefined && Number.isInteger(f2.n) ? f2.n : undefined;
            };
            let range: { lo: number; hi: number } | undefined;
            const top = num('top') ?? num('myTop') ?? num('tos');
            const front = num('front') ?? num('myFront') ?? num('head');
            const rear = num('rear') ?? num('myBack') ?? num('tail');
            if (top !== undefined) range = { lo: 0, hi: top };
            else if (front !== undefined && rear !== undefined && front !== rear && front <= rear + 1) range = { lo: front, hi: rear };
            const ref: StructRef = { id: aid, names: [label], item: arr, fieldMarkers, info: info.join(' · '), range };
            seen.set(aid, ref);
            order.push(ref);
          }
          continue;
        }
        objRoots.push({ name, id, label });
        continue;
      }
      if (nested.has(id) && item.kind === 'arr') {
        // a row of a 2D array: still draw it if nothing else draws its parent
        const parentShown = order.some((s) => s.item.kind === 'arr' && s.item.items.some((x) => x.t === 'r' && x.id === id));
        if (parentShown) continue;
      }
      if (item.kind === 'arr' && item.items.some((x) => x.t === 'r' && step.heap[x.id]?.kind === 'obj') && !item.items.some((x) => x.t === 'p')) {
        // array of nodes (e.g. adjacency of objects): draw the objects as a graph too
        item.items.forEach((x, i) => x.t === 'r' && objRoots.push({ name: `${name}[${i}]`, id: x.id, label: false }));
      }
      const ex = seen.get(id);
      if (ex) {
        if (!ex.names.includes(name)) ex.names.push(name);
        continue;
      }
      const ref: StructRef = { id, names: [name], item };
      seen.set(id, ref);
      order.push(ref);
    }
  });
  return {
    arrays: order.filter((s) => s.item.kind === 'arr'),
    maps: order.filter((s) => s.item.kind === 'map'),
    objects: { roots: objRoots },
  };
}

/** Range bounds that are worth marking even when not used directly as an index. */
const BOUND_NAMES = ['low', 'high', 'lo', 'hi', 'mid', 'left', 'right', 'l', 'r', 'start', 'end', 'top', 'front', 'rear', 'first', 'last', 'minIdx', 'min_idx', 'minIndex', 'min_index', 'maxIdx', 'max_idx', 'pivotIndex', 'pi'];

/** Index markers (i, j, mid...) for an array, from the current frame and the globals. */
export function markersFor(step: Step, arrId: number, len: number): Map<number, string[]> {
  const out = new Map<number, string[]>();
  const cur = step.frames[step.frames.length - 1];
  if (!cur) return out;
  const global = step.frames[0]?.fid === 0 ? step.frames[0] : undefined;
  const frames = global && global !== cur ? [cur, global] : [cur];
  const refs = (v: SnapVal) => (v.t === 'r' && v.id === arrId) || (v.t === 'ptr' && v.id === arrId);
  // array variable names (in these frames) that point at this array
  const arrNames = new Set<string>();
  for (const f of frames) for (const [n, v] of f.vars) if (refs(v)) arrNames.add(n);
  if (!arrNames.size) return out;
  const wanted = new Set<string>();
  const usedElsewhere = new Set<string>();
  for (const f of frames) {
    for (const [arr, vars] of Object.entries(f.indexVars)) {
      for (const v of vars) (arrNames.has(arr) ? wanted : usedElsewhere).add(v);
    }
  }
  for (const b of BOUND_NAMES) if (!usedElsewhere.has(b)) wanted.add(b);
  const seen = new Set<string>();
  for (const f of frames) {
    for (const [name, v] of f.vars) {
      if (seen.has(name) || !wanted.has(name)) continue;
      if (v.t !== 'p' || v.n === undefined || !Number.isInteger(v.n)) continue;
      seen.add(name);
      if (v.n < 0 || v.n >= len) continue;
      const list = out.get(v.n) ?? [];
      list.push(name);
      out.set(v.n, list);
    }
  }
  return out;
}

/** The comparison operator in a COMPARE narration, for the bracket above the cells. */
export function compareOp(text: string): string | null {
  const m = /COMPARE .*?\) (<=|>=|==|!=|<|>) /.exec(text) ?? /COMPARE \S+ (<=|>=|==|!=|<|>) /.exec(text);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------- recursion tree

export interface CallNode {
  fid: number;
  name: string;
  label: string;
  parent: number | null;
  children: number[];
  start: number;
  end: number;
  ret?: string;
}

/** Every function call in the trace, with its caller, start/end step and return value. */
export function buildCallTree(trace: Trace): Map<number, CallNode> {
  const nodes = new Map<number, CallNode>();
  trace.steps.forEach((s, si) => {
    const fr = s.frames.filter((f) => f.fid !== 0);
    fr.forEach((f, i) => {
      let n = nodes.get(f.fid);
      if (!n) {
        const parent = i > 0 ? fr[i - 1].fid : null;
        const isTop = i === fr.length - 1;
        const m = isTop && s.kind === 'call' ? /^(?:CALL|NEW) (.*)$/.exec(s.text) : null;
        n = { fid: f.fid, name: f.name, label: m ? m[1] : `${f.name}()`, parent, children: [], start: si, end: si };
        nodes.set(f.fid, n);
        if (parent !== null) nodes.get(parent)?.children.push(f.fid);
      }
      n.end = si;
    });
    const top = fr[fr.length - 1];
    if (top && s.kind === 'return') {
      const m = /^RETURN (.*?)(?: from \S+)?$/.exec(s.text);
      const n = nodes.get(top.fid);
      if (n && m && m[1]) n.ret = m[1];
    }
  });
  return nodes;
}

/** The recursive call tree around the current step (or the last finished one), or null. */
export function recursionRoot(nodes: Map<number, CallNode>, step: Step, stepIndex: number): number | null {
  const isRoot = (n: CallNode) => {
    const parent = n.parent !== null ? nodes.get(n.parent) : undefined;
    return (!parent || parent.name !== n.name) && n.children.some((c) => nodes.get(c)?.name === n.name);
  };
  for (const f of step.frames) {
    const n = nodes.get(f.fid);
    if (n && isRoot(n)) return n.fid;
  }
  let best: CallNode | null = null;
  for (const n of nodes.values()) {
    if (n.start <= stepIndex && isRoot(n) && (!best || n.start > best.start)) best = n;
  }
  return best ? best.fid : null;
}

/** How much each array is worked on (writes and swaps count most), to pick what beginners see. */
export function computeImportance(trace: Trace): Map<number, number> {
  const score = new Map<number, number>();
  for (const s of trace.steps) {
    for (const t of s.touches) {
      const w = t.role === 'read' ? 0 : t.role === 'compare' ? 2 : 3;
      if (w) score.set(t.id, (score.get(t.id) ?? 0) + w);
    }
  }
  return score;
}

// ---------------------------------------------------------------- key steps

const KEY_KINDS = new Set(['start', 'end', 'error', 'call', 'return', 'print', 'compare', 'swap']);

/**
 * The steps worth stopping on in class: compares, swaps, changes to arrays and
 * nodes, pointers moving, new data, calls/returns and output. Loop bookkeeping
 * (i++, condition checks, temp variables) is skipped.
 */
export function keySteps(trace: Trace): number[] {
  const out: number[] = [];
  trace.steps.forEach((s, i) => {
    const prev = trace.steps[i - 1];
    let key = KEY_KINDS.has(s.kind) || s.touches.some((t) => t.role !== 'read');
    // console programs (gotoxy / cprintf): every change on the screen matters
    if (!key && prev && s.screen && (!prev.screen || s.screen.join('\n') !== prev.screen.join('\n'))) key = true;
    if (!key && prev) {
      for (const [id, h] of Object.entries(s.heap)) {
        const p = prev.heap[Number(id)];
        if (!p) {
          key = true; // new array / node / map
          break;
        }
        if (h.kind !== 'arr' && p !== h && JSON.stringify(p) !== JSON.stringify(h)) {
          key = true; // a node's field or a map changed
          break;
        }
      }
    }
    if (!key && prev) {
      // a pointer variable moved (cur = cur.next, prev = cur...)
      const f = s.frames[s.frames.length - 1];
      const pf = f && prev.frames.find((x) => x.fid === f.fid);
      if (f && pf) {
        for (const [n, v] of f.vars) {
          const isPtr = v.t === 'null' || (v.t === 'r' && s.heap[v.id]?.kind === 'obj');
          if (!isPtr) continue;
          const old = pf.vars.find((x) => x[0] === n);
          if (!old || JSON.stringify(old[1]) !== JSON.stringify(v)) {
            key = true;
            break;
          }
        }
      }
    }
    if (key) out.push(i);
  });
  // the first half of a swap (arr[j] = arr[j + 1]) is shown by the swap step itself
  const isWriteOnly = (i: number) => {
    const s = trace.steps[i];
    return s.kind !== 'swap' && s.touches.some((t) => t.role === 'write') && !s.touches.some((t) => t.role === 'swap' || t.role === 'compare');
  };
  const trimmed = out.filter((i, k) => !(isWriteOnly(i) && out[k + 1] === i + 1 && trace.steps[i + 1].kind === 'swap'));
  // a run of prints (an output loop) collapses to its last step
  if (trace.steps.some((st) => st.screen)) return trimmed;
  const result = trimmed.filter((i, k) => !(trace.steps[i].kind === 'print' && trimmed[k + 1] !== undefined && trace.steps[trimmed[k + 1]].kind === 'print'));
  // programs that only work with plain variables (brute force over bit patterns, number puzzles) would
  // jump straight to the end: add their decisions (if / switch) so there is something to step through
  if (result.length < 25 && result.length * 8 < trace.steps.length) {
    const extra = trace.steps.flatMap((st, i) => (st.kind === 'check' && /^(IF|SWITCH) /.test(st.text) ? [i] : []));
    return [...new Set([...result, ...extra])].sort((a, b) => a - b);
  }
  return result;
}
