import type { Node } from 'web-tree-sitter';
import { CompileError, type Expr, type Stmt, type Ty } from '../ir';

export const lineOf = (n: Node) => n.startPosition.row + 1;
export const endLineOf = (n: Node) => n.endPosition.row + 1;

export function f(n: Node, name: string): Node | null {
  return n.childForFieldName(name);
}

export function fields(n: Node, name: string): Node[] {
  return n.childrenForFieldName(name).filter((c): c is Node => !!c);
}

/** Named children without comments. */
export function kids(n: Node): Node[] {
  return n.namedChildren.filter((c): c is Node => !!c && c.type !== 'comment' && !c.type.endsWith('_comment'));
}

/** All children (named and anonymous). */
export function allKids(n: Node): Node[] {
  return n.children.filter((c): c is Node => !!c);
}

export function ty(base: string, arr = 0, ptr = 0, args?: Ty[]): Ty {
  return args ? { base, arr, ptr, args } : { base, arr, ptr };
}

export function fail(n: Node, what: string): never {
  throw new CompileError(what, lineOf(n));
}

export function unsupported(n: Node, what?: string): never {
  const snippet = n.text.split('\n')[0].slice(0, 40);
  throw new CompileError(
    `AlgoScope doesn't support ${what ?? `this kind of code (${n.type.replace(/_/g, ' ')})`} yet: "${snippet}"`,
    lineOf(n),
  );
}

/** Find the first syntax error in a tree, if any. */
export function findSyntaxError(root: Node): { line: number; text: string } | null {
  if (!root.hasError) return null;
  const stack: Node[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.isError || n.isMissing) {
      return { line: lineOf(n), text: n.isMissing ? `missing "${n.type}"` : n.text.split('\n')[0].slice(0, 40) };
    }
    if (n.hasError) {
      const ch = n.children.filter((c): c is Node => !!c);
      for (let i = ch.length - 1; i >= 0; i--) stack.push(ch[i]);
    }
  }
  return { line: 1, text: '' };
}

export function unescape(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== '\\' || i === s.length - 1) {
      out += c;
      continue;
    }
    const d = s[++i];
    switch (d) {
      case 'n': out += '\n'; break;
      case 't': out += '\t'; break;
      case 'r': out += '\r'; break;
      case '0': out += '\0'; break;
      case 'a': out += '\x07'; break;
      case 'b': out += '\b'; break;
      case 'f': out += '\f'; break;
      case 'v': out += '\v'; break;
      case '\\': out += '\\'; break;
      case "'": out += "'"; break;
      case '"': out += '"'; break;
      case '\n': break;
      case 'x': {
        const m = /^[0-9a-fA-F]{1,2}/.exec(s.slice(i + 1));
        if (m) {
          out += String.fromCharCode(parseInt(m[0], 16));
          i += m[0].length;
        } else out += 'x';
        break;
      }
      case 'u': {
        const m = /^[0-9a-fA-F]{4}/.exec(s.slice(i + 1));
        if (m) {
          out += String.fromCharCode(parseInt(m[0], 16));
          i += 4;
        } else out += 'u';
        break;
      }
      default: out += '\\' + d;
    }
  }
  return out;
}

/** Parse a numeric literal of any of the supported languages. */
export function parseNumber(text: string): { v: number; float: boolean } {
  let t = text.replace(/[_']/g, '');
  if (/^0[xX]/.test(t)) return { v: parseInt(t.replace(/[uUlL]+$/, ''), 16), float: false };
  if (/^0[bB]/.test(t)) return { v: parseInt(t.slice(2).replace(/[uUlL]+$/, ''), 2), float: false };
  const isFloat = /[.eE]/.test(t) || /[fFdDmM]$/.test(t);
  t = t.replace(/[uUlLfFdDmM]+$/, '');
  if (!isFloat && /^0[0-7]+$/.test(t)) return { v: parseInt(t, 8), float: false };
  return { v: Number(t), float: isFloat };
}

/** Variables used as array indexes (arr[j], arr[j + 1], arr[i - 1]) in a function body. */
export function collectIndexVars(body: Stmt[]): string[] {
  const found = new Set<string>();
  const visitE = (e: Expr | undefined | null): void => {
    if (!e) return;
    switch (e.k) {
      case 'index': {
        const ix = e.idx;
        if (ix.k === 'name') found.add(ix.name);
        else if (ix.k === 'bin' && (ix.op === '+' || ix.op === '-') && ix.l.k === 'name') found.add(ix.l.name);
        visitE(e.obj);
        visitE(e.idx);
        return;
      }
      case 'bin': visitE(e.l); visitE(e.r); return;
      case 'cmpchain': e.items.forEach(visitE); return;
      case 'un': visitE(e.e); return;
      case 'assign': visitE(e.target); visitE(e.value); return;
      case 'incdec': visitE(e.target); return;
      case 'cond': visitE(e.c); visitE(e.t); visitE(e.f); return;
      case 'call': visitE(e.callee); e.args.forEach(visitE); return;
      case 'member': visitE(e.obj); return;
      case 'list': e.items.forEach(visitE); return;
      case 'kw': visitE(e.value); return;
      case 'cast': visitE(e.e); return;
      case 'slice': visitE(e.obj); return;
      default: return;
    }
  };
  const visitS = (s: Stmt): void => {
    switch (s.k) {
      case 'vardecl': s.decls.forEach((d) => { visitE(d.init); d.ctorArgs?.forEach(visitE); }); return;
      case 'expr': visitE(s.e); return;
      case 'if': visitE(s.c); s.then.forEach(visitS); s.else?.forEach(visitS); return;
      case 'while': case 'dowhile': visitE(s.c); s.body.forEach(visitS); return;
      case 'for': s.init.forEach(visitS); visitE(s.c); s.update.forEach(visitE); s.body.forEach(visitS); return;
      case 'foreach': visitE(s.iter); s.body.forEach(visitS); return;
      case 'return': visitE(s.e); return;
      case 'block': s.body.forEach(visitS); return;
      case 'switch': visitE(s.e); s.cases.forEach((c) => c.body.forEach(visitS)); return;
      default: return;
    }
  };
  body.forEach(visitS);
  return [...found];
}

/** Normalise primitive type names across languages. */
export function primName(t: string): string {
  const s = t.replace(/\b(const|static|final|unsigned|signed|volatile|register|readonly)\b/g, '').trim();
  switch (s) {
    case 'int': case 'long': case 'short': case 'byte': case 'sbyte': case 'uint': case 'ulong': case 'ushort':
    case 'long long': case 'long int': case 'short int': case 'long long int': case 'size_t': case 'Integer': case 'Long':
    case 'Short': case 'Byte': case '': case 'int32_t': case 'int64_t': case 'Int32': case 'Int64':
      return 'int';
    case 'double': case 'float': case 'long double': case 'decimal': case 'Double': case 'Float':
      return 'double';
    case 'char': case 'Character': case 'wchar_t':
      return 'char';
    case 'bool': case 'boolean': case 'Boolean':
      return 'bool';
    case 'string': case 'String': case 'std::string':
      return 'string';
    case 'void':
      return 'void';
    case 'var': case 'auto': case 'Object': case 'object': case 'dynamic':
      return 'auto';
    default:
      return s;
  }
}
