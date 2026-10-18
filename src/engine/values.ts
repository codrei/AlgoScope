// Runtime values used by the interpreter.
import type { Func, Ty } from './ir';

let nextId = 1;
export function resetIds() {
  nextId = 1;
}

/** A floating-point number (double/float in C-family, float in Python). Plain JS numbers are integers. */
export class Flt {
  v: number;
  constructor(v: number) {
    this.v = v;
  }
}

/** A character (char in C/C++/Java/C#). */
export class Chr {
  c: number;
  constructor(c: number) {
    this.c = c;
  }
}

export type ArrKind = 'array' | 'list' | 'vector' | 'stack' | 'queue' | 'deque' | 'tuple' | 'pq';

/** Arrays, lists, vectors, stacks and queues: anything shown as a row of boxes. */
export class Arr {
  id: number;
  items: Val[];
  kind: ArrKind;
  elemTy?: Ty;
  version = 0;
  /** last element write, used to detect swaps */
  lastWrite?: { idx: number; old: Val; neu: Val; step: number };
  /** priority queues: true = smallest first (Java/Python/C#), false = largest first (C++) */
  minHeap?: boolean;
  constructor(items: Val[], kind: ArrKind, elemTy?: Ty) {
    this.id = nextId++;
    this.items = items;
    this.kind = kind;
    this.elemTy = elemTy;
  }
}

/** An instance of a user class / struct (linked-list nodes, tree nodes, ...). */
export class Obj {
  id: number;
  cls: string;
  fields: Map<string, Val>;
  fieldTys: Map<string, Ty>;
  version = 0;
  constructor(cls: string) {
    this.id = nextId++;
    this.cls = cls;
    this.fields = new Map();
    this.fieldTys = new Map();
  }
}

/** Dictionaries / hash maps / sets. Keys are stored by a canonical string. */
export class MapV {
  id: number;
  entries: Map<string, [Val, Val]>;
  isSet: boolean;
  sorted: boolean;
  version = 0;
  constructor(isSet: boolean, sorted = false) {
    this.id = nextId++;
    this.entries = new Map();
    this.isSet = isSet;
    this.sorted = sorted;
  }
}

/** Python range object. */
export class RangeV {
  start: number;
  stop: number;
  step: number;
  constructor(start: number, stop: number, step: number) {
    this.start = start;
    this.stop = stop;
    this.step = step;
  }
  get length() {
    if (this.step > 0) return Math.max(0, Math.ceil((this.stop - this.start) / this.step));
    return Math.max(0, Math.ceil((this.start - this.stop) / -this.step));
  }
}

/** A storage location: variable, array element or object field. */
export interface Cell {
  get(): Val;
  set(v: Val): void;
  ty?: Ty;
  /** description, e.g. "arr[2]" */
  label(): string;
}

export class VarCell implements Cell {
  v: Val;
  ty?: Ty;
  name: string;
  constructor(name: string, v: Val, ty?: Ty) {
    this.name = name;
    this.v = v;
    this.ty = ty;
  }
  get() {
    return this.v;
  }
  set(v: Val) {
    this.v = v;
  }
  label() {
    return this.name;
  }
}

/** C pointer. Points at a cell; element pointers support arithmetic. */
export class Ptr {
  cell: Cell;
  arr?: Arr;
  idx?: number;
  constructor(cell: Cell, arr?: Arr, idx?: number) {
    this.cell = cell;
    this.arr = arr;
    this.idx = idx;
  }
}

/** A function value (Python functions, bound methods, lambdas). */
export class FnV {
  fn?: Func;
  self?: Obj;
  name: string;
  lambda?: { params: string[]; body: import('./ir').Expr; env: Map<string, Cell>[] };
  constructor(name: string) {
    this.name = name;
  }
}

/** A reference argument (C++ int&, C# ref) passed to a user function. */
export class RefArg {
  cell: Cell;
  constructor(cell: Cell) {
    this.cell = cell;
  }
}

/** Built-in namespace / stream objects (cout, System.out, Math, ...). */
export class Special {
  kind: string;
  constructor(kind: string) {
    this.kind = kind;
  }
}

/** C++ iterator (v.begin(), v.end()) used for sort(v.begin(), v.end()). */
export class Iter {
  arr: Arr;
  idx: number;
  constructor(arr: Arr, idx: number) {
    this.arr = arr;
    this.idx = idx;
  }
}

export type Val =
  | number
  | boolean
  | string
  | null
  | undefined
  | Flt
  | Chr
  | Arr
  | Obj
  | MapV
  | RangeV
  | Ptr
  | FnV
  | Special
  | Iter;

export function isNumeric(v: Val): v is number | Flt | Chr | boolean {
  return typeof v === 'number' || v instanceof Flt || v instanceof Chr || typeof v === 'boolean';
}

export function num(v: Val): number {
  if (typeof v === 'number') return v;
  if (v instanceof Flt) return v.v;
  if (v instanceof Chr) return v.c;
  if (typeof v === 'boolean') return v ? 1 : 0;
  throw new Error(`expected a number but got ${typeName(v)}`);
}

export function typeName(v: Val): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return 'int';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'string') return 'string';
  if (v instanceof Flt) return 'double';
  if (v instanceof Chr) return 'char';
  if (v instanceof Arr) return v.kind;
  if (v instanceof Obj) return v.cls;
  if (v instanceof MapV) return v.isSet ? 'set' : 'map';
  if (v instanceof RangeV) return 'range';
  if (v instanceof Ptr) return 'pointer';
  if (v instanceof FnV) return 'function';
  return 'value';
}

/** Equality used by == on primitives and by swap detection. */
export function valEq(a: Val, b: Val): boolean {
  if (isNumeric(a) && isNumeric(b)) return num(a) === num(b);
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  if (a instanceof Chr && typeof b === 'string') return String.fromCharCode(a.c) === b;
  if (typeof a === 'string' && b instanceof Chr) return a === String.fromCharCode(b.c);
  if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
  if (a instanceof Ptr && b instanceof Ptr) return a.cell === b.cell || (a.arr !== undefined && a.arr === b.arr && a.idx === b.idx);
  if (a instanceof Special && b instanceof Special) return a.kind === b.kind;
  if (a instanceof Iter && b instanceof Iter) return a.arr === b.arr && a.idx === b.idx;
  if (a instanceof Arr && b instanceof Arr && (a.kind === 'tuple' || a.kind === 'list') && a.kind === b.kind) {
    return a === b || (a.items.length === b.items.length && a.items.every((x, i) => valEq(x, b.items[i])));
  }
  return a === b;
}

/** Canonical key for maps/sets. */
export function keyOf(v: Val): string {
  if (isNumeric(v) && !(v instanceof Chr)) return 'n:' + num(v);
  if (v instanceof Chr) return 's:' + String.fromCharCode(v.c);
  if (typeof v === 'string') return 's:' + v;
  if (v === null || v === undefined) return 'null';
  if (v instanceof Arr && v.kind === 'tuple') return 't:(' + v.items.map(keyOf).join(',') + ')';
  if (v instanceof Arr || v instanceof Obj || v instanceof MapV) return 'r:' + v.id;
  return 'x:' + String(v);
}

export function truthy(v: Val): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (v instanceof Flt) return v.v !== 0;
  if (v instanceof Chr) return v.c !== 0;
  if (typeof v === 'string') return v.length > 0;
  if (v instanceof Arr) return v.items.length > 0;
  if (v instanceof MapV) return v.entries.size > 0;
  if (v instanceof RangeV) return v.length > 0;
  return true;
}
