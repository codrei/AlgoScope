// How values are printed in each language (output panel and narration).
import type { Lang } from './ir';
import { Arr, Chr, Flt, FnV, Iter, MapV, Obj, Ptr, RangeV, Special, type Val, num } from './values';

function pyFloat(x: number): string {
  if (Number.isNaN(x)) return 'nan';
  if (!Number.isFinite(x)) return x > 0 ? 'inf' : '-inf';
  if (Number.isInteger(x) && Math.abs(x) < 1e16) return x.toFixed(1);
  let s = String(x);
  if (s.includes('e')) {
    s = s.replace(/e([+-])(\d)$/, 'e$10$2');
  }
  return s;
}

function javaDouble(x: number): string {
  if (Number.isNaN(x)) return 'NaN';
  if (!Number.isFinite(x)) return x > 0 ? 'Infinity' : '-Infinity';
  const ax = Math.abs(x);
  if (ax !== 0 && (ax >= 1e7 || ax < 1e-3)) {
    const [m, e] = x.toExponential().split('e');
    return (m.includes('.') ? m : m + '.0') + 'E' + e.replace('+', '');
  }
  if (Number.isInteger(x)) return x.toFixed(1);
  return String(x);
}

/** %g-style with 6 significant digits, like C++ cout's default. */
function cppDouble(x: number, precision = 6): string {
  if (Number.isNaN(x)) return 'nan';
  if (!Number.isFinite(x)) return x > 0 ? 'inf' : '-inf';
  if (x === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(x)));
  if (exp < -5 || exp >= precision) {
    let [m, e] = x.toExponential(precision - 1).split('e');
    if (m.includes('.')) m = m.replace(/0+$/, '').replace(/\.$/, '');
    const en = parseInt(e, 10);
    return `${m}e${en < 0 ? '-' : '+'}${String(Math.abs(en)).padStart(2, '0')}`;
  }
  let s = x.toFixed(Math.max(0, precision - 1 - exp));
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

function csDouble(x: number): string {
  if (Number.isNaN(x)) return 'NaN';
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '-∞';
  const s = String(x);
  return s.replace(/e\+?/, 'E+').replace('E+-', 'E-');
}

/** Lets the interpreter print objects with their own toString() / ToString() / __str__. */
let objTextHook: ((o: Obj, repr: boolean) => string | undefined) | null = null;
export function setObjTextHook(h: typeof objTextHook) {
  objTextHook = h;
}

export interface StreamState {
  fixed: boolean;
  precision: number;
  width: number;
  boolalpha: boolean;
}

/** Text a value produces when printed (print/println/cout/Console.Write). */
export function toText(v: Val, lang: Lang, st?: StreamState): string {
  if (v === undefined || v === null) {
    if (lang === 'python') return 'None';
    if (lang === 'java') return 'null';
    if (lang === 'csharp') return '';
    return '0';
  }
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') {
    if (lang === 'python' || lang === 'csharp') return v ? 'True' : 'False';
    if (lang === 'java') return String(v);
    return st?.boolalpha ? String(v) : v ? '1' : '0';
  }
  if (v instanceof Flt) {
    if (lang === 'python') return pyFloat(v.v);
    if (lang === 'java') return javaDouble(v.v);
    if (lang === 'csharp') return csDouble(v.v);
    if (st?.fixed) return v.v.toFixed(st.precision);
    return cppDouble(v.v, st?.precision ?? 6);
  }
  if (v instanceof Chr) return String.fromCharCode(v.c);
  if (lang === 'python') return pyStr(v);
  if (v instanceof Arr) {
    if (lang === 'java') {
      if (v.kind === 'array') return `[${v.elemTy?.base === 'int' ? 'I' : 'L'}@${(0x1b6d3586 + v.id * 97).toString(16)}`;
      return '[' + v.items.map((x) => toText(x, lang)).join(', ') + ']';
    }
    if (lang === 'csharp') {
      if (v.kind === 'array') return 'System.Int32[]';
      return `System.Collections.Generic.List\`1[System.Int32]`;
    }
    return '0x' + (0x7ffe1000 + v.id * 16).toString(16);
  }
  if (v instanceof Obj) {
    const custom = objTextHook?.(v, false);
    if (custom !== undefined) return custom;
    if (v.cls === 'pair') return `(${toText(v.fields.get('first'), lang)}, ${toText(v.fields.get('second'), lang)})`;
    if (lang === 'java') return `${v.cls}@${(0x4e25154f + v.id * 131).toString(16)}`;
    if (lang === 'csharp') return v.cls;
    return '0x' + (0x5581a000 + v.id * 32).toString(16);
  }
  if (v instanceof MapV) {
    const items = [...v.entries.values()];
    if (v.isSet) return '[' + items.map(([k]) => toText(k, lang)).join(', ') + ']';
    return '{' + items.map(([k, x]) => `${toText(k, lang)}=${toText(x, lang)}`).join(', ') + '}';
  }
  if (v instanceof Ptr) return '0x' + (0x7ffe2000 + (v.arr ? v.arr.id * 16 + (v.idx ?? 0) * 4 : 64)).toString(16);
  if (v instanceof RangeV) return `range(${v.start}, ${v.stop})`;
  if (v instanceof FnV) return `<function ${v.name}>`;
  if (v instanceof Special) return v.kind;
  if (v instanceof Iter) return 'iterator';
  return String(v);
}

/** Python repr(). */
export function pyRepr(v: Val): string {
  if (v instanceof Obj) return objTextHook?.(v, true) ?? `<__main__.${v.cls} object>`;
  if (typeof v === 'string') {
    const q = v.includes("'") && !v.includes('"') ? '"' : "'";
    return q + v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(new RegExp(q, 'g'), '\\' + q) + q;
  }
  return pyStr(v);
}

export function pyStr(v: Val): string {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  if (v instanceof Flt) return pyFloat(v.v);
  if (v instanceof Chr) return String.fromCharCode(v.c);
  if (v instanceof Arr) {
    const inner = v.items.map(pyRepr).join(', ');
    if (v.kind === 'tuple') return v.items.length === 1 ? `(${inner},)` : `(${inner})`;
    if (v.kind === 'deque') return `deque([${inner}])`;
    return `[${inner}]`;
  }
  if (v instanceof MapV) {
    const items = [...v.entries.values()];
    if (v.isSet) return items.length ? '{' + items.map(([k]) => pyRepr(k)).join(', ') + '}' : 'set()';
    return '{' + items.map(([k, x]) => `${pyRepr(k)}: ${pyRepr(x)}`).join(', ') + '}';
  }
  if (v instanceof Obj) return objTextHook?.(v, false) ?? `<__main__.${v.cls} object>`;
  if (v instanceof RangeV) return v.step === 1 ? `range(${v.start}, ${v.stop})` : `range(${v.start}, ${v.stop}, ${v.step})`;
  if (v instanceof FnV) return `<function ${v.name}>`;
  return String(v);
}

function pad(s: string, width: number, left: boolean, zero = false): string {
  if (s.length >= width) return s;
  if (zero && !left) {
    const neg = s.startsWith('-');
    const body = neg ? s.slice(1) : s;
    return (neg ? '-' : '') + body.padStart(width - (neg ? 1 : 0), '0');
  }
  return left ? s.padEnd(width) : s.padStart(width);
}

/** printf / String.format / Python % formatting. */
export function printf(fmt: string, args: Val[], lang: Lang): string {
  let ai = 0;
  const next = () => args[ai++];
  return fmt.replace(/%([-+ 0#,]*)(\d+|\*)?(?:\.(\d+|\*))?(hh|h|ll|l|L|z|j|t)?([diuoxXfFeEgGcspbBn%])/g, (m, flags: string, w: string, p: string, _len, conv: string) => {
    if (conv === '%') return '%';
    if (conv === 'n') return lang === 'java' ? '\n' : '';
    const width = w === '*' ? num(next()) : w ? parseInt(w, 10) : 0;
    const prec = p === '*' ? num(next()) : p !== undefined ? parseInt(p, 10) : undefined;
    const left = flags.includes('-');
    const zero = flags.includes('0');
    const plus = flags.includes('+');
    const comma = flags.includes(',');
    const a = next();
    let s: string;
    switch (conv) {
      case 'd': case 'i': case 'u': {
        let n = a instanceof Flt && lang === 'python' ? Math.trunc(a.v) : Math.trunc(num(a));
        if (conv === 'u' && n < 0) n = n >>> 0;
        s = comma ? n.toLocaleString('en-US') : String(n);
        if (plus && n >= 0) s = '+' + s;
        break;
      }
      case 'f': case 'F': {
        const n = num(a);
        s = Number.isFinite(n) ? n.toFixed(prec ?? 6) : n > 0 ? 'inf' : '-inf';
        if (comma) {
          const [ip, fp] = s.split('.');
          s = Number(ip).toLocaleString('en-US') + (fp ? '.' + fp : '');
        }
        if (plus && n >= 0) s = '+' + s;
        break;
      }
      case 'e': case 'E': {
        const [mant, ex] = num(a).toExponential(prec ?? 6).split('e');
        const en = parseInt(ex, 10);
        s = `${mant}e${en < 0 ? '-' : '+'}${String(Math.abs(en)).padStart(2, '0')}`;
        if (conv === 'E') s = s.toUpperCase();
        break;
      }
      case 'g': case 'G':
        s = cppDouble(num(a), prec ?? 6);
        break;
      case 'x': s = Math.trunc(num(a)).toString(16); break;
      case 'X': s = Math.trunc(num(a)).toString(16).toUpperCase(); break;
      case 'o': s = Math.trunc(num(a)).toString(8); break;
      case 'c': s = typeof a === 'string' ? a[0] ?? '' : String.fromCharCode(num(a)); break;
      case 's':
        s = lang === 'python' ? pyStr(a) : toText(a, lang);
        if (prec !== undefined) s = s.slice(0, prec);
        break;
      case 'b': case 'B': s = lang === 'java' ? String(a !== null && a !== undefined && a !== false) : Math.trunc(num(a)).toString(2); break;
      case 'p': s = toText(a, 'c'); break;
      default: return m;
    }
    return pad(s, width, left, zero && conv !== 's' && conv !== 'c');
  });
}

/** Python format-spec mini-language ({x:>5}, {x:.2f}, {x:,}). */
export function pyFormatSpec(v: Val, spec: string | undefined): string {
  if (!spec) return pyStr(v);
  if (spec === '!r') return pyRepr(v);
  if (spec === '!s') return pyStr(v);
  const m = /^(?:(.)?([<>^=]))?([+\- ])?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/.exec(spec);
  if (!m) return pyStr(v);
  const [, fill0, align0, sign, , zero, width, group, prec, type] = m;
  let s: string;
  const n = typeof v === 'number' || v instanceof Flt || typeof v === 'boolean' ? num(v) : NaN;
  switch (type) {
    case 'f': case 'F': s = n.toFixed(prec ? +prec : 6); break;
    case 'e': case 'E': s = printf(`%.${prec ?? 6}${type}`, [n], 'python'); break;
    case '%': s = (n * 100).toFixed(prec ? +prec : 6) + '%'; break;
    case 'd': case 'n': s = String(Math.trunc(n)); break;
    case 'x': s = Math.trunc(n).toString(16); break;
    case 'X': s = Math.trunc(n).toString(16).toUpperCase(); break;
    case 'b': s = Math.trunc(n).toString(2); break;
    case 'o': s = Math.trunc(n).toString(8); break;
    case 'c': s = String.fromCharCode(n); break;
    case 'g': case 'G': s = cppDouble(n, prec ? +prec : 6); break;
    default:
      if (prec && (typeof v === 'number' || v instanceof Flt)) s = cppDouble(n, +prec);
      else if (prec && typeof v === 'string') s = v.slice(0, +prec);
      else s = pyStr(v);
  }
  if (group && type !== 's') {
    const [ip, fp] = s.split('.');
    const neg = ip.startsWith('-');
    const digits = (neg ? ip.slice(1) : ip).replace(/\B(?=(\d{3})+(?!\d))/g, group);
    s = (neg ? '-' : '') + digits + (fp !== undefined ? '.' + fp : '');
  }
  if (sign === '+' && !Number.isNaN(n) && n >= 0) s = '+' + s;
  const w = width ? +width : 0;
  if (s.length >= w) return s;
  const fill = fill0 ?? (zero ? '0' : ' ');
  const isNum = typeof v === 'number' || v instanceof Flt;
  const align = align0 ?? (zero ? '=' : isNum ? '>' : '<');
  const gap = w - s.length;
  switch (align) {
    case '<': return s + fill.repeat(gap);
    case '>': return fill.repeat(gap) + s;
    case '^': return fill.repeat(Math.floor(gap / 2)) + s + fill.repeat(Math.ceil(gap / 2));
    case '=': {
      const neg = s.startsWith('-') || s.startsWith('+');
      return neg ? s[0] + fill.repeat(gap) + s.slice(1) : fill.repeat(gap) + s;
    }
  }
  return s;
}

/** C# composite / interpolation format items ({0,5:F2}). */
export function csFormatItem(v: Val, spec: string | undefined): string {
  let align = 0;
  let fmt = '';
  if (spec) {
    const m = /^(?:,(-?\d+))?(?::?(.*))?$/.exec(spec);
    if (m) {
      align = m[1] ? parseInt(m[1], 10) : 0;
      fmt = m[2] ?? '';
    }
  }
  let s: string;
  const fm = /^([FfNnDdEeXxCcPp])(\d*)$/.exec(fmt);
  if (fm && (typeof v === 'number' || v instanceof Flt)) {
    const n = num(v);
    const p = fm[2] ? parseInt(fm[2], 10) : undefined;
    switch (fm[1].toUpperCase()) {
      case 'F': s = n.toFixed(p ?? 2); break;
      case 'N': s = n.toLocaleString('en-US', { minimumFractionDigits: p ?? 2, maximumFractionDigits: p ?? 2 }); break;
      case 'D': s = String(Math.trunc(n)).padStart(p ?? 0, '0'); break;
      case 'E': s = n.toExponential(p ?? 6).toUpperCase(); break;
      case 'X': s = Math.trunc(n).toString(16).toUpperCase().padStart(p ?? 0, '0'); if (fm[1] === 'x') s = s.toLowerCase(); break;
      case 'P': s = (n * 100).toFixed(p ?? 2) + ' %'; break;
      case 'C': s = '$' + n.toFixed(p ?? 2); break;
      default: s = toText(v, 'csharp');
    }
  } else s = toText(v, 'csharp');
  if (align > 0) s = s.padStart(align);
  else if (align < 0) s = s.padEnd(-align);
  return s;
}

export function csFormat(fmt: string, args: Val[]): string {
  return fmt.replace(/\{\{|\}\}|\{(\d+)((?:,-?\d+)?(?::[^}]*)?)\}/g, (m, i: string, spec: string) => {
    if (m === '{{') return '{';
    if (m === '}}') return '}';
    return csFormatItem(args[parseInt(i, 10)], spec || undefined);
  });
}

/** Short display used inside the visualizer boxes and the variables panel. */
export function display(v: Val, lang: Lang): string {
  if (v === undefined) return '?';
  if (v === null) return lang === 'python' ? 'None' : lang === 'c' ? 'NULL' : lang === 'cpp' ? 'nullptr' : 'null';
  if (typeof v === 'string') return lang === 'python' ? pyRepr(v) : JSON.stringify(v);
  if (v instanceof Chr) return `'${v.c === 0 ? '\\0' : v.c === 10 ? '\\n' : String.fromCharCode(v.c)}'`;
  if (typeof v === 'boolean') return lang === 'python' ? (v ? 'True' : 'False') : String(v);
  if (v instanceof Flt) {
    if (lang === 'python') return pyFloat(v.v);
    if (!Number.isFinite(v.v)) return v.v > 0 ? '∞' : '-∞';
    const s = Number.isInteger(v.v) ? v.v.toFixed(1) : String(Number(v.v.toPrecision(6)));
    return s;
  }
  if (typeof v === 'number') {
    if (v >= 2147483647) return lang === 'python' ? String(v) : '∞';
    if (v <= -2147483648) return lang === 'python' ? String(v) : '-∞';
    return String(v);
  }
  if (v instanceof RangeV) return pyStr(v);
  if (v instanceof FnV) return `fn ${v.name}`;
  if (v instanceof Special) return v.kind;
  return toText(v, lang);
}
