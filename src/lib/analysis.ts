// Derived information computed from a whole trace (used by the visualizer).
import type { HeapArr, HeapItem, SnapVal, Step, Trace } from '../engine/trace';

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
  trace.steps.forEach((s, si) => {
    for (const t of s.touches) {
      if (t.role === 'read') continue;
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
    if ((writes.get(id) ?? 0) < 2) continue;
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
  const nums = items.map((v) => (v.t === 'p' && v.n !== undefined ? v.n : NaN));
  if (nums.some((x) => Number.isNaN(x))) return false;
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
}

/** Structures to draw for a step: arrays, objects and maps referenced by variables. */
export function structuresFor(step: Step): { arrays: StructRef[]; objects: { roots: { name: string; id: number }[] }; maps: StructRef[] } {
  const seen = new Map<number, StructRef>();
  const order: StructRef[] = [];
  const objRoots: { name: string; id: number }[] = [];
  const nested = new Set<number>();
  // arrays referenced from other arrays are drawn inside their parent (2D grids)
  for (const h of Object.values(step.heap)) {
    if (h.kind === 'arr') for (const v of h.items) if (v.t === 'r' && step.heap[v.id]?.kind === 'arr') nested.add(v.id);
  }
  for (const f of step.frames) {
    for (const [name, v] of f.vars) {
      const id = v.t === 'r' ? v.id : v.t === 'ptr' && v.id !== undefined && step.heap[v.id]?.kind === 'obj' ? v.id : undefined;
      if (id === undefined) continue;
      const item = step.heap[id];
      if (!item) continue;
      // Java/C# main(String[] args) is always empty: not worth drawing
      if (name === 'args' && item.kind === 'arr' && item.items.length === 0) continue;
      if (item.kind === 'obj') {
        objRoots.push({ name, id });
        continue;
      }
      if (nested.has(id) && item.kind === 'arr') {
        // a row of a 2D array: still draw it if nothing else draws its parent
        const parentShown = order.some((s) => s.item.kind === 'arr' && s.item.items.some((x) => x.t === 'r' && x.id === id));
        if (parentShown) continue;
      }
      if (item.kind === 'arr' && item.items.some((x) => x.t === 'r' && step.heap[x.id]?.kind === 'obj') && !item.items.some((x) => x.t === 'p')) {
        // array of nodes (e.g. adjacency of objects): draw the objects as a graph too
        item.items.forEach((x, i) => x.t === 'r' && objRoots.push({ name: `${name}[${i}]`, id: x.id }));
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
  }
  return {
    arrays: order.filter((s) => s.item.kind === 'arr'),
    maps: order.filter((s) => s.item.kind === 'map'),
    objects: { roots: objRoots },
  };
}

const COMMON_INDEX = ['i', 'j', 'k', 'low', 'high', 'lo', 'hi', 'mid', 'left', 'right', 'l', 'r', 'start', 'end', 'min_idx', 'minIdx', 'minIndex', 'min_index', 'maxIdx', 'max_idx', 'top', 'front', 'rear', 'p', 'q', 'idx', 'pos', 'first', 'last'];

/** Index markers (i, j, mid...) for an array in the current frame. */
export function markersFor(step: Step, arrId: number, len: number): Map<number, string[]> {
  const out = new Map<number, string[]>();
  const f = step.frames[step.frames.length - 1];
  if (!f) return out;
  const refersHere = f.vars.some(([, v]) => (v.t === 'r' && v.id === arrId) || (v.t === 'ptr' && v.id === arrId));
  if (!refersHere) return out;
  const names = new Set([...f.indexVars, ...COMMON_INDEX]);
  for (const [name, v] of f.vars) {
    if (!names.has(name) || v.t !== 'p' || v.n === undefined || !Number.isInteger(v.n)) continue;
    if (v.n < 0 || v.n >= len) continue;
    const list = out.get(v.n) ?? [];
    list.push(name);
    out.set(v.n, list);
  }
  return out;
}

/** The comparison operator in a COMPARE narration, for the bracket above the cells. */
export function compareOp(text: string): string | null {
  const m = /COMPARE .*?\) (<=|>=|==|!=|<|>) /.exec(text) ?? /COMPARE \S+ (<=|>=|==|!=|<|>) /.exec(text);
  return m ? m[1] : null;
}
