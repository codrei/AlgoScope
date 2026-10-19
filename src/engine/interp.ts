// The interpreter: runs a Program one statement at a time and records a Step for each.
import type { ClassDef, Expr, Func, Lang, Program, Stmt, Ty } from './ir';
import { display, pyFormatSpec, csFormatItem, setObjTextHook, type StreamState } from './format';
import { consequence, OP_WORDS, plain, type CheckCtx } from './say';
import type { Counts, FrameSnap, HeapItem, SnapVal, Step, StepKind, Touch, Trace } from './trace';
import {
  Arr, Chr, Flt, FnV, Iter, MapV, Obj, Ptr, RangeV, RefArg, Special, VarCell, isNumeric, keyOf, num, resetIds, truthy, typeName, valEq,
  type ArrKind, type Cell, type Val,
} from './values';
import { collectIndexVars } from './lower/util';
import { NF, builtinName, callFunction, callMethod, getMember, libraryNew, isLibraryType } from './builtins';

export interface RunOptions {
  maxSteps?: number;
  maxDepth?: number;
  stdin?: string;
  /** only count operations (no snapshots): used by the Complexity Lab */
  countsOnly?: boolean;
}

export class RuntimeErr extends Error {
  line: number;
  constructor(msg: string, line: number) {
    super(msg);
    this.line = line;
  }
}

class StepLimit extends Error {}

/** A thrown exception object travelling up to the nearest matching catch. */
export class Thrown extends Error {
  obj: Obj;
  line: number;
  constructor(obj: Obj, line: number) {
    super(String(obj.fields.get('message') ?? obj.cls));
    this.obj = obj;
    this.line = line;
  }
}

const STD_EXCEPTIONS = new Set(['exception', 'runtime_error', 'logic_error', 'out_of_range', 'invalid_argument', 'overflow_error', 'underflow_error', 'length_error', 'domain_error', 'range_error', 'bad_alloc', 'Throwable']);
export const isExceptionName = (n: string) => /(Error|Exception)$/.test(n) || STD_EXCEPTIONS.has(n);
const CATCH_ALL = new Set(['Exception', 'BaseException', 'Throwable', 'exception', 'RuntimeException', 'SystemException', 'Error']);

type Completion = undefined | { t: 'break' } | { t: 'continue' } | { t: 'return'; v: Val };

interface ClassRT {
  def: ClassDef;
  statics: Map<string, Cell>;
}

let frameSeq = 1;

export class Frame {
  id = frameSeq++;
  name: string;
  fn?: Func;
  scopes: Map<string, Cell>[] = [new Map()];
  self?: Obj;
  cls?: string;
  ln = 0;
  globalNames?: Set<string>;
  /** Python nonlocal names: they live in the enclosing function's scope */
  nonlocalNames?: Set<string>;
  closure?: Map<string, Cell>[];
  constructor(name: string, fn?: Func) {
    this.name = name;
    this.fn = fn;
  }
}

export class ElemCell implements Cell {
  I: Interp;
  arr: Arr;
  idx: number;
  lbl: string;
  ty?: Ty;
  constructor(I: Interp, arr: Arr, idx: number, lbl: string) {
    this.I = I;
    this.arr = arr;
    this.idx = idx;
    this.lbl = lbl;
    this.ty = arr.elemTy;
  }
  get() {
    return this.I.readElem(this.arr, this.idx, this.lbl);
  }
  set(v: Val) {
    this.I.writeElem(this.arr, this.idx, v, this.lbl);
  }
  label() {
    return this.lbl;
  }
}

export class FieldCell implements Cell {
  obj: Obj;
  name: string;
  lbl: string;
  ty?: Ty;
  constructor(obj: Obj, name: string, lbl: string) {
    this.obj = obj;
    this.name = name;
    this.lbl = lbl;
    this.ty = obj.fieldTys.get(name);
  }
  get() {
    return this.obj.fields.get(this.name);
  }
  set(v: Val) {
    this.obj.fields.set(this.name, convert(v, this.ty));
    this.obj.version++;
  }
  label() {
    return this.lbl;
  }
}

/** Convert a value to a declared static type (int truncation, char, double, bool). */
/** C++ library types that are copied on assignment and when passed by value */
const CPP_VALUE_CONTAINERS = new Set(['vector', 'deque', 'list', 'stack', 'queue', 'priority_queue', 'map', 'unordered_map', 'set', 'unordered_set', 'multiset', 'multimap', 'pair', 'array']);

export function convert(v: Val, t?: Ty): Val {
  if (!t || t.arr || t.ptr || v === undefined || v === null) return v;
  switch (t.base) {
    case 'int':
      if (v instanceof Flt) return Number.isFinite(v.v) ? Math.trunc(v.v) : v.v > 0 ? 2147483647 : -2147483648;
      if (v instanceof Chr) return v.c;
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v;
    case 'double':
      if (typeof v === 'number' || v instanceof Chr || typeof v === 'boolean') return new Flt(num(v));
      return v;
    case 'char':
      if (typeof v === 'number') return new Chr(v);
      if (v instanceof Flt) return new Chr(Math.trunc(v.v));
      if (typeof v === 'string' && v.length === 1) return new Chr(v.charCodeAt(0));
      return v;
    case 'bool':
      if (isNumeric(v)) return truthy(v);
      return v;
    default:
      return v;
  }
}

export class Interp {
  prog: Program;
  lang: Lang;
  steps: Step[] = [];
  out = '';
  frames: Frame[] = [];
  /** the call stack at the moment a runtime error was thrown */
  errFrames?: Frame[];
  global: Frame;
  classes = new Map<string, ClassRT>();
  counts: Counts = { compares: 0, swaps: 0, reads: 0, writes: 0, calls: 0 };
  touches: Touch[] = [];
  compareText?: string;
  compareExpr?: Expr;
  compareSay?: string;
  compareRes?: boolean;
  swapText?: string;
  swapSay?: string;
  note?: string;
  silent = 0;
  ln = 1;
  maxSteps: number;
  maxDepth: number;
  stdin: string;
  stdinPos = 0;
  countsOnly: boolean;
  stepCount = 0;
  cout: StreamState = { fixed: false, precision: 6, width: 0, boolalpha: false };
  /** Turbo C text screen, created by the first clrscr() / gotoxy() */
  screen?: string[];
  cursor = { x: 0, y: 0 };

  enableScreen() {
    if (!this.screen) this.screen = Array.from({ length: 25 }, () => '');
  }

  private screenWrite(text: string) {
    const sc = this.screen!;
    for (const ch of text) {
      if (ch === '\n') {
        this.cursor.y = Math.min(24, this.cursor.y + 1);
        this.cursor.x = 0;
        continue;
      }
      if (ch === '\r') {
        this.cursor.x = 0;
        continue;
      }
      const row = sc[this.cursor.y].padEnd(this.cursor.x, ' ');
      sc[this.cursor.y] = row.slice(0, this.cursor.x) + ch + row.slice(this.cursor.x + 1);
      this.cursor.x = Math.min(79, this.cursor.x + 1);
    }
  }

  /** Next key for getch(): <up> <down> <left> <right> <esc> <enter> or a single character. */
  readKey(): number {
    const rest = this.stdin.slice(this.stdinPos);
    const named: Record<string, number> = { up: 72, down: 80, left: 75, right: 77, esc: 27, enter: 13, space: 32, tab: 9, backspace: 8 };
    const m = /^<(\w+)>/i.exec(rest);
    if (m && named[m[1].toLowerCase()] !== undefined) {
      this.stdinPos += m[0].length;
      return named[m[1].toLowerCase()];
    }
    while (this.stdinPos < this.stdin.length && (this.stdin[this.stdinPos] === '\n' || this.stdin[this.stdinPos] === '\r') && this.stdin.slice(this.stdinPos).trim() !== '' && /^\s*</.test(this.stdin.slice(this.stdinPos))) this.stdinPos++;
    if (this.stdinPos >= this.stdin.length) return -1;
    const ch = this.stdin[this.stdinPos++];
    return ch === '\n' ? 13 : ch.charCodeAt(0);
  }
  private heapCache = new Map<number, { ver: number; item: HeapItem }>();
  private globalIndexVars: Record<string, string[]>;

  constructor(prog: Program, opts: RunOptions = {}) {
    resetIds();
    frameSeq = 1;
    this.prog = prog;
    this.lang = prog.lang;
    this.maxSteps = opts.maxSteps ?? 5000;
    this.maxDepth = opts.maxDepth ?? 200;
    this.stdin = opts.stdin ?? '';
    this.countsOnly = !!opts.countsOnly;
    this.global = new Frame('Global');
    for (const [name, def] of Object.entries(prog.classes)) this.classes.set(name, { def, statics: new Map() });
    this.globalIndexVars = collectIndexVars(prog.globals);
  }

  get frame(): Frame {
    return this.frames[this.frames.length - 1] ?? this.global;
  }

  err(msg: string): RuntimeErr {
    return new RuntimeErr(msg, this.ln);
  }

  fmt(v: Val): string {
    if (v instanceof Arr) {
      const items = v.items.slice(0, 8).map((x) => (x instanceof Arr ? '[…]' : this.fmt(x)));
      const more = v.items.length > 8 ? ', …' : '';
      return v.kind === 'tuple' ? `(${items.join(', ')}${more})` : `[${items.join(', ')}${more}]`;
    }
    if (v instanceof Obj) return `${v.cls} #${v.id}`;
    if (v instanceof MapV) return v.isSet ? `set(${v.entries.size})` : `map(${v.entries.size})`;
    if (v instanceof Ptr) return v.arr ? `&${v.cell.label()}` : `&${v.cell.label()}`;
    return display(v, this.lang);
  }

  // ===================================================================== run
  /** Text of an object printed with its own toString() / ToString() / __str__ / __repr__. */
  private printing = 0;
  objText(o: Obj, repr: boolean): string | undefined {
    if (o.fields.has('message') && (isExceptionName(o.cls) || this.isExceptionClass(o.cls)) && !this.findMethod(o.cls, this.lang === 'python' ? '__str__' : 'toString', 0)) {
      const msg = String(o.fields.get('message'));
      if (this.lang === 'python') return repr ? `${o.cls}(${JSON.stringify(msg)})` : msg;
      if (this.lang === 'java') return msg ? `${o.cls}: ${msg}` : o.cls;
      return msg;
    }
    const names = this.lang === 'java' ? ['toString'] : this.lang === 'csharp' ? ['ToString'] : this.lang === 'python' ? (repr ? ['__repr__'] : ['__str__', '__repr__']) : [];
    for (const n of names) {
      const m = this.findMethod(o.cls, n, 0);
      if (m && this.printing < 20) {
        this.printing++;
        try {
          return this.strOf(this.invoke(m, [], o));
        } finally {
          this.printing--;
        }
      }
    }
    return undefined;
  }

  run(): Trace {
    setObjTextHook((o, repr) => this.objText(o, repr));
    const trace: Trace = { lang: this.lang, steps: this.steps, stdout: '' };
    try {
      if (this.lang === 'python') {
        for (const [name, fs] of Object.entries(this.prog.funcs)) {
          if (name.includes('@')) continue;
          const fv = new FnV(name);
          fv.fn = fs[0];
          this.global.scopes[0].set(name, new VarCell(name, fv));
        }
        this.frames.push(this.global);
        this.initStatics();
        this.step(this.prog.globals[0]?.ln ?? 1, 'start', 'Program starts');
        const r = this.execList(this.prog.globals);
        void r;
        this.step(this.ln, 'end', 'Program finished');
      } else {
        this.frames.push(this.global);
        this.silent++;
        for (const g of this.prog.globals) this.exec(g);
        this.initStatics();
        this.silent--;
        const entry = this.prog.entry!;
        const fn = entry.cls ? this.classes.get(entry.cls)!.def.methods[entry.name][0] : this.prog.funcs[entry.name][0];
        const args: Val[] = fn.params.map(() => new Arr([], 'array', { base: 'string', arr: 0, ptr: 0 }));
        this.entryFn = fn;
        this.invoke(fn, args, undefined);
      }
    } catch (e) {
      if (e instanceof StepLimit) {
        trace.truncated = true;
      } else if (e instanceof Thrown) {
        const msg = `uncaught ${e.obj.cls}: ${e.message}`;
        trace.error = { msg, line: e.line };
        this.silent = 0;
        if (this.errFrames) this.frames = this.errFrames;
        this.pushStep(e.line, 'error', `ERROR: ${msg}`, `The ${e.obj.cls} thrown on line ${e.line} was not caught, so the program stops: ${e.message}`);
      } else {
        const msg = e instanceof RuntimeErr ? e.message : e instanceof Error ? e.message : String(e);
        const line = e instanceof RuntimeErr ? e.line : this.ln;
        trace.error = { msg, line };
        this.silent = 0;
        if (this.errFrames) this.frames = this.errFrames;
        this.pushStep(line, 'error', `ERROR: ${msg}`, `Something went wrong on line ${line}: ${msg}`);
      }
    }
    trace.stdout = this.out;
    if (this.countsOnly) trace.finalCounts = { ...this.counts, steps: this.stepCount };
    return trace;
  }

  private initStatics() {
    for (const rt of this.classes.values()) {
      const saveFrames = this.frames.length;
      const fr = new Frame(rt.def.name);
      fr.cls = rt.def.name;
      this.frames.push(fr);
      for (const fd of rt.def.fields) {
        if (!fd.isStatic) continue;
        const v = fd.init ? this.evInit(fd.init, fd.ty) : this.defaultFor(fd.ty, true);
        rt.statics.set(fd.name, new VarCell(fd.name, convert(v, fd.ty), fd.ty));
      }
      this.frames.length = saveFrames;
    }
  }

  // ===================================================================== steps
  step(ln: number, kind: StepKind, text: string, cond?: Expr, condSrc?: string, result?: boolean, ctx?: CheckCtx, say?: string) {
    if (this.silent) return;
    if (this.countsOnly) {
      this.stepCount++;
      this.resetEvents();
      if (this.stepCount >= this.maxSteps) throw new StepLimit();
      return;
    }
    let plainText: string | undefined;
    if (this.swapText) {
      kind = 'swap';
      text = this.swapText;
      plainText = this.swapSay;
    } else if (this.compareText && (kind === 'check' || kind === 'assign' || kind === 'info')) {
      const cmp = `${this.compareSay}? ${this.compareRes ? 'Yes' : 'No'}`;
      if (cond && this.compareExpr === cond) {
        text = `COMPARE ${this.compareText}`;
        plainText = cmp + consequence(ctx, result);
      } else if (cond) {
        text = `CHECK ${condSrc} → ${result} · COMPARE ${this.compareText}`;
        plainText = `${cmp}. So the whole condition ${condSrc} is ${result}${consequence(ctx, result)}`;
      } else {
        plainText = `${say ?? plain(kind, text)} ${cmp}.`;
        text = `${text} · COMPARE ${this.compareText}`;
      }
      kind = 'compare';
    }
    this.pushStep(ln, kind, text, plainText ?? say ?? plain(kind, text, ctx, result));
    if (this.steps.length >= this.maxSteps) throw new StepLimit();
  }

  private resetEvents() {
    this.touches = [];
    this.compareText = undefined;
    this.compareExpr = undefined;
    this.compareSay = undefined;
    this.swapText = undefined;
    this.swapSay = undefined;
  }

  private pushStep(ln: number, kind: StepKind, text: string, say?: string) {
    const heap: Record<number, HeapItem> = {};
    const frames = this.snapFrames(heap);
    this.steps.push({
      ln,
      kind,
      text,
      say: say ?? plain(kind, text),
      frames,
      heap,
      out: this.out.length,
      touches: this.touches,
      counts: { ...this.counts },
      screen: this.screen ? [...this.screen] : undefined,
    });
    this.resetEvents();
  }

  private snapFrames(heap: Record<number, HeapItem>): FrameSnap[] {
    const queue: (Arr | Obj | MapV)[] = [];
    const sv = (v: Val): SnapVal => this.snapVal(v, queue);
    const out: FrameSnap[] = [];
    const gvars: [string, SnapVal][] = [];
    for (const [name, c] of this.global.scopes[0]) {
      const v = c.get();
      if (v instanceof FnV && !v.lambda) continue;
      if (v instanceof Special) continue;
      gvars.push([name, sv(v)]);
    }
    for (const rt of this.classes.values()) {
      for (const [name, c] of rt.statics) gvars.push([this.lang === 'python' ? `${rt.def.name}.${name}` : name, sv(c.get())]);
    }
    if (gvars.length || this.lang === 'python') {
      out.push({ name: this.lang === 'python' ? 'Global' : 'Globals', ln: this.global.ln, vars: gvars, indexVars: this.globalIndexVars, fid: 0 });
    }
    for (const fr of this.frames) {
      if (fr === this.global) continue;
      const vars: [string, SnapVal][] = [];
      if (fr.self && this.lang !== 'python') vars.push(['this', sv(fr.self)]);
      const seen = new Set<string>();
      for (let i = fr.scopes.length - 1; i >= 0; i--) {
        for (const [name, c] of fr.scopes[i]) {
          if (seen.has(name)) continue;
          seen.add(name);
          const v = c instanceof ElemCell ? c.arr.items[c.idx] : c.get();
          if (v instanceof FnV && v.fn && this.lang === 'python') continue;
          vars.push([name, sv(v)]);
        }
      }
      // keep declaration order (outer scopes first)
      const order: string[] = [];
      for (const s of fr.scopes) for (const k of s.keys()) if (!order.includes(k)) order.push(k);
      vars.sort((a, b) => (a[0] === 'this' ? -1 : b[0] === 'this' ? 1 : order.indexOf(a[0]) - order.indexOf(b[0])));
      out.push({ name: fr.name, ln: fr.ln, vars, indexVars: fr.fn?.indexVars ?? {}, fid: fr.id });
    }
    // walk the heap
    const seen = new Set<number>();
    while (queue.length) {
      const o = queue.shift()!;
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      const cached = this.heapCache.get(o.id);
      if (cached && cached.ver === o.version && !(o instanceof Obj)) {
        heap[o.id] = cached.item;
        // children still need to be visited
        if (o instanceof Arr) o.items.forEach((x) => this.snapVal(x, queue));
        else if (o instanceof MapV) for (const [k, x] of o.entries.values()) { this.snapVal(k, queue); this.snapVal(x, queue); }
        continue;
      }
      let item: HeapItem;
      if (o instanceof Arr) item = { kind: 'arr', id: o.id, arrKind: o.kind, items: o.items.map(sv), heap: o.kind === 'pq' || o.minHeap !== undefined || undefined };
      else if (o instanceof Obj) item = { kind: 'obj', id: o.id, cls: o.cls, fields: [...o.fields].map(([k, x]) => [k, sv(x)] as [string, SnapVal]) };
      else {
        let entries = [...o.entries.values()];
        if (o.sorted) entries = entries.sort((a, b) => cmpVals(a[0], b[0]));
        item = { kind: 'map', id: o.id, isSet: o.isSet, entries: entries.map(([k, x]) => [sv(k), sv(x)] as [SnapVal, SnapVal]) };
      }
      this.heapCache.set(o.id, { ver: o.version, item });
      heap[o.id] = item;
    }
    return out;
  }

  private snapVal(v: Val, queue: (Arr | Obj | MapV)[]): SnapVal {
    if (v === null || v === undefined) return v === null ? { t: 'null' } : { t: 'p', s: '?' };
    if (v instanceof Arr || v instanceof Obj || v instanceof MapV) {
      queue.push(v);
      return { t: 'r', id: v.id };
    }
    if (v instanceof Ptr) {
      if (v.arr) {
        queue.push(v.arr);
        return { t: 'ptr', s: `&${v.cell.label()}`, id: v.arr.id, idx: v.idx };
      }
      const target = v.cell instanceof VarCell ? v.cell.v : undefined;
      if (target instanceof Obj) {
        queue.push(target);
        return { t: 'ptr', s: `&${v.cell.label()}`, id: target.id };
      }
      return { t: 'ptr', s: `&${v.cell.label()}` };
    }
    if (v instanceof Iter) return { t: 'p', s: `iter@${v.idx}` };
    const s = display(v, this.lang);
    if (typeof v === 'number' || v instanceof Flt || v instanceof Chr) return { t: 'p', s, n: num(v) };
    if (typeof v === 'boolean') return { t: 'p', s, n: v ? 1 : 0 };
    return { t: 'p', s };
  }

  // ===================================================================== statements
  execList(ss: Stmt[]): Completion {
    for (const s of ss) {
      const r = this.exec(s);
      if (r) return r;
    }
    return undefined;
  }

  private pushScope() {
    if (this.lang !== 'python') this.frame.scopes.push(new Map());
  }

  private popScope() {
    if (this.lang !== 'python') this.frame.scopes.pop();
  }

  execBlock(ss: Stmt[]): Completion {
    this.pushScope();
    try {
      return this.execList(ss);
    } finally {
      this.popScope();
    }
  }

  declare(name: string, v: Val, t?: Ty) {
    const scopes = this.frame.scopes;
    scopes[scopes.length - 1].set(name, new VarCell(name, v, t));
  }

  exec(s: Stmt): Completion {
    this.ln = s.ln;
    this.frame.ln = s.ln;
    switch (s.k) {
      case 'vardecl': {
        const texts: string[] = [];
        const says: string[] = [];
        for (const d of s.decls) {
          const t: Ty = { ...s.ty, ptr: s.ty.ptr + (d.ptr ?? 0) };
          let v: Val;
          this.note = undefined;
          const lvKinds = ['name', 'index', 'member', 'un'];
          if (d.ref && d.init && lvKinds.includes(d.init.k)) {
            // a reference is another name for an existing variable
            const cell = this.lv(d.init);
            const scopes = this.frame.scopes;
            scopes[scopes.length - 1].set(d.name, cell);
            texts.push(`${d.name} refers to ${cell.label()}`);
            says.push(`${d.name} becomes another name for ${cell.label()}.`);
            continue;
          }
          if (d.dims) {
            t.arr = d.dims.length;
            v = this.makeCArray({ ...t, arr: 0 }, d.dims, d.init);
          } else if (d.ctorArgs) v = this.constructType(t, d.ctorArgs);
          else if (d.init) v = this.evInit(d.init, t);
          else v = this.declDefault(t);
          v = convert(v, t);
          if (d.init && !d.dims) v = this.copyValue(v, t, d.init);
          if (t.base === 'auto' && !t.arr && !t.ptr) {
            // keep the runtime type for auto/var
          }
          this.declare(d.name, v, t.base === 'auto' ? undefined : t);
          texts.push(`${d.name} = ${this.fmt(v)}`);
          if (v instanceof Arr) says.push(`Create the ${v.kind === 'array' ? 'array' : v.kind} ${d.name} = ${this.fmt(v)}.`);
          else if (v instanceof Obj) {
            const fresh = d.ctorArgs || !d.init || d.init.k === 'newobj' || (d.init.k === 'call' && d.init.callee.k === 'name' && this.classes.has(d.init.callee.name));
            says.push(fresh ? `Create ${d.name}, a new ${v.cls}.` : `Create ${d.name}. It points to the same ${v.cls} as ${this.label(d.init!)}.`);
          }
          else if (v === null) says.push(`Create ${d.name}. It points to nothing yet (${this.fmt(v)}).`);
          else if (v === undefined) says.push(`Create the variable ${d.name} (no value yet).`);
          else says.push(`Create the variable ${d.name} = ${this.fmt(v)}.`);
        }
        this.step(s.ln, 'assign', texts.join(', '), undefined, undefined, undefined, undefined, says.join(' '));
        return undefined;
      }
      case 'expr': {
        this.note = undefined;
        const v = this.ev(s.e);
        const kind: StepKind = this.noteKind ?? 'assign';
        this.noteKind = undefined;
        this.step(s.ln, kind, this.note ?? this.describe(s.e, v));
        this.note = undefined;
        return undefined;
      }
      case 'if': {
        const c = truthy(this.ev(s.c));
        this.step(s.ln, 'check', `IF ${s.src} → ${c}`, s.c, s.src, c, s.else ? 'ifelse' : 'if');
        if (c) return this.execBlockOrList(s.then);
        if (s.else) return this.execBlockOrList(s.else);
        return undefined;
      }
      case 'while': {
        for (;;) {
          const c = truthy(this.ev(s.c));
          this.step(s.ln, 'check', `WHILE ${s.src} → ${c}${c ? '' : ' · exit loop'}`, s.c, s.src, c, 'loop');
          if (!c) {
            // Python while ... else: runs when the loop ends without break
            if (s.elseBody) return this.execList(s.elseBody);
            break;
          }
          const r = this.execBlockOrList(s.body);
          if (r) {
            if (r.t === 'break') break;
            if (r.t === 'continue') continue;
            return r;
          }
        }
        return undefined;
      }
      case 'dowhile': {
        for (;;) {
          const r = this.execBlockOrList(s.body);
          if (r) {
            if (r.t === 'break') break;
            if (r.t === 'return') return r;
          }
          this.ln = s.condLn;
          const c = truthy(this.ev(s.c));
          this.step(s.condLn, 'check', `WHILE ${s.src} → ${c}${c ? '' : ' · exit loop'}`, s.c, s.src, c, 'loop');
          if (!c) break;
        }
        return undefined;
      }
      case 'for': {
        this.pushScope();
        try {
          this.silent++;
          const initTexts: string[] = [];
          try {
            for (const i of s.init) {
              this.exec(i);
              const last = s.init.length ? this.describeInit(i) : '';
              if (last) initTexts.push(last);
            }
          } finally {
            this.silent--;
          }
          let prefix = initTexts.join(', ');
          for (;;) {
            this.ln = s.ln;
            this.frame.ln = s.ln;
            const c = s.c ? truthy(this.ev(s.c)) : true;
            const head = prefix ? `${prefix} · ` : '';
            this.step(s.ln, 'check', `${head}CHECK ${s.src} → ${c}${c ? '' : ' · exit loop'}`, s.c, s.src, c, 'loop');
            if (!c) break;
            const r = this.execBlockOrList(s.body);
            if (r) {
              if (r.t === 'break') break;
              if (r.t === 'return') return r;
            }
            this.ln = s.ln;
            this.frame.ln = s.ln;
            const texts: string[] = [];
            this.silent++;
            try {
              for (const u of s.update) {
                this.note = undefined;
                const v = this.ev(u);
                texts.push(this.note ?? this.describe(u, v));
              }
            } finally {
              this.silent--;
            }
            this.note = undefined;
            prefix = texts.join(', ');
          }
        } finally {
          this.popScope();
        }
        return undefined;
      }
      case 'foreach':
        return this.execForeach(s);
      case 'return': {
        const v = s.e ? this.ev(s.e) : this.lang === 'python' ? null : undefined;
        const fnName = this.frame.fn?.name;
        this.step(s.ln, 'return', s.e ? `RETURN ${this.fmt(v)}${fnName ? ` from ${fnName}` : ''}` : `RETURN${fnName ? ` from ${fnName}` : ''}`);
        return { t: 'return', v };
      }
      case 'break':
        this.step(s.ln, 'info', 'BREAK · leave the loop');
        return { t: 'break' };
      case 'continue':
        this.step(s.ln, 'info', 'CONTINUE · next iteration');
        return { t: 'continue' };
      case 'pass':
        this.step(s.ln, 'info', 'pass');
        return undefined;
      case 'block':
        return this.execBlock(s.body);
      case 'switch': {
        const v = this.ev(s.e);
        this.step(s.ln, 'check', `SWITCH ${this.fmt(v)}`);
        let start = s.cases.findIndex((c) => c.tests && c.tests.some((t) => valEq(this.ev(t), v)));
        if (start < 0) start = s.cases.findIndex((c) => c.tests === null);
        if (start < 0) return undefined;
        this.pushScope();
        try {
          for (let i = start; i < s.cases.length; i++) {
            const r = this.execList(s.cases[i].body);
            if (r) {
              if (r.t === 'break') return undefined;
              return r;
            }
          }
        } finally {
          this.popScope();
        }
        return undefined;
      }
      case 'global': {
        const fr = this.frame;
        const set = s.nonlocal ? (fr.nonlocalNames ??= new Set()) : (fr.globalNames ??= new Set());
        s.names.forEach((n) => set.add(n));
        return undefined;
      }
      case 'del': {
        for (const t of s.targets) this.delTarget(t);
        this.step(s.ln, 'write', `DELETE ${s.targets.length} item(s)`);
        return undefined;
      }
      case 'throw': {
        const v = s.e ? this.ev(s.e) : this.currentException;
        if (!v) throw this.err('throw with no exception to rethrow');
        const obj = this.toException(v);
        const msg = String(obj.fields.get('message') ?? '');
        this.step(s.ln, 'info', `THROW ${obj.cls}${msg ? `: ${msg}` : ''}`, undefined, undefined, undefined, undefined,
          `Throw a ${obj.cls}${msg ? ` ("${msg}")` : ''}. The program jumps to the nearest matching catch.`);
        throw new Thrown(obj, s.ln);
      }
      case 'try':
        return this.execTry(s);
      case 'unsupported':
        throw this.err(`AlgoScope doesn't support ${s.what} yet`);
    }
  }

  noteKind?: StepKind;
  currentException?: Obj;
  entryFn?: Func;

  makeException(cls: string, msg: Val): Obj {
    const o = new Obj(cls);
    const text = msg === undefined || msg === null ? '' : this.strOf(msg);
    o.fields.set('message', text);
    if (this.lang === 'csharp') o.fields.set('Message', text);
    return o;
  }

  private toException(v: Val): Obj {
    if (v instanceof Obj) return v;
    if (v instanceof Special && v.kind.startsWith('class:')) return this.makeException(v.kind.slice(6), '');
    if (typeof v === 'string') return this.makeException(this.lang === 'cpp' || this.lang === 'c' ? 'string' : 'Exception', v);
    return this.makeException(typeName(v), this.strOf(v));
  }

  /** Errors the interpreter raises itself (index out of range...) as catchable exceptions. */
  private errorAsException(e: RuntimeErr): Obj {
    const m = e.message;
    const L = this.lang;
    const pick = (py: string, java: string, cs: string, cpp: string) => (L === 'python' ? py : L === 'java' ? java : L === 'csharp' ? cs : cpp);
    let cls: string;
    if (/out of (range|bounds)|index/i.test(m)) cls = pick('IndexError', 'ArrayIndexOutOfBoundsException', 'IndexOutOfRangeException', 'out_of_range');
    else if (/division|modulo/i.test(m)) cls = pick('ZeroDivisionError', 'ArithmeticException', 'DivideByZeroException', 'runtime_error');
    else if (/KeyError|key .* not found/i.test(m)) cls = pick('KeyError', 'NoSuchElementException', 'KeyNotFoundException', 'out_of_range');
    else if (/null/i.test(m)) cls = pick('AttributeError', 'NullPointerException', 'NullReferenceException', 'runtime_error');
    else if (/empty/i.test(m)) cls = pick('IndexError', 'EmptyStackException', 'InvalidOperationException', 'runtime_error');
    else if (/convert|literal|parse/i.test(m)) cls = pick('ValueError', 'NumberFormatException', 'FormatException', 'invalid_argument');
    else cls = pick('RuntimeError', 'RuntimeException', 'Exception', 'runtime_error');
    return this.makeException(cls, m);
  }

  private isSubclass(cls: string, of: string): boolean {
    let c: string | undefined = cls;
    while (c) {
      if (c === of) return true;
      c = this.classes.get(c)?.def.base;
    }
    return false;
  }

  private execTry(s: Extract<Stmt, { k: 'try' }>): Completion {
    let result: Completion;
    let failed = false;
    try {
      result = this.execBlock(s.body);
    } catch (e) {
      if (!(e instanceof Thrown) && !(e instanceof RuntimeErr)) throw e;
      const obj = e instanceof Thrown ? e.obj : this.errorAsException(e);
      const h = s.handlers.find((hd) => hd.types === null || hd.types.some((t) => CATCH_ALL.has(t) || this.isSubclass(obj.cls, t) || t === obj.cls));
      if (!h) throw e;
      this.errFrames = undefined;
      failed = true;
      this.pushScope();
      try {
        if (h.name) this.declare(h.name, obj);
        const save = this.currentException;
        this.currentException = obj;
        this.ln = h.ln;
        this.step(h.ln, 'info', `CATCH ${obj.cls}`, undefined, undefined, undefined, undefined,
          `The ${obj.cls} is caught here${obj.fields.get('message') ? ` (message: "${obj.fields.get('message')}")` : ''}, so the program continues.`);
        try {
          result = this.execList(h.body);
        } finally {
          this.currentException = save;
        }
      } finally {
        this.popScope();
      }
    } finally {
      if (s.finallyBody) {
        const r = this.execBlock(s.finallyBody);
        if (r) return r;
      }
    }
    if (!failed && !result && s.elseBody) return this.execList(s.elseBody);
    return result;
  }

  private execBlockOrList(ss: Stmt[]): Completion {
    if (ss.length === 1 && ss[0].k === 'block') return this.exec(ss[0]);
    return this.execBlock(ss);
  }

  private describeInit(s: Stmt): string {
    if (s.k === 'vardecl') {
      return s.decls.map((d) => {
        const c = this.lookup(d.name);
        return `${d.name} = ${c ? this.fmt(c.get()) : '?'}`;
      }).join(', ');
    }
    if (s.k === 'expr') return this.note ?? this.describe(s.e, undefined);
    return '';
  }

  private execForeach(s: Extract<Stmt, { k: 'foreach' }>): Completion {
    const it = this.ev(s.iter);
    const label = this.label(s.iter);
    const tname = s.target.k === 'name' ? s.target.name : this.label(s.target);
    this.pushScope();
    try {
      let i = 0;
      const nextVal = (): { done: boolean; v?: Val } => {
        if (it instanceof RangeV) {
          const v = it.start + i * it.step;
          if (it.step > 0 ? v >= it.stop : v <= it.stop) return { done: true };
          i++;
          return { done: false, v };
        }
        if (it instanceof Arr) {
          if (i >= it.items.length) return { done: true };
          const v = this.readElem(it, i, `${label}[${i}]`);
          i++;
          return { done: false, v };
        }
        if (typeof it === 'string') {
          if (i >= it.length) return { done: true };
          const ch = it[i++];
          return { done: false, v: this.lang === 'python' ? ch : new Chr(ch.charCodeAt(0)) };
        }
        if (it instanceof MapV) {
          const entries = [...it.entries.values()];
          if (it.sorted) entries.sort((a, b) => cmpVals(a[0], b[0]));
          if (i >= entries.length) return { done: true };
          const [k, v] = entries[i++];
          if (it.isSet || this.lang === 'python' || this.lang === 'java') return { done: false, v: k };
          const pair = new Obj(this.lang === 'csharp' ? 'KeyValuePair' : 'pair');
          pair.fields.set(this.lang === 'csharp' ? 'Key' : 'first', k);
          pair.fields.set(this.lang === 'csharp' ? 'Value' : 'second', v);
          return { done: false, v: pair };
        }
        throw this.err(`can't loop over a ${typeName(it)}`);
      };
      for (;;) {
        this.ln = s.ln;
        this.frame.ln = s.ln;
        const n = nextVal();
        if (n.done) {
          this.step(s.ln, 'check', `FOR ${tname} in ${label} · loop finished`);
          break;
        }
        if (this.lang !== 'python' && s.target.k === 'list') {
          // foreach (var (to, w) in edges): declare each part
          const parts = this.iterToArray(n.v);
          s.target.items.forEach((t, k) => t.k === 'name' && this.declare(t.name, parts[k]));
        } else if (this.lang === 'python' || s.target.k !== 'name') this.assignTo(s.target, n.v);
        else if (s.ty?.ref && it instanceof Arr) {
          // for (auto& x : v): x is the element itself
          const scopes = this.frame.scopes;
          scopes[scopes.length - 1].set(s.target.name, new ElemCell(this, it, i - 1, `${label}[${i - 1}]`));
        } else if (s.ty?.ref && typeof it === 'string' && this.lang === 'cpp') {
          const scopes = this.frame.scopes;
          scopes[scopes.length - 1].set(s.target.name, this.stringCell(s.iter, i - 1, `${label}[${i - 1}]`));
        } else this.declare(s.target.name, this.copyValue(convert(n.v, s.ty), s.ty), s.ty && s.ty.base !== 'auto' ? s.ty : undefined);
        this.step(s.ln, 'assign', `FOR ${s.target.k === 'name' ? s.target.name : tname} = ${this.fmt(n.v)}`);
        const r = this.lang === 'python' ? this.execList(s.body) : this.execBlockOrList(s.body);
        if (r) {
          if (r.t === 'break') return undefined;
          if (r.t === 'continue') continue;
          return r;
        }
      }
      if (s.elseBody) return this.execList(s.elseBody);
    } finally {
      this.popScope();
    }
    return undefined;
  }

  /** Narration for an expression statement when nothing more specific was recorded. */
  describe(e: Expr, v: Val): string {
    switch (e.k) {
      case 'call': {
        const name = e.callee.k === 'name' ? e.callee.name : e.callee.k === 'member' ? e.callee.name : 'call';
        return v === undefined || v === null ? `${name}(…) done` : `${name}(…) → ${this.fmt(v)}`;
      }
      default:
        return v === undefined ? 'evaluate' : `= ${this.fmt(v)}`;
    }
  }

  // ===================================================================== names
  lookup(name: string): Cell | undefined {
    const fr = this.frame;
    if (this.lang === 'python' && fr.globalNames?.has(name)) return this.global.scopes[0].get(name);
    if (this.lang === 'python' && fr.nonlocalNames?.has(name)) return this.closureCell(name);
    for (let i = fr.scopes.length - 1; i >= 0; i--) {
      const c = fr.scopes[i].get(name);
      if (c) return c;
    }
    if (fr.closure) {
      for (let i = fr.closure.length - 1; i >= 0; i--) {
        const c = fr.closure[i].get(name);
        if (c) return c;
      }
    }
    if (fr.self && this.lang !== 'python') {
      if (fr.self.fields.has(name)) return new FieldCell(fr.self, name, name);
      const getter = this.lang === 'csharp' ? this.findMethod(fr.self.cls, `__get_${name}`, 0) : undefined;
      if (getter) {
        const self = fr.self;
        return { get: () => this.invoke(getter, [], self), set: () => { throw this.err(`${name} is read-only`); }, label: () => name };
      }
    }
    if (fr.cls) {
      const st = this.findStatic(fr.cls, name);
      if (st) return st;
    }
    if (fr !== this.global) return this.global.scopes[0].get(name);
    return undefined;
  }

  /** the variable a Python nonlocal name refers to: the nearest enclosing function's */
  closureCell(name: string): Cell | undefined {
    const cl = this.frame.closure ?? [];
    for (let i = cl.length - 1; i >= 0; i--) {
      const c = cl[i].get(name);
      if (c) return c;
    }
    return undefined;
  }

  findStatic(cls: string, name: string): Cell | undefined {
    let c: string | undefined = cls;
    while (c) {
      const rt = this.classes.get(c);
      if (!rt) break;
      const st = rt.statics.get(name);
      if (st) return st;
      c = rt.def.base;
    }
    // nested classes can see the outer class's statics (Java/C#)
    for (const rt of this.classes.values()) {
      const st = rt.statics.get(name);
      if (st) return st;
    }
    return undefined;
  }

  findMethod(cls: string, name: string, nargs: number): Func | undefined {
    let c: string | undefined = cls;
    while (c) {
      const rt = this.classes.get(c);
      if (!rt) break;
      const ms = rt.def.methods[name];
      if (ms) return pickOverload(ms, nargs);
      c = rt.def.base;
    }
    return undefined;
  }

  private setName(name: string, v: Val, ln: number, src?: Expr): Cell {
    void ln;
    if (this.lang === 'python') {
      const fr = this.frame;
      if (fr.nonlocalNames?.has(name)) {
        const outer = this.closureCell(name);
        if (!outer) throw this.err(`no binding for nonlocal '${name}' found`);
        outer.set(v);
        return outer;
      }
      // assignment inside a nested function creates a local (unless declared global / nonlocal)
      const target = fr.globalNames?.has(name) ? this.global.scopes[0] : fr.scopes[0];
      let c = target.get(name);
      if (c) c.set(v);
      else {
        c = new VarCell(name, v);
        target.set(name, c);
      }
      return c;
    }
    const c = this.lookup(name);
    if (!c) throw this.err(`'${name}' was not declared`);
    c.set(src ? this.copyValue(convert(v, c.ty), c.ty, src) : convert(v, c.ty));
    return c;
  }

  label(e: Expr): string {
    switch (e.k) {
      case 'name': return e.name;
      case 'this': return this.lang === 'python' ? 'self' : 'this';
      case 'member': {
        const o = e.obj.k === 'this' && this.lang !== 'python' ? '' : this.label(e.obj) + (e.arrow ? '->' : '.');
        return o + e.name;
      }
      case 'index': return `${this.label(e.obj)}[…]`;
      case 'un': return e.op === 'deref' ? `*${this.label(e.e)}` : this.label(e.e);
      case 'num': return String(e.v);
      case 'call': return `${this.label(e.callee)}()`;
      default: return '…';
    }
  }

  // ===================================================================== expressions
  ev(e: Expr): Val {
    if ((e as { k: string }).k === '__val') return (e as unknown as { v: Val }).v;
    switch (e.k) {
      case 'num': return e.float ? new Flt(e.v) : e.v;
      case 'str': return e.v;
      case 'char': return new Chr(e.v);
      case 'bool': return e.v;
      case 'null': return null;
      case 'name': return this.evName(e.name);
      case 'this': {
        const s = this.frame.self;
        if (!s) throw this.err(`'this' used outside of a method`);
        return s;
      }
      case 'bin': return this.evBin(e);
      case 'cmpchain': {
        let left = this.ev(e.items[0]);
        for (let i = 0; i < e.ops.length; i++) {
          const right = this.ev(e.items[i + 1]);
          if (!truthy(this.binop(e.ops[i], left, right))) return false;
          left = right;
        }
        return true;
      }
      case 'un': return this.evUnary(e);
      case 'assign': return this.evAssign(e);
      case 'incdec': return this.evIncDec(e);
      case 'cond': return truthy(this.ev(e.c)) ? this.ev(e.t) : this.ev(e.f);
      case 'call': return this.evCall(e);
      case 'index': {
        const r = this.evIndexFull(e);
        return this.readIndexed(r.cont, r.key, r.label);
      }
      case 'slice': return this.evSlice(e);
      case 'member': return this.evMember(e);
      case 'newarr': return this.evNewArr(e);
      case 'newobj': return this.constructType(e.ty, e.args);
      case 'list': {
        if (e.kind === 'set') {
          const m = new MapV(true);
          for (const it of e.items) {
            const v = this.ev(it);
            m.entries.set(keyOf(v), [v, true]);
          }
          return m;
        }
        const kind: ArrKind = e.kind === 'tuple' ? 'tuple' : e.kind === 'init' ? (this.lang === 'python' ? 'list' : 'array') : 'list';
        return new Arr(e.items.map((x) => this.ev(x)), kind);
      }
      case 'dict': {
        const m = new MapV(false);
        for (const [k, v] of e.entries) {
          const kv = this.ev(k);
          m.entries.set(keyOf(kv), [kv, this.ev(v)]);
        }
        return m;
      }
      case 'listcomp': return this.evListComp(e);
      case 'fstr': {
        let s = '';
        for (const p of e.parts) {
          if (typeof p === 'string') s += p;
          else {
            const v = this.ev(p.e);
            s += this.lang === 'python' ? pyFormatSpec(v, p.spec) : csFormatItem(v, p.spec);
          }
        }
        return s;
      }
      case 'kw': throw this.err('keyword argument used outside a call');
      case 'spread': throw this.err('*unpacking is only supported in function calls');
      case 'declvar': {
        this.declare(e.name, this.declDefault(e.ty) ?? convert(0, e.ty), e.ty.base === 'auto' ? undefined : e.ty);
        return undefined;
      }
      case 'cast': return this.castTo(e.ty, this.ev(e.e));
      case 'sizeof': return this.evSizeof(e);
      case 'lambda': {
        const f = new FnV('lambda');
        f.lambda = { params: e.params, body: e.body, env: [...this.frame.scopes] };
        return f;
      }
    }
  }

  evName(name: string): Val {
    const c = this.lookup(name);
    if (c) return c.get();
    const b = builtinName(this, name);
    if (b !== NF) return b as Val;
    if (this.prog.classes[name]) return new Special(`class:${name}`);
    const fs = this.prog.funcs[name];
    if (fs) {
      const f = new FnV(name);
      f.fn = fs[0];
      return f;
    }
    if (this.frame.cls) {
      const m = this.findMethod(this.frame.cls, name, -1);
      if (m) {
        const f = new FnV(name);
        f.fn = m;
        f.self = this.frame.self;
        return f;
      }
    }
    if (this.lang === 'python') throw this.err(`name '${name}' is not defined`);
    throw this.err(`'${name}' was not declared in this scope`);
  }

  /** Evaluate an operand, remembering which array cell it came from (for COMPARE). */
  private evTracked(e: Expr): { v: Val; label: string; arr?: Arr; idx?: number } {
    if (e.k === 'index') {
      const r = this.evIndexFull(e);
      if (r.cont instanceof Arr && isNumeric(r.key)) {
        const idx = this.normIndex(r.cont, num(r.key));
        const v = this.readElem(r.cont, idx, r.label);
        return { v, label: r.label, arr: r.cont, idx };
      }
      return { v: this.readIndexed(r.cont, r.key, r.label), label: r.label };
    }
    const v = this.ev(e);
    const label = e.k === 'num' || e.k === 'str' || e.k === 'char' || e.k === 'bool' || e.k === 'null' ? '' : this.label(e);
    return { v, label };
  }

  private evBin(e: Extract<Expr, { k: 'bin' }>): Val {
    const op = e.op;
    if (op === '&&' || op === 'and') {
      const l = this.ev(e.l);
      if (!truthy(l)) return this.lang === 'python' ? l : false;
      const r = this.ev(e.r);
      return this.lang === 'python' ? r : truthy(r);
    }
    if (op === '||' || op === 'or') {
      const l = this.ev(e.l);
      if (truthy(l)) return this.lang === 'python' ? l : true;
      const r = this.ev(e.r);
      return this.lang === 'python' ? r : truthy(r);
    }
    if (op === '<' || op === '>' || op === '<=' || op === '>=' || op === '==' || op === '!=') {
      const L = this.evTracked(e.l);
      const R = this.evTracked(e.r);
      const res = this.binop(op, L.v, R.v);
      if (L.arr || R.arr) {
        this.counts.compares++;
        if (L.arr) this.touches.push({ id: L.arr.id, idx: L.idx!, role: 'compare' });
        if (R.arr) this.touches.push({ id: R.arr.id, idx: R.idx!, role: 'compare' });
        if (!this.compareText) {
          const side = (x: { v: Val; label: string }) => (x.label ? `${x.label} (${this.fmt(x.v)})` : this.fmt(x.v));
          const plainSide = (x: { v: Val; label: string }) => (x.label && x.label !== this.fmt(x.v) ? `${x.label} = ${this.fmt(x.v)}` : this.fmt(x.v));
          this.compareText = `${side(L)} ${op} ${side(R)} → ${truthy(res)}`;
          this.compareSay = `Is ${plainSide(L)} ${OP_WORDS[op] ?? op} ${plainSide(R)}`;
          this.compareRes = truthy(res);
          this.compareExpr = e;
        }
      }
      return res;
    }
    if (op === '<<' || op === '>>') {
      const l = this.ev(e.l);
      if (l instanceof Special && (l.kind === 'cout' || l.kind === 'cerr') && op === '<<') {
        const r = this.ev(e.r);
        this.coutWrite(r);
        return l;
      }
      if (l instanceof Special && l.kind === 'cin' && op === '>>') {
        const cell = this.lv(e.r);
        const tok = this.readToken();
        if (tok === null) throw this.err('no more input (type input values in the Input box)');
        const t = cell.ty?.base;
        let v: Val = tok;
        if (t === 'int') v = parseInt(tok, 10);
        else if (t === 'double') v = new Flt(parseFloat(tok));
        else if (t === 'char') v = new Chr(tok.charCodeAt(0));
        else if (t !== 'string' && /^-?\d+$/.test(tok)) v = parseInt(tok, 10);
        cell.set(v);
        this.note = `READ ${cell.label()} = ${this.fmt(cell.get())}`;
        return l;
      }
      return this.binop(op, l, this.ev(e.r));
    }
    const l = this.ev(e.l);
    const r = this.ev(e.r);
    return this.binop(op, l, r);
  }

  coutWrite(r: Val) {
    if (r instanceof Special) {
      if (r.kind === 'endl') this.write('\n');
      else if (r.kind === 'fixed') this.cout.fixed = true;
      else if (r.kind === 'boolalpha') this.cout.boolalpha = true;
      else if (r.kind.startsWith('setprecision:')) this.cout.precision = parseInt(r.kind.split(':')[1], 10);
      else if (r.kind.startsWith('setw:')) this.cout.width = parseInt(r.kind.split(':')[1], 10);
      return;
    }
    let s = r instanceof Chr ? String.fromCharCode(r.c) : (this.toText(r));
    if (this.cout.width) {
      s = s.padStart(this.cout.width);
      this.cout.width = 0;
    }
    this.write(s);
  }

  toText(v: Val): string {
    // imported lazily to avoid a cycle at module init
    return textOf(v, this.lang, this.cout);
  }

  write(s: string) {
    if (this.screen) this.screenWrite(s);
    this.out += s;
    if (this.out.length > 200000) throw this.err('too much output (over 200,000 characters)');
    const shown = s.length > 40 ? s.slice(0, 40) + '…' : s;
    this.note = (this.note && this.note.startsWith('PRINT ') ? this.note.slice(0, -1) + JSON.stringify(shown).slice(1) : `PRINT ${JSON.stringify(shown)}`);
    this.noteKind = 'print';
  }

  binop(op: string, a: Val, b: Val): Val {
    const py = this.lang === 'python';
    // pointers / iterators
    if ((a instanceof Ptr || a instanceof Arr && !py) && (op === '+' || op === '-') && isNumeric(b) && !(a instanceof Arr && a.kind !== 'array')) {
      const arr = a instanceof Ptr ? a.arr : a;
      if (!arr) throw this.err('pointer arithmetic on a non-array pointer');
      const base = a instanceof Ptr ? a.idx ?? 0 : 0;
      const idx = base + (op === '+' ? num(b) : -num(b));
      return new Ptr(new ElemCell(this, arr, idx, `${this.arrName(arr)}[${idx}]`), arr, idx);
    }
    if (a instanceof Ptr && b instanceof Ptr && op === '-') return (a.idx ?? 0) - (b.idx ?? 0);
    // C: an array name is a pointer to its first element, so p < arr + n, p == arr and p - arr work
    if (this.lang === 'c' || this.lang === 'cpp') {
      const pos = (v: Val) => (v instanceof Ptr && v.arr ? { arr: v.arr, idx: v.idx ?? 0 } : v instanceof Arr && v.kind === 'array' ? { arr: v, idx: 0 } : null);
      const pa = pos(a);
      const pb = pos(b);
      if (pa && pb && pa.arr === pb.arr && (a instanceof Ptr || b instanceof Ptr)) {
        switch (op) {
          case '-': return pa.idx - pb.idx;
          case '<': return pa.idx < pb.idx;
          case '<=': return pa.idx <= pb.idx;
          case '>': return pa.idx > pb.idx;
          case '>=': return pa.idx >= pb.idx;
          case '==': return pa.idx === pb.idx;
          case '!=': return pa.idx !== pb.idx;
        }
      }
      // char *s = "text": s + 1 points one character further
      if (typeof a === 'string' && typeof b === 'number' && (op === '+' || op === '-') && this.lang === 'c') return a.slice(op === '+' ? b : -b);
    }
    if (a instanceof Iter && isNumeric(b) && (op === '+' || op === '-')) return new Iter(a.arr, a.idx + (op === '+' ? num(b) : -num(b)));
    if (a instanceof Iter && b instanceof Iter && op === '-') return a.idx - b.idx;
    // strings
    if (op === '+' && (typeof a === 'string' || typeof b === 'string')) {
      if (py && (typeof a !== 'string' || typeof b !== 'string')) {
        throw this.err(`can only concatenate str (not "${typeName(typeof a === 'string' ? b : a)}") to str`);
      }
      return this.strOf(a) + this.strOf(b);
    }
    if (op === '+' && (this.lang === 'cpp') && a instanceof Chr && typeof b === 'string') return String.fromCharCode(a.c) + b;
    if (py) {
      if (op === '+' && a instanceof Arr && b instanceof Arr) return new Arr([...a.items, ...b.items], a.kind === 'tuple' ? 'tuple' : 'list');
      if (op === '*' && (a instanceof Arr || typeof a === 'string') && typeof b === 'number') return repeat(a, b);
      if (op === '*' && (b instanceof Arr || typeof b === 'string') && typeof a === 'number') return repeat(b, a);
      if (op === '%' && typeof a === 'string') {
        const args = b instanceof Arr && b.kind === 'tuple' ? b.items : [b];
        return pyPercent(a, args);
      }
      if (op === 'in' || op === 'not in') {
        const r = contains(b, a);
        return op === 'in' ? r : !r;
      }
      if (op === 'is') return a === b || (a == null && b == null);
      if (op === 'is not') return !(a === b || (a == null && b == null));
    }
    if (op === '==') return valEq(a, b);
    if (op === '!=') return !valEq(a, b);
    if (op === '<' || op === '>' || op === '<=' || op === '>=') {
      if (typeof a === 'string' && typeof b === 'string' || a instanceof Arr && b instanceof Arr) {
        const c = cmpVals(a, b);
        return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
      }
      if (!isNumeric(a) || !isNumeric(b)) throw this.err(`can't compare ${typeName(a)} and ${typeName(b)} with ${op}`);
      const x = num(a), y = num(b);
      return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
    }
    if (!isNumeric(a) || !isNumeric(b)) {
      if (a === undefined || b === undefined) throw this.err('a variable was used before it was given a value');
      throw this.err(`can't use ${op} on ${typeName(a)} and ${typeName(b)}`);
    }
    const fl = a instanceof Flt || b instanceof Flt;
    const x = num(a), y = num(b);
    const mk = (n: number) => (fl ? new Flt(n) : n);
    switch (op) {
      case '+': return mk(x + y);
      case '-': return mk(x - y);
      case '*': return fl ? new Flt(x * y) : x * y;
      case '/':
        if (y === 0) {
          if (fl && !py) return new Flt(x / y);
          throw this.err(py ? 'division by zero' : 'division by zero');
        }
        if (py) return new Flt(x / y);
        return fl ? new Flt(x / y) : Math.trunc(x / y);
      case '//':
        if (y === 0) throw this.err('integer division or modulo by zero');
        return fl ? new Flt(Math.floor(x / y)) : Math.floor(x / y);
      case '%':
        if (y === 0) throw this.err(py ? 'integer division or modulo by zero' : 'modulo by zero');
        if (py) return mk(((x % y) + y) % y);
        return mk(x % y);
      case '**': {
        const r = Math.pow(x, y);
        return fl || y < 0 ? new Flt(r) : r;
      }
      case '&': return typeof a === 'boolean' && typeof b === 'boolean' ? a && b : x & y;
      case '|': return typeof a === 'boolean' && typeof b === 'boolean' ? a || b : x | y;
      case '^': return typeof a === 'boolean' && typeof b === 'boolean' ? a !== b : x ^ y;
      case '<<': return x << y;
      case '>>': return x >> y;
      case '>>>': return x >>> y;
      default: throw this.err(`operator ${op} is not supported`);
    }
  }

  strOf(v: Val): string {
    if (typeof v === 'string') return v;
    return textOf(v, this.lang, this.cout);
  }

  private evUnary(e: Extract<Expr, { k: 'un' }>): Val {
    if (e.op === 'addr') {
      const cell = this.lv(e.e);
      if (cell instanceof ElemCell) return new Ptr(cell, cell.arr, cell.idx);
      return new Ptr(cell);
    }
    const v = this.ev(e.e);
    switch (e.op) {
      case 'deref': return this.deref(v).get();
      case '-': return v instanceof Flt ? new Flt(-v.v) : -num(v);
      case '+': return v instanceof Flt ? v : num(v);
      case '!': case 'not': return !truthy(v);
      case '~': return ~num(v);
      default: throw this.err(`unary ${e.op} is not supported`);
    }
  }

  deref(v: Val): Cell {
    if (v instanceof Ptr) return v.cell;
    if (v instanceof Iter) return new ElemCell(this, v.arr, v.idx, `${this.arrName(v.arr)}[${v.idx}]`);
    if (v instanceof Arr) return new ElemCell(this, v, 0, `${this.arrName(v)}[0]`);
    if (v instanceof Obj) return { get: () => v, set: () => { throw this.err('cannot assign to *object'); }, label: () => `*${v.cls}` };
    if (v === null || v === undefined) throw this.err('null pointer dereference (the pointer is NULL)');
    // char *s = "text": *s is the first character ('\0' at the end)
    if (typeof v === 'string' && (this.lang === 'c' || this.lang === 'cpp')) {
      return { get: () => new Chr(v.length ? v.charCodeAt(0) : 0), set: () => { throw this.err('a string literal cannot be changed (copy it into a char array first)'); }, label: () => `*"${v.length > 8 ? v.slice(0, 8) + '…' : v}"` };
    }
    throw this.err(`can't dereference a ${typeName(v)}`);
  }

  arrName(arr: Arr): string {
    return this.findArrName(arr) ?? 'arr';
  }

  findArrName(arr: Arr): string | undefined {
    for (let f = this.frames.length - 1; f >= 0; f--) {
      for (const s of this.frames[f].scopes) for (const [n, c] of s) if (c instanceof VarCell && c.v === arr) return n;
    }
    for (const [n, c] of this.global.scopes[0]) if (c instanceof VarCell && c.v === arr) return n;
    return undefined;
  }

  private evAssign(e: Extract<Expr, { k: 'assign' }>): Val {
    if (e.op === '=') {
      const v = this.ev(e.value);
      return this.assignTo(e.target, v, e.value);
    }
    const op = e.op.slice(0, -1);
    const cell = this.lv(e.target);
    const cur = cell instanceof ElemCell ? cell.get() : cell.get();
    const rhs = this.ev(e.value);
    if (this.lang === 'python' && op === '+' && cur instanceof Arr && cur.kind === 'list') {
      const items = this.iterToArray(rhs);
      for (const x of items) {
        cur.items.push(x);
        cur.version++;
        this.touches.push({ id: cur.id, idx: cur.items.length - 1, role: 'write' });
      }
      this.note = `${cell.label()} += ${this.fmt(rhs)}`;
      return cur;
    }
    const nv = this.binop(op, cur, rhs);
    cell.set(convert(nv, cell.ty));
    const after = cell instanceof ElemCell ? cell.arr.items[cell.idx] : cell.get();
    this.note = `${cell.label()} ${e.op} ${this.fmt(rhs)} → ${this.fmt(after)}`;
    return after;
  }

  assignTo(target: Expr, v: Val, src?: Expr): Val {
    if (target.k === 'list') {
      const items = this.iterToArray(v);
      if (items.length !== target.items.length) throw this.err(`expected ${target.items.length} values to unpack, got ${items.length}`);
      const labels: string[] = [];
      target.items.forEach((t, i) => {
        this.assignTo(t, items[i]);
        labels.push(this.label(t));
      });
      if (!this.swapText) this.note = `${labels.join(', ')} = ${items.map((x) => this.fmt(x)).join(', ')}`;
      return v;
    }
    if (target.k === 'name') {
      const c = this.setName(target.name, v, target.ln, src);
      const nv = c.get();
      this.note = `${target.name} = ${this.fmt(nv)}`;
      return nv;
    }
    if (target.k === 'index' && this.lang === 'cpp') {
      const probe = this.ev(target.obj);
      if (typeof probe === 'string') {
        const cell = this.lv(target);
        cell.set(v);
        this.note = `${cell.label()} = ${this.fmt(cell.get())}`;
        return cell.get();
      }
    }
    if (target.k === 'index') {
      const r = this.evIndexFull(target);
      if (src && r.cont instanceof Arr) v = this.copyValue(v, r.cont.elemTy, src);
      this.writeIndexed(r.cont, r.key, v, r.label);
      const nv = r.cont instanceof Arr ? r.cont.items[this.normIndex(r.cont, num(r.key))] : v;
      this.note = `${r.label} = ${this.fmt(nv)}`;
      return nv;
    }
    const cell = this.lv(target);
    cell.set(src ? this.copyValue(convert(v, cell.ty), cell.ty, src) : convert(v, cell.ty));
    const nv = cell.get();
    this.note = `${cell.label()} = ${this.fmt(nv)}`;
    return nv;
  }

  /**
   * C/C++ structs and objects, C++ containers (vector, map...) and C# structs are values:
   * assigning or passing one by value makes a copy. src is the expression the value came
   * from; a temporary (a call, a literal, new ...) needs no copy. No src (parameters) = copy.
   */
  copyValue(v: Val, t: Ty | undefined, src?: Expr): Val {
    if (!(v instanceof Obj || v instanceof Arr || v instanceof MapV)) return v;
    if (src && !(src.k === 'name' || src.k === 'member' || src.k === 'index' || (src.k === 'un' && src.op === '*'))) return v;
    if (this.lang === 'csharp') return v instanceof Obj && this.classes.get(v.cls)?.def.isStruct ? this.cloneValue(v) : v;
    if (this.lang !== 'c' && this.lang !== 'cpp') return v;
    if (!t || t.ptr || t.ref || t.arr || t.base === 'auto') return v;
    if (v instanceof Obj) return this.classes.has(t.base) ? this.cloneValue(v) : v;
    if (this.lang === 'cpp' && (v instanceof MapV || v.kind !== 'array') && CPP_VALUE_CONTAINERS.has(t.base)) return this.cloneValue(v);
    return v;
  }

  cloneValue(v: Val): Val {
    if (v instanceof Obj) {
      const c = new Obj(v.cls);
      v.fieldTys.forEach((ty, k) => c.fieldTys.set(k, ty));
      v.fields.forEach((x, k) => {
        const ty = v.fieldTys.get(k);
        const deep = !!ty && !ty.ptr && !ty.ref && (
          (x instanceof Obj && this.classes.has(ty.base) && (this.lang !== 'csharp' || !!this.classes.get(x.cls)?.def.isStruct))
          || (this.lang !== 'csharp' && (x instanceof MapV || (x instanceof Arr && (x.kind === 'array' || CPP_VALUE_CONTAINERS.has(ty.base))))));
        c.fields.set(k, deep ? this.cloneValue(x) : x);
      });
      return c;
    }
    if (v instanceof Arr) {
      const et = v.elemTy;
      const a = new Arr(v.items.map((x) => (x instanceof Arr || x instanceof MapV || (x instanceof Obj && et && !et.ptr && this.classes.has(et.base)) ? this.cloneValue(x) : x)), v.kind, et);
      a.minHeap = v.minHeap;
      a.cmpFn = v.cmpFn;
      a.priorityPairs = v.priorityPairs;
      return a;
    }
    if (v instanceof MapV) {
      const m = new MapV(v.isSet, v.sorted);
      m.factory = v.factory;
      v.entries.forEach(([k, x], key) => m.entries.set(key, [k, this.cloneValue(x)]));
      return m;
    }
    return v;
  }

  private evIncDec(e: Extract<Expr, { k: 'incdec' }>): Val {
    const cell = this.lv(e.target);
    const old = cell.get();
    let nv: Val;
    const cfam = this.lang === 'c' || this.lang === 'cpp';
    if ((old instanceof Ptr && old.arr) || (cfam && old instanceof Arr && old.kind === 'array' && !!cell.ty?.ptr)) nv = this.binop(e.op === '++' ? '+' : '-', old, 1);
    // char *s = "text"; s++ moves to the next character
    else if (cfam && typeof old === 'string' && !!cell.ty?.ptr && e.op === '++') nv = old.slice(1);
    else if (old instanceof Iter) nv = new Iter(old.arr, old.idx + (e.op === '++' ? 1 : -1));
    else if (old instanceof Chr) nv = new Chr(old.c + (e.op === '++' ? 1 : -1));
    else if (old instanceof Flt) nv = new Flt(old.v + (e.op === '++' ? 1 : -1));
    else {
      if (old === undefined) throw this.err(`${cell.label()} was used before it was given a value`);
      nv = num(old) + (e.op === '++' ? 1 : -1);
    }
    cell.set(convert(nv, cell.ty));
    const after = cell instanceof ElemCell ? cell.arr.items[cell.idx] : cell.get();
    this.note = `${cell.label()}${e.op} → ${this.fmt(after)}`;
    return e.prefix ? after : old;
  }

  /** Storage location for an assignable expression. */
  lv(e: Expr): Cell {
    switch (e.k) {
      case 'name': {
        const c = this.lookup(e.name);
        if (c) return c;
        if (this.lang === 'python') return this.setName(e.name, null, e.ln);
        throw this.err(`'${e.name}' was not declared`);
      }
      case 'index': {
        const r = this.evIndexFull(e);
        if (r.cont instanceof Arr) {
          const idx = this.normIndex(r.cont, num(r.key));
          if (idx < 0 || idx >= r.cont.items.length) this.outOfBounds(r.cont, idx, r.label);
          return new ElemCell(this, r.cont, idx, r.label);
        }
        if (r.cont instanceof MapV) {
          const m = r.cont;
          const key = r.key;
          return {
            get: () => this.mapGet(m, key, true),
            set: (v: Val) => this.mapSet(m, key, v),
            label: () => r.label,
          };
        }
        if (r.cont instanceof Ptr && r.cont.arr) {
          const idx = (r.cont.idx ?? 0) + num(r.key);
          return new ElemCell(this, r.cont.arr, idx, `${this.arrName(r.cont.arr)}[${idx}]`);
        }
        if (typeof r.cont === 'string' && this.lang === 'cpp') return this.stringCell(e.obj, num(r.key), r.label);
        if (typeof r.cont === 'string') throw this.err('strings cannot be changed in place');
        throw this.err(`can't index into a ${typeName(r.cont)}`);
      }
      case 'member': {
        if (e.obj.k === 'name' && this.prog.classes[e.obj.name] && !this.lookup(e.obj.name)) {
          const st = this.findStatic(e.obj.name, e.name);
          if (st) return st;
        }
        let o = this.ev(e.obj);
        if (o instanceof Ptr && !o.arr) o = o.cell.get();
        if (o instanceof Obj) {
          const lbl = this.memberLabel(e);
          return new FieldCell(o, e.name, lbl);
        }
        if (o instanceof Special && o.kind.startsWith('class:')) {
          const cls = o.kind.slice(6);
          let st = this.findStatic(cls, e.name);
          if (!st) {
            st = new VarCell(e.name, null);
            this.classes.get(cls)?.statics.set(e.name, st);
          }
          return st;
        }
        if (o === null || o === undefined) throw this.err(`null pointer: tried to use ${this.label(e.obj)}.${e.name} but ${this.label(e.obj)} is ${this.fmt(o)}`);
        throw this.err(`can't assign to ${e.name} of a ${typeName(o)}`);
      }
      case 'un':
        if (e.op === 'deref') return this.deref(this.ev(e.e));
        break;
      case 'declvar': {
        this.declare(e.name, undefined, e.ty.base === 'auto' ? undefined : e.ty);
        return this.lookup(e.name)!;
      }
      case 'this':
        break;
      default:
        break;
    }
    throw this.err('this expression cannot be assigned to');
  }

  /** A character of a C++ std::string as an assignable cell (s[i] = 'x'). */
  stringCell(holderExpr: Expr, i: number, label: string): Cell {
    const holder = this.lv(holderExpr);
    return {
      get: () => {
        const s = holder.get() as string;
        return new Chr(s.charCodeAt(i));
      },
      set: (v: Val) => {
        const s = holder.get() as string;
        if (i < 0 || i >= s.length) throw this.err(`index ${i} is out of range for a string of length ${s.length}`);
        const ch = v instanceof Chr ? String.fromCharCode(v.c) : typeof v === 'string' ? v : String.fromCharCode(num(v));
        holder.set(s.slice(0, i) + ch + s.slice(i + 1));
      },
      label: () => label,
    };
  }

  private memberLabel(e: Extract<Expr, { k: 'member' }>): string {
    if (e.obj.k === 'this' && this.lang !== 'python') return e.name;
    return `${this.label(e.obj)}${e.arrow ? '->' : '.'}${e.name}`;
  }

  evIndexFull(e: Extract<Expr, { k: 'index' }>): { cont: Val; key: Val; label: string } {
    let cont: Val;
    let base: string;
    if (e.obj.k === 'index') {
      const r = this.evIndexFull(e.obj);
      cont = this.readIndexed(r.cont, r.key, r.label);
      base = r.label;
    } else {
      cont = this.ev(e.obj);
      base = this.label(e.obj);
    }
    const key = this.ev(e.idx);
    const kt = isNumeric(key) ? String(num(key)) : this.fmt(key);
    return { cont, key, label: `${base}[${kt}]` };
  }

  normIndex(arr: Arr, i: number): number {
    if (this.lang === 'python' && i < 0) return arr.items.length + i;
    return i;
  }

  outOfBounds(arr: Arr, idx: number, label: string): never {
    const name = label.replace(/\[[^\]]*\]$/, '');
    if (this.lang === 'python') throw this.err(`list index out of range (${label}, but ${name} has ${arr.items.length} items)`);
    throw this.err(`index ${idx} is out of bounds: ${name} has ${arr.items.length} elements (valid: 0 to ${arr.items.length - 1})`);
  }

  readIndexed(cont: Val, key: Val, label: string): Val {
    if (cont instanceof Arr) {
      if (key instanceof Arr && key.kind === 'tuple') {
        let cur: Val = cont;
        for (const k of key.items) cur = this.readIndexed(cur, k, label);
        return cur;
      }
      const idx = this.normIndex(cont, Math.trunc(num(key)));
      return this.readElem(cont, idx, label);
    }
    if (typeof cont === 'string') {
      let i = Math.trunc(num(key));
      if (this.lang === 'python' && i < 0) i += cont.length;
      if (i < 0 || i >= cont.length) {
        if (this.lang === 'python') throw this.err('string index out of range');
        if ((this.lang === 'c' || this.lang === 'cpp') && i === cont.length) return new Chr(0);
        throw this.err(`index ${i} is out of bounds for a string of length ${cont.length}`);
      }
      return this.lang === 'python' ? cont[i] : new Chr(cont.charCodeAt(i));
    }
    if (cont instanceof MapV) return this.mapGet(cont, key, this.lang === 'cpp');
    if (cont instanceof Ptr && cont.arr) return this.readElem(cont.arr, (cont.idx ?? 0) + num(key), label);
    if (cont instanceof RangeV) return cont.start + num(key) * cont.step;
    if (cont === null || cont === undefined) throw this.err(`${label.replace(/\[[^\]]*\]$/, '')} is ${this.fmt(cont)} — it has no elements`);
    throw this.err(`can't index into a ${typeName(cont)}`);
  }

  writeIndexed(cont: Val, key: Val, v: Val, label: string) {
    if (cont instanceof Arr) {
      if (cont.kind === 'tuple') throw this.err("'tuple' object does not support item assignment");
      const idx = this.normIndex(cont, Math.trunc(num(key)));
      this.writeElem(cont, idx, v, label);
      return;
    }
    if (cont instanceof MapV) {
      this.mapSet(cont, key, v);
      return;
    }
    if (cont instanceof Ptr && cont.arr) {
      const idx = (cont.idx ?? 0) + num(key);
      this.writeElem(cont.arr, idx, v, `${this.arrName(cont.arr)}[${idx}]`);
      return;
    }
    if (typeof cont === 'string') throw this.err(this.lang === 'python' ? "'str' object does not support item assignment" : 'strings cannot be changed in place here');
    throw this.err(`can't index into a ${typeName(cont)}`);
  }

  readElem(arr: Arr, idx: number, label: string): Val {
    if (!(idx >= 0 && idx < arr.items.length)) this.outOfBounds(arr, idx, label);
    this.counts.reads++;
    this.touches.push({ id: arr.id, idx, role: 'read' });
    return arr.items[idx];
  }

  writeElem(arr: Arr, idx: number, v: Val, label: string) {
    if (!(idx >= 0 && idx < arr.items.length)) this.outOfBounds(arr, idx, label);
    v = convert(v, arr.elemTy);
    const old = arr.items[idx];
    arr.items[idx] = v;
    arr.version++;
    this.counts.writes++;
    this.touches.push({ id: arr.id, idx, role: 'write' });
    const lw = arr.lastWrite;
    const stepNo = this.countsOnly ? this.stepCount : this.steps.length;
    if (
      lw && lw.idx !== idx && stepNo - lw.step <= 1 && !valEq(old, v) &&
      valEq(lw.neu, old) && valEq(v, lw.old) && valEq(arr.items[lw.idx], lw.neu)
    ) {
      this.counts.swaps++;
      this.touches.push({ id: arr.id, idx: lw.idx, role: 'swap' }, { id: arr.id, idx, role: 'swap' });
      const name = label.replace(/\[[^\]]*\]$/, '');
      const [a, b] = lw.idx < idx ? [lw.idx, idx] : [idx, lw.idx];
      this.swapText = `SWAP ${name}[${a}] ↔ ${name}[${b}]`;
      this.swapSay = `Swap: ${this.fmt(arr.items[a])} moves to position ${a} and ${this.fmt(arr.items[b])} moves to position ${b}.`;
      arr.lastWrite = undefined;
    } else arr.lastWrite = { idx, old, neu: v, step: stepNo };
  }

  mapGet(m: MapV, key: Val, autoInsert: boolean): Val {
    const k = keyOf(key);
    const e = m.entries.get(k);
    if (e) return e[1];
    if (m.factory !== undefined) {
      const v = m.factory === null ? null : this.callFnValue(m.factory, []);
      m.entries.set(k, [key, v]);
      m.version++;
      return v;
    }
    if (autoInsert) {
      const v: Val = 0;
      m.entries.set(k, [key, v]);
      m.version++;
      return v;
    }
    if (this.lang === 'python') throw this.err(`KeyError: ${this.fmt(key)}`);
    if (this.lang === 'csharp') throw this.err(`the key ${this.fmt(key)} was not found in the dictionary`);
    return null;
  }

  mapSet(m: MapV, key: Val, v: Val) {
    m.entries.set(keyOf(key), [key, v]);
    m.version++;
  }

  private delTarget(t: Expr) {
    if (t.k === 'index') {
      const r = this.evIndexFull(t);
      if (r.cont instanceof Arr) {
        const idx = this.normIndex(r.cont, num(r.key));
        if (idx < 0 || idx >= r.cont.items.length) this.outOfBounds(r.cont, idx, r.label);
        r.cont.items.splice(idx, 1);
        r.cont.version++;
        return;
      }
      if (r.cont instanceof MapV) {
        if (!r.cont.entries.delete(keyOf(r.key))) throw this.err(`KeyError: ${this.fmt(r.key)}`);
        r.cont.version++;
        return;
      }
    }
    if (t.k === 'name') {
      for (const s of this.frame.scopes) s.delete(t.name);
      return;
    }
    throw this.err('del is only supported for list items, dict keys and names');
  }

  private evSlice(e: Extract<Expr, { k: 'slice' }>): Val {
    const o = this.ev(e.obj);
    const len = typeof o === 'string' ? o.length : o instanceof Arr ? o.items.length : -1;
    if (len < 0) throw this.err(`can't slice a ${typeName(o)}`);
    const step = e.step ? num(this.ev(e.step)) : 1;
    if (step === 0) throw this.err('slice step cannot be zero');
    const clamp = (x: number, def: number) => {
      if (x < 0) x += len;
      return step > 0 ? Math.min(Math.max(x, 0), len) : Math.min(Math.max(x, -1), len - 1);
      void def;
    };
    const lo = e.lo ? clamp(num(this.ev(e.lo)), 0) : step > 0 ? 0 : len - 1;
    const hi = e.hi ? clamp(num(this.ev(e.hi)), len) : step > 0 ? len : -1;
    const idxs: number[] = [];
    for (let i = lo; step > 0 ? i < hi : i > hi; i += step) idxs.push(i);
    if (typeof o === 'string') return idxs.map((i) => o[i]).join('');
    const arr = o as Arr;
    return new Arr(idxs.map((i) => arr.items[i]), arr.kind === 'tuple' ? 'tuple' : 'list');
  }

  private evMember(e: Extract<Expr, { k: 'member' }>): Val {
    if (e.obj.k === 'name' && this.prog.classes[e.obj.name] && !this.lookup(e.obj.name)) {
      const st = this.findStatic(e.obj.name, e.name);
      if (st) return st.get();
    }
    let o = this.ev(e.obj);
    if (o instanceof Ptr && !o.arr) o = o.cell.get();
    if (o instanceof Obj) {
      if (o.fields.has(e.name)) return o.fields.get(e.name);
      const getter = this.findMethod(o.cls, `__get_${e.name}`, 0);
      if (getter) return this.invoke(getter, [], o);
      const m = this.findMethod(o.cls, e.name, -1);
      if (m) {
        const f = new FnV(e.name);
        f.fn = m;
        f.self = o;
        return f;
      }
      const st = this.findStatic(o.cls, e.name);
      if (st) return st.get();
      if (o.cls === 'pair' || o.cls === 'KeyValuePair') throw this.err(`a pair has no member '${e.name}'`);
      if (this.lang === 'python') throw this.err(`'${o.cls}' object has no attribute '${e.name}'`);
      return undefined;
    }
    if (o instanceof Special && o.kind.startsWith('class:')) {
      const st = this.findStatic(o.kind.slice(6), e.name);
      if (st) return st.get();
    }
    if (o === null || o === undefined) {
      throw this.err(`null pointer: ${this.label(e.obj)} is ${this.fmt(o)}, so ${this.label(e.obj)}${this.lang === 'c' || this.lang === 'cpp' ? '->' : '.'}${e.name} doesn't exist`);
    }
    const r = getMember(this, o, e.name);
    if (r === NF) throw this.err(`a ${typeName(o)} has no member '${e.name}'`);
    return r as Val;
  }

  // ===================================================================== calls
  private evCall(e: Extract<Expr, { k: 'call' }>): Val {
    const c = e.callee;
    if (c.k === 'name') {
      const name = c.name;
      if (name === '__closure__') {
        const id = (e.args[0] as { v: string }).v;
        const f = new FnV(id.split('@')[0]);
        f.fn = this.prog.funcs[id][0];
        f.lambda = undefined;
        (f as FnV & { closure?: Map<string, Cell>[] }).closure = [...this.frame.scopes, ...(this.frame.closure ?? [])];
        f.self = this.frame.self;
        return f;
      }
      if (name === '__fieldinit__') {
        // C++ constructor initializer list: adj(v) builds a vector, data(d) just stores d
        const fname = (e.args[0] as { v: string }).v;
        const t = this.frame.self?.fieldTys.get(fname);
        if (t && !t.ptr && !t.arr && (isLibraryType(t.base) || t.base === 'string' || (this.classes.has(t.base) && e.args.length !== 2))) {
          return this.constructType(t, e.args.slice(1));
        }
        if (t && !t.ptr && this.classes.has(t.base) && e.args.length === 2) {
          const v = this.ev(e.args[1]);
          return v instanceof Obj ? v : this.constructType(t, e.args.slice(1));
        }
        return e.args.length > 1 ? this.ev(e.args[1]) : 0;
      }
      if (this.lang === 'python') {
        const cell = this.lookup(name);
        if (cell) return this.callValue(cell.get(), e.args, name);
        if (this.prog.classes[name]) return this.construct(name, e.args);
        const r = callFunction(this, name, e.args);
        if (r !== NF) return r as Val;
        if (isExceptionName(name)) return this.makeException(name, e.args.length ? this.ev(e.args[0]) : '');
        throw this.err(`name '${name}' is not defined`);
      }
      const fr = this.frame;
      if (fr.cls) {
        // virtual dispatch: an inherited method calling name() uses the object's real class first
        const m = (fr.self && this.findMethod(fr.self.cls, name, e.args.length)) || this.findMethod(fr.cls, name, e.args.length);
        if (m) return this.callUser(m, e.args, m.isStatic ? undefined : fr.self);
      }
      const fs = this.prog.funcs[name];
      if (fs) return this.callUser(pickOverload(fs, e.args.length), e.args, undefined);
      if (this.prog.classes[name]) return this.construct(name, e.args);
      const local = this.lookup(name);
      if (local) return this.callValue(local.get(), e.args, name);
      const r = callFunction(this, name, e.args);
      if (r !== NF) return r as Val;
      if (isExceptionName(name)) return this.makeException(name, e.args.length ? this.ev(e.args[0]) : '');
      throw this.err(`function '${name}' is not defined`);
    }
    if (c.k === 'member') {
      if (c.obj.k === 'name' && this.prog.classes[c.obj.name] && !this.lookup(c.obj.name)) {
        const m = this.findMethod(c.obj.name, c.name, e.args.length);
        if (m) return this.callUser(m, e.args, undefined);
      }
      // Java/C# super.m(...) and Python super().m(...)
      const isSuper = (c.obj.k === 'name' && c.obj.name === 'super') || (c.obj.k === 'call' && c.obj.callee.k === 'name' && c.obj.callee.name === 'super');
      if (isSuper && this.frame.self) {
        const base = this.classes.get(this.frame.cls ?? '')?.def.base;
        if (base && !this.classes.has(base) && isExceptionName(base) && c.name === '__init__') {
          const msg = e.args.length ? this.ev(e.args[0]) : '';
          const fresh = this.makeException(base, msg);
          for (const [k, v] of fresh.fields) this.frame.self.fields.set(k, v);
          this.frame.self.version++;
          return undefined;
        }
        if (base) {
          const m = c.name === '__init__' ? pickOverload(this.classes.get(base)!.def.ctors, e.args.length) : this.findMethod(base, c.name, e.args.length);
          if (m) return this.callUser(m, e.args, this.frame.self);
        }
      }
      let o = this.ev(c.obj);
      if (o instanceof Ptr && !o.arr) o = o.cell.get();
      if (o instanceof Obj) {
        const m = this.findMethod(o.cls, c.name, e.args.length);
        if (m) return this.callUser(m, e.args, m.isStatic ? undefined : o);
        if (o.fields.has(c.name)) return this.callValue(o.fields.get(c.name), e.args, c.name);
      }
      if (o instanceof Special && o.kind.startsWith('class:')) {
        const m = this.findMethod(o.kind.slice(6), c.name, e.args.length);
        if (m) return this.callUser(m, e.args, undefined);
      }
      if (o === null || o === undefined) {
        throw this.err(`null pointer: can't call ${c.name}() because ${this.label(c.obj)} is ${this.fmt(o)}`);
      }
      const r = callMethod(this, o, c.name, e.args, c.obj);
      if (r !== NF) return r as Val;
      // obj.GetType().Name (C#) / obj.getClass().getSimpleName() (Java)
      if (o instanceof Obj && (c.name === 'GetType' || c.name === 'getClass') && !e.args.length) {
        const t = new Obj('Type');
        t.fields.set('Name', o.cls);
        t.fields.set('FullName', o.cls);
        return t;
      }
      if (o instanceof Obj && o.cls === 'Type' && ['getSimpleName', 'getName', 'ToString', 'toString'].includes(c.name)) return o.fields.get('Name') ?? null;
      const tn = typeName(o);
      throw this.err(`${/^[aeiou]/i.test(tn) ? 'an' : 'a'} ${tn} has no method '${c.name}'`);
    }
    return this.callValue(this.ev(c), e.args, 'function');
  }

  callValue(fv: Val, args: Expr[], name: string): Val {
    if (fv instanceof FnV && fv.native) return fv.native(args.map((a) => this.ev(a)));
    if (fv instanceof FnV) {
      if (fv.lambda) {
        const vals = args.map((a) => this.ev(a));
        return this.callLambda(fv, vals);
      }
      if (fv.fn) {
        const r = this.callUser(fv.fn, args, fv.self, (fv as FnV & { closure?: Map<string, Cell>[] }).closure);
        return r;
      }
    }
    if (fv instanceof Special && fv.kind.startsWith('class:')) return this.construct(fv.kind.slice(6), args);
    if (fv instanceof Special) {
      const r = callFunction(this, fv.kind, args);
      if (r !== NF) return r as Val;
    }
    throw this.err(`'${name}' is not a function`);
  }

  callLambda(fv: FnV, vals: Val[]): Val {
    const lam = fv.lambda!;
    const fr = new Frame('lambda');
    fr.closure = lam.env;
    lam.params.forEach((p, i) => fr.scopes[0].set(p, new VarCell(p, vals[i])));
    this.frames.push(fr);
    try {
      return this.ev(lam.body);
    } finally {
      this.frames.pop();
    }
  }

  /** Call a user function from Values (used by builtins like sorted(key=...)). */
  callFnValue(fv: Val, vals: Val[]): Val {
    if (fv instanceof FnV && fv.native) return fv.native(vals);
    if (fv instanceof FnV && fv.lambda) return this.callLambda(fv, vals);
    if (fv instanceof FnV && fv.fn) return this.invoke(fv.fn, vals, fv.self, (fv as FnV & { closure?: Map<string, Cell>[] }).closure);
    if (fv instanceof Special) {
      const lits = vals.map((v) => ({ k: '__val', ln: this.ln, v }) as unknown as Expr);
      const r = callFunction(this, fv.kind, lits);
      if (r !== NF) return r as Val;
    }
    throw this.err('expected a function');
  }

  callUser(fn: Func, argExprs: Expr[], self: Obj | undefined, closure?: Map<string, Cell>[]): Val {
    const positional: Expr[] = [];
    for (const a of argExprs) {
      if (a.k === 'kw') continue;
      if (a.k === 'spread') for (const v of this.iterToArray(this.ev(a.e))) positional.push({ k: '__val', ln: a.ln, v } as unknown as Expr);
      else positional.push(a);
    }
    const kws = new Map<string, Expr>();
    argExprs.forEach((a) => a.k === 'kw' && kws.set(a.name, a.value));
    if (positional.length > fn.params.length) {
      throw this.err(`${fn.name}() takes ${fn.params.length} argument(s) but ${positional.length} were given`);
    }
    const args: (Val | RefArg)[] = [];
    fn.params.forEach((p, i) => {
      const ae = positional[i] ?? kws.get(p.name);
      if (!ae) {
        if (p.def) {
          args.push(this.ev(p.def));
          return;
        }
        throw this.err(`${fn.name}() is missing the argument '${p.name}'`);
      }
      // a reference parameter binds to a variable; a temporary (literal, list, call) is passed by value
      const lvalue = ae.k === 'name' || ae.k === 'index' || ae.k === 'member' || (ae.k === 'un' && ae.op === 'deref');
      if (p.byRef && lvalue) args.push(new RefArg(this.lv(ae)));
      else args.push(this.ev(ae));
    });
    return this.invoke(fn, args, self, closure);
  }

  private memoTables = new Map<Func, Map<string, Val>>();

  invoke(fn: Func, args: (Val | RefArg)[], self: Obj | undefined, closure?: Map<string, Cell>[], isCtor = false, skipMemo = false): Val {
    if (fn.memo && !skipMemo) {
      const table = this.memoTables.get(fn) ?? new Map<string, Val>();
      this.memoTables.set(fn, table);
      const key = args.map((a) => keyOf(a instanceof RefArg ? a.cell.get() : a)).join('|');
      if (table.has(key)) {
        const v = table.get(key);
        this.note = `${fn.name}(…) returned ${this.fmt(v)} (remembered by @lru_cache)`;
        return v;
      }
      const v = this.invoke(fn, args, self, closure, isCtor, true);
      table.set(key, v);
      return v;
    }
    if (this.frames.length > this.maxDepth) {
      throw this.err(`too many nested calls (over ${this.maxDepth}) — stack overflow. Check the base case of ${fn.name}()`);
    }
    const fr = new Frame(fn.cls && !fn.isStatic && this.lang !== 'python' && fn.name !== fn.cls ? `${fn.cls}.${fn.name}` : fn.name, fn);
    fr.self = self;
    fr.cls = fn.cls;
    fr.closure = closure;
    fr.ln = fn.ln;
    if (fn.globals?.length) fr.globalNames = new Set(fn.globals);
    if (fn.nonlocals?.length) fr.nonlocalNames = new Set(fn.nonlocals);
    const argTexts: string[] = [];
    if (this.lang === 'python' && fn.cls && !fn.isStatic && self) fr.scopes[0].set('self', new VarCell('self', self));
    fn.params.forEach((p, i) => {
      const a = args[i];
      if (a instanceof RefArg) {
        fr.scopes[0].set(p.name, a.cell);
        argTexts.push(this.fmt(a.cell instanceof ElemCell ? a.cell.arr.items[a.cell.idx] : a.cell.get()));
      } else {
        const v = this.copyValue(convert(a as Val, p.ty), p.ty);
        fr.scopes[0].set(p.name, new VarCell(p.name, v, p.ty.base === 'auto' ? undefined : p.ty));
        argTexts.push(v instanceof Arr ? this.findArrName(v) ?? this.fmt(v) : this.fmt(v));
      }
    });
    this.frames.push(fr);
    this.counts.calls++;
    const saveLn = this.ln;
    this.ln = fn.ln;
    const shown = fn.name === '__init__' ? `${fn.cls}` : fn.name;
    this.step(fn.ln, 'call', `${isCtor ? 'NEW' : 'CALL'} ${shown}(${argTexts.join(', ')})`);
    let rv: Val;
    try {
      const r = this.execList(fn.body);
      rv = r && r.t === 'return' ? r.v : this.lang === 'python' ? null : undefined;
      if (fn === this.entryFn && this.frames[this.frames.length - 1] === fr) {
        // the last step still shows main's variables and data
        const code = (this.lang === 'c' || this.lang === 'cpp') && typeof rv === 'number' ? ` (returned ${rv})` : '';
        this.ln = fn.endLn;
        fr.ln = fn.endLn;
        this.step(fn.endLn, 'end', `Program finished${code}`);
      }
    } catch (e) {
      // remember where the error happened, so the error step can still show that function's variables
      if (!this.errFrames && (e instanceof RuntimeErr || e instanceof Thrown)) this.errFrames = [...this.frames];
      throw e;
    } finally {
      this.frames.pop();
    }
    this.ln = saveLn;
    rv = convert(rv, fn.retTy);
    this.note = rv === undefined || isCtor ? `${shown}(…) finished` : `${shown}(…) returned ${this.fmt(rv)}`;
    return rv;
  }

  // ===================================================================== objects & arrays
  construct(clsName: string, argExprs: Expr[]): Val {
    const rt = this.classes.get(clsName);
    if (!rt) throw this.err(`unknown class ${clsName}`);
    const obj = new Obj(clsName);
    this.initFields(obj, clsName);
    const ctor = rt.def.ctors.length ? pickOverload(rt.def.ctors, argExprs.length) : undefined;
    if (ctor) {
      this.callUserCtor(ctor, argExprs, obj);
    } else if (argExprs.length && this.isExceptionClass(clsName)) {
      const msg = this.ev(argExprs[0]);
      for (const [k, v] of this.makeException(clsName, msg).fields) obj.fields.set(k, v);
    } else if (argExprs.length) {
      // aggregate initialisation: Node{1, nullptr} / (struct Node){...}
      const fields = this.allFields(clsName).filter((f) => !f.isStatic);
      argExprs.forEach((a, i) => {
        if (fields[i]) obj.fields.set(fields[i].name, convert(this.ev(a), fields[i].ty));
      });
    } else if (this.lang === 'python' && rt.def.ctors.length === 0 && argExprs.length) {
      throw this.err(`${clsName}() takes no arguments`);
    }
    return obj;
  }

  private isExceptionClass(cls: string): boolean {
    let c: string | undefined = cls;
    while (c && this.classes.has(c)) c = this.classes.get(c)!.def.base;
    return !!c && isExceptionName(c);
  }

  private callUserCtor(fn: Func, argExprs: Expr[], obj: Obj) {
    const positional = argExprs.filter((a) => a.k !== 'kw');
    const kws = new Map<string, Expr>();
    argExprs.forEach((a) => a.k === 'kw' && kws.set(a.name, a.value));
    const args: Val[] = fn.params.map((p, i) => {
      const ae = positional[i] ?? kws.get(p.name);
      if (ae) return this.ev(ae);
      if (p.def) return this.ev(p.def);
      throw this.err(`${obj.cls}() is missing the argument '${p.name}'`);
    });
    this.invoke(fn, args, obj, undefined, true);
  }

  private allFields(cls: string) {
    const out: ClassDef['fields'] = [];
    let c: string | undefined = cls;
    const chain: ClassDef[] = [];
    while (c) {
      const rt = this.classes.get(c);
      if (!rt) break;
      chain.unshift(rt.def);
      c = rt.def.base;
    }
    chain.forEach((d) => out.push(...d.fields));
    return out;
  }

  private initFields(obj: Obj, cls: string) {
    const fr = new Frame(cls);
    fr.self = obj;
    fr.cls = cls;
    this.frames.push(fr);
    this.silent++;
    try {
      for (const fd of this.allFields(cls)) {
        if (fd.isStatic) continue;
        obj.fieldTys.set(fd.name, fd.ty);
        const v = fd.init ? this.evInit(fd.init, fd.ty) : this.defaultFor(fd.ty, true);
        obj.fields.set(fd.name, convert(v, fd.ty));
      }
    } finally {
      this.silent--;
      this.frames.pop();
    }
  }

  /** Default value of a declared field / array element. */
  defaultFor(t: Ty, isField: boolean): Val {
    if (t.ptr || t.arr) return null;
    switch (t.base) {
      case 'int': return 0;
      case 'double': return new Flt(0);
      case 'bool': return false;
      case 'char': return new Chr(0);
      case 'string': return this.lang === 'cpp' ? '' : null;
      default:
        if ((this.lang === 'cpp' || this.lang === 'c') && this.classes.has(t.base) && isField) return this.construct(t.base, []);
        if (this.lang === 'cpp' && isLibraryType(t.base) && !this.classes.has(t.base)) return libraryNew(this, t, []);
        return null;
    }
  }

  /** Value of an uninitialised local variable declaration. */
  declDefault(t: Ty): Val {
    if (t.ptr) return null;
    if (this.lang === 'cpp' || this.lang === 'c') {
      if (t.base === 'string') return '';
      if (this.classes.has(t.base) && !t.arr) return this.construct(t.base, []);
      if (isLibraryType(t.base)) return libraryNew(this, t, []);
      if (t.base === 'double') return new Flt(0);
      if (t.base === 'char') return new Chr(0);
      if (t.base === 'bool') return false;
      return 0;
    }
    return undefined;
  }

  /** Evaluate an initializer against a declared type (handles {..} lists). */
  evInit(e: Expr, t: Ty): Val {
    if (e.k === 'list' && e.kind === 'init') return this.initListFor(t, e);
    return this.ev(e);
  }

  private initListFor(t: Ty, e: Extract<Expr, { k: 'list' }>): Val {
    if (t.base === 'pair' && !t.arr) {
      const p = new Obj('pair');
      p.fields.set('first', this.ev(e.items[0]));
      p.fields.set('second', this.ev(e.items[1]));
      return p;
    }
    if (isLibraryType(t.base) && !t.arr && !this.classes.has(t.base)) {
      const lib = libraryNew(this, t, []);
      const inner = t.args?.[0] ?? { base: 'auto', arr: 0, ptr: 0 };
      if (lib instanceof Arr) {
        lib.items = e.items.map((x) => convert(x.k === 'list' && x.kind === 'init' ? this.initListFor(inner, x) : this.ev(x), inner));
        return lib;
      }
      if (lib instanceof MapV) {
        for (const x of e.items) {
          if (x.k === 'list') {
            const k = this.ev(x.items[0]);
            lib.entries.set(keyOf(k), [k, lib.isSet ? true : this.ev(x.items[1])]);
          } else {
            const k = this.ev(x);
            lib.entries.set(keyOf(k), [k, true]);
          }
        }
        return lib;
      }
    }
    if (this.classes.has(t.base) && !t.arr && !t.ptr) {
      const obj = new Obj(t.base);
      this.initFields(obj, t.base);
      const fields = this.allFields(t.base).filter((f) => !f.isStatic);
      e.items.forEach((x, i) => fields[i] && obj.fields.set(fields[i].name, convert(this.ev(x), fields[i].ty)));
      return obj;
    }
    const elem: Ty = { ...t, arr: Math.max(0, t.arr - 1) };
    const items = e.items.map((x) => (x.k === 'list' && x.kind === 'init' ? this.initListFor(elem, x) : convert(this.ev(x), elem)));
    return new Arr(items, 'array', elem);
  }

  /** C/C++ array declarations: int a[5]; int a[] = {..}; int g[3][4] = {{..}}; char s[] = "hi". */
  private makeCArray(base: Ty, dims: (Expr | null)[], init?: Expr): Val {
    const sizes = dims.map((d) => (d ? Math.trunc(num(this.ev(d))) : null));
    const build = (level: number, ie: Expr | undefined): Arr => {
      const elemTy: Ty = { ...base, arr: sizes.length - level - 1 };
      if (ie && ie.k === 'str' && level === sizes.length - 1) {
        const chars = [...ie.v].map((ch) => new Chr(ch.charCodeAt(0)) as Val);
        chars.push(new Chr(0));
        const n = sizes[level] ?? chars.length;
        while (chars.length < n) chars.push(new Chr(0));
        return new Arr(chars.slice(0, n), 'array', elemTy);
      }
      const list = ie && ie.k === 'list' ? ie.items : undefined;
      const n = sizes[level] ?? (list ? list.length : 0);
      if (n < 0 || n > 100000) throw this.err(`array size ${n} is too large`);
      const items: Val[] = [];
      for (let i = 0; i < n; i++) {
        const sub = list?.[i];
        if (level < sizes.length - 1) items.push(build(level + 1, sub));
        else if (sub && sub.k === 'list' && sub.kind === 'init') items.push(this.initListFor(base, sub));
        else items.push(sub ? convert(this.ev(sub), base) : this.cDefault(base));
      }
      return new Arr(items, 'array', elemTy);
    };
    return build(0, init);
  }

  private cDefault(t: Ty): Val {
    if (t.ptr) return null;
    if (this.classes.has(t.base)) return this.construct(t.base, []);
    if (t.base === 'string') return '';
    return this.defaultFor(t, false) ?? 0;
  }

  private evNewArr(e: Extract<Expr, { k: 'newarr' }>): Val {
    if (e.init && e.init.k === 'list') {
      const items = e.init.items.map((x) => {
        const v = x.k === 'list' && x.kind === 'init' ? this.evNewArr({ k: 'newarr', ln: x.ln, ty: e.ty, dims: [null], init: x }) : this.ev(x);
        return v instanceof Arr ? v : convert(v, e.ty);
      });
      const nested = items.some((x) => x instanceof Arr);
      return new Arr(items, 'array', nested ? { ...e.ty, arr: 1 } : e.ty);
    }
    const sizes = e.dims.map((d) => (d ? Math.trunc(num(this.ev(d))) : null));
    const build = (level: number): Val => {
      const n = sizes[level];
      if (n === null || n === undefined) return null;
      if (n < 0) throw this.err(`negative array size ${n}`);
      if (n > 100000) throw this.err(`array size ${n} is too large`);
      const items: Val[] = [];
      for (let i = 0; i < n; i++) items.push(level < sizes.length - 1 ? build(level + 1) : this.defaultFor(e.ty, false));
      return new Arr(items, 'array', { ...e.ty, arr: sizes.length - level - 1 });
    };
    return build(0);
  }

  /** new T(args) / T var(args) / T(args) for user classes and library types. */
  constructType(t: Ty, args: Expr[]): Val {
    if (this.classes.has(t.base) && !t.ptr) return this.construct(t.base, args);
    if (this.classes.has(t.base)) return this.construct(t.base, args);
    if (isLibraryType(t.base) || t.base === 'string' || t.base === 'pair') return libraryNew(this, t, args.map((a) => this.ev(a)), args);
    if (['int', 'double', 'char', 'bool'].includes(t.base)) return convert(args.length ? this.ev(args[0]) : 0, t);
    if (isExceptionName(t.base)) return this.makeException(t.base, args.length ? this.ev(args[0]) : '');
    throw this.err(`unknown type '${t.base}'`);
  }

  castTo(t: Ty, v: Val): Val {
    if (t.ptr || t.arr) return v;
    switch (t.base) {
      case 'int':
        if (typeof v === 'string' && this.lang === 'python') return parseInt(v, 10);
        return convert(isNumeric(v) ? (v instanceof Flt ? v : num(v)) : v, t);
      case 'double':
      case 'char':
      case 'bool':
        return convert(v, t);
      default:
        return v;
    }
  }

  private evSizeof(e: Extract<Expr, { k: 'sizeof' }>): Val {
    const sizeOfTy = (t: Ty): number => {
      if (t.ptr) return 8;
      switch (t.base) {
        case 'char': case 'bool': return 1;
        case 'double': return 8;
        case 'int': return 4;
        default: {
          const rt = this.classes.get(t.base);
          if (rt) return rt.def.fields.filter((f) => !f.isStatic).reduce((s, f) => s + sizeOfTy(f.ty), 0) || 1;
          return 8;
        }
      }
    };
    if (e.ty) return sizeOfTy(e.ty);
    const x = e.e!;
    if (x.k === 'index') {
      const r = this.evIndexFull(x);
      if (r.cont instanceof Arr) return r.cont.elemTy ? (r.cont.elemTy.arr ? 4 : sizeOfTy(r.cont.elemTy)) : 4;
      return 4;
    }
    if (x.k === 'name' && !this.lookup(x.name) && this.classes.has(x.name)) return sizeOfTy({ base: x.name, arr: 0, ptr: 0 });
    const v = this.ev(x);
    if (v instanceof Arr) {
      const elem = v.elemTy ? sizeOfTy({ ...v.elemTy, arr: 0 }) : 4;
      const total = (a: Arr): number => a.items.reduce<number>((s, it) => s + (it instanceof Arr ? total(it) : elem), 0);
      return total(v);
    }
    if (v instanceof Flt) return 8;
    if (v instanceof Chr) return 1;
    if (v instanceof Obj) return sizeOfTy({ base: v.cls, arr: 0, ptr: 0 });
    return 4;
  }

  private evListComp(e: Extract<Expr, { k: 'listcomp' }>): Val {
    const out: Val[] = [];
    const fr = this.frame;
    const scope = new Map<string, Cell>();
    fr.scopes.push(scope);
    const save = this.lang;
    try {
      const run = (ci: number) => {
        if (ci === e.clauses.length) {
          out.push(this.ev(e.body));
          return;
        }
        const c = e.clauses[ci];
        if (c.kind === 'if') {
          if (truthy(this.ev(c.c))) run(ci + 1);
          return;
        }
        const items = this.iterToArray(this.ev(c.iter));
        for (const it of items) {
          this.bindCompTarget(c.target, it, scope);
          run(ci + 1);
        }
      };
      run(0);
    } finally {
      fr.scopes.pop();
    }
    void save;
    return new Arr(out, 'list');
  }

  private bindCompTarget(t: Expr, v: Val, scope: Map<string, Cell>) {
    if (t.k === 'name') scope.set(t.name, new VarCell(t.name, v));
    else if (t.k === 'list') {
      const items = this.iterToArray(v);
      t.items.forEach((x, i) => this.bindCompTarget(x, items[i], scope));
    }
  }

  iterToArray(v: Val): Val[] {
    if (v instanceof Arr) return [...v.items];
    if (v instanceof RangeV) {
      const out: number[] = [];
      if (v.length > 1000000) throw this.err('range is too large');
      for (let i = 0; i < v.length; i++) out.push(v.start + i * v.step);
      return out;
    }
    if (typeof v === 'string') return [...v];
    if (v instanceof MapV) {
      const es = [...v.entries.values()];
      if (v.sorted) es.sort((a, b) => cmpVals(a[0], b[0]));
      return es.map(([k]) => k);
    }
    throw this.err(`'${typeName(v)}' is not iterable`);
  }

  readToken(): string | null {
    const m = /\S+/.exec(this.stdin.slice(this.stdinPos));
    if (!m) return null;
    this.stdinPos += m.index + m[0].length;
    return m[0];
  }

  readLine(): string | null {
    if (this.stdinPos >= this.stdin.length) return null;
    const rest = this.stdin.slice(this.stdinPos);
    const nl = rest.indexOf('\n');
    const line = nl < 0 ? rest : rest.slice(0, nl);
    this.stdinPos += nl < 0 ? rest.length : nl + 1;
    return line.replace(/\r$/, '');
  }
}

export function pickOverload(fs: Func[], nargs: number): Func {
  if (nargs < 0 || fs.length === 1) return fs[0];
  return fs.find((f) => f.params.length === nargs) ?? fs.find((f) => f.params.filter((p) => !p.def).length <= nargs && nargs <= f.params.length) ?? fs[0];
}

export function cmpVals(a: Val, b: Val): number {
  if (isNumeric(a) && isNumeric(b)) return num(a) - num(b);
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  if (a instanceof Arr && b instanceof Arr) {
    for (let i = 0; i < Math.min(a.items.length, b.items.length); i++) {
      const c = cmpVals(a.items[i], b.items[i]);
      if (c) return c;
    }
    return a.items.length - b.items.length;
  }
  if (a instanceof Obj && b instanceof Obj && a.cls === 'pair' && b.cls === 'pair') {
    return cmpVals(a.fields.get('first'), b.fields.get('first')) || cmpVals(a.fields.get('second'), b.fields.get('second'));
  }
  if (a instanceof Chr && typeof b === 'string') return a.c - b.charCodeAt(0);
  return 0;
}

function repeat(v: Arr | string, n: number): Val {
  if (typeof v === 'string') return v.repeat(Math.max(0, n));
  const items: Val[] = [];
  for (let i = 0; i < n; i++) items.push(...v.items);
  return new Arr(items, v.kind === 'tuple' ? 'tuple' : 'list');
}

function contains(container: Val, x: Val): boolean {
  if (container instanceof Arr) return container.items.some((y) => valEq(x, y));
  if (typeof container === 'string') return typeof x === 'string' && container.includes(x);
  if (container instanceof MapV) return container.entries.has(keyOf(x));
  if (container instanceof RangeV) {
    const n = num(x);
    return container.step > 0 ? n >= container.start && n < container.stop && (n - container.start) % container.step === 0
      : n <= container.start && n > container.stop && (container.start - n) % -container.step === 0;
  }
  return false;
}

import { printf, toText as textOfFmt } from './format';

function pyPercent(fmt: string, args: Val[]): string {
  return printf(fmt, args, 'python');
}

function textOf(v: Val, lang: Lang, st: StreamState): string {
  return textOfFmt(v, lang, st);
}
