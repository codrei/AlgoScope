// Python front-end.
import type { Node } from 'web-tree-sitter';
import { AUTO, type CatchClause, type ClassDef, type CompClause, type Expr, type Func, type Param, type Program, type Stmt } from '../ir';
import { allKids, collectIndexVars, endLineOf, f, fields, kids, lineOf, parseNumber, unescape, unsupported } from './util';

export function lowerPython(root: Node): Program {
  const prog: Program = { lang: 'python', funcs: Object.create(null), classes: Object.create(null), globals: [] };

  function params(n: Node | null, skipSelf: boolean): Param[] {
    if (!n) return [];
    const out: Param[] = [];
    for (const p of kids(n)) {
      if (p.type === 'identifier') out.push({ name: p.text, ty: AUTO, byRef: false });
      else if (p.type === 'default_parameter' || p.type === 'typed_default_parameter') {
        out.push({ name: f(p, 'name')!.text, ty: AUTO, byRef: false, def: expr(f(p, 'value')!) });
      } else if (p.type === 'typed_parameter') {
        const id = kids(p).find((k) => k.type === 'identifier');
        if (id) out.push({ name: id.text, ty: AUTO, byRef: false });
      } else if (p.type === 'list_splat_pattern' || p.type === 'dictionary_splat_pattern') {
        unsupported(p, '*args / **kwargs');
      }
    }
    if (skipSelf && out.length) out.shift();
    return out;
  }

  function funcDef(n: Node, cls?: string, decorators = ''): Func {
    const body = block(f(n, 'body')!);
    const globals: string[] = [];
    const scan = (ss: Stmt[]) => ss.forEach((s) => {
      if (s.k === 'global') globals.push(...s.names);
      if (s.k === 'block') scan(s.body);
    });
    scan(body);
    const deco = decorators;
    const isStaticMethod = /@staticmethod/.test(deco);
    const fn: Func = {
      name: f(n, 'name')!.text,
      params: params(f(n, 'parameters'), !!cls && !isStaticMethod),
      body,
      ln: lineOf(n),
      endLn: endLineOf(n),
      retTy: AUTO,
      isStatic: !cls || isStaticMethod,
      cls,
      indexVars: collectIndexVars(body),
      globals,
      memo: /@(?:functools\.)?(?:lru_cache|cache)\b/.test(deco) || undefined,
    };
    return fn;
  }

  function classDef(n: Node) {
    const name = f(n, 'name')!.text;
    const cls: ClassDef = { name, fields: [], methods: Object.create(null), ctors: [], ln: lineOf(n) };
    const sup = f(n, 'superclasses');
    if (sup) {
      const b = kids(sup)[0];
      if (b && b.text !== 'object') cls.base = b.text;
    }
    prog.classes[name] = cls;
    for (let m of kids(f(n, 'body')!)) {
      let deco = '';
      if (m.type === 'decorated_definition') {
        deco = kids(m).filter((k) => k.type === 'decorator').map((k) => k.text).join(' ');
        m = f(m, 'definition')!;
      }
      if (m.type === 'function_definition') {
        const fn = funcDef(m, name, deco);
        if (fn.name === '__init__') cls.ctors.push(fn);
        else (cls.methods[fn.name] ??= []).push(fn);
      } else if (m.type === 'expression_statement') {
        const a = kids(m)[0];
        if (a?.type === 'assignment' && f(a, 'left')?.type === 'identifier') {
          const r = f(a, 'right');
          cls.fields.push({ name: f(a, 'left')!.text, ty: AUTO, isStatic: true, init: r ? expr(r) : undefined });
        }
      }
    }
  }

  function block(n: Node): Stmt[] {
    return kids(n).flatMap(stmt);
  }

  function stmt(n: Node): Stmt[] {
    const ln = lineOf(n);
    switch (n.type) {
      case 'expression_statement': {
        const c = kids(n);
        if (c.length > 1) return [{ k: 'expr', ln, e: { k: 'list', ln, kind: 'tuple', items: c.map(expr) } }];
        const e = c[0];
        if (e.type === 'string') return []; // docstring
        return [{ k: 'expr', ln, e: expr(e) }];
      }
      case 'if_statement': {
        const c = f(n, 'condition')!;
        const top: Stmt = { k: 'if', ln, c: expr(c), src: c.text, then: block(f(n, 'consequence')!) };
        let cur = top as Extract<Stmt, { k: 'if' }>;
        for (const alt of fields(n, 'alternative')) {
          if (alt.type === 'elif_clause') {
            const ec = f(alt, 'condition')!;
            const next: Extract<Stmt, { k: 'if' }> = { k: 'if', ln: lineOf(alt), c: expr(ec), src: ec.text, then: block(f(alt, 'consequence')!) };
            cur.else = [next];
            cur = next;
          } else if (alt.type === 'else_clause') {
            cur.else = block(f(alt, 'body')!);
          }
        }
        return [top];
      }
      case 'while_statement': {
        const c = f(n, 'condition')!;
        return [{ k: 'while', ln, c: expr(c), src: c.text, body: block(f(n, 'body')!) }];
      }
      case 'for_statement': {
        const alt = f(n, 'alternative');
        return [{
          k: 'foreach', ln, target: target(f(n, 'left')!), iter: expr(f(n, 'right')!), body: block(f(n, 'body')!),
          elseBody: alt ? block(f(alt, 'body')!) : undefined,
        }];
      }
      case 'return_statement': {
        const c = kids(n);
        if (!c.length) return [{ k: 'return', ln }];
        const e = c[0].type === 'expression_list' ? tuple(c[0]) : expr(c[0]);
        return [{ k: 'return', ln, e }];
      }
      case 'pass_statement':
        return [{ k: 'pass', ln }];
      case 'break_statement':
        return [{ k: 'break', ln }];
      case 'continue_statement':
        return [{ k: 'continue', ln }];
      case 'global_statement':
      case 'nonlocal_statement':
        return [{ k: 'global', ln, names: kids(n).map((k) => k.text) }];
      case 'delete_statement': {
        const t = kids(n)[0];
        return [{ k: 'del', ln, targets: t.type === 'expression_list' ? kids(t).map(expr) : [expr(t)] }];
      }
      case 'function_definition': {
        // nested function: bind it as a local name
        const fn = funcDef(n);
        const id = `${fn.name}@${fn.ln}`;
        (prog.funcs[id] ??= []).push(fn);
        return [{
          k: 'expr', ln,
          e: { k: 'assign', ln, op: '=', target: { k: 'name', ln, name: fn.name }, value: { k: 'call', ln, callee: { k: 'name', ln, name: '__closure__' }, args: [{ k: 'str', ln, v: id }] } },
        }];
      }
      case 'decorated_definition': {
        const def = f(n, 'definition')!;
        if (def.type !== 'function_definition') return stmt(def);
        const fn = funcDef(def, undefined, kids(n).filter((k) => k.type === 'decorator').map((k) => k.text).join(' '));
        const id = `${fn.name}@${fn.ln}`;
        (prog.funcs[id] ??= []).push(fn);
        return [{
          k: 'expr', ln,
          e: { k: 'assign', ln, op: '=', target: { k: 'name', ln, name: fn.name }, value: { k: 'call', ln, callee: { k: 'name', ln, name: '__closure__' }, args: [{ k: 'str', ln, v: id }] } },
        }];
      }
      case 'class_definition':
        classDef(n);
        return [];
      case 'import_statement':
      case 'import_from_statement':
      case 'future_import_statement':
        return [];
      case 'assert_statement':
        return [];
      case 'try_statement': {
        const handlers: CatchClause[] = [];
        let elseBody: Stmt[] | undefined;
        let finallyBody: Stmt[] | undefined;
        for (const c of kids(n)) {
          if (c.type === 'except_clause' || c.type === 'except_group_clause') {
            const blk = kids(c).find((k) => k.type === 'block');
            let types: string[] | null = null;
            let name: string | undefined;
            for (const k of kids(c)) {
              if (k === blk || k.type === 'block') continue;
              if (k.type === 'as_pattern') {
                const tgt = kids(k).find((x) => x.type === 'as_pattern_target');
                name = tgt?.text;
                types = typeNames(kids(k)[0]);
              } else if (k.type === 'as_pattern_target') name = k.text;
              else if (types === null) types = typeNames(k);
            }
            const alias = f(c, 'alias');
            if (alias) name = alias.text;
            handlers.push({ types, name, ln: lineOf(c), body: blk ? block(blk) : [] });
          } else if (c.type === 'else_clause') elseBody = block(f(c, 'body') ?? kids(c)[0]);
          else if (c.type === 'finally_clause') finallyBody = block(kids(c).find((k) => k.type === 'block')!);
        }
        return [{ k: 'try', ln, body: block(f(n, 'body')!), handlers, elseBody, finallyBody }];
      }
      case 'raise_statement': {
        const e = kids(n)[0];
        return [{ k: 'throw', ln, e: e ? expr(e) : undefined }];
      }
      case 'with_statement':
        return unsupported(n, 'with statements');
      case 'match_statement':
        return unsupported(n, 'match statements');
      default:
        return unsupported(n);
    }
  }

  function typeNames(n: Node): string[] {
    if (n.type === 'tuple' || n.type === 'parenthesized_expression') return kids(n).flatMap(typeNames);
    return [n.text.split('.').pop()!];
  }

  function target(n: Node): Expr {
    switch (n.type) {
      case 'pattern_list':
      case 'tuple_pattern':
      case 'list_pattern':
      case 'expression_list':
      case 'tuple':
        return { k: 'list', ln: lineOf(n), kind: 'tuple', items: kids(n).map(target) };
      case 'parenthesized_expression':
        return target(kids(n)[0]);
      default:
        return expr(n);
    }
  }

  function tuple(n: Node): Expr {
    return { k: 'list', ln: lineOf(n), kind: 'tuple', items: kids(n).map(expr) };
  }

  function stringNode(n: Node): Expr {
    const ln = lineOf(n);
    const start = kids(n).find((k) => k.type === 'string_start');
    const prefix = (start?.text ?? '"').replace(/["']+$/, '').toLowerCase();
    const raw = prefix.includes('r');
    const isF = prefix.includes('f');
    const parts: (string | { e: Expr; spec?: string })[] = [];
    for (const c of allKids(n)) {
      if (c.type === 'string_content') parts.push(raw ? c.text : unescape(c.text));
      else if (c.type === 'escape_sequence') parts.push(raw ? c.text : unescape(c.text));
      else if (c.type === 'interpolation' && isF) {
        const e = f(c, 'expression') ?? kids(c)[0];
        const spec = f(c, 'format_specifier');
        const conv = kids(c).find((k) => k.type === 'type_conversion');
        parts.push({ e: expr(e), spec: spec ? spec.text.replace(/^:/, '') : conv ? conv.text : undefined });
      } else if (c.type === 'interpolation') parts.push(c.text);
    }
    if (isF) return { k: 'fstr', ln, parts };
    return { k: 'str', ln, v: parts.map((p) => (typeof p === 'string' ? p : '')).join('') };
  }

  function argList(n: Node): Expr[] {
    if (n.type === 'generator_expression') return [comprehension(n)];
    return kids(n).map((a) => {
      if (a.type === 'keyword_argument') return { k: 'kw', ln: lineOf(a), name: f(a, 'name')!.text, value: expr(f(a, 'value')!) } as Expr;
      if (a.type === 'list_splat') return { k: 'spread', ln: lineOf(a), e: expr(kids(a)[0]) } as Expr;
      if (a.type === 'dictionary_splat') unsupported(a, 'argument unpacking (**kwargs)');
      return expr(a);
    });
  }

  function comprehension(n: Node): Expr {
    const clauses: CompClause[] = [];
    for (const c of kids(n)) {
      if (c.type === 'for_in_clause') {
        const right = fields(c, 'right');
        clauses.push({ kind: 'for', target: target(f(c, 'left')!), iter: expr(right[0]) });
      } else if (c.type === 'if_clause') clauses.push({ kind: 'if', c: expr(kids(c)[0]) });
    }
    return { k: 'listcomp', ln: lineOf(n), body: expr(f(n, 'body')!), clauses };
  }

  function expr(n: Node): Expr {
    const ln = lineOf(n);
    switch (n.type) {
      case 'integer':
      case 'float': {
        const { v, float } = parseNumber(n.text.replace(/[jJ]$/, ''));
        return { k: 'num', ln, v, float: float || n.type === 'float' };
      }
      case 'string':
        return stringNode(n);
      case 'concatenated_string': {
        const parts = kids(n).map(stringNode);
        if (parts.every((p) => p.k === 'str')) return { k: 'str', ln, v: parts.map((p) => (p as { v: string }).v).join('') };
        const all: (string | { e: Expr; spec?: string })[] = [];
        for (const p of parts) {
          if (p.k === 'str') all.push(p.v);
          else if (p.k === 'fstr') all.push(...p.parts);
        }
        return { k: 'fstr', ln, parts: all };
      }
      case 'true':
        return { k: 'bool', ln, v: true };
      case 'false':
        return { k: 'bool', ln, v: false };
      case 'none':
        return { k: 'null', ln };
      case 'identifier':
        return { k: 'name', ln, name: n.text };
      case 'parenthesized_expression':
        return expr(kids(n)[0]);
      case 'binary_operator':
        return { k: 'bin', ln, op: f(n, 'operator')!.text, l: expr(f(n, 'left')!), r: expr(f(n, 'right')!) };
      case 'boolean_operator': {
        const op = f(n, 'operator')!.text === 'and' ? '&&' : '||';
        return { k: 'bin', ln, op, l: expr(f(n, 'left')!), r: expr(f(n, 'right')!) };
      }
      case 'not_operator':
        return { k: 'un', ln, op: '!', e: expr(f(n, 'argument')!) };
      case 'unary_operator':
        return { k: 'un', ln, op: f(n, 'operator')!.text, e: expr(f(n, 'argument')!) };
      case 'comparison_operator': {
        const items = kids(n).filter((k) => k.type !== 'comment');
        // operators are anonymous children between operands; 'not in' / 'is not' are two tokens
        const ops: string[] = [];
        const ch = allKids(n);
        let pending = '';
        for (const c of ch) {
          if (c.isNamed) {
            if (pending) ops.push(pending.trim());
            pending = '';
          } else pending += ' ' + c.text;
        }
        const es = items.map(expr);
        if (es.length === 2) return { k: 'bin', ln, op: ops[0], l: es[0], r: es[1] };
        return { k: 'cmpchain', ln, ops, items: es };
      }
      case 'call': {
        const fn = f(n, 'function')!;
        const args = argList(f(n, 'arguments')!);
        return { k: 'call', ln, callee: expr(fn), args };
      }
      case 'attribute':
        return { k: 'member', ln, obj: expr(f(n, 'object')!), name: f(n, 'attribute')!.text };
      case 'subscript': {
        const obj = expr(f(n, 'value')!);
        const subs = fields(n, 'subscript');
        const s = subs[0];
        if (subs.length > 1) return { k: 'index', ln, obj, idx: { k: 'list', ln, kind: 'tuple', items: subs.map(expr) } };
        if (s.type === 'slice') {
          // slice children: [lo] ':' [hi] [':' [step]]
          const parts: (Expr | undefined)[] = [undefined, undefined, undefined];
          let slot = 0;
          for (const c of allKids(s)) {
            if (c.text === ':' && !c.isNamed) slot++;
            else if (c.isNamed) parts[slot] = expr(c);
          }
          return { k: 'slice', ln, obj, lo: parts[0], hi: parts[1], step: parts[2] };
        }
        return { k: 'index', ln, obj, idx: expr(s) };
      }
      case 'list':
        return { k: 'list', ln, kind: 'list', items: kids(n).map(expr) };
      case 'tuple':
      case 'expression_list':
        return { k: 'list', ln, kind: 'tuple', items: kids(n).map(expr) };
      case 'set':
        return { k: 'list', ln, kind: 'set', items: kids(n).map(expr) };
      case 'dictionary':
        return {
          k: 'dict', ln,
          entries: kids(n).filter((p) => p.type === 'pair').map((p) => [expr(f(p, 'key')!), expr(f(p, 'value')!)] as [Expr, Expr]),
        };
      case 'list_comprehension':
      case 'generator_expression':
        return comprehension(n);
      case 'set_comprehension': {
        const c = comprehension(n);
        return { k: 'call', ln, callee: { k: 'name', ln, name: 'set' }, args: [c] };
      }
      case 'dictionary_comprehension': {
        // {k: v for ...} -> dict([(k, v) for ...])
        const pair = f(n, 'body')!;
        const clauses: CompClause[] = [];
        for (const c of kids(n)) {
          if (c.type === 'for_in_clause') clauses.push({ kind: 'for', target: target(f(c, 'left')!), iter: expr(fields(c, 'right')[0]) });
          else if (c.type === 'if_clause') clauses.push({ kind: 'if', c: expr(kids(c)[0]) });
        }
        const body: Expr = { k: 'list', ln, kind: 'tuple', items: [expr(f(pair, 'key')!), expr(f(pair, 'value')!)] };
        return { k: 'call', ln, callee: { k: 'name', ln, name: 'dict' }, args: [{ k: 'listcomp', ln, body, clauses }] };
      }
      case 'conditional_expression': {
        const [t, c, e] = kids(n);
        return { k: 'cond', ln, c: expr(c), t: expr(t), f: expr(e) };
      }
      case 'assignment': {
        const left = f(n, 'left')!;
        const right = f(n, 'right');
        if (!right) return { k: 'assign', ln, op: '=', target: target(left), value: { k: 'null', ln } };
        const rv = right.type === 'expression_list' ? tuple(right) : expr(right);
        return { k: 'assign', ln, op: '=', target: target(left), value: rv };
      }
      case 'augmented_assignment':
        return { k: 'assign', ln, op: f(n, 'operator')!.text, target: target(f(n, 'left')!), value: expr(f(n, 'right')!) };
      case 'named_expression':
        return { k: 'assign', ln, op: '=', target: expr(f(n, 'name')!), value: expr(f(n, 'value')!) };
      case 'lambda': {
        const ps = f(n, 'parameters');
        return { k: 'lambda', ln, params: ps ? kids(ps).map((p) => (p.type === 'identifier' ? p.text : f(p, 'name')!.text)) : [], body: expr(f(n, 'body')!) };
      }
      case 'keyword_argument':
        return { k: 'kw', ln, name: f(n, 'name')!.text, value: expr(f(n, 'value')!) };
      case 'pattern_list':
      case 'tuple_pattern':
      case 'list_pattern':
        return target(n);
      case 'ellipsis':
        return { k: 'null', ln };
      case 'await':
        return unsupported(n, 'async code');
      default:
        return unsupported(n);
    }
  }

  for (let n of kids(root)) {
    let deco = '';
    if (n.type === 'decorated_definition') {
      deco = kids(n).filter((k) => k.type === 'decorator').map((k) => k.text).join(' ');
      n = f(n, 'definition')!;
    }
    if (n.type === 'function_definition') {
      const fn = funcDef(n, undefined, deco);
      (prog.funcs[fn.name] ??= []).push(fn);
    } else if (n.type === 'class_definition') classDef(n);
    else prog.globals.push(...stmt(n));
  }
  return prog;
}
