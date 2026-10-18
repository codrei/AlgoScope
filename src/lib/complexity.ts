// Complexity Lab: run an example on inputs of growing size and count operations.
import { runCode } from '../engine';
import type { Lang } from '../engine/ir';
import type { Example } from '../examples';

export type CaseKind = 'average' | 'best' | 'worst';

export interface Measurement {
  n: number;
  compares: number;
  swaps: number;
  steps: number;
}

export const SIZES = [8, 16, 32, 64];

/** Which examples the lab can resize, and how. */
export function labKind(ex: Example): 'sort' | 'linear' | 'binary' | null {
  if (ex.only) return null;
  if (ex.topic === 'Sorting') return 'sort';
  if (ex.id === 'linear-search') return 'linear';
  if (ex.id === 'binary-search') return 'binary';
  return null;
}

let seed = 7;
function rnd(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The literal array (e.g. "5, 1, 4, 2, 8, 3") that appears in the example's code. */
function originalList(code: string): string | null {
  const m = /[{[]\s*(-?\d+(?:,\s*-?\d+){3,})\s*[}\]]/.exec(code);
  return m ? m[1] : null;
}

/** Input data for one run. */
export function inputFor(kind: 'sort' | 'linear' | 'binary', n: number, c: CaseKind): { arr: number[]; target?: number } {
  seed = 7 + n;
  if (kind === 'sort') {
    if (c === 'best') return { arr: Array.from({ length: n }, (_, i) => i + 1) };
    if (c === 'worst') return { arr: Array.from({ length: n }, (_, i) => n - i) };
    return { arr: shuffled(n) };
  }
  if (kind === 'linear') {
    const arr = shuffled(n).map((x) => x * 3);
    if (c === 'best') return { arr, target: arr[0] };
    if (c === 'worst') return { arr, target: -1 };
    return { arr, target: arr[Math.floor(rnd() * n)] };
  }
  const arr = Array.from({ length: n }, (_, i) => (i + 1) * 3);
  if (c === 'best') return { arr, target: arr[Math.floor((n - 1) / 2)] };
  if (c === 'worst') return { arr, target: 3 * n + 1 };
  return { arr, target: arr[Math.floor(rnd() * n)] };
}

/** The example's code with its array (and search target) replaced. */
export function resizeCode(code: string, data: { arr: number[]; target?: number }): string | null {
  const orig = originalList(code);
  if (!orig) return null;
  let out = code.replace(orig, data.arr.join(', '));
  if (data.target !== undefined) out = out.replace(/target = -?\d+/, `target = ${data.target}`);
  return out;
}

export async function measure(ex: Example, lang: Lang, c: CaseKind, sizes = SIZES): Promise<Measurement[]> {
  const kind = labKind(ex);
  if (!kind) return [];
  const res: Measurement[] = [];
  for (const n of sizes) {
    const src = ex.code[lang];
    if (src === undefined) break;
    const code = resizeCode(src, inputFor(kind, n, c));
    if (!code) break;
    const r = await runCode(lang, code, { countsOnly: true, maxSteps: 400000, maxDepth: 400 });
    const fc = r.trace?.finalCounts;
    if (!fc || r.trace?.error) break;
    res.push({ n, compares: fc.compares, swaps: fc.swaps, steps: fc.steps });
    // let the page breathe between runs
    await new Promise((ok) => setTimeout(ok, 0));
  }
  return res;
}

/** f(n) for a Big-O label, used for the reference curve. */
export function growthFn(label: string): ((n: number) => number) | null {
  const t = label.replace(/\s+/g, '').toLowerCase();
  if (t.includes('nlogn')) return (n) => n * Math.log2(n);
  if (t.includes('n²') || t.includes('n^2')) return (n) => n * n;
  if (t.includes('logn')) return (n) => Math.log2(n);
  if (t.includes('2^n')) return (n) => Math.pow(2, n);
  if (/o\(n\)/.test(t)) return (n) => n;
  if (t.includes('o(1)')) return () => 1;
  return null;
}
