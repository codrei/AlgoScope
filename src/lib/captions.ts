// Algorithm-level captions: what phase of the algorithm a step belongs to
// ("Pass 2 of 5", "Partition around pivot 3"). They read the variables of the
// running program, so the same caption works in all five languages.
import type { SnapVal, Step } from '../engine/trace';

const norm = (s: string) => s.toLowerCase().replace(/[_\s]/g, '');

/** facts about the whole run that a single step cannot know (computed once per run) */
export interface RunInfo {
  /** heap sort: the first step of the "move the largest to the end" phase */
  extractFrom?: number;
}

interface Ctx {
  step: Step;
  /** index of this step in the run, and facts about the whole run */
  index: number;
  info: RunInfo;
  /** innermost frame whose function name matches */
  inFn: (name: string) => boolean;
  num: (...names: string[]) => number | undefined;
  str: (...names: string[]) => string | undefined;
  arr: (name: string, idx: number | undefined) => string | undefined;
  /** a value inside a 2D array: graph[u][v] */
  arr2: (name: string, i: number | undefined, j: number | undefined) => string | undefined;
  /** did this step write the 2D cell name[i][j]? */
  wrote2: (name: string, i: number | undefined, j: number | undefined) => boolean;
  /** a field of an object variable: root.data */
  field: (name: string, field: string) => string | undefined;
  /** the array cells this step compared / wrote / swapped, with their values */
  touched: (role: 'compare' | 'write' | 'swap' | 'read', arrName?: string) => { idx: number; v: string; n?: number }[];
  /** the result of this step's condition (→ true / → false), if it has one */
  outcome: () => boolean | undefined;
  calls: number;
}

function makeCtx(step: Step, index = 0, info: RunInfo = {}): Ctx {
  const frames = [...step.frames].reverse();
  const top = frames[0];
  const find = (names: string[]): SnapVal | undefined => {
    // exact names first: knapsack has both w (the column) and W (the capacity)
    for (const f of frames) {
      for (const [n, v] of f.vars) if (names.includes(n)) return v;
    }
    const wanted = names.map(norm);
    for (const f of frames) {
      for (const [n, v] of f.vars) if (wanted.includes(norm(n))) return v;
    }
    return undefined;
  };
  return {
    step,
    index,
    info,
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
    arr2: (name, i, j) => {
      if (i === undefined || j === undefined) return undefined;
      const v = find([name]);
      if (!v || v.t !== 'r') return undefined;
      const row = step.heap[v.id];
      const rv = row?.kind === 'arr' ? row.items[i] : undefined;
      if (!rv || rv.t !== 'r') return undefined;
      const h = step.heap[rv.id];
      const x = h?.kind === 'arr' ? h.items[j] : undefined;
      return x && x.t === 'p' ? x.s : undefined;
    },
    wrote2: (name, i, j) => {
      if (i === undefined || j === undefined) return false;
      const v = find([name]);
      const outer = v && v.t === 'r' ? step.heap[v.id] : undefined;
      const row = outer?.kind === 'arr' ? outer.items[i] : undefined;
      return !!row && row.t === 'r' && step.touches.some((t) => t.role === 'write' && t.id === row.id && t.idx === j);
    },
    field: (name, fieldName) => {
      const v = find([name]);
      if (!v || v.t !== 'r') return undefined;
      const h = step.heap[v.id];
      if (h?.kind !== 'obj') return undefined;
      const x = h.fields.find(([k]) => norm(k) === norm(fieldName))?.[1];
      return x && x.t === 'p' ? x.s : undefined;
    },
    touched: (role, arrName) => {
      const only = arrName ? find([arrName]) : undefined;
      const onlyId = only && only.t === 'r' ? only.id : undefined;
      return step.touches
        .filter((t) => t.role === role && (!arrName || t.id === onlyId))
        .map((t) => {
          const h = step.heap[t.id];
          const x = h?.kind === 'arr' ? h.items[t.idx] : undefined;
          return { idx: t.idx, v: x && x.t === 'p' ? x.s : '?', n: x && x.t === 'p' ? x.n : undefined };
        });
    },
    outcome: () => {
      const m = /→ (true|false)/.exec(step.text);
      return m ? m[1] === 'true' : undefined;
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
    // at the start of a round key still holds the previous round's value
    const newRound = /^FOR |^(i\+\+|i \+= 1) · /.test(c.step.text) || key === undefined;
    return newRound
      ? `Round ${i}: take the next value (${c.arr('arr', i) ?? '?'}) and slide it into the sorted part on the left.`
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
  'heap-sort': (c) => {
    const n = c.num('n');
    const i = c.num('i');
    const extracting = c.info.extractFrom !== undefined && c.index >= c.info.extractFrom;
    if (c.inFn('heapify') && i !== undefined) return `Repair the heap at index ${i}: a parent must be bigger than both children (heap size ${n ?? ''}).`;
    if (c.inFn('heapSort') && extracting) return 'Move the largest value (arr[0]) into its final place at the end, then repair the smaller heap.';
    if (c.inFn('heapSort')) return 'First build a max-heap: fix every parent from the last one up to the root, so the largest value rises to arr[0].';
    return null;
  },
  'counting-sort': (c) => {
    if (!c.inFn('countingSort')) return null;
    const k = c.num('k');
    const v = c.num('v');
    if (k !== undefined && v !== undefined) return `Write the value ${v} back as many times as it was counted. The next free position is ${k}.`;
    if (c.step.frames.at(-1)?.vars.some(([n]) => n === 'count')) return 'Tally each value: count[v] is how many times v appears. No two elements are ever compared.';
    return 'Find the largest value, so the count array knows how big to be.';
  },
  'string-matching': (c) => {
    const i = c.num('i');
    const j = c.num('j');
    if (!c.inFn('search') || i === undefined) return null;
    return `Try the pattern starting at text index ${i}${j !== undefined ? `: ${j} character${j === 1 ? '' : 's'} matched so far` : ''}.`;
  },
  'hash-table': (c) => {
    const key = c.num('key');
    if (key === undefined) return null;
    if (c.inFn('insert')) return `Insert ${key}: its home slot is ${key} % 7 = ${key % 7}. If that slot is taken, try the next one.`;
    if (c.inFn('search')) return `Search for ${key}: start at slot ${key % 7} and move forward until we find it or reach an empty slot.`;
    return null;
  },
  'topological-sort': (c) => {
    if (!c.inFn('topologicalSort')) return null;
    const node = c.num('node');
    if (node !== undefined) return `Output vertex ${node}, then remove its edges. A neighbor whose indegree drops to 0 joins the queue.`;
    return 'Count the edges coming into each vertex (its indegree). Vertices with indegree 0 can go first.';
  },
  'prim-mst': (c) => {
    if (c.inFn('minKey')) return 'Pick the vertex outside the tree with the cheapest edge into it.';
    const u = c.num('u');
    if (c.inFn('prim') && u !== undefined) return `Vertex ${u} joins the tree. Update the cheapest known edge to each vertex still outside.`;
    if (c.inFn('prim')) return 'Start the tree at vertex 0. Every other vertex has no known edge yet (∞).';
    return null;
  },
  'floyd-warshall': (c) => {
    const k = c.num('k');
    const i = c.num('i');
    const j = c.num('j');
    if (!c.inFn('floydWarshall') || k === undefined) return null;
    if (i === undefined || j === undefined) return `Round ${k + 1}: allow vertex ${k} as a stop on every path.`;
    if (i === k || j === k || i === j) return `Round ${k + 1}: a path from or to vertex ${k} itself cannot get shorter by stopping at ${k}.`;
    return `Is going ${i} → ${k} → ${j} shorter than the best known path ${i} → ${j}?`;
  },
  'n-queens': (c) => {
    const row = c.num('row');
    const col = c.num('col');
    if (row === undefined) return null;
    if (c.inFn('isSafe')) return `Is row ${row}, column ${col} safe? Look for a queen in the same column and on both diagonals above.`;
    if (c.inFn('solve')) return row >= 4 ? 'All 4 queens are placed, so the search can stop.' : row === 0 ? 'Row 0: try each column for the first queen.' : `Row ${row}: try each column. If none is safe, go back and move the queen in row ${row - 1}.`;
    return null;
  },
  'coin-change': (c) => {
    const amount = c.num('amount');
    if (!c.inFn('coinChange') || amount === undefined) return null;
    return amount === 0 ? 'Nothing left to pay.' : `${amount} left to pay: take the biggest coin that still fits.`;
  },
  'activity-selection': (c) => {
    const i = c.num('i');
    const last = c.num('last');
    if (!c.inFn('selectActivities') || i === undefined || last === undefined) return null;
    return `Activity ${i} starts at ${c.arr('start', i) ?? '?'}; the last chosen activity ends at ${c.arr('finish', last) ?? '?'}. Take it only if it does not overlap.`;
  },
  gcd: (c) => {
    const a = c.num('a');
    const b = c.num('b');
    if (!c.inFn('gcd') || a === undefined || b === undefined) return null;
    return b === 0 ? `The remainder is 0, so the answer is ${a}.` : 'Divide a by b and keep the remainder. Then repeat with (b, remainder): gcd(a, b) = gcd(b, a % b).';
  },
  'growth-rates': (c) => {
    const n = c.num('n');
    const steps = c.num('steps');
    for (const [fn, label] of [['constant', 'O(1): one step, whatever n is'], ['logarithmic', 'O(log n): i doubles each time, so few steps'], ['linear', 'O(n): one step per element'], ['quadratic', 'O(n²): n steps for each of the n rows']] as const) {
      if (c.inFn(fn)) return `${label} (n = ${n}, ${steps ?? 0} so far).`;
    }
    return null;
  },
  'fast-power': (c) => {
    const x = c.num('x');
    const n = c.num('n');
    if (!c.inFn('power') || n === undefined) return null;
    return n === 0 ? `Base case: ${x}^0 = 1.` : `${x}^${n} = (${x}^${Math.floor(n / 2)})²${n % 2 ? ` × ${x}` : ''}: solve the half once and square it.`;
  },
  'array-operations': (c) => {
    if (c.inFn('insertAt')) return `Insert ${c.num('value')} at position ${c.num('pos')}: shift the elements from the end one place right to open a gap.`;
    if (c.inFn('deleteAt')) return `Delete position ${c.num('pos')}: shift the later elements one place left to close the gap.`;
    return null;
  },
  'doubly-linked-list': (c) => {
    if (c.inFn('insertEnd')) return `Add ${c.num('data') ?? ''} after the tail: link it both ways (tail.next and node.prev).`;
    if (c.inFn('deleteValue')) return `Delete ${c.num('data') ?? ''}: find it, then link its previous and next nodes to each other.`;
    if (c.inFn('printForward')) return 'Walk forward from head using next.';
    if (c.inFn('printBackward')) return 'Walk backward from tail using prev.';
    return null;
  },
  'infix-to-postfix': (c) => {
    if (c.inFn('precedence')) return '* and / bind tighter (2) than + and - (1).';
    if (!c.inFn('toPostfix')) return null;
    const ch = unq(c.str('c'));
    if (!ch) return 'Read the expression left to right.';
    if (/[A-Z]/.test(ch)) return `${ch} is an operand: write it to the output.`;
    if (ch === '(') return '( waits on the stack until its ) arrives.';
    if (ch === ')') return ') pops operators to the output until the matching (.';
    return `${ch} is an operator: first pop the operators on the stack that bind at least as tightly.`;
  },
  'tree-traversals': (c) => {
    if (c.inFn('preorder')) return 'Preorder: print the node first, then visit its left and right subtrees.';
    if (c.inFn('inorder')) return 'Inorder: visit the left subtree, print the node, then the right subtree.';
    if (c.inFn('postorder')) return 'Postorder: visit both subtrees first, print the node last.';
    if (c.inFn('levelOrder')) return 'Level order: take the node at the front of the queue, print it, and add its children to the back.';
    return null;
  },
  'min-heap': (c) => {
    if (c.inFn('insert')) return `Insert ${c.num('value') ?? ''}: put it at the end, then swap it with its parent while it is smaller.`;
    if (c.inFn('extractMin')) return 'Remove the root (the smallest). Move the last value to the root and let it sink below its smaller child.';
    return null;
  },
  'coin-change-dp': (c) => {
    const a = c.num('a');
    if (!c.inFn('minCoins') || a === undefined) return null;
    return `Amount ${a}: for each coin, try it as the last coin: 1 + dp[${a} - coin]. Keep the smallest.`;
  },
  'kruskal-mst': (c) => {
    if (c.inFn('find')) return 'Find: follow parent links up to the leader of the group.';
    const i = c.num('i');
    if (!c.inFn('kruskal') || i === undefined) return c.inFn('kruskal') ? 'Every vertex starts in its own group.' : null;
    return `Next cheapest edge (#${i}): keep it only if its two ends are in different groups, otherwise it would make a cycle.`;
  },
  'fractional-knapsack': (c) => {
    const i = c.num('i');
    const cap = c.num('capacity');
    if (!c.inFn('knapsack') || i === undefined) return null;
    return `Item ${i} (best value per kg left), ${cap} kg of space left: take all of it if it fits, otherwise the part that fits.`;
  },
  permutations: (c) => {
    const start = c.num('start');
    if (!c.inFn('permute') || start === undefined) return null;
    return `Choose the letter for position ${start}, arrange the rest, then swap back to try the next letter.`;
  },
  'tsp-brute-force': (c) => {
    const count = c.num('count');
    const city = c.num('city');
    if (!c.inFn('tour') || count === undefined) return null;
    return count === 4 ? `All cities visited: add the trip back to city 0 and compare with the best tour so far.` : `At city ${city} with ${count} of 4 cities visited: try every unvisited city next. Brute force tries all (n-1)! orders.`;
  },
  'subset-sum': (c) => {
    const mask = c.num('mask');
    if (mask === undefined) return null;
    const bits = mask.toString(2).padStart(6, '0').split('').reverse().join('');
    return `Subset #${mask + 1} of 64. Bits ${bits}: a 1 means take the number in that position. Brute force tries all 2ⁿ subsets.`;
  },
};

/** The algorithm-level caption for a step of a built-in example (or null). */
export function captionFor(exampleId: string, step: Step, index = 0, info: RunInfo = {}): string | null {
  return fromTable(CAPTIONS, exampleId, step, index, info);
}

function fromTable(table: Record<string, CaptionFn>, exampleId: string, step: Step, index: number, info: RunInfo): string | null {
  const fn = table[exampleId];
  if (!fn) return null;
  try {
    // inside a small helper (swap, max...) use the caption of the function that called it
    for (let drop = 0; drop < 3 && drop < step.frames.length; drop++) {
      const frames = drop ? step.frames.slice(0, -drop) : step.frames;
      const c = fn(makeCtx({ ...step, frames }, index, info));
      if (c) return c;
    }
    return null;
  } catch {
    return null;
  }
}

/** Facts about a whole run that the captions and chapters of an example need. */
export function runInfo(exampleId: string, steps: Step[]): RunInfo {
  const info: RunInfo = {};
  if (exampleId === 'heap-sort') {
    // the extract phase starts when heapSort itself (not heapify) first moves arr[0] to the end;
    // its loop check just before that is where the phase begins
    const inSort = (st: Step) => {
      const top = st.frames[st.frames.length - 1];
      return !!top && norm(top.name).replace(/^.*\./, '') === 'heapsort';
    };
    const first = steps.findIndex((st) => inSort(st) && st.touches.some((t) => t.idx === 0 && (t.role === 'write' || t.role === 'swap')));
    if (first >= 0) {
      let k = first;
      while (k > 0 && !(inSort(steps[k]) && steps[k].kind === 'check')) k--;
      info.extractFrom = k;
    }
  }
  return info;
}

/**
 * Moments: the idea behind a key step of a built-in example, in words and values
 * ("Is 8 bigger than the key 4? Yes, so 8 shifts one place right"). They are shown instead of the
 * code-level sentence, which stays underneath in smaller text.
 */
const MOMENTS: Record<string, CaptionFn> = {
  'bubble-sort': (c) => {
    if (!c.inFn('bubbleSort')) return null;
    const cmp = c.touched('compare');
    if (c.step.kind === 'compare' && cmp.length === 2) {
      const [a, b] = cmp[0].idx < cmp[1].idx ? cmp : [cmp[1], cmp[0]];
      return c.outcome()
        ? `Compare the neighbors ${a.v} and ${b.v}: is ${a.v} bigger? Yes, they are in the wrong order, so they swap.`
        : `Compare the neighbors ${a.v} and ${b.v}: is ${a.v} bigger? No, they are already in order.`;
    }
    const sw = c.touched('swap');
    if (c.step.kind === 'swap' && sw.length === 2) {
      const [a, b] = sw[0].idx < sw[1].idx ? sw : [sw[1], sw[0]];
      return `Swap: ${b.v} moves right and ${a.v} moves left. The bigger value keeps bubbling toward the end.`;
    }
    return null;
  },
  'selection-sort': (c) => {
    if (!c.inFn('selectionSort')) return null;
    const j = c.num('j');
    const min = c.arr('arr', c.num('minIdx', 'min_idx', 'minIndex'));
    if (c.step.kind === 'compare' && j !== undefined) {
      const v = c.arr('arr', j);
      return c.outcome()
        ? `Is ${v} smaller than the smallest so far (${min})? Yes, so ${v} becomes the new smallest.`
        : `Is ${v} smaller than the smallest so far (${min})? No, ${min} is still the smallest.`;
    }
    const sw = c.touched('swap');
    if (c.step.kind === 'swap' && sw.length === 2) {
      const i = c.num('i');
      const into = sw.find((t) => t.idx === i) ?? sw[0];
      return `Swap the smallest value ${into.v} into position ${i}. Everything up to index ${i} is now sorted.`;
    }
    return null;
  },
  'insertion-sort': (c) => {
    if (!c.inFn('insertionSort')) return null;
    const key = c.num('key');
    const j = c.num('j');
    if (c.step.kind === 'compare' && j !== undefined && j >= 0) {
      const v = c.arr('arr', j);
      return c.outcome()
        ? `Is ${v} bigger than the key ${key}? Yes, so ${v} shifts one place right to make room.`
        : `Is ${v} bigger than the key ${key}? No, so the key belongs right after it.`;
    }
    const w = c.touched('write');
    if (w.length === 1) {
      const copied = c.touched('read').length > 0 && String(w[0].n) !== String(key);
      return copied
        ? `Shift ${w[0].v} one place right, into index ${w[0].idx}. Its old spot is the gap the key can move into.`
        : `Drop the key ${w[0].v} into the gap at index ${w[0].idx}. The left part is sorted again.`;
    }
    return null;
  },
  'quick-sort': (c) => {
    if (!c.inFn('partition')) return null;
    const pivot = c.num('pivot');
    const j = c.num('j');
    if (c.step.kind === 'compare' && j !== undefined) {
      const v = c.arr('arr', j);
      return c.outcome()
        ? `Is ${v} smaller than the pivot ${pivot}? Yes, so it belongs on the left side.`
        : `Is ${v} smaller than the pivot ${pivot}? No, so it stays on the right side.`;
    }
    const sw = c.touched('swap');
    if (c.step.kind === 'swap' && sw.length === 2) {
      const high = c.num('high');
      if (sw.some((t) => t.idx === high)) {
        const at = sw.find((t) => t.idx !== high)!;
        return `Put the pivot ${pivot} between the two sides, at index ${at.idx}. It is now in its final place.`;
      }
      return `Move ${sw.find((t) => t.n !== undefined && pivot !== undefined && t.n <= pivot)?.v ?? sw[0].v} into the left side (the values smaller than the pivot).`;
    }
    return null;
  },
  'heap-sort': (c) => {
    const sw = c.touched('swap');
    if (c.inFn('heapify')) {
      const left = c.num('left');
      const right = c.num('right');
      const largest = c.num('largest');
      const i = c.num('i');
      const cmp = c.touched('compare');
      if (c.step.kind === 'compare' && cmp.length === 2) {
        const child = cmp.find((t) => t.idx === left || t.idx === right);
        const other = cmp.find((t) => t !== child);
        if (child && other) {
          const side = child.idx === left ? 'left' : 'right';
          const who = other.idx === i ? `the parent ${other.v}` : `the bigger child so far, ${other.v}`;
          return c.outcome()
            ? `Is the ${side} child ${child.v} bigger than ${who}? Yes, so it is the largest so far.`
            : `Is the ${side} child ${child.v} bigger than ${who}? No.`;
        }
      }
      if (c.step.kind === 'swap' && sw.length === 2 && largest !== undefined) {
        const parent = sw.find((t) => t.idx === i);
        const child = sw.find((t) => t.idx !== i);
        return `The parent ${child?.v} was smaller than its child ${parent?.v}: swap them, so the bigger value is on top. Then repair below.`;
      }
      return null;
    }
    if (c.inFn('heapSort') && c.step.kind === 'swap' && sw.length === 2) {
      const end = sw.find((t) => t.idx !== 0);
      return `The largest value ${end?.v} is at the top (arr[0]). Move it to its final place at index ${end?.idx}.`;
    }
    return null;
  },
  'merge-sort': (c) => {
    if (!c.inFn('merge')) return null;
    // the two front values being compared, whatever the index variables are called (i/j, a/b)
    const a = c.touched('compare', 'L')[0]?.v;
    const b = c.touched('compare', 'R')[0]?.v;
    if (c.step.kind === 'compare' && a !== undefined && b !== undefined) {
      return c.outcome()
        ? `Which front value is smaller, ${a} (left half) or ${b} (right half)? ${a}, so it goes next.`
        : `Which front value is smaller, ${a} (left half) or ${b} (right half)? ${b}, so it goes next.`;
    }
    const w = c.touched('write', 'arr');
    if (w.length === 1) return `Write ${w[0].v} into arr[${w[0].idx}]. The merged part grows by one.`;
    return null;
  },
  'linear-search': (c) => {
    if (!c.inFn('linearSearch') || c.step.kind !== 'compare') return null;
    const i = c.num('i');
    const t = c.num('target');
    const v = c.arr('arr', i);
    if (v === undefined) return null;
    return c.outcome() ? `Is ${v} the target ${t}? Yes, found it at index ${i}.` : `Is ${v} the target ${t}? No, so look at the next element.`;
  },
  'binary-search': (c) => {
    if (!c.inFn('binarySearch') || c.step.kind !== 'compare') return null;
    const mid = c.num('mid');
    const t = c.num('target');
    const v = c.arr('arr', mid);
    if (v === undefined || t === undefined) return null;
    const n = Number(v);
    if (n === t) return `The middle value is ${v}. That is the target: found it at index ${mid}.`;
    // the "== target" check comes first; the next check decides which half to drop
    if (/==/.test(c.step.text)) return `Look at the middle value, arr[${mid}] = ${v}. Is it the target ${t}? No.`;
    return n < t
      ? `The middle value is ${v}, smaller than ${t}. The target can only be in the right half, so drop the left half.`
      : `The middle value is ${v}, bigger than ${t}. The target can only be in the left half, so drop the right half.`;
  },
  'binary-search-tree': (c) => {
    if (!c.inFn('insert') || c.step.kind !== 'check' || !/</.test(c.step.text)) return null;
    const key = c.num('key');
    const here = c.field('root', 'key') ?? c.field('root', 'data') ?? c.field('node', 'key');
    if (key === undefined || here === undefined) return null;
    return key < Number(here)
      ? `${key} is smaller than ${here}, so it goes into the left subtree.`
      : `${key} is not smaller than ${here}, so it goes into the right subtree.`;
  },
  dijkstra: (c) => {
    if (!c.inFn('dijkstra') || c.step.kind !== 'compare') return null;
    const u = c.num('u');
    const v = c.num('v');
    const du = c.arr('dist', u);
    const dv = c.arr('dist', v);
    const w = c.arr2('graph', u, v);
    if (u === undefined || v === undefined || du === undefined || !w || w === '0' || c.arr('visited', v) === '1' || c.arr('visited', v) === 'true') return null;
    const via = Number(du) + Number(w);
    const old = /^(2147483647|9223372036854775807|∞|inf|Infinity)$/.test(dv ?? '') ? '∞' : dv;
    return c.outcome()
      ? `Going through ${u} reaches ${v} with distance ${du} + ${w} = ${via}, shorter than ${old}. Update it.`
      : `Going through ${u} would give ${v} distance ${via}, not shorter than ${old}. Keep ${old}.`;
  },
};

const DP_MOMENTS: Record<string, CaptionFn> = {
  'fibonacci-dp': (c) => {
    const w = c.touched('write', 'dp');
    const i = c.num('i');
    if (!c.inFn('fib') || w.length !== 1 || i === undefined || i < 2) return null;
    return `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${c.arr('dp', i - 1)} + ${c.arr('dp', i - 2)} = ${w[0].v}. Both were computed earlier, so nothing is worked out twice.`;
  },
  knapsack: (c) => {
    const i = c.num('i');
    const w = c.num('w');
    if (!c.inFn('knapsack') || !c.wrote2('dp', i, w) || i === undefined || w === undefined) return null;
    const v = c.arr2('dp', i, w);
    if (i === 0 || w === 0) return `No items or no capacity: the best value is 0.`;
    const wt = Number(c.arr('wt', i - 1));
    const val = Number(c.arr('val', i - 1));
    const skip = c.arr2('dp', i - 1, w);
    if (wt > w) return `Item ${i} weighs ${wt}, more than the capacity ${w}, so it cannot go in: keep the value above, ${skip}.`;
    const rest = c.arr2('dp', i - 1, w - wt);
    return `Item ${i} (weight ${wt}, value ${val}) with capacity ${w}: skip it → ${skip}, or take it → ${val} + ${rest} = ${val + Number(rest)}. The better one is ${v}.`;
  },
  lcs: (c) => {
    const i = c.num('i');
    const j = c.num('j');
    if (!c.inFn('lcs') || !c.wrote2('dp', i, j) || i === undefined || j === undefined) return null;
    const v = c.arr2('dp', i, j);
    if (i === 0 || j === 0) return 'One of the prefixes is empty, so the common part has length 0.';
    const x = unq(c.str('X'))[i - 1];
    const y = unq(c.str('Y'))[j - 1];
    if (x === y) return `"${x}" = "${y}": a match! It extends the answer for both shorter prefixes: dp[${i - 1}][${j - 1}] + 1 = ${v}.`;
    return `"${x}" ≠ "${y}": no match, so take the better of above (${c.arr2('dp', i - 1, j)}) and left (${c.arr2('dp', i, j - 1)}) → ${v}.`;
  },
  'coin-change-dp': (c) => {
    const a = c.num('a');
    const w = c.touched('write', 'dp');
    if (!c.inFn('minCoins') || a === undefined || w.length !== 1) return null;
    if (w[0].v === '999') return `Amount ${a}: no way to make it is known yet (999 stands for "impossible").`;
    const coin = c.arr('coins', c.num('i'));
    return coin ? `Amount ${a}: use a ${coin} coin last. That is 1 coin + the best for ${a - Number(coin)} (${c.arr('dp', a - Number(coin))}) = ${w[0].v} coin${w[0].v === '1' ? '' : 's'}, fewer than before.` : null;
  },
  'floyd-warshall': (c) => {
    const i = c.num('i');
    const j = c.num('j');
    const k = c.num('k');
    if (!c.inFn('floydWarshall') || !c.wrote2('dist', i, j) || k === undefined) return null;
    return `Shorter path found: ${i} → ${k} → ${j} costs ${c.arr2('dist', i, k)} + ${c.arr2('dist', k, j)} = ${c.arr2('dist', i, j)}.`;
  },
};
Object.assign(MOMENTS, DP_MOMENTS);

/** The idea behind this step of a built-in example, if it is one of the key moments. */
export function momentFor(exampleId: string, step: Step, index = 0, info: RunInfo = {}): string | null {
  const fn = MOMENTS[exampleId];
  if (!fn) return null;
  try {
    const m = fn(makeCtx(step, index, info));
    if (m) return m;
    // a swap done inside a small swap() helper belongs to the function that called it
    const top = step.frames[step.frames.length - 1];
    if (top && /swap/i.test(top.name) && step.frames.length > 1) return fn(makeCtx({ ...step, frames: step.frames.slice(0, -1) }, index, info));
    return null;
  } catch {
    return null;
  }
}

/**
 * Chapters: the parts of an algorithm ("Pass 2 of 5", "Merge [0..2]") that the timeline is split into.
 * Steps where the label is null belong to the chapter before them.
 */
const CHAPTERS: Record<string, CaptionFn> = {
  'bubble-sort': (c) => (c.inFn('bubbleSort') && c.num('i') !== undefined ? `Pass ${c.num('i')! + 1} of ${(c.num('n') ?? 6) - 1}` : null),
  'selection-sort': (c) => (c.inFn('selectionSort') && c.num('i') !== undefined ? `Pass ${c.num('i')! + 1}` : null),
  'insertion-sort': (c) => (c.inFn('insertionSort') && c.num('i') !== undefined ? `Insert arr[${c.num('i')}]` : null),
  'merge-sort': (c) => {
    const l = c.num('left');
    const r = c.num('right');
    if (c.inFn('merge') && l !== undefined && r !== undefined) return `Merge [${l}..${r}]`;
    if (c.inFn('mergeSort') && l !== undefined && r !== undefined && l < r) return `Split [${l}..${r}]`;
    return null;
  },
  'quick-sort': (c) => (c.inFn('partition') && c.num('low') !== undefined ? `Partition [${c.num('low')}..${c.num('high')}]` : null),
  'heap-sort': (c) => {
    if (c.info.extractFrom === undefined || c.index < c.info.extractFrom) return c.inFn('main') ? null : 'Build the heap';
    const i = c.num('i');
    if (c.inFn('heapSort') && i !== undefined && i > 0) return `Move the largest to arr[${i}]`;
    return null;
  },
  'counting-sort': (c) => {
    if (!c.inFn('countingSort')) return null;
    if (c.num('k') !== undefined) return 'Write back';
    if (c.step.frames.at(-1)?.vars.some(([n]) => n === 'count')) return 'Count';
    return 'Find the largest';
  },
  'binary-search': (c) => (c.inFn('binarySearch') && c.num('low') !== undefined && c.num('high') !== undefined ? `Search [${c.num('low')}..${c.num('high')}]` : null),
  'string-matching': (c) => (c.inFn('search') && c.num('i') !== undefined ? `Try index ${c.num('i')}` : null),
  'tree-traversals': (c) => {
    for (const [fn, label] of [['preorder', 'Preorder'], ['inorder', 'Inorder'], ['postorder', 'Postorder'], ['levelOrder', 'Level order']] as const) {
      if (c.step.frames.some((f) => norm(f.name).replace(/^.*\./, '') === norm(fn))) return label;
    }
    return null;
  },
  'growth-rates': (c) => {
    const n = c.num('n');
    for (const fn of ['constant', 'logarithmic', 'linear', 'quadratic']) if (c.inFn(fn)) return `n = ${n}: ${fn}`;
    return null;
  },
  'n-queens': (c) => (c.inFn('solve') && c.num('row') !== undefined ? `Row ${c.num('row')}` : null),
  dijkstra: (c) => (c.inFn('dijkstra') && c.num('u') !== undefined ? `Vertex ${c.num('u')}` : null),
  'prim-mst': (c) => (c.inFn('prim') && c.num('u') !== undefined ? `Add vertex ${c.num('u')}` : null),
  bfs: (c) => (c.inFn('bfs') && c.num('node') !== undefined ? `Visit ${c.num('node')}` : null),
  dfs: (c) => (c.inFn('dfs') && c.num('node') !== undefined ? `Visit ${c.num('node')}` : null),
  'topological-sort': (c) => {
    if (!c.inFn('topologicalSort')) return null;
    if (c.num('node') !== undefined) return `Output ${c.num('node')}`;
    // once the queue exists we are past counting; between two outputs keep the current part
    return c.step.frames.at(-1)?.vars.some(([n]) => n === 'queue' || n === 'q') ? null : 'Count indegrees';
  },
  'floyd-warshall': (c) => (c.inFn('floydWarshall') && c.num('k') !== undefined ? `Through vertex ${c.num('k')}` : null),
  knapsack: (c) => (c.inFn('knapsack') && c.num('i') !== undefined ? `Item ${c.num('i')}` : null),
  lcs: (c) => (c.inFn('lcs') && c.num('i') !== undefined ? `Row ${c.num('i')}` : null),
  'coin-change-dp': (c) => (c.inFn('minCoins') && c.num('a') !== undefined ? `Amount ${c.num('a')}` : null),
  'kruskal-mst': (c) => (c.inFn('kruskal') && c.num('i') !== undefined ? `Edge ${c.num('i')}` : null),
  'activity-selection': (c) => (c.inFn('selectActivities') && c.arr('start', c.num('i')) !== undefined ? `Activity ${c.num('i')}` : null),
  'coin-change': (c) => {
    const coin = c.inFn('coinChange') ? c.arr('coins', c.num('i')) : undefined;
    return coin ? `Coin ${coin}` : null;
  },
  // only at the loop check: in between, a is already updated and b not yet
  gcd: (c) => (c.inFn('gcd') && c.step.kind === 'check' && c.num('b') ? `${c.num('a')} ÷ ${c.num('b')}` : null),
  'infix-to-postfix': (c) => {
    const ch = unq(c.str('c'));
    return c.inFn('toPostfix') && ch ? `Read ${ch}` : null;
  },
  'balanced-parentheses': (c) => {
    const ch = unq(c.str('c', 'ch'));
    return ch && /[()[\]{}]/.test(ch) ? `Read ${ch}` : null;
  },
  'subset-sum': (c) => (c.num('mask') !== undefined ? `Subset #${c.num('mask')! + 1}` : null),
  'fractional-knapsack': (c) => (c.inFn('knapsack') && c.num('i') !== undefined ? `Item ${c.num('i')}` : null),
  permutations: (c) => (c.inFn('permute') && c.num('start') !== undefined ? `Fix position ${c.num('start')}` : null),
};

/** The chapter label of a step of a built-in example (null: same chapter as before). */
export function chapterFor(exampleId: string, step: Step, index = 0, info: RunInfo = {}): string | null {
  return fromTable(CHAPTERS, exampleId, step, index, info);
}

export function hasChapters(exampleId: string): boolean {
  return exampleId in CHAPTERS;
}

/** recursive examples: coming back to a part that already ran is not a new part */
export function chapterOnce(exampleId: string): boolean {
  return ['merge-sort', 'dfs', 'permutations'].includes(exampleId);
}
