// Algorithm-level captions: what phase of the algorithm a step belongs to
// ("Pass 2 of 5", "Partition around pivot 3"). They read the variables of the
// running program, so the same caption works in all five languages.
import type { SnapVal, Step } from '../engine/trace';

const norm = (s: string) => s.toLowerCase().replace(/[_\s]/g, '');

interface Ctx {
  step: Step;
  /** innermost frame whose function name matches */
  inFn: (name: string) => boolean;
  num: (...names: string[]) => number | undefined;
  str: (...names: string[]) => string | undefined;
  arr: (name: string, idx: number | undefined) => string | undefined;
  calls: number;
}

function makeCtx(step: Step): Ctx {
  const frames = [...step.frames].reverse();
  const top = frames[0];
  const find = (names: string[]): SnapVal | undefined => {
    const wanted = names.map(norm);
    for (const f of frames) {
      for (const [n, v] of f.vars) if (wanted.includes(norm(n))) return v;
    }
    return undefined;
  };
  return {
    step,
    inFn: (name) => !!top && norm(top.name).replace(/^.*\./, '') === norm(name),
    num: (...names) => {
      const v = find(names);
      return v && v.t === 'p' && v.n !== undefined ? v.n : undefined;
    },
    str: (...names) => {
      const v = find(names);
      if (!v) return undefined;
      if (v.t === 'p') return v.s;
      if (v.t === 'r') {
        const h = step.heap[v.id];
        if (h?.kind === 'arr') return h.items.map((x) => (x.t === 'p' ? x.s.replace(/^'|'$/g, '') : '')).join('');
      }
      return undefined;
    },
    arr: (name, idx) => {
      if (idx === undefined) return undefined;
      const v = find([name]);
      if (!v || v.t !== 'r') return undefined;
      const h = step.heap[v.id];
      if (h?.kind !== 'arr') return undefined;
      const x = h.items[idx];
      return x && x.t === 'p' ? x.s : undefined;
    },
    calls: step.counts.calls,
  };
}

const unq = (s: string | undefined) => (s ?? '').replace(/^["']|["']$/g, '');

type CaptionFn = (c: Ctx) => string | null;

const CAPTIONS: Record<string, CaptionFn> = {
  'bubble-sort': (c) => {
    const i = c.num('i');
    const n = c.num('n') ?? 6;
    if (!c.inFn('bubbleSort') || i === undefined) return null;
    return `Pass ${i + 1} of ${n - 1}: compare neighbors and push the largest unsorted value to the end.`;
  },
  'selection-sort': (c) => {
    const i = c.num('i');
    if (!c.inFn('selectionSort') || i === undefined) return null;
    const min = c.arr('arr', c.num('minIdx', 'min_idx'));
    return `Pass ${i + 1}: find the smallest value from position ${i} onward${min ? ` (smallest so far: ${min})` : ''}, then move it to position ${i}.`;
  },
  'insertion-sort': (c) => {
    const i = c.num('i');
    const key = c.num('key');
    if (!c.inFn('insertionSort') || i === undefined) return null;
    return key === undefined
      ? `Round ${i}: take the next value and slide it into the sorted part on the left.`
      : `Round ${i}: insert the key ${key} into the sorted part on the left, shifting bigger values right.`;
  },
  'merge-sort': (c) => {
    const l = c.num('left');
    const r = c.num('right');
    const m = c.num('mid');
    if (c.inFn('merge') && l !== undefined && r !== undefined && m !== undefined) {
      return `Merge: combine the sorted halves arr[${l}..${m}] and arr[${m + 1}..${r}] into one sorted part.`;
    }
    if (c.inFn('mergeSort') && l !== undefined && r !== undefined) {
      return l >= r ? `arr[${l}] is a single value, which is already sorted.` : `Divide: split arr[${l}..${r}] into two halves and sort each one.`;
    }
    return null;
  },
  'quick-sort': (c) => {
    const lo = c.num('low');
    const hi = c.num('high');
    if (c.inFn('partition') && lo !== undefined && hi !== undefined) {
      const p = c.num('pivot');
      return `Partition arr[${lo}..${hi}] around the pivot ${p ?? c.arr('arr', hi) ?? ''}: smaller values go to its left.`;
    }
    if (c.inFn('quickSort') && lo !== undefined && hi !== undefined) {
      return lo >= hi ? `arr[${lo}..${hi}] has at most one value, so it is already sorted.` : `Sort arr[${lo}..${hi}]: partition it, then sort both sides.`;
    }
    return null;
  },
  'linear-search': (c) => {
    const t = c.num('target');
    if (!c.inFn('linearSearch') || t === undefined) return null;
    return `Look at each element from left to right until we find ${t}.`;
  },
  'binary-search': (c) => {
    const lo = c.num('low');
    const hi = c.num('high');
    const t = c.num('target');
    if (!c.inFn('binarySearch') || lo === undefined || hi === undefined) return null;
    return `Search for ${t} between index ${lo} and ${hi} (${Math.max(0, hi - lo + 1)} values left): check the middle and drop the wrong half.`;
  },
  factorial: (c) => {
    const n = c.num('n');
    if (!c.inFn('factorial') || n === undefined) return null;
    return n <= 1 ? 'Base case: factorial(1) is 1, so the calls can start returning.' : `factorial(${n}) needs factorial(${n - 1}) first, so it waits on the call stack.`;
  },
  fibonacci: (c) => {
    const n = c.num('n');
    if (!c.inFn('fib') || n === undefined) return null;
    return n <= 1 ? `Base case: fib(${n}) = ${n}.` : `fib(${n}) = fib(${n - 1}) + fib(${n - 2}). ${c.calls - 1} calls so far: notice the repeated work.`;
  },
  'tower-of-hanoi': (c) => {
    const n = c.num('n');
    const from = unq(c.str('from', 'source'));
    const to = unq(c.str('to', 'target'));
    if (!c.inFn('hanoi') || n === undefined) return null;
    return n === 1 ? `Move the smallest disk straight from ${from} to ${to}.` : `Move ${n} disks from ${from} to ${to}: first move ${n - 1} out of the way.`;
  },
  'stack-array': (c) => {
    const top = c.num('top');
    if (top === undefined) return null;
    return top < 0 ? 'The stack is empty (top = -1).' : `The stack holds ${top + 1} value${top ? 's' : ''}; the top is at index ${top}.`;
  },
  'queue-circular': (c) => {
    const count = c.num('count');
    const front = c.num('front');
    const rear = c.num('rear');
    if (count === undefined) return null;
    return `The queue holds ${count} value${count === 1 ? '' : 's'}: front at index ${front}, rear at index ${rear}. Indexes wrap around with % SIZE.`;
  },
  'balanced-parentheses': (c) => {
    const e = unq(c.str('expr'));
    if (!e) return null;
    return `Checking "${e}": push opening brackets, pop and match on closing ones.`;
  },
  'linked-list': (c) => {
    if (c.inFn('insertEnd')) return `Add ${c.num('data', 'value') ?? ''} at the end: walk to the last node and link the new node after it.`;
    if (c.inFn('reverse')) return 'Reverse the list in place: turn each node\'s arrow around, one node at a time.';
    if (c.inFn('printList')) return 'Print the list by following the arrows from head.';
    return null;
  },
  'binary-search-tree': (c) => {
    if (c.inFn('insert')) return `Insert ${c.num('key') ?? ''}: smaller keys go left, larger keys go right, until we reach an empty spot.`;
    if (c.inFn('inorder')) return 'Inorder traversal: visit the left subtree, then the node, then the right subtree. This prints the keys in sorted order.';
    return null;
  },
  'fibonacci-dp': (c) => {
    const i = c.num('i');
    if (!c.inFn('fib') || i === undefined) return null;
    return `Fill dp[${i}] using the two values before it. Each value is computed only once.`;
  },
  knapsack: (c) => {
    const i = c.num('i');
    const w = c.num('w');
    if (!c.inFn('knapsack') || i === undefined || w === undefined) return null;
    if (i === 0 || w === 0) return 'Row 0 / column 0: no items or no capacity means value 0.';
    return `Item ${i} (weight ${c.arr('wt', i - 1)}, value ${c.arr('val', i - 1)}) with capacity ${w}: skip it, or take it if it fits, whichever is worth more.`;
  },
  lcs: (c) => {
    const i = c.num('i');
    const j = c.num('j');
    const X = unq(c.str('X'));
    const Y = unq(c.str('Y'));
    if (!c.inFn('lcs') || i === undefined || j === undefined) return null;
    if (i === 0 || j === 0) return 'Empty prefix: the LCS length is 0.';
    return `Compare "${X[i - 1] ?? '?'}" (X[${i - 1}]) with "${Y[j - 1] ?? '?'}" (Y[${j - 1}]): a match extends the diagonal, otherwise take the better neighbor.`;
  },
  bfs: (c) => {
    const node = c.num('node');
    if (!c.inFn('bfs')) return null;
    return node === undefined ? 'Start at vertex 0: mark it visited and put it in the queue.' : `Visit vertex ${node}: add its unvisited neighbors to the back of the queue.`;
  },
  dfs: (c) => {
    const node = c.num('node');
    if (!c.inFn('dfs') || node === undefined) return null;
    return `At vertex ${node}: go as deep as possible through an unvisited neighbor before coming back.`;
  },
  dijkstra: (c) => {
    if (c.inFn('minDistance')) return 'Pick the unvisited vertex with the smallest known distance.';
    const u = c.num('u');
    if (c.inFn('dijkstra') && u !== undefined) return `Vertex ${u} is now final. Relax its neighbors: is going through ${u} shorter?`;
    if (c.inFn('dijkstra')) return 'Start: the source has distance 0, every other vertex ∞.';
    return null;
  },
};

/** The algorithm-level caption for a step of a built-in example (or null). */
export function captionFor(exampleId: string, step: Step): string | null {
  const fn = CAPTIONS[exampleId];
  if (!fn) return null;
  try {
    // inside a small helper (swap, max...) use the caption of the function that called it
    for (let drop = 0; drop < 3 && drop < step.frames.length; drop++) {
      const frames = drop ? step.frames.slice(0, -drop) : step.frames;
      const c = fn(makeCtx({ ...step, frames }));
      if (c) return c;
    }
    return null;
  } catch {
    return null;
  }
}
