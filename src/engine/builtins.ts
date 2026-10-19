// Standard-library functions, methods and constants for the five languages.
import type { Expr, Ty } from './ir';
import { csFormat, csFormatItem, printf, pyRepr, pyStr, toText } from './format';
import type { Interp } from './interp';
import { cmpVals, convert, ElemCell } from './interp';
import { Arr, Chr, Flt, FnV, Iter, MapV, Obj, RangeV, Special, isNumeric, keyOf, num, truthy, typeName, valEq, type ArrKind, type Val } from './values';

export const NF = Symbol('not-found');
type R = Val | typeof NF;

const INT_MAX = 2147483647;
const INT_MIN = -2147483648;

// ------------------------------------------------------------------ library types
const LIB: Record<string, { kind: 'arr'; arr: ArrKind } | { kind: 'map'; set: boolean; sorted: boolean } | { kind: 'special' }> = {
  vector: { kind: 'arr', arr: 'vector' },
  list: { kind: 'arr', arr: 'deque' },
  deque: { kind: 'arr', arr: 'deque' },
  stack: { kind: 'arr', arr: 'stack' },
  queue: { kind: 'arr', arr: 'queue' },
  priority_queue: { kind: 'arr', arr: 'pq' },
  map: { kind: 'map', set: false, sorted: true },
  unordered_map: { kind: 'map', set: false, sorted: false },
  set: { kind: 'map', set: true, sorted: true },
  unordered_set: { kind: 'map', set: true, sorted: false },
  multiset: { kind: 'map', set: true, sorted: true },
  ArrayList: { kind: 'arr', arr: 'list' },
  LinkedList: { kind: 'arr', arr: 'deque' },
  ArrayDeque: { kind: 'arr', arr: 'deque' },
  Stack: { kind: 'arr', arr: 'stack' },
  Queue: { kind: 'arr', arr: 'queue' },
  PriorityQueue: { kind: 'arr', arr: 'pq' },
  List: { kind: 'arr', arr: 'list' },
  Vector: { kind: 'arr', arr: 'list' },
  HashMap: { kind: 'map', set: false, sorted: false },
  LinkedHashMap: { kind: 'map', set: false, sorted: false },
  TreeMap: { kind: 'map', set: false, sorted: true },
  Dictionary: { kind: 'map', set: false, sorted: false },
  SortedDictionary: { kind: 'map', set: false, sorted: true },
  HashSet: { kind: 'map', set: true, sorted: false },
  LinkedHashSet: { kind: 'map', set: true, sorted: false },
  TreeSet: { kind: 'map', set: true, sorted: true },
  SortedSet: { kind: 'map', set: true, sorted: true },
  Scanner: { kind: 'special' },
  Random: { kind: 'special' },
  StringBuilder: { kind: 'special' },
};

export function isLibraryType(base: string): boolean {
  return base in LIB;
}

let seed = 12345;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed;
}

export function libraryNew(I: Interp, t: Ty, vals: Val[], exprs?: Expr[]): Val {
  void exprs;
  if (t.base === 'string') {
    if (vals[0] instanceof Arr) return vals[0].items.map((x) => (x instanceof Chr ? String.fromCharCode(x.c) : toText(x, I.lang))).join('');
    if (vals.length === 2 && isNumeric(vals[0])) return toText(vals[1], I.lang).repeat(num(vals[0]));
    return vals.length ? I.strOf(vals[0]) : '';
  }
  if (t.base === 'pair') {
    const p = new Obj('pair');
    p.fields.set('first', vals[0] ?? 0);
    p.fields.set('second', vals[1] ?? 0);
    return p;
  }
  const spec = LIB[t.base];
  if (!spec) throw I.err(`unknown type ${t.base}`);
  if (spec.kind === 'special') {
    if (t.base === 'Random') {
      if (vals.length) seed = num(vals[0]);
      return new Special('Random');
    }
    if (t.base === 'StringBuilder') {
      const sb = new Obj('StringBuilder');
      sb.fields.set('value', vals.length ? I.strOf(vals[0]) : '');
      return sb;
    }
    return new Special(t.base);
  }
  const elemTy = t.args?.[0];
  if (spec.kind === 'map') {
    const m = new MapV(spec.set, spec.sorted);
    const src = vals[0];
    if (src instanceof MapV) for (const [k, v] of src.entries) m.entries.set(k, v);
    else if (src instanceof Arr) {
      for (const x of src.items) {
        if (!spec.set && x instanceof Arr && x.items.length === 2) m.entries.set(keyOf(x.items[0]), [x.items[0], x.items[1]]);
        else m.entries.set(keyOf(x), [x, true]);
      }
    }
    return m;
  }
  const a = new Arr([], spec.arr, elemTy);
  if (spec.arr === 'pq') {
    a.minHeap = I.lang !== 'cpp' || t.args?.[2]?.base === 'greater';
    const custom = vals.find((v) => v instanceof FnV || v instanceof Special);
    if (custom) a.cmpFn = toComparator(I, custom);
    if (I.lang === 'cpp' && t.args?.[2]?.base === 'greater') a.cmpFn = undefined;
    if (!a.cmpFn && I.lang !== 'cpp') {
      const nat = naturalCmp(I);
      a.cmpFn = (x, y) => nat(x, y);
    }
    if (I.lang === 'csharp' && (t.args?.length ?? 0) >= 2) a.priorityPairs = true;
  }
  if (vals.length) {
    const v0 = vals[0];
    if (I.lang === 'cpp' && spec.arr === 'vector' && isNumeric(v0)) {
      const n = num(v0);
      if (n > 100000) throw I.err(`vector size ${n} is too large`);
      const fill = vals.length > 1 ? vals[1] : I.defaultFor(elemTy ?? { base: 'int', arr: 0, ptr: 0 }, false) ?? 0;
      for (let i = 0; i < n; i++) a.items.push(fill instanceof Arr ? new Arr([...fill.items], fill.kind, fill.elemTy) : fill);
    } else if (v0 instanceof Arr) {
      a.items = [...v0.items];
      if (spec.arr === 'pq') {
        a.items = [];
        for (const x of v0.items) heapPush(I, a, x);
        I.touches.length = 0;
      }
    } else if (v0 instanceof MapV) {
      a.items = [...v0.entries.values()].map(([k]) => k);
    }
  }
  return a;
}

// ------------------------------------------------------------------ comparators

/** Natural order, using compareTo / CompareTo / __lt__ for user objects (Comparable). */
export function naturalCmp(I: Interp): (a: Val, b: Val) => number {
  return (a, b) => {
    if (a instanceof Obj) {
      for (const n of ['compareTo', 'CompareTo']) {
        const m = I.findMethod(a.cls, n, 1);
        if (m) return num(I.invoke(m, [b], a));
      }
      const lt = I.findMethod(a.cls, '__lt__', 1);
      if (lt) return truthy(I.invoke(lt, [b], a)) ? -1 : truthy(I.invoke(lt, [a], b as Obj)) ? 1 : 0;
    }
    return cmpVals(a, b);
  };
}

/** A comparator value (Java Comparator / C# Comparison / lambda / reverseOrder) as a JS function. */
export function toComparator(I: Interp, c: Val): ((a: Val, b: Val) => number) | undefined {
  const nat = naturalCmp(I);
  if (c instanceof Special && (c.kind === 'reverseOrder' || c.kind === 'greater')) return (a, b) => -nat(a, b);
  if (c instanceof Special && c.kind === 'less') return nat;
  if (c instanceof FnV) {
    return (a, b) => {
      const r = I.callFnValue(c, [a, b]);
      if (typeof r === 'boolean') return r ? -1 : truthy(I.callFnValue(c, [b, a])) ? 1 : 0;
      return num(r);
    };
  }
  return undefined;
}

function nativeFn(name: string, fn: (args: Val[]) => Val): FnV {
  const f = new FnV(name);
  f.native = fn;
  return f;
}

// ------------------------------------------------------------------ heaps
function heapLess(a: Arr, x: Val, y: Val): boolean {
  if (a.cmpFn) return a.cmpFn(x, y) < 0;
  const c = cmpVals(x, y);
  return a.minHeap ? c < 0 : c > 0;
}

function heapPush(I: Interp, a: Arr, v: Val) {
  a.items.push(v);
  let i = a.items.length - 1;
  I.touches.push({ id: a.id, idx: i, role: 'write' });
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (!heapLess(a, a.items[i], a.items[p])) break;
    [a.items[i], a.items[p]] = [a.items[p], a.items[i]];
    I.counts.swaps++;
    I.touches.push({ id: a.id, idx: p, role: 'swap' }, { id: a.id, idx: i, role: 'swap' });
    i = p;
  }
  a.version++;
}

function heapPop(I: Interp, a: Arr): Val {
  if (!a.items.length) throw I.err('the priority queue / heap is empty');
  const top = a.items[0];
  const last = a.items.pop()!;
  if (a.items.length) {
    a.items[0] = last;
    siftDown(I, a, 0);
  }
  a.version++;
  return top;
}

function siftDown(I: Interp | null, a: Arr, i: number) {
  const n = a.items.length;
  for (;;) {
    const l = 2 * i + 1, r = l + 1;
    let m = i;
    if (l < n && heapLess(a, a.items[l], a.items[m])) m = l;
    if (r < n && heapLess(a, a.items[r], a.items[m])) m = r;
    if (m === i) break;
    [a.items[i], a.items[m]] = [a.items[m], a.items[i]];
    if (I) {
      I.counts.swaps++;
      I.touches.push({ id: a.id, idx: i, role: 'swap' }, { id: a.id, idx: m, role: 'swap' });
    }
    i = m;
  }
}

function heapify(a: Arr) {
  for (let i = (a.items.length >> 1) - 1; i >= 0; i--) siftDown(null, a, i);
}

// ------------------------------------------------------------------ names
export function builtinName(I: Interp, name: string): R {
  const L = I.lang;
  if (L === 'c' || L === 'cpp') {
    switch (name) {
      case 'cout': case 'cin': case 'cerr': case 'endl': case 'fixed': case 'boolalpha':
        return new Special(name === 'cerr' ? 'cout' : name);
      case 'INT_MAX': return INT_MAX;
      case 'INT_MIN': return INT_MIN;
      case 'LLONG_MAX': case 'LONG_MAX': return Number.MAX_SAFE_INTEGER;
      case 'LLONG_MIN': case 'LONG_MIN': return Number.MIN_SAFE_INTEGER;
      case 'UINT_MAX': return 4294967295;
      case 'RAND_MAX': return 2147483647;
      case 'EOF': return -1;
      // conio.h colors
      case 'BLINK': return 128;
      case 'BLACK': return 0;
      case 'BLUE': return 1;
      case 'GREEN': return 2;
      case 'CYAN': return 3;
      case 'RED': return 4;
      case 'MAGENTA': return 5;
      case 'BROWN': return 6;
      case 'LIGHTGRAY': return 7;
      case 'DARKGRAY': return 8;
      case 'YELLOW': return 14;
      case 'WHITE': return 15;
      case 'M_PI': return new Flt(Math.PI);
      case 'true': return true;
      case 'false': return false;
      case 'string': return new Special('string');
    }
  }
  if (L === 'java') {
    switch (name) {
      case 'System': case 'Math': case 'Integer': case 'Long': case 'Double': case 'Character': case 'String':
      case 'Arrays': case 'Collections': case 'Boolean': case 'List': case 'Comparator': case 'IO':
        return new Special(name);
    }
  }
  if (L === 'csharp') {
    switch (name) {
      case 'Console': case 'Math': case 'Array': case 'Convert': case 'String': case 'Char': case 'Enumerable':
        return new Special(name);
      case 'int': case 'Int32': return new Special('int');
      case 'long': case 'Int64': return new Special('long');
      case 'double': case 'Double': return new Special('double');
      case 'string': return new Special('String');
      case 'char': return new Special('Char');
    }
  }
  if (L === 'python') {
    switch (name) {
      case 'math': case 'sys': case 'heapq': case 'collections': case 'random': case 'itertools': case 'functools':
        return new Special(name);
      case 'defaultdict': case 'Counter': case 'OrderedDict': case 'set': case 'dict': case 'tuple': case 'bool':
        return new Special(name);
      case '__name__': return '__main__';
      case 'print': case 'len': case 'range': case 'min': case 'max': case 'sum': case 'abs': case 'int': case 'float':
      case 'str': case 'sorted': case 'list': case 'deque': case 'ord': case 'chr':
        return new Special(name);
    }
  }
  return NF;
}

// ------------------------------------------------------------------ helpers
function vals(I: Interp, args: Expr[]): Val[] {
  const out: Val[] = [];
  for (const a of args) {
    if (a.k === 'kw') continue;
    if (a.k === 'spread') out.push(...I.iterToArray(I.ev(a.e)));
    else out.push(I.ev(a));
  }
  return out;
}

function kwargs(I: Interp, args: Expr[]): Map<string, Val> {
  const m = new Map<string, Val>();
  for (const a of args) if (a.k === 'kw') m.set(a.name, I.ev(a.value));
  return m;
}

function lenOf(I: Interp, v: Val): number {
  if (v instanceof Obj) {
    const m = I.findMethod(v.cls, '__len__', 0);
    if (m) return num(I.invoke(m, [], v));
  }
  if (typeof v === 'string') return v.length;
  if (v instanceof Arr) return v.items.length;
  if (v instanceof MapV) return v.entries.size;
  if (v instanceof RangeV) return v.length;
  throw I.err(`object of type '${typeName(v)}' has no len()`);
}

function numResult(x: number, likeFloat: boolean): Val {
  return likeFloat ? new Flt(x) : x;
}

function mathFn(I: Interp, name: string, a: Val[]): R {
  const n = (i: number) => num(a[i]);
  const anyFloat = a.some((x) => x instanceof Flt);
  const py = I.lang === 'python';
  switch (name.toLowerCase()) {
    case 'max':
      if (a.length === 1 && a[0] instanceof Arr) return a[0].items.reduce((m, x) => (cmpVals(x, m) > 0 ? x : m));
      return a.reduce((m, x) => (cmpVals(x, m) > 0 ? x : m));
    case 'min':
      if (a.length === 1 && a[0] instanceof Arr) return a[0].items.reduce((m, x) => (cmpVals(x, m) < 0 ? x : m));
      return a.reduce((m, x) => (cmpVals(x, m) < 0 ? x : m));
    case 'abs': case 'fabs': case 'labs': return numResult(Math.abs(n(0)), anyFloat || name === 'fabs');
    case 'pow': {
      const r = Math.pow(n(0), n(1));
      if (py && !anyFloat && n(1) >= 0) return a.length > 2 ? Number(BigInt(Math.trunc(n(0))) ** BigInt(Math.trunc(n(1))) % BigInt(Math.trunc(n(2)))) : r;
      return new Flt(r);
    }
    case 'sqrt': return new Flt(Math.sqrt(n(0)));
    case 'cbrt': return new Flt(Math.cbrt(n(0)));
    case 'floor': return py ? Math.floor(n(0)) : new Flt(Math.floor(n(0)));
    case 'ceil': case 'ceiling': return py ? Math.ceil(n(0)) : new Flt(Math.ceil(n(0)));
    case 'round': {
      if (I.lang === 'java') return Math.round(n(0));
      // C# Math.Round and Python round() round halves to the even neighbor; C rounds them away from zero
      const digits = a.length > 1 ? n(1) : 0;
      const f = Math.pow(10, digits);
      const x = n(0) * f;
      const fl = Math.floor(x);
      const diff = x - fl;
      let r: number;
      if (I.lang === 'c' || I.lang === 'cpp') r = Math.sign(x) * Math.round(Math.abs(x));
      else if (Math.abs(diff - 0.5) < 1e-9) r = fl % 2 === 0 ? fl : fl + 1;
      else r = Math.round(x);
      const v = r / f;
      if (py && a.length < 2) return v;
      return new Flt(v);
    }
    case 'log': return new Flt(a.length > 1 ? Math.log(n(0)) / Math.log(n(1)) : Math.log(n(0)));
    case 'log2': return new Flt(Math.log2(n(0)));
    case 'log10': return new Flt(Math.log10(n(0)));
    case 'exp': return new Flt(Math.exp(n(0)));
    case 'hypot': return new Flt(Math.hypot(n(0), n(1)));
    case 'sin': return new Flt(Math.sin(n(0)));
    case 'cos': return new Flt(Math.cos(n(0)));
    case 'random': return new Flt(rand() / 2147483648);
    case 'gcd': {
      let x = Math.abs(n(0)), y = Math.abs(n(1));
      while (y) [x, y] = [y, x % y];
      return x;
    }
    case 'factorial': {
      let r = 1;
      for (let i = 2; i <= n(0); i++) r *= i;
      return r;
    }
    case 'trunc': return Math.trunc(n(0));
    case 'sign': return Math.sign(n(0));
  }
  return NF;
}

function sortArr(I: Interp, a: Arr, opts: { reverse?: boolean; key?: Val; cmp?: (x: Val, y: Val) => number; from?: number; to?: number } = {}) {
  const from = opts.from ?? 0, to = opts.to ?? a.items.length;
  const part = a.items.slice(from, to);
  const keyed = opts.key ? part.map((x) => [I.callFnValue(opts.key!, [x]), x] as [Val, Val]) : part.map((x) => [x, x] as [Val, Val]);
  const nat = naturalCmp(I);
  keyed.sort((p, q) => (opts.cmp ? opts.cmp(p[0], q[0]) : nat(p[0], q[0])) * (opts.reverse ? -1 : 1));
  keyed.forEach(([, x], i) => (a.items[from + i] = x));
  a.version++;
  for (let i = from; i < to; i++) I.touches.push({ id: a.id, idx: i, role: 'write' });
  I.note = 'SORT (library sort, done in one step)';
}

function toArr(I: Interp, v: Val): Val[] {
  return I.iterToArray(v);
}

function push(I: Interp, a: Arr, v: Val) {
  a.items.push(convert(v, a.elemTy));
  a.version++;
  I.counts.writes++;
  I.touches.push({ id: a.id, idx: a.items.length - 1, role: 'write' });
}

function insertAt(I: Interp, a: Arr, i: number, v: Val) {
  if (i < 0 || i > a.items.length) throw I.err(`insert position ${i} is out of range`);
  a.items.splice(i, 0, convert(v, a.elemTy));
  a.version++;
  I.counts.writes++;
  I.touches.push({ id: a.id, idx: i, role: 'write' });
}

function removeAt(I: Interp, a: Arr, i: number): Val {
  if (!a.items.length) throw I.err(emptyMsg(I, a));
  if (i < 0 || i >= a.items.length) I.outOfBounds(a, i, `${I.arrName(a)}[${i}]`);
  const [v] = a.items.splice(i, 1);
  a.version++;
  return v;
}

function emptyMsg(I: Interp, a: Arr): string {
  const what = a.kind === 'stack' ? 'stack' : a.kind === 'queue' || a.kind === 'deque' ? 'queue' : a.kind === 'pq' ? 'priority queue' : 'list';
  if (I.lang === 'python') return a.kind === 'deque' ? 'pop from an empty deque' : 'pop from empty list';
  return `the ${what} is empty`;
}

function peekAt(I: Interp, a: Arr, i: number): Val {
  if (!a.items.length) throw I.err(emptyMsg(I, a));
  I.touches.push({ id: a.id, idx: i, role: 'read' });
  return a.items[i];
}

// ------------------------------------------------------------------ free functions
export function callFunction(I: Interp, name: string, args: Expr[]): R {
  const L = I.lang;
  if (L === 'python') return pyFunction(I, name, args);
  if (L === 'c' || L === 'cpp') return cFunction(I, name, args);
  return NF;
}

function pyFunction(I: Interp, name: string, args: Expr[]): R {
  const kw = () => kwargs(I, args);
  switch (name) {
    case 'print': {
      const v = vals(I, args);
      const k = kw();
      const sep = k.has('sep') ? pyStr(k.get('sep')) : ' ';
      const end = k.has('end') ? pyStr(k.get('end')) : '\n';
      I.write(v.map(pyStr).join(sep) + end);
      return null;
    }
    case 'len': return lenOf(I, vals(I, args)[0]);
    case 'range': {
      const v = vals(I, args).map(num);
      if (v.length === 1) return new RangeV(0, v[0], 1);
      if (v[2] === 0) throw I.err('range() step must not be zero');
      return new RangeV(v[0], v[1], v[2] ?? 1);
    }
    case 'min': case 'max': {
      const v = vals(I, args);
      const k = kw();
      let items = v.length === 1 ? toArr(I, v[0]) : v;
      if (!items.length) {
        if (k.has('default')) return k.get('default');
        throw I.err(`${name}() arg is an empty sequence`);
      }
      const key = k.get('key');
      const keyed = key ? items.map((x) => [I.callFnValue(key, [x]), x] as [Val, Val]) : items.map((x) => [x, x] as [Val, Val]);
      let best = keyed[0];
      for (const p of keyed.slice(1)) if (name === 'min' ? cmpVals(p[0], best[0]) < 0 : cmpVals(p[0], best[0]) > 0) best = p;
      items = [];
      return best[1];
    }
    case 'sum': {
      const v = vals(I, args);
      let acc: Val = v[1] ?? 0;
      for (const x of toArr(I, v[0])) acc = I.binop('+', acc, x);
      return acc;
    }
    case 'abs': case 'pow': case 'round': case 'divmod': {
      const v = vals(I, args);
      if (name === 'divmod') return new Arr([Math.floor(num(v[0]) / num(v[1])), ((num(v[0]) % num(v[1])) + num(v[1])) % num(v[1])], 'tuple');
      return mathFn(I, name, v);
    }
    case 'int': {
      const v = vals(I, args);
      if (!v.length) return 0;
      const x = v[0];
      if (typeof x === 'string') {
        const base = v[1] !== undefined ? num(v[1]) : 10;
        const t = x.trim();
        const r = parseInt(t, base);
        if (Number.isNaN(r) || (base === 10 && !/^[-+]?\d+$/.test(t))) throw I.err(`invalid literal for int() with base ${base}: ${pyRepr(x)}`);
        return r;
      }
      return Math.trunc(num(x));
    }
    case 'float': {
      const x = vals(I, args)[0];
      if (x === undefined) return new Flt(0);
      if (typeof x === 'string') {
        const t = x.trim().toLowerCase();
        if (t === 'inf' || t === 'infinity' || t === '+inf') return new Flt(Infinity);
        if (t === '-inf' || t === '-infinity') return new Flt(-Infinity);
        if (t === 'nan') return new Flt(NaN);
        const r = Number(t);
        if (Number.isNaN(r)) throw I.err(`could not convert string to float: ${pyRepr(x)}`);
        return new Flt(r);
      }
      return new Flt(num(x));
    }
    case 'str': {
      const v = vals(I, args);
      return v.length ? pyStr(v[0]) : '';
    }
    case 'repr': return pyRepr(vals(I, args)[0]);
    case 'bool': return truthy(vals(I, args)[0]);
    case 'list': {
      const v = vals(I, args);
      return new Arr(v.length ? toArr(I, v[0]) : [], 'list');
    }
    case 'tuple': {
      const v = vals(I, args);
      return new Arr(v.length ? toArr(I, v[0]) : [], 'tuple');
    }
    case 'set': case 'frozenset': {
      const v = vals(I, args);
      const m = new MapV(true);
      if (v.length) for (const x of toArr(I, v[0])) m.entries.set(keyOf(x), [x, true]);
      return m;
    }
    case 'dict': {
      const v = vals(I, args);
      const m = new MapV(false);
      if (v[0] instanceof MapV) for (const [k, e] of v[0].entries) m.entries.set(k, [...e] as [Val, Val]);
      else if (v[0]) for (const p of toArr(I, v[0])) {
        const [k, x] = toArr(I, p);
        m.entries.set(keyOf(k), [k, x]);
      }
      for (const [k, x] of kw()) m.entries.set(keyOf(k), [k, x]);
      return m;
    }
    case 'sorted': {
      const v = vals(I, args);
      const k = kw();
      const a = new Arr(toArr(I, v[0]), 'list');
      const save = I.touches.length;
      sortArr(I, a, { reverse: truthy(k.get('reverse') ?? false), key: k.get('key') });
      I.touches.length = save;
      I.note = undefined;
      return a;
    }
    case 'reversed': return new Arr(toArr(I, vals(I, args)[0]).reverse(), 'list');
    case 'enumerate': {
      const v = vals(I, args);
      const start = v[1] !== undefined ? num(v[1]) : num(kw().get('start') ?? 0);
      return new Arr(toArr(I, v[0]).map((x, i) => new Arr([i + start, x], 'tuple')), 'list');
    }
    case 'zip': {
      const lists = vals(I, args).map((x) => toArr(I, x));
      const n = Math.min(...lists.map((l) => l.length));
      const out: Val[] = [];
      for (let i = 0; i < n; i++) out.push(new Arr(lists.map((l) => l[i]), 'tuple'));
      return new Arr(out, 'list');
    }
    case 'map': {
      const v = vals(I, args);
      return new Arr(toArr(I, v[1]).map((x) => I.callFnValue(v[0], [x])), 'list');
    }
    case 'filter': {
      const v = vals(I, args);
      return new Arr(toArr(I, v[1]).filter((x) => (v[0] === null ? truthy(x) : truthy(I.callFnValue(v[0], [x])))), 'list');
    }
    case 'any': return toArr(I, vals(I, args)[0]).some(truthy);
    case 'all': return toArr(I, vals(I, args)[0]).every(truthy);
    case 'input': {
      const v = vals(I, args);
      if (v.length) I.write(pyStr(v[0]));
      const line = I.readLine();
      if (line === null) throw I.err('input(): no more input (type input values in the Input box)');
      I.note = `READ ${JSON.stringify(line)}`;
      return line;
    }
    case 'ord': {
      const s = vals(I, args)[0];
      return typeof s === 'string' ? s.charCodeAt(0) : num(s);
    }
    case 'chr': return String.fromCharCode(num(vals(I, args)[0]));
    case 'hex': return '0x' + num(vals(I, args)[0]).toString(16);
    case 'bin': return '0b' + num(vals(I, args)[0]).toString(2);
    case 'isinstance': {
      const [x, t] = vals(I, args);
      const tn = t instanceof Special ? t.kind.replace(/^class:/, '') : '';
      if (tn === 'int') return typeof x === 'number';
      if (tn === 'float') return x instanceof Flt;
      if (tn === 'str') return typeof x === 'string';
      if (tn === 'list') return x instanceof Arr && x.kind === 'list';
      if (x instanceof Obj) return x.cls === tn;
      return false;
    }
    case 'type': {
      const x = vals(I, args)[0];
      return `<class '${x instanceof Obj ? x.cls : typeName(x) === 'double' ? 'float' : typeName(x)}'>`;
    }
    case 'deque': {
      const v = vals(I, args);
      return new Arr(v.length ? toArr(I, v[0]) : [], 'deque');
    }
    case 'defaultdict': case 'Counter': case 'OrderedDict': {
      const v = vals(I, args);
      const m = new MapV(false);
      if (name === 'defaultdict') m.factory = v[0] ?? null;
      if (name === 'Counter') {
        m.factory = new Special('int');
        if (v[0] !== undefined) for (const x of toArr(I, v[0])) {
          const e = m.entries.get(keyOf(x));
          m.entries.set(keyOf(x), [x, (e ? num(e[1]) : 0) + 1]);
        }
      }
      if (name === 'OrderedDict' && v[0] instanceof MapV) for (const [k, e] of v[0].entries) m.entries.set(k, e);
      return m;
    }
    case 'id': {
      const x = vals(I, args)[0];
      return x instanceof Arr || x instanceof Obj || x instanceof MapV ? 140000000 + x.id * 16 : 0;
    }
    case 'iter': return vals(I, args)[0];
    case 'exit': case 'quit': throw I.err('exit() called');
  }
  return NF;
}

function cFunction(I: Interp, name: string, args: Expr[]): R {
  const cpp = I.lang === 'cpp';
  switch (name) {
    case 'printf': {
      const v = vals(I, args);
      I.write(printf(I.strOf(v[0]), v.slice(1).map(cArg), I.lang));
      return 0;
    }
    case 'puts': {
      I.write(cStr(vals(I, args)[0]) + '\n');
      return 0;
    }
    case 'putchar': {
      I.write(String.fromCharCode(num(vals(I, args)[0])));
      return 0;
    }
    case 'scanf': {
      const fmt = I.strOf(I.ev(args[0]));
      const convs = fmt.match(/%l*[difsc]/g) ?? [];
      let count = 0;
      convs.forEach((c, i) => {
        const target = args[i + 1];
        if (!target) return;
        const cell = target.k === 'un' && target.op === 'addr' ? I.lv(target.e) : I.lv(target);
        const tok = I.readToken();
        if (tok === null) throw I.err('scanf: no more input (type input values in the Input box)');
        cell.set(c.endsWith('f') ? new Flt(parseFloat(tok)) : c.endsWith('c') ? new Chr(tok.charCodeAt(0)) : c.endsWith('s') ? tok : parseInt(tok, 10));
        count++;
      });
      I.note = 'READ input';
      return count;
    }
    case 'malloc': case 'calloc': {
      // malloc(sizeof(struct Node)) -> object; malloc(n * sizeof(int)) -> array
      const a = name === 'calloc' ? args : args;
      const findSizeof = (e: Expr): { ty?: Ty; count: Expr | null } | null => {
        if (e.k === 'sizeof') return { ty: e.ty, count: null };
        if (e.k === 'bin' && e.op === '*') {
          if (e.l.k === 'sizeof') return { ty: e.l.ty, count: e.r };
          if (e.r.k === 'sizeof') return { ty: e.r.ty, count: e.l };
        }
        return null;
      };
      let info: { ty?: Ty; count: Expr | null } | null;
      if (name === 'calloc') info = { ty: findSizeof(a[1])?.ty, count: a[0] };
      else info = findSizeof(a[0]);
      if (info && info.ty && I.classes.has(info.ty.base) && !info.ty.ptr && info.count === null) {
        return I.construct(info.ty.base, []);
      }
      if (info && info.ty) {
        const n = info.count ? num(I.ev(info.count)) : 1;
        const items: Val[] = [];
        for (let i = 0; i < n; i++) items.push(I.classes.has(info.ty.base) && !info.ty.ptr ? I.construct(info.ty.base, []) : I.defaultFor(info.ty, false) ?? 0);
        return new Arr(items, 'array', info.ty);
      }
      throw I.err('malloc: use malloc(sizeof(Type)) or malloc(n * sizeof(Type))');
    }
    case 'realloc': {
      const [p, size] = vals(I, args);
      if (p instanceof Arr) {
        const n = Math.floor(num(size) / 4);
        while (p.items.length < n) p.items.push(0);
        p.items.length = n;
        p.version++;
      }
      return p;
    }
    case 'free':
      vals(I, args);
      I.note = 'free memory';
      return undefined;
    case 'strlen': return cStr(vals(I, args)[0]).length;
    case 'strcmp': {
      const [a, b] = vals(I, args).map(cStr);
      return a < b ? -1 : a > b ? 1 : 0;
    }
    case 'strcpy': {
      const target = I.ev(args[0]);
      const src = cStr(I.ev(args[1]));
      if (target instanceof Arr) {
        [...src, '\0'].forEach((ch, i) => i < target.items.length && (target.items[i] = new Chr(ch.charCodeAt(0))));
        target.version++;
      }
      return target;
    }
    case 'strcat': {
      const target = I.ev(args[0]);
      const src = cStr(I.ev(args[1]));
      if (target instanceof Arr) {
        const cur = cStr(target);
        [...(cur + src), '\0'].forEach((ch, i) => i < target.items.length && (target.items[i] = new Chr(ch.charCodeAt(0))));
        target.version++;
      }
      return target;
    }
    case 'atoi': return parseInt(cStr(vals(I, args)[0]), 10) || 0;
    case 'atof': return new Flt(parseFloat(cStr(vals(I, args)[0])) || 0);
    case 'isdigit': { const c = num(vals(I, args)[0]); return c >= 48 && c <= 57 ? 1 : 0; }
    case 'isalpha': { const c = String.fromCharCode(num(vals(I, args)[0])); return /[a-zA-Z]/.test(c) ? 1 : 0; }
    case 'isalnum': { const c = String.fromCharCode(num(vals(I, args)[0])); return /[a-zA-Z0-9]/.test(c) ? 1 : 0; }
    case 'ispunct': { const c = String.fromCharCode(num(vals(I, args)[0])); return /[!-\/:-@[-`{-~]/.test(c) ? 1 : 0; }
    case 'isxdigit': { const c = String.fromCharCode(num(vals(I, args)[0])); return /[0-9a-fA-F]/.test(c) ? 1 : 0; }
    case 'isspace': { const c = String.fromCharCode(num(vals(I, args)[0])); return /\s/.test(c) ? 1 : 0; }
    case 'isupper': { const c = String.fromCharCode(num(vals(I, args)[0])); return /[A-Z]/.test(c) ? 1 : 0; }
    case 'islower': { const c = String.fromCharCode(num(vals(I, args)[0])); return /[a-z]/.test(c) ? 1 : 0; }
    case 'toupper': return new Chr(String.fromCharCode(num(vals(I, args)[0])).toUpperCase().charCodeAt(0));
    case 'tolower': return new Chr(String.fromCharCode(num(vals(I, args)[0])).toLowerCase().charCodeAt(0));
    case 'rand': return rand();
    case 'srand': seed = num(vals(I, args)[0]); return undefined;
    case 'time': return 1700000000;
    case 'exit': throw I.err(`exit(${num(vals(I, args)[0] ?? 0)}) called`);
    // Turbo C / conio.h console
    case 'clrscr': {
      vals(I, args);
      I.enableScreen();
      I.screen!.fill('');
      I.cursor = { x: 0, y: 0 };
      I.note = 'clear the screen';
      return undefined;
    }
    case 'gotoxy': {
      const [x, y] = vals(I, args).map(num);
      I.enableScreen();
      I.cursor = { x: Math.max(0, Math.min(79, x - 1)), y: Math.max(0, Math.min(24, y - 1)) };
      I.note = `move the cursor to column ${x}, row ${y}`;
      return undefined;
    }
    case 'cprintf': {
      const v = vals(I, args);
      I.write(printf(I.strOf(v[0]), v.slice(1).map(cArg), I.lang));
      return 0;
    }
    case 'cputs': I.write(cStr(vals(I, args)[0])); return 0;
    case 'getch': case 'getche': case '_getch': {
      const k = I.readKey();
      if (k === -1) {
        I.note = 'getch(): no more keys in the Input box, so it returns Esc (27)';
        return 27;
      }
      if (name === 'getche' && k >= 32) I.write(String.fromCharCode(k));
      I.note = `getch() read key code ${k}${k >= 32 && k < 127 ? ` ('${String.fromCharCode(k)}')` : ''}`;
      return k;
    }
    case 'kbhit': case '_kbhit': return I.stdinPos < I.stdin.length ? 1 : 0;
    case 'wherex': return I.cursor.x + 1;
    case 'wherey': return I.cursor.y + 1;
    case 'textcolor': case 'textbackground': case 'textattr': case 'delay': case 'sleep': case 'Sleep': case 'sound': case 'nosound': case '_setcursortype': case 'highvideo': case 'lowvideo': case 'normvideo':
      vals(I, args);
      return undefined;
    // Dev-C++ / Windows console helpers do nothing here
    case 'system':
      vals(I, args);
      I.note = 'system(...) is ignored here (it controls the Windows console)';
      return 0;
    case 'memset': {
      const [a, v] = vals(I, args);
      if (a instanceof Arr) {
        const fill = (x: Arr) => x.items.forEach((it, i) => (it instanceof Arr ? fill(it) : (x.items[i] = convert(num(v) === -1 ? -1 : num(v), x.elemTy)), x.version++));
        fill(a);
      }
      return a;
    }
    case 'abs': case 'fabs': case 'labs': case 'sqrt': case 'pow': case 'floor': case 'ceil': case 'round': case 'log':
    case 'log2': case 'log10': case 'exp': case 'cbrt': case 'hypot': case 'sin': case 'cos':
      return mathFn(I, name, vals(I, args));
    case 'max': case 'min': case 'fmax': case 'fmin': {
      if (!cpp && (name === 'max' || name === 'min')) return NF;
      return mathFn(I, name.replace(/^f/, ''), vals(I, args));
    }
  }
  if (!cpp) return NF;
  switch (name) {
    case 'swap': {
      const a = I.lv(args[0]);
      const b = I.lv(args[1]);
      const va = a instanceof ElemCell ? a.arr.items[a.idx] : a.get();
      const vb = b instanceof ElemCell ? b.arr.items[b.idx] : b.get();
      a.set(vb);
      b.set(va);
      if (!I.swapText) I.note = `SWAP ${a.label()} ↔ ${b.label()}`;
      return undefined;
    }
    case 'sort': case 'stable_sort': case 'reverse': {
      const v = vals(I, args);
      const range = iterRange(I, v[0], v[1]);
      if (name === 'reverse') {
        const part = range.arr.items.slice(range.from, range.to).reverse();
        part.forEach((x, i) => (range.arr.items[range.from + i] = x));
        range.arr.version++;
        return undefined;
      }
      const desc = v[2] instanceof Special && v[2].kind === 'greater';
      const custom = v[2] instanceof FnV ? v[2] : undefined;
      sortArr(I, range.arr, {
        from: range.from, to: range.to, reverse: desc,
        cmp: custom ? (x, y) => (truthy(I.callFnValue(custom, [x, y])) ? -1 : truthy(I.callFnValue(custom, [y, x])) ? 1 : 0) : undefined,
      });
      return undefined;
    }
    case 'greater': case 'less': return new Special(name);
    case 'to_string': return toText(vals(I, args)[0], 'cpp');
    case 'stoi': case 'stol': case 'stoll': return parseInt(I.strOf(vals(I, args)[0]), 10);
    case 'stod': case 'stof': return new Flt(parseFloat(I.strOf(vals(I, args)[0])));
    case 'make_pair': {
      const [a, b] = vals(I, args);
      const p = new Obj('pair');
      p.fields.set('first', a);
      p.fields.set('second', b);
      return p;
    }
    case 'setw': return new Special(`setw:${num(vals(I, args)[0])}`);
    case 'setprecision': return new Special(`setprecision:${num(vals(I, args)[0])}`);
    case 'getline': {
      const cell = I.lv(args[1]);
      const line = I.readLine();
      if (line === null) throw I.err('getline: no more input (type input values in the Input box)');
      cell.set(line);
      I.note = `READ ${cell.label()} = ${JSON.stringify(line)}`;
      return new Special('cin');
    }
    case 'fill': {
      const v = vals(I, args);
      const range = iterRange(I, v[0], v[1]);
      for (let i = range.from; i < range.to; i++) range.arr.items[i] = convert(v[2], range.arr.elemTy);
      range.arr.version++;
      return undefined;
    }
    case 'accumulate': {
      const v = vals(I, args);
      const range = iterRange(I, v[0], v[1]);
      let acc = v[2];
      for (let i = range.from; i < range.to; i++) acc = I.binop('+', acc, range.arr.items[i]);
      return acc;
    }
    case 'count': case 'count_if': case 'any_of': case 'all_of': case 'none_of': case 'find': case 'find_if': {
      const v = vals(I, args);
      const range = iterRange(I, v[0], v[1]);
      const test = (x: Val) => (name === 'count' || name === 'find' ? valEq(x, v[2]) : truthy(I.callFnValue(v[2], [x])));
      let hits = 0;
      for (let i = range.from; i < range.to; i++) {
        if (test(range.arr.items[i])) {
          if (name === 'find' || name === 'find_if') return new Iter(range.arr, i);
          if (name === 'any_of') return true;
          hits++;
        } else if (name === 'all_of') return false;
      }
      if (name === 'find' || name === 'find_if') return new Iter(range.arr, range.to);
      if (name === 'any_of') return false;
      if (name === 'all_of') return true;
      if (name === 'none_of') return hits === 0;
      return hits;
    }
    case 'min_element': case 'max_element': {
      const v = vals(I, args);
      const range = iterRange(I, v[0], v[1]);
      let best = range.from;
      for (let i = range.from + 1; i < range.to; i++) {
        const c = cmpVals(range.arr.items[i], range.arr.items[best]);
        if (name === 'min_element' ? c < 0 : c > 0) best = i;
      }
      return new Iter(range.arr, best);
    }
  }
  return NF;
}

function cArg(v: Val): Val {
  if (v instanceof Arr && v.items.every((x) => x instanceof Chr)) return cStr(v);
  return v;
}

function cStr(v: Val): string {
  if (typeof v === 'string') return v;
  if (v instanceof Arr) {
    let s = '';
    for (const x of v.items) {
      if (!(x instanceof Chr) || x.c === 0) break;
      s += String.fromCharCode(x.c);
    }
    return s;
  }
  return String(v);
}

function iterRange(I: Interp, a: Val, b: Val): { arr: Arr; from: number; to: number } {
  if (a instanceof Iter && b instanceof Iter) return { arr: a.arr, from: a.idx, to: b.idx };
  if (a instanceof Arr) {
    const to = b instanceof Iter ? b.idx : (b as { idx?: number })?.idx ?? a.items.length;
    return { arr: a, from: 0, to };
  }
  const p = a as { arr?: Arr; idx?: number };
  const q = b as { arr?: Arr; idx?: number };
  if (p?.arr) return { arr: p.arr, from: p.idx ?? 0, to: q?.idx ?? p.arr.items.length };
  throw I.err('sort/reverse need a range like (arr, arr + n) or (v.begin(), v.end())');
}

// ------------------------------------------------------------------ members (properties)
export function getMember(_I: Interp, o: Val, name: string): R {
  if (o instanceof Special) {
    const k = o.kind;
    switch (`${k}.${name}`) {
      case 'System.out': case 'System.err': return new Special('System.out');
      case 'System.in': return new Special('System.in');
      case 'Math.PI': case 'math.pi': return new Flt(Math.PI);
      case 'Math.E': case 'math.e': return new Flt(Math.E);
      case 'math.inf': return new Flt(Infinity);
      case 'Integer.MAX_VALUE': case 'int.MaxValue': return INT_MAX;
      case 'Integer.MIN_VALUE': case 'int.MinValue': return INT_MIN;
      case 'Long.MAX_VALUE': case 'long.MaxValue': case 'sys.maxsize': return Number.MAX_SAFE_INTEGER;
      case 'Long.MIN_VALUE': case 'long.MinValue': return Number.MIN_SAFE_INTEGER;
      case 'Double.MAX_VALUE': case 'double.MaxValue': return new Flt(Number.MAX_VALUE);
      case 'Double.POSITIVE_INFINITY': case 'double.PositiveInfinity': return new Flt(Infinity);
      case 'Double.NEGATIVE_INFINITY': case 'double.NegativeInfinity': return new Flt(-Infinity);
      case 'collections.deque': return new Special('deque');
      case 'collections.defaultdict': return new Special('defaultdict');
      case 'collections.Counter': return new Special('Counter');
      case 'String.Empty': return '';
    }
    if (k === 'math' || k === 'heapq' || k === 'random' || k === 'sys' || k === 'Math') return new Special(`${k}.${name}`);
    return NF;
  }
  if (o instanceof Arr) {
    switch (name) {
      case 'length': return o.items.length;
      case 'Length': case 'Count': return o.items.length;
      // a {a, b} brace list used as a std::pair
      case 'first': if (o.kind === 'tuple' || (o.kind === 'array' && o.items.length === 2)) return o.items[0]; break;
      case 'second': if (o.kind === 'tuple' || (o.kind === 'array' && o.items.length === 2)) return o.items[1]; break;
    }
    return NF;
  }
  if (typeof o === 'string') {
    if (name === 'Length') return o.length;
    return NF;
  }
  if (o instanceof MapV) {
    if (name === 'Count') return o.entries.size;
    if (name === 'Keys') return new Arr([...o.entries.values()].map(([k]) => k), 'list');
    if (name === 'Values') return new Arr([...o.entries.values()].map(([, v]) => v), 'list');
    return NF;
  }
  return NF;
}

// ------------------------------------------------------------------ methods
export function callMethod(I: Interp, o: Val, name: string, args: Expr[], objExpr: Expr): R {
  if (o instanceof Special) return specialMethod(I, o, name, args);
  if (o instanceof Arr) return arrMethod(I, o, name, args);
  if (typeof o === 'string') return strMethod(I, o, name, args, objExpr);
  if (o instanceof MapV) return mapMethod(I, o, name, args);
  if (o instanceof Obj) return objMethod(I, o, name, args);
  if (o instanceof Iter) return NF;
  if (o instanceof FnV && name === 'reversed') {
    const base = toComparator(I, o)!;
    return nativeFn('comparator', ([x, y]) => -base(x, y));
  }
  if (o instanceof FnV && name === 'thenComparing') {
    const first = toComparator(I, o)!;
    const next = vals(I, args)[0];
    const second = next instanceof FnV && next.fn?.params.length === 1
      ? (x: Val, y: Val) => cmpVals(I.callFnValue(next, [x]), I.callFnValue(next, [y]))
      : toComparator(I, next)!;
    return nativeFn('comparator', ([x, y]) => first(x, y) || second(x, y));
  }
  if (o instanceof Chr && I.lang === 'cpp') return NF;
  if (isNumeric(o) || typeof o === 'boolean') {
    switch (name) {
      case 'ToString': case 'toString': {
        // C#: x.ToString("F2"), x.ToString("N0")
        const f = args.length ? vals(I, args)[0] : undefined;
        return typeof f === 'string' && I.lang === 'csharp' ? csFormatItem(o, f) : toText(o, I.lang);
      }
      case 'equals': case 'Equals': return valEq(o, vals(I, args)[0]);
      case 'compareTo': case 'CompareTo': return Math.sign(num(o) - num(vals(I, args)[0]));
      case 'intValue': return Math.trunc(num(o));
      case 'is_integer': return Number.isInteger(num(o));
    }
  }
  return NF;
}

function writeLine(I: Interp, s: string) {
  I.write(s + '\n');
}

function specialMethod(I: Interp, o: Special, name: string, args: Expr[]): R {
  const k = o.kind;
  const v = () => vals(I, args);
  switch (k) {
    case 'System.out':
      switch (name) {
        case 'println': { const a = v(); writeLine(I, a.length ? I.strOf(a[0]) : ''); return undefined; }
        case 'print': I.write(I.strOf(v()[0])); return undefined;
        case 'printf': case 'format': { const a = v(); I.write(printf(I.strOf(a[0]), a.slice(1), 'java')); return undefined; }
      }
      break;
    case 'Console':
      switch (name) {
        case 'WriteLine': case 'Write': {
          const a = v();
          let s = '';
          if (a.length > 1 && typeof a[0] === 'string') s = csFormat(a[0], a.slice(1));
          else if (a.length) s = I.strOf(a[0]);
          I.write(name === 'WriteLine' ? s + '\n' : s);
          return undefined;
        }
        case 'ReadLine': {
          const line = I.readLine();
          I.note = `READ ${JSON.stringify(line)}`;
          return line;
        }
      }
      break;
    case 'Math': case 'math': {
      const r = mathFn(I, name, v());
      if (r !== NF) {
        if (I.lang === 'csharp' && (name === 'Floor' || name === 'Ceiling' || name === 'Round')) return r;
        if (I.lang === 'java' && (name === 'max' || name === 'min' || name === 'abs')) return r;
        return r;
      }
      break;
    }
    case 'Integer': case 'Long': case 'int': case 'long':
      switch (name) {
        case 'parseInt': case 'parseLong': case 'Parse': case 'valueOf': {
          const s = I.strOf(v()[0]).trim();
          const r = parseInt(s, 10);
          if (Number.isNaN(r)) throw I.err(`can't convert "${s}" to a number`);
          return r;
        }
        case 'toString': case 'ToString': return toText(v()[0], I.lang);
        case 'max': return Math.max(...v().map(num));
        case 'min': return Math.min(...v().map(num));
        case 'compare': { const a = v(); return Math.sign(num(a[0]) - num(a[1])); }
        case 'TryParse': {
          const s = I.strOf(I.ev(args[0])).trim();
          const cell = I.lv(args[1]);
          const ok = /^[-+]?\d+$/.test(s);
          cell.set(ok ? parseInt(s, 10) : 0);
          return ok;
        }
      }
      break;
    case 'Double': case 'double':
      if (name === 'parseDouble' || name === 'Parse' || name === 'valueOf') return new Flt(parseFloat(I.strOf(v()[0])));
      if (name === 'compare') { const a = v(); return Math.sign(num(a[0]) - num(a[1])); }
      break;
    case 'Convert':
      if (name === 'ToInt32' || name === 'ToInt64') { const x = v()[0]; return typeof x === 'string' ? parseInt(x, 10) : Math.round(num(x)); }
      if (name === 'ToDouble') return new Flt(Number(v()[0] instanceof Flt ? num(v()[0]) : I.strOf(v()[0])));
      if (name === 'ToString') return toText(v()[0], I.lang);
      break;
    case 'Character': case 'Char': {
      const c = String.fromCharCode(num(v()[0]));
      switch (name) {
        case 'isDigit': case 'IsDigit': return /[0-9]/.test(c);
        case 'isLetter': case 'IsLetter': return /[a-zA-Z]/.test(c);
        case 'isLetterOrDigit': case 'IsLetterOrDigit': return /[a-zA-Z0-9]/.test(c);
        case 'isUpperCase': case 'IsUpper': return /[A-Z]/.test(c);
        case 'isLowerCase': case 'IsLower': return /[a-z]/.test(c);
        case 'isWhitespace': case 'IsWhiteSpace': return /\s/.test(c);
        case 'toUpperCase': case 'ToUpper': return new Chr(c.toUpperCase().charCodeAt(0));
        case 'toLowerCase': case 'ToLower': return new Chr(c.toLowerCase().charCodeAt(0));
        case 'getNumericValue': return parseInt(c, 36);
      }
      break;
    }
    case 'String':
      switch (name) {
        case 'valueOf': {
          const x = v()[0];
          if (x instanceof Arr) return x.items.map((c) => (c instanceof Chr ? String.fromCharCode(c.c) : I.strOf(c))).join('');
          return I.strOf(x);
        }
        case 'join': case 'Join': {
          const a = v();
          const items = a.length === 2 && a[1] instanceof Arr ? a[1].items : a.slice(1);
          return items.map((x) => I.strOf(x)).join(I.strOf(a[0]));
        }
        case 'format': case 'Format': {
          const a = v();
          return I.lang === 'java' ? printf(I.strOf(a[0]), a.slice(1), 'java') : csFormat(I.strOf(a[0]), a.slice(1));
        }
        case 'IsNullOrEmpty': { const s = v()[0]; return s === null || s === ''; }
        case 'Compare': case 'CompareOrdinal': {
          const [x, y] = v().map((z) => I.strOf(z));
          return x < y ? -1 : x > y ? 1 : 0;
        }
        case 'Concat': return v().map((z) => I.strOf(z)).join('');
      }
      break;
    case 'Arrays':
      switch (name) {
        case 'toString': {
          const a = v()[0];
          if (!(a instanceof Arr)) return 'null';
          return '[' + a.items.map((x) => I.strOf(x)).join(', ') + ']';
        }
        case 'deepToString': {
          const show = (x: Val): string => (x instanceof Arr ? '[' + x.items.map(show).join(', ') + ']' : I.strOf(x));
          return show(v()[0]);
        }
        case 'sort': {
          const a = v();
          const arr = a[0] as Arr;
          if (a[1] !== undefined && !isNumeric(a[1])) {
            sortArr(I, arr, { cmp: toComparator(I, a[1]) });
            return undefined;
          }
          sortArr(I, arr, { from: a[1] !== undefined ? num(a[1]) : 0, to: a[2] !== undefined ? num(a[2]) : arr.items.length });
          return undefined;
        }
        case 'fill': {
          const [arr, x] = v() as [Arr, Val];
          arr.items = arr.items.map(() => convert(x, arr.elemTy));
          arr.version++;
          return undefined;
        }
        case 'copyOf': {
          const [arr, n] = v() as [Arr, Val];
          const items = arr.items.slice(0, num(n));
          while (items.length < num(n)) items.push(I.defaultFor(arr.elemTy ?? { base: 'int', arr: 0, ptr: 0 }, false));
          return new Arr(items, 'array', arr.elemTy);
        }
        case 'copyOfRange': {
          const [arr, a, b] = v() as [Arr, Val, Val];
          return new Arr(arr.items.slice(num(a), num(b)), 'array', arr.elemTy);
        }
        case 'asList': {
          const a = v();
          return new Arr(a.length === 1 && a[0] instanceof Arr ? [...a[0].items] : a, 'list');
        }
        case 'equals': {
          const [a, b] = v() as [Arr, Arr];
          return a.items.length === b.items.length && a.items.every((x, i) => valEq(x, b.items[i]));
        }
      }
      break;
    case 'Array':
      switch (name) {
        case 'Sort': { const a = v(); sortArr(I, a[0] as Arr, { cmp: a[1] !== undefined ? toComparator(I, a[1]) : undefined }); return undefined; }
        case 'Reverse': { const a = v()[0] as Arr; a.items.reverse(); a.version++; return undefined; }
        case 'Fill': { const [arr, x] = v() as [Arr, Val]; arr.items = arr.items.map(() => x); arr.version++; return undefined; }
        case 'IndexOf': { const [arr, x] = v() as [Arr, Val]; return arr.items.findIndex((y) => valEq(x, y)); }
        case 'Copy': {
          const a = v();
          const [src, dst] = a as [Arr, Arr];
          const n = num(a[a.length - 1]);
          for (let i = 0; i < n; i++) dst.items[i] = src.items[i];
          dst.version++;
          return undefined;
        }
      }
      break;
    case 'Collections':
      switch (name) {
        case 'sort': { const a = v(); sortArr(I, a[0] as Arr, { cmp: a[1] !== undefined ? toComparator(I, a[1]) : undefined }); return undefined; }
        case 'reverse': { const a = v()[0] as Arr; a.items.reverse(); a.version++; return undefined; }
        case 'swap': {
          const [arr, i, j] = v() as [Arr, Val, Val];
          const x = arr.items[num(i)];
          I.writeElem(arr, num(i), arr.items[num(j)], `${I.arrName(arr)}[${num(i)}]`);
          I.writeElem(arr, num(j), x, `${I.arrName(arr)}[${num(j)}]`);
          return undefined;
        }
        case 'max': return (v()[0] as Arr).items.reduce((m, x) => (cmpVals(x, m) > 0 ? x : m));
        case 'min': return (v()[0] as Arr).items.reduce((m, x) => (cmpVals(x, m) < 0 ? x : m));
        case 'reverseOrder': return new Special('reverseOrder');
      }
      break;
    case 'List':
      if (name === 'of') return new Arr(v(), 'list');
      break;
    case 'Comparator': {
      const a = v();
      if (name === 'comparingInt' || name === 'comparingDouble' || name === 'comparing' || name === 'comparingLong') {
        const key = a[0];
        return nativeFn('comparator', ([x, y]) => cmpVals(I.callFnValue(key, [x]), I.callFnValue(key, [y])));
      }
      if (name === 'reverseOrder') return new Special('reverseOrder');
      if (name === 'naturalOrder') return nativeFn('comparator', ([x, y]) => naturalCmp(I)(x, y));
      break;
    }
    case 'IO':
      // the textbook IO helper class: IO.readInt(), IO.readDouble(), IO.readString()...
      switch (name) {
        case 'readInt': case 'readLong': {
          const t = I.readToken();
          if (t === null) throw I.err('IO.readInt(): no more input (type input values in the Input box)');
          return parseInt(t, 10);
        }
        case 'readDouble': case 'readFloat': {
          const t = I.readToken();
          if (t === null) throw I.err('IO.readDouble(): no more input (type input values in the Input box)');
          return new Flt(parseFloat(t));
        }
        case 'readString': case 'readWord': {
          const t = I.readToken();
          if (t === null) throw I.err('IO.readString(): no more input (type input values in the Input box)');
          return t;
        }
        case 'readLine': return I.readLine() ?? '';
        case 'readChar': { const t = I.readToken(); return new Chr((t ?? ' ').charCodeAt(0)); }
        case 'readBoolean': return (I.readToken() ?? '').toLowerCase() === 'true';
        case 'print': case 'println': case 'outputln': {
          const a = vals(I, args);
          I.write((a.length ? I.strOf(a[0]) : '') + (name === 'print' ? '' : '\n'));
          return undefined;
        }
      }
      break;
    case 'Scanner':
      switch (name) {
        case 'nextInt': case 'nextLong': {
          const t = I.readToken();
          if (t === null) throw I.err('Scanner: no more input (type input values in the Input box)');
          I.note = `READ ${t}`;
          return parseInt(t, 10);
        }
        case 'nextDouble': {
          const t = I.readToken();
          if (t === null) throw I.err('Scanner: no more input (type input values in the Input box)');
          return new Flt(parseFloat(t));
        }
        case 'next': {
          const t = I.readToken();
          if (t === null) throw I.err('Scanner: no more input (type input values in the Input box)');
          return t;
        }
        case 'nextLine': {
          const l = I.readLine();
          if (l === null) throw I.err('Scanner: no more input (type input values in the Input box)');
          return l;
        }
        case 'hasNext': case 'hasNextInt': case 'hasNextLine': return /\S/.test(I.stdin.slice(I.stdinPos));
        case 'close': return undefined;
      }
      break;
    case 'Random':
      switch (name) {
        case 'nextInt': case 'Next': {
          const a = v();
          if (a.length === 2) return num(a[0]) + (rand() % (num(a[1]) - num(a[0])));
          return a.length ? rand() % num(a[0]) : rand();
        }
        case 'nextDouble': case 'NextDouble': return new Flt(rand() / 2147483648);
      }
      break;
    case 'heapq': {
      const a = v();
      if (name === 'nsmallest' || name === 'nlargest') {
        const k = num(a[0]);
        const items = toArr(I, a[1]).slice().sort((x, y) => cmpVals(x, y) * (name === 'nlargest' ? -1 : 1));
        return new Arr(items.slice(0, k), 'list');
      }
      const h = a[0] as Arr;
      if (!(h instanceof Arr)) break;
      h.minHeap = true;
      switch (name) {
        case 'heappush': heapPush(I, h, a[1]); I.note = `heappush ${I.fmt(a[1])}`; return null;
        case 'heappop': { const r = heapPop(I, h); I.note = `heappop → ${I.fmt(r)}`; return r; }
        case 'heapify': heapify(h); h.version++; return null;
        case 'nsmallest': case 'nlargest': {
          const k = num(a[0]);
          const items = toArr(I, a[1]).slice().sort((x, y) => cmpVals(x, y) * (name === 'nlargest' ? -1 : 1));
          return new Arr(items.slice(0, k), 'list');
        }
      }
      break;
    }
    case 'random': {
      const a = v();
      if (name === 'randint') return num(a[0]) + (rand() % (num(a[1]) - num(a[0]) + 1));
      if (name === 'random') return new Flt(rand() / 2147483648);
      if (name === 'shuffle') return null;
      if (name === 'seed') { seed = num(a[0] ?? 1); return null; }
      if (name === 'choice') { const arr = a[0] as Arr; return arr.items[rand() % arr.items.length]; }
      break;
    }
    case 'sys':
      if (name === 'setrecursionlimit') return null;
      break;
    case 'collections':
      if (name === 'deque') { const a = v(); return new Arr(a.length ? toArr(I, a[0]) : [], 'deque'); }
      break;
    case 'Enumerable':
      if (name === 'Range') { const [s, c] = v().map(num); return new Arr(Array.from({ length: c }, (_, i) => s + i), 'list'); }
      break;
  }
  if (k.startsWith('math.') || k.startsWith('Math.')) return NF;
  // a builtin function value called through a Special (python: len, print, ...)
  if (I.lang === 'python') return pyFunction(I, k, args);
  return NF;
}

/** a Java expression whose value is an Integer object rather than an int */
function isBoxedInteger(I: Interp, e: Expr | undefined): boolean {
  if (!e) return false;
  if (e.k === 'call' && e.callee.k === 'member' && e.callee.obj.k === 'name' && e.callee.obj.name === 'Integer' && e.callee.name === 'valueOf') return true;
  if (e.k === 'cast') return e.ty.base === 'Integer';
  if (e.k === 'name') return I.lookup(e.name)?.ty?.base === 'Integer';
  return false;
}

function arrMethod(I: Interp, a: Arr, name: string, args: Expr[]): R {
  const v = () => vals(I, args);
  const L = I.lang;
  const n = a.items.length;
  // ----- stacks
  if (a.kind === 'stack') {
    switch (name) {
      case 'push': case 'Push': case 'push_back': case 'add': {
        const x = v()[0];
        push(I, a, x);
        I.note = `PUSH ${I.fmt(x)}`;
        return L === 'java' ? x : undefined;
      }
      case 'pop': case 'Pop': {
        if (!n) throw I.err(emptyMsg(I, a));
        const x = a.items.pop()!;
        a.version++;
        I.note = `POP ${I.fmt(x)}`;
        return L === 'cpp' ? undefined : x;
      }
      case 'top': case 'peek': case 'Peek': return peekAt(I, a, n - 1);
      case 'empty': case 'isEmpty': return n === 0;
      case 'size': return n;
      case 'search': { const x = v()[0]; const i = a.items.map((y) => valEq(x, y)).lastIndexOf(true); return i < 0 ? -1 : n - i; }
      case 'Contains': case 'contains': { const x = v()[0]; return a.items.some((y) => valEq(x, y)); }
      case 'Clear': case 'clear': a.items = []; a.version++; return undefined;
    }
  }
  // ----- priority queues
  if (a.kind === 'pq') {
    switch (name) {
      case 'push': case 'offer': case 'add': case 'Enqueue': case 'emplace': {
        const vv = v();
        let x = vv[0];
        if (a.priorityPairs) {
          x = new Arr([vv[0], vv[1]], 'tuple');
          const nat = naturalCmp(I);
          a.cmpFn = (p, q) => nat((p as Arr).items[1], (q as Arr).items[1]);
        }
        heapPush(I, a, x);
        I.note = `PUSH ${I.fmt(x)}`;
        return L === 'java' ? true : undefined;
      }
      case 'pop': case 'poll': case 'Dequeue': case 'remove': {
        if (!n && name === 'poll') return null;
        let x = heapPop(I, a);
        if (a.priorityPairs && x instanceof Arr) x = x.items[0];
        I.note = `POP ${I.fmt(x)}`;
        return L === 'cpp' ? undefined : x;
      }
      case 'top': case 'peek': case 'Peek': {
        const x = n ? peekAt(I, a, 0) : L === 'java' ? null : peekAt(I, a, 0);
        return a.priorityPairs && x instanceof Arr ? x.items[0] : x;
      }
      case 'Count': return n;
      case 'empty': case 'isEmpty': return n === 0;
      case 'size': return n;
    }
  }
  // ----- queues and deques
  if (a.kind === 'queue' || a.kind === 'deque') {
    switch (name) {
      case 'push': case 'Enqueue': case 'offer': case 'push_back': case 'addLast': case 'offerLast': case 'emplace': {
        const x = v()[0];
        push(I, a, x);
        I.note = `ENQUEUE ${I.fmt(x)}`;
        return L === 'java' ? true : undefined;
      }
      case 'add': case 'append':
        if (a.kind === 'deque' && L === 'java' && args.length === 2) break;
        { const x = v()[0]; push(I, a, x); I.note = `ADD ${I.fmt(x)}`; return L === 'java' ? true : null; }
      case 'push_front': case 'addFirst': case 'offerFirst': case 'appendleft': case 'AddFirst': {
        const x = v()[0];
        insertAt(I, a, 0, x);
        I.note = `ADD FRONT ${I.fmt(x)}`;
        return undefined;
      }
      case 'pop':
        if (L === 'python') {
          if (!n) throw I.err(emptyMsg(I, a));
          const x = a.items.pop()!;
          a.version++;
          I.note = `POP ${I.fmt(x)}`;
          return x;
        }
        {
          // Java deque.pop() and C++ queue::pop() both remove the front
          const x = removeAt(I, a, 0);
          I.note = `${L === 'java' ? 'POP' : 'DEQUEUE'} ${I.fmt(x)}`;
          return L === 'cpp' ? undefined : x;
        }
      case 'Dequeue': case 'poll': case 'remove': case 'pop_front': case 'popleft': case 'removeFirst': case 'pollFirst': {
        if (!n && (name === 'poll' || name === 'pollFirst')) return null;
        if (name === 'remove' && args.length) break;
        const x = removeAt(I, a, 0);
        I.note = `DEQUEUE ${I.fmt(x)}`;
        return L === 'cpp' ? undefined : x;
      }
      case 'pop_back': case 'removeLast': case 'pollLast': {
        if (!n && name === 'pollLast') return null;
        const x = removeAt(I, a, n - 1);
        I.note = `REMOVE LAST ${I.fmt(x)}`;
        return L === 'cpp' ? undefined : x;
      }
      case 'front': case 'peek': case 'Peek': case 'getFirst': case 'peekFirst': case 'element':
        if (!n && (name === 'peek' || name === 'peekFirst') && L === 'java') return null;
        return peekAt(I, a, 0);
      case 'back': case 'getLast': case 'peekLast': return peekAt(I, a, n - 1);
      case 'empty': case 'isEmpty': return n === 0;
      case 'size': return n;
    }
  }
  // ----- lists, vectors, arrays
  switch (name) {
    case 'push_back': case 'add': case 'Add': case 'append': case 'emplace_back': {
      if (args.length === 2 && (name === 'add')) {
        const [i, x] = v();
        insertAt(I, a, num(i), x);
        I.note = `INSERT ${I.fmt(x)} at ${num(i)}`;
        return undefined;
      }
      const x = v()[0];
      push(I, a, x);
      I.note = `${L === 'python' ? 'APPEND' : 'ADD'} ${I.fmt(x)}`;
      return L === 'java' ? true : L === 'python' ? null : undefined;
    }
    case 'AddRange': case 'extend': case 'addAll': {
      for (const x of toArr(I, v()[0])) push(I, a, x);
      return L === 'python' ? null : undefined;
    }
    case 'insert': case 'Insert': {
      const [i, x] = v();
      const pos = i instanceof Iter ? i.idx : L === 'python' ? Math.min(Math.max(num(i) < 0 ? n + num(i) : num(i), 0), n) : num(i);
      insertAt(I, a, pos, x);
      I.note = `INSERT ${I.fmt(x)} at ${pos}`;
      return L === 'python' ? null : undefined;
    }
    case 'pop_back': {
      const x = removeAt(I, a, n - 1);
      I.note = `POP_BACK ${I.fmt(x)}`;
      return undefined;
    }
    case 'pop': {
      if (L !== 'python') break;
      const vv = v();
      let i = vv.length ? num(vv[0]) : n - 1;
      if (i < 0) i += n;
      if (!n) throw I.err('pop from empty list');
      if (i < 0 || i >= n) throw I.err('pop index out of range');
      const x = removeAt(I, a, i);
      I.note = `POP ${I.fmt(x)}`;
      return x;
    }
    case 'RemoveAt': {
      const i = num(v()[0]);
      removeAt(I, a, i);
      return undefined;
    }
    case 'remove': case 'Remove': {
      const x = v()[0];
      // Java: list.remove(2) removes index 2, but list.remove(Integer.valueOf(2)) / remove((Integer) x)
      // / remove(boxedVar) removes the value 2
      if (L === 'java' && typeof x === 'number' && !isBoxedInteger(I, args[0])) return removeAt(I, a, x);
      const i = a.items.findIndex((y) => valEq(x, y));
      if (i < 0) {
        if (L === 'python') throw I.err('list.remove(x): x not in list');
        return false;
      }
      removeAt(I, a, i);
      return L === 'python' ? null : true;
    }
    case 'erase': {
      const vv = v();
      const it = vv[0];
      if (it instanceof Iter) {
        const end = vv[1] instanceof Iter ? vv[1].idx : it.idx + 1;
        a.items.splice(it.idx, end - it.idx);
        a.version++;
        return new Iter(a, it.idx);
      }
      break;
    }
    case 'get': case 'at': case 'ElementAt': case 'elementAt': {
      const i = num(v()[0]);
      return I.readElem(a, i, `${I.arrName(a)}[${i}]`);
    }
    case 'set': {
      const [i, x] = v();
      const old = a.items[num(i)];
      I.writeElem(a, num(i), x, `${I.arrName(a)}[${num(i)}]`);
      return old;
    }
    case 'size': return n;
    case 'length': if (L === 'java') return n; break;
    case 'empty': case 'isEmpty': return n === 0;
    case 'clear': case 'Clear':
      a.items = [];
      a.version++;
      return L === 'python' ? null : undefined;
    case 'front': case 'getFirst': case 'First': return peekAt(I, a, 0);
    case 'back': case 'getLast': case 'Last': return peekAt(I, a, n - 1);
    case 'begin': return new Iter(a, 0);
    case 'end': return new Iter(a, n);
    case 'resize': {
      const [m, fill] = v();
      while (a.items.length < num(m)) a.items.push(fill ?? I.defaultFor(a.elemTy ?? { base: 'int', arr: 0, ptr: 0 }, false) ?? 0);
      a.items.length = num(m);
      a.version++;
      return undefined;
    }
    case 'assign': {
      const [m, fill] = v();
      a.items = Array.from({ length: num(m) }, () => fill);
      a.version++;
      return undefined;
    }
    case 'contains': case 'Contains': case 'includes': {
      const x = v()[0];
      return a.items.some((y) => valEq(x, y));
    }
    case 'indexOf': case 'IndexOf': case 'index': {
      const x = v()[0];
      const i = a.items.findIndex((y) => valEq(x, y));
      if (i < 0 && L === 'python') throw I.err(`${I.fmt(x)} is not in list`);
      return i;
    }
    case 'lastIndexOf': case 'LastIndexOf': {
      const x = v()[0];
      return a.items.map((y) => valEq(x, y)).lastIndexOf(true);
    }
    case 'count': {
      const x = v()[0];
      return a.items.filter((y) => valEq(x, y)).length;
    }
    case 'sort': case 'Sort': {
      const k = kwargs(I, args);
      const vv = v();
      sortArr(I, a, { reverse: truthy(k.get('reverse') ?? false), key: k.get('key'), cmp: vv[0] !== undefined && vv[0] !== null ? toComparator(I, vv[0]) : undefined });
      return L === 'python' ? null : undefined;
    }
    case 'reverse': case 'Reverse':
      a.items.reverse();
      a.version++;
      return L === 'python' ? null : undefined;
    case 'copy': case 'clone': case 'ToList': case 'ToArray':
      return new Arr([...a.items], name === 'ToArray' ? 'array' : a.kind === 'array' && L === 'java' ? 'array' : 'list', a.elemTy);
    case 'GetLength': {
      const d = num(v()[0]);
      return d === 0 ? n : a.items[0] instanceof Arr ? a.items[0].items.length : 0;
    }
    case 'toString': case 'ToString': return toText(a, L);
    case 'equals': case 'Equals': return a === v()[0];
    case 'Sum': return a.items.reduce<Val>((s, x) => I.binop('+', s, x), 0);
    case 'Max': return a.items.reduce((m, x) => (cmpVals(x, m) > 0 ? x : m));
    case 'Min': return a.items.reduce((m, x) => (cmpVals(x, m) < 0 ? x : m));
    case 'subList': {
      const [x, y] = v().map(num);
      return new Arr(a.items.slice(x, y), 'list', a.elemTy);
    }
    case 'stream': return a;
  }
  return NF;
}

function strMethod(I: Interp, s: string, name: string, args: Expr[], objExpr: Expr): R {
  const v = () => vals(I, args);
  const L = I.lang;
  const ch = (c: string) => (L === 'python' ? c : new Chr(c.charCodeAt(0)));
  switch (name) {
    case 'length': case 'size': return s.length;
    case 'charAt': case 'at': {
      const i = num(v()[0]);
      if (i < 0 || i >= s.length) throw I.err(`index ${i} is out of bounds for a string of length ${s.length}`);
      return new Chr(s.charCodeAt(i));
    }
    case 'substring': {
      const [a, b] = v().map(num);
      if (a < 0 || (b ?? s.length) > s.length || a > (b ?? s.length)) throw I.err(`substring(${a}, ${b}) is out of range for length ${s.length}`);
      return s.substring(a, b);
    }
    case 'substr': case 'Substring': {
      const [a, len] = v().map(num);
      if (a > s.length) throw I.err(`substr position ${a} is out of range`);
      return len === undefined ? s.slice(a) : s.substr(a, len);
    }
    case 'indexOf': case 'IndexOf': case 'find': {
      const x = v()[0];
      const i = s.indexOf(x instanceof Chr ? String.fromCharCode(x.c) : I.strOf(x));
      if (L === 'cpp' && i < 0) return -1;
      return i;
    }
    case 'rfind': case 'lastIndexOf': case 'LastIndexOf': return s.lastIndexOf(I.strOf(v()[0]));
    case 'equals': case 'Equals': return s === v()[0];
    case 'equalsIgnoreCase': return s.toLowerCase() === I.strOf(v()[0]).toLowerCase();
    case 'compareTo': case 'CompareTo': case 'compare': {
      const t = I.strOf(v()[0]);
      if (L === 'java') {
        for (let i = 0; i < Math.min(s.length, t.length); i++) if (s[i] !== t[i]) return s.charCodeAt(i) - t.charCodeAt(i);
        return s.length - t.length;
      }
      return s < t ? -1 : s > t ? 1 : 0;
    }
    case 'toUpperCase': case 'upper': case 'ToUpper': return s.toUpperCase();
    case 'toLowerCase': case 'lower': case 'ToLower': return s.toLowerCase();
    case 'contains': case 'Contains': return s.includes(I.strOf(v()[0]));
    case 'startsWith': case 'startswith': case 'StartsWith': return s.startsWith(I.strOf(v()[0]));
    case 'endsWith': case 'endswith': case 'EndsWith': return s.endsWith(I.strOf(v()[0]));
    case 'trim': case 'strip': case 'Trim': return s.trim();
    case 'lstrip': case 'TrimStart': return s.trimStart();
    case 'rstrip': case 'TrimEnd': return s.trimEnd();
    case 'isEmpty': case 'empty': return s.length === 0;
    case 'toCharArray': case 'ToCharArray': return new Arr([...s].map((c) => new Chr(c.charCodeAt(0))), 'array', { base: 'char', arr: 0, ptr: 0 });
    case 'split': case 'Split': {
      const a = v();
      if (!a.length || a[0] === null) return new Arr(s.trim().split(/\s+/).filter((x) => x), L === 'python' ? 'list' : 'array');
      const sep = a[0] instanceof Chr ? String.fromCharCode(a[0].c) : I.strOf(a[0]);
      const parts = L === 'java' ? s.split(new RegExp(sep)) : s.split(sep);
      return new Arr(parts, L === 'python' ? 'list' : 'array');
    }
    case 'replace': case 'Replace': {
      const [a, b] = v();
      const from = a instanceof Chr ? String.fromCharCode(a.c) : I.strOf(a);
      const to = b instanceof Chr ? String.fromCharCode(b.c) : I.strOf(b);
      return s.split(from).join(to);
    }
    case 'join': return toArr(I, v()[0]).map((x) => pyStr(x)).join(s);
    case 'format': {
      const a = v();
      let auto = 0;
      return s.replace(/\{(\d*)(?::([^}]*))?\}/g, (_, i: string, spec: string) => {
        const val = a[i === '' ? auto++ : parseInt(i, 10)];
        return spec ? printf(`%${spec.replace(/^([<>^])?/, '')}`, [val], 'python') : pyStr(val);
      });
    }
    case 'isdigit': case 'isnumeric': return s.length > 0 && /^\d+$/.test(s);
    case 'isalpha': return s.length > 0 && /^[a-zA-Z]+$/.test(s);
    case 'isalnum': return s.length > 0 && /^[a-zA-Z0-9]+$/.test(s);
    case 'isupper': return /[A-Z]/.test(s) && s === s.toUpperCase();
    case 'islower': return /[a-z]/.test(s) && s === s.toLowerCase();
    case 'isspace': return s.length > 0 && /^\s+$/.test(s);
    case 'count': { const t = I.strOf(v()[0]); return t ? s.split(t).length - 1 : s.length + 1; }
    case 'c_str': case 'ToString': case 'toString': case 'intern': return s;
    case 'push_back': case 'append': case '+=': {
      const x = v()[0];
      const cell = I.lv(objExpr);
      cell.set(s + (x instanceof Chr ? String.fromCharCode(x.c) : I.strOf(x)));
      return undefined;
    }
    case 'pop_back': {
      const cell = I.lv(objExpr);
      cell.set(s.slice(0, -1));
      return undefined;
    }
    case 'chars': return new Arr([...s].map(ch), 'list');
    case 'capitalize': return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    case 'title': return s.replace(/\b\w/g, (c) => c.toUpperCase());
    case 'zfill': return s.padStart(num(v()[0]), '0');
    case 'center': { const w = num(v()[0]); const gap = Math.max(0, w - s.length); return ' '.repeat(Math.floor(gap / 2)) + s + ' '.repeat(Math.ceil(gap / 2)); }
    case 'ljust': case 'PadRight': return s.padEnd(num(v()[0]));
    case 'rjust': case 'PadLeft': return s.padStart(num(v()[0]));
    case 'repeat': return s.repeat(num(v()[0]));
    case 'hashCode': { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
  }
  return NF;
}

function mapMethod(I: Interp, m: MapV, name: string, args: Expr[]): R {
  const v = () => vals(I, args);
  const L = I.lang;
  const set = (k: Val, x: Val) => {
    m.entries.set(keyOf(k), [k, x]);
    m.version++;
  };
  const has = (k: Val) => m.entries.has(keyOf(k));
  switch (name) {
    // ----- sets
    case 'add': case 'Add':
      if (m.isSet) {
        const x = v()[0];
        const had = has(x);
        set(x, true);
        I.note = `ADD ${I.fmt(x)}`;
        return L === 'python' ? null : !had;
      }
      if (L === 'csharp') {
        const [k, x] = v();
        if (has(k)) throw I.err(`an item with the key ${I.fmt(k)} has already been added`);
        set(k, x);
        I.note = `ADD ${I.fmt(k)} → ${I.fmt(x)}`;
        return undefined;
      }
      break;
    case 'insert': {
      const x = v()[0];
      if (m.isSet) {
        const had = has(x);
        set(x, true);
        return had ? false : true;
      }
      if (x instanceof Obj && x.cls === 'pair') {
        const k = x.fields.get('first');
        if (!has(k)) set(k, x.fields.get('second'));
        return undefined;
      }
      if (x instanceof Arr) {
        if (!has(x.items[0])) set(x.items[0], x.items[1]);
        return undefined;
      }
      break;
    }
    case 'discard': case 'erase': case 'Remove': case 'remove': {
      const x = v()[0];
      const had = has(x);
      if (!had && name === 'remove' && L === 'python') throw I.err(`KeyError: ${I.fmt(x)}`);
      const old = m.entries.get(keyOf(x));
      m.entries.delete(keyOf(x));
      m.version++;
      if (L === 'cpp') return had ? 1 : 0;
      if (L === 'java' && !m.isSet) return old ? old[1] : null;
      return L === 'python' ? null : had;
    }
    case 'contains': case 'Contains': case 'containsKey': case 'ContainsKey': return has(v()[0]);
    case 'count': return has(v()[0]) ? 1 : 0;
    case 'containsValue': case 'ContainsValue': { const x = v()[0]; return [...m.entries.values()].some(([, y]) => valEq(x, y)); }
    case 'size': case '__len__': return m.entries.size;
    case 'empty': case 'isEmpty': return m.entries.size === 0;
    case 'clear': case 'Clear': m.entries.clear(); m.version++; return undefined;
    // ----- maps
    case 'put': {
      const [k, x] = v();
      const old = m.entries.get(keyOf(k));
      set(k, x);
      I.note = `PUT ${I.fmt(k)} → ${I.fmt(x)}`;
      return old ? old[1] : null;
    }
    case 'putIfAbsent': { const [k, x] = v(); if (!has(k)) set(k, x); return undefined; }
    case 'get': {
      const [k, d] = v();
      const e = m.entries.get(keyOf(k));
      return e ? e[1] : L === 'python' ? (d ?? null) : null;
    }
    case 'TryGetValue': {
      const k = I.ev(args[0]);
      const cell = I.lv(args[1]);
      const e = m.entries.get(keyOf(k));
      cell.set(e ? e[1] : 0);
      return !!e;
    }
    case 'getOrDefault': case 'GetValueOrDefault': {
      const [k, d] = v();
      const e = m.entries.get(keyOf(k));
      return e ? e[1] : d ?? 0;
    }
    case 'setdefault': {
      const [k, d] = v();
      if (!has(k)) set(k, d ?? null);
      return m.entries.get(keyOf(k))![1];
    }
    case 'merge': {
      const [k, x] = v();
      const e = m.entries.get(keyOf(k));
      set(k, e ? I.binop('+', e[1], x) : x);
      return undefined;
    }
    case 'keys': case 'keySet':
      return new Arr([...m.entries.values()].map(([k]) => k), 'list');
    case 'values':
      return new Arr([...m.entries.values()].map(([, x]) => x), 'list');
    case 'items':
      return new Arr([...m.entries.values()].map(([k, x]) => new Arr([k, x], 'tuple')), 'list');
    case 'entrySet':
      return new Arr([...m.entries.values()].map(([k, x]) => {
        const e = new Obj('Entry');
        e.fields.set('key', k);
        e.fields.set('value', x);
        return e;
      }), 'list');
    case 'pop': {
      const [k, d] = v();
      const e = m.entries.get(keyOf(k));
      if (!e) {
        if (d !== undefined) return d;
        if (m.isSet && L === 'python' && args.length === 0) {
          const first = [...m.entries.values()][0];
          if (!first) throw I.err('pop from an empty set');
          m.entries.delete(keyOf(first[0]));
          m.version++;
          return first[0];
        }
        throw I.err(`KeyError: ${I.fmt(k)}`);
      }
      m.entries.delete(keyOf(k));
      m.version++;
      return e[1];
    }
    case 'update': {
      const src = v()[0];
      if (src instanceof MapV) for (const [k, e] of src.entries) m.entries.set(k, e);
      m.version++;
      return null;
    }
    case 'find': {
      const k = v()[0];
      const e = m.entries.get(keyOf(k));
      if (!e) return new Special('end');
      const p = new Obj('pair');
      p.fields.set('first', e[0]);
      p.fields.set('second', e[1]);
      return p;
    }
    case 'end': return new Special('end');
    case 'begin': return NF;
    case 'copy': {
      const c = new MapV(m.isSet, m.sorted);
      for (const [k, e] of m.entries) c.entries.set(k, e);
      return c;
    }
    case 'union': case 'intersection': case 'difference': {
      const other = new Set(toArr(I, v()[0]).map(keyOf));
      const out = new MapV(true);
      if (name === 'union') {
        for (const [k, e] of m.entries) out.entries.set(k, e);
        for (const x of toArr(I, v()[0])) out.entries.set(keyOf(x), [x, true]);
      } else {
        for (const [k, e] of m.entries) if (other.has(k) === (name === 'intersection')) out.entries.set(k, e);
      }
      return out;
    }
  }
  return NF;
}

function objMethod(I: Interp, o: Obj, name: string, args: Expr[]): R {
  if (o.fields.has('message') && ['getMessage', 'what', 'getLocalizedMessage', 'ToString', 'toString'].includes(name)) {
    return name === 'toString' || name === 'ToString' ? (I.objText(o, false) ?? String(o.fields.get('message'))) : o.fields.get('message');
  }
  if (o.cls === 'Entry') {
    if (name === 'getKey') return o.fields.get('key');
    if (name === 'getValue') return o.fields.get('value');
  }
  if (o.cls === 'StringBuilder') {
    const cur = o.fields.get('value') as string;
    const set = (s: string) => {
      o.fields.set('value', s);
      o.version++;
    };
    const v = () => vals(I, args);
    switch (name) {
      case 'append': case 'Append': { const x = v()[0]; set(cur + (x instanceof Chr ? String.fromCharCode(x.c) : I.strOf(x))); return o; }
      case 'toString': case 'ToString': return cur;
      case 'reverse': set([...cur].reverse().join('')); return o;
      case 'length': return cur.length;
      case 'charAt': return new Chr(cur.charCodeAt(num(v()[0])));
      case 'insert': case 'Insert': { const [i, x] = v(); set(cur.slice(0, num(i)) + I.strOf(x) + cur.slice(num(i))); return o; }
      case 'setCharAt': { const [i, c] = v(); set(cur.slice(0, num(i)) + String.fromCharCode(num(c)) + cur.slice(num(i) + 1)); return undefined; }
      case 'deleteCharAt': { const i = num(v()[0]); set(cur.slice(0, i) + cur.slice(i + 1)); return o; }
    }
  }
  if (name === 'toString' || name === 'ToString') return toText(o, I.lang);
  if (name === 'equals' || name === 'Equals') return o === vals(I, args)[0];
  return NF;
}

export { FnV };
