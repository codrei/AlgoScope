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
