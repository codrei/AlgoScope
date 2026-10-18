// C# front-end.
import type { Node } from 'web-tree-sitter';
import { AUTO, CompileError, type ClassDef, type Expr, type Func, type Param, type Program, type Stmt, type Ty, type VarDeclItem } from '../ir';
import { allKids, collectIndexVars, endLineOf, f, fields, kids, lineOf, parseNumber, primName, ty, unescape, unsupported } from './util';

export function lowerCSharp(root: Node): Program {
  const prog: Program = { lang: 'csharp', funcs: {}, classes: {}, globals: [] };
  const topLevel: Stmt[] = [];

  function typeOf(n: Node | null): Ty {
    if (!n) return AUTO;
    switch (n.type) {
      case 'predefined_type':
      case 'void_keyword':
      case 'implicit_type':
        return ty(primName(n.text));
      case 'identifier':
        return ty(primName(n.text));
      case 'qualified_name':
        return ty(primName(n.text.split('.').pop()!));
      case 'generic_name': {
        const id = kids(n).find((k) => k.type === 'identifier')!;
        const ta = kids(n).find((k) => k.type === 'type_argument_list');
        return ty(id.text, 0, 0, ta ? kids(ta).map(typeOf) : []);
      }
      case 'array_type': {
        const el = typeOf(f(n, 'type'));
        const rank = f(n, 'rank');
        const dims = rank ? (rank.text.match(/,/g) ?? []).length + 1 : 1;
        return { ...el, arr: el.arr + dims };
      }
      case 'nullable_type':
        return typeOf(kids(n)[0]);
      case 'tuple_type':
        return ty('tuple');
      default:
        return ty(primName(n.text));
    }
  }

  const mods = (n: Node) => kids(n).filter((k) => k.type === 'modifier').map((k) => k.text);

  function params(n: Node | null): Param[] {
    if (!n) return [];
    return kids(n)
      .filter((p) => p.type === 'parameter')
      .map((p) => {
        const m = allKids(p).map((k) => k.text);
        const def = kids(p).find((k) => k.type === 'equals_value_clause');
        return {
          name: f(p, 'name')!.text,
          ty: typeOf(f(p, 'type')),
          byRef: m.includes('ref') || m.includes('out'),
          def: def ? expr(kids(def)[0]) : undefined,
        };
      });
  }

  function defineClass(n: Node) {
    const name = f(n, 'name')!.text;
    const cls: ClassDef = { name, fields: [], methods: {}, ctors: [], ln: lineOf(n) };
    const bases = kids(n).find((k) => k.type === 'base_list');
    if (bases) cls.base = kids(bases)[0]?.text;
    prog.classes[name] = cls;
    for (const m of kids(f(n, 'body')!)) {
      switch (m.type) {
        case 'field_declaration': {
          const st = mods(m).includes('static') || mods(m).includes('const');
          const vd = kids(m).find((k) => k.type === 'variable_declaration')!;
          const t = typeOf(f(vd, 'type'));
          for (const d of kids(vd).filter((k) => k.type === 'variable_declarator')) {
            const ev = kids(d).find((k) => k.type === 'equals_value_clause');
            cls.fields.push({ name: kids(d)[0].text, ty: t, isStatic: st, init: ev ? init(kids(ev)[0], t) : undefined });
          }
          break;
        }
        case 'property_declaration': {
          const st = mods(m).includes('static');
          const t = typeOf(f(m, 'type'));
          const v = f(m, 'value');
          cls.fields.push({ name: f(m, 'name')!.text, ty: t, isStatic: st, init: v ? expr(v) : undefined });
          break;
        }
        case 'method_declaration': {
          const fn = method(m, name);
          (cls.methods[fn.name] ??= []).push(fn);
          if (fn.name === 'Main' && fn.isStatic) prog.entry = { cls: name, name: 'Main' };
          break;
        }
        case 'constructor_declaration':
          cls.ctors.push(method(m, name));
          break;
        case 'class_declaration':
        case 'struct_declaration':
        case 'record_declaration':
          defineClass(m);
          break;
        case 'interface_declaration':
        case 'enum_declaration':
          unsupported(m, 'interfaces/enums');
          break;
        default:
          break;
      }
    }
  }

  function method(n: Node, cls: string): Func {
    const body = f(n, 'body');
    let stmts: Stmt[] = [];
    if (body) {
      if (body.type === 'block') stmts = kids(body).flatMap(stmt);
      else if (body.type === 'arrow_expression_clause') {
        const e = kids(body)[0];
        const isVoid = f(n, 'returns')?.text === 'void' || f(n, 'type')?.text === 'void';
        stmts = [isVoid ? { k: 'expr', ln: lineOf(e), e: expr(e) } : { k: 'return', ln: lineOf(e), e: expr(e) }];
      }
    } else {
      const arrow = kids(n).find((k) => k.type === 'arrow_expression_clause');
      if (arrow) stmts = [{ k: 'return', ln: lineOf(arrow), e: expr(kids(arrow)[0]) }];
    }
    return {
      name: f(n, 'name')!.text,
      params: params(f(n, 'parameters')),
      body: stmts,
      ln: lineOf(n),
      endLn: endLineOf(n),
      retTy: n.type === 'constructor_declaration' ? ty('void') : typeOf(f(n, 'returns') ?? f(n, 'type')),
      isStatic: mods(n).includes('static'),
      cls,
      indexVars: collectIndexVars(stmts),
    };
  }

  function bodyOf(n: Node | null): Stmt[] {
    if (!n) return [];
    if (n.type === 'block') return [{ k: 'block', ln: lineOf(n), body: kids(n).flatMap(stmt) }];
    return stmt(n);
  }

  function varDecl(vd: Node): Stmt {
    const t = typeOf(f(vd, 'type'));
    const decls: VarDeclItem[] = kids(vd)
      .filter((k) => k.type === 'variable_declarator')
      .map((d) => {
        const ev = kids(d).find((k) => k.type === 'equals_value_clause');
        const id = kids(d).find((k) => k.type === 'identifier')!;
        return { name: id.text, init: ev ? init(kids(ev)[0], t) : undefined };
      });
    return { k: 'vardecl', ln: lineOf(vd), ty: t, decls };
  }

  function init(v: Node, t: Ty): Expr {
    if (v.type === 'initializer_expression') return arrInit(v, t);
    return expr(v);
  }

  function arrInit(n: Node, t: Ty): Expr {
    const elem: Ty = { ...t, arr: Math.max(0, t.arr - 1) };
    return {
      k: 'newarr', ln: lineOf(n), ty: { ...t, arr: 0 }, dims: [null],
      init: {
        k: 'list', ln: lineOf(n), kind: 'init',
        items: kids(n).map((c) => (c.type === 'initializer_expression' ? arrInit(c, elem) : expr(c))),
      },
    };
  }

  function stmt(n: Node): Stmt[] {
    const ln = lineOf(n);
    switch (n.type) {
      case 'block':
        return [{ k: 'block', ln, body: kids(n).flatMap(stmt) }];
      case 'local_declaration_statement':
        return [varDecl(kids(n).find((k) => k.type === 'variable_declaration')!)];
      case 'expression_statement':
        return [{ k: 'expr', ln, e: expr(kids(n)[0]) }];
      case 'if_statement': {
        const ks = kids(n);
        const c = f(n, 'condition') ?? ks[0];
        const cons = f(n, 'consequence') ?? ks[1];
        const alt = f(n, 'alternative') ?? (ks.length > 2 ? ks[2] : null);
        return [{ k: 'if', ln, c: expr(c), src: c.text, then: bodyOf(cons), else: alt ? bodyOf(alt) : undefined }];
      }
      case 'while_statement': {
        const ks = kids(n);
        const c = f(n, 'condition') ?? ks[0];
        const body = f(n, 'body') ?? ks[ks.length - 1];
        return [{ k: 'while', ln, c: expr(c), src: c.text, body: bodyOf(body) }];
      }
      case 'do_statement': {
        const ks = kids(n);
        const body = f(n, 'body') ?? ks[0];
        const c = f(n, 'condition') ?? ks[ks.length - 1];
        return [{ k: 'dowhile', ln, c: expr(c), src: c.text, condLn: lineOf(c), body: bodyOf(body) }];
      }
      case 'for_statement': {
        const init: Stmt[] = [];
        for (const i of fields(n, 'initializer')) {
          if (i.type === 'variable_declaration') init.push(varDecl(i));
          else init.push({ k: 'expr', ln, e: expr(i) });
        }
        const c = f(n, 'condition');
        return [{
          k: 'for', ln, init, c: c ? expr(c) : undefined, src: c ? c.text : 'true',
          update: fields(n, 'update').map(expr), body: bodyOf(f(n, 'body')),
        }];
      }
      case 'for_each_statement': {
        const left = f(n, 'left')!;
        return [{
          k: 'foreach', ln, target: { k: 'name', ln, name: left.text }, ty: typeOf(f(n, 'type')),
          iter: expr(f(n, 'right')!), body: bodyOf(f(n, 'body')),
        }];
      }
      case 'return_statement': {
        const e = kids(n)[0];
        return [{ k: 'return', ln, e: e ? expr(e) : undefined }];
      }
      case 'break_statement':
        return [{ k: 'break', ln }];
      case 'continue_statement':
        return [{ k: 'continue', ln }];
      case 'switch_statement': {
        const val = f(n, 'value') ?? kids(n)[0];
        const e = expr(val.type === 'parenthesized_expression' ? kids(val)[0] : val);
        const cases: { tests: Expr[] | null; body: Stmt[] }[] = [];
        const body = f(n, 'body')!;
        for (const sec of kids(body)) {
          if (sec.type !== 'switch_section') continue;
          const secKids = kids(sec);
          const labels = secKids.filter((k) => /label|pattern|case/.test(k.type) && !/statement/.test(k.type));
          const rest = secKids.filter((k) => !labels.includes(k));
          const isDefault = labels.some((l) => l.text.startsWith('default'));
          const tests = labels.filter((l) => !l.text.startsWith('default')).map((l) => {
            const inner = kids(l)[0] ?? l;
            return expr(inner.type === 'constant_pattern' ? kids(inner)[0] : inner);
          });
          cases.push({ tests: isDefault ? null : tests, body: rest.flatMap(stmt) });
        }
        return [{ k: 'switch', ln, e, cases }];
      }
      case 'try_statement': {
        const b = f(n, 'body');
        return b ? bodyOf(b) : [];
      }
      case 'throw_statement':
        return [{ k: 'unsupported', ln, what: 'throw (exceptions)' }];
      case 'local_function_statement':
        return unsupported(n, 'local functions');
      case 'empty_statement':
        return [];
      default:
        return unsupported(n);
    }
  }

  function stringLit(n: Node): string {
    const t = n.text;
    if (t.startsWith('@"')) return t.slice(2, -1).replace(/""/g, '"');
    return unescape(t.replace(/^"/, '').replace(/"$/, ''));
  }

  function expr(n: Node): Expr {
    const ln = lineOf(n);
    switch (n.type) {
      case 'integer_literal':
      case 'real_literal': {
        const { v, float } = parseNumber(n.text);
        return { k: 'num', ln, v, float };
      }
      case 'string_literal':
      case 'verbatim_string_literal':
      case 'raw_string_literal':
        return { k: 'str', ln, v: stringLit(n) };
      case 'character_literal':
        return { k: 'char', ln, v: unescape(n.text.slice(1, -1)).charCodeAt(0) };
      case 'boolean_literal':
      case 'true':
      case 'false':
        return { k: 'bool', ln, v: n.text === 'true' };
      case 'null_literal':
        return { k: 'null', ln };
      case 'identifier':
      case 'predefined_type':
        return { k: 'name', ln, name: n.text };
      case 'this_expression':
      case 'this':
        return { k: 'this', ln };
      case 'parenthesized_expression':
        return expr(kids(n)[0]);
      case 'binary_expression':
        return { k: 'bin', ln, op: f(n, 'operator')!.text, l: expr(f(n, 'left')!), r: expr(f(n, 'right')!) };
      case 'prefix_unary_expression': {
        const ch = allKids(n);
        const op = ch[0].text;
        const arg = kids(n)[0];
        if (op === '++' || op === '--') return { k: 'incdec', ln, op, prefix: true, target: expr(arg) };
        return { k: 'un', ln, op, e: expr(arg) };
      }
      case 'postfix_unary_expression': {
        const ch = allKids(n);
        const op = ch[ch.length - 1].text;
        if (op === '!') return expr(kids(n)[0]);
        return { k: 'incdec', ln, op: op as '++' | '--', prefix: false, target: expr(kids(n)[0]) };
      }
      case 'assignment_expression': {
        const opNode = kids(n).find((k) => k.type === 'assignment_operator');
        const op = opNode ? opNode.text : (f(n, 'operator')?.text ?? '=');
        return { k: 'assign', ln, op, target: expr(f(n, 'left')!), value: expr(f(n, 'right')!) };
      }
      case 'conditional_expression':
        return { k: 'cond', ln, c: expr(f(n, 'condition')!), t: expr(f(n, 'consequence')!), f: expr(f(n, 'alternative')!) };
      case 'invocation_expression': {
        const fn = f(n, 'function')!;
        const args = kids(f(n, 'arguments')!).map((a) => expr(a.type === 'argument' ? kids(a)[kids(a).length - 1] : a));
        if (fn.type === 'generic_name') {
          const id = kids(fn).find((k) => k.type === 'identifier')!;
          return { k: 'call', ln, callee: { k: 'name', ln, name: id.text }, args };
        }
        return { k: 'call', ln, callee: expr(fn), args };
      }
      case 'member_access_expression': {
        const obj = f(n, 'expression')!;
        const name = f(n, 'name')!;
        const nm = name.type === 'generic_name' ? kids(name).find((k) => k.type === 'identifier')!.text : name.text;
        return { k: 'member', ln, obj: expr(obj), name: nm };
      }
      case 'element_access_expression': {
        let obj = expr(f(n, 'expression')!);
        const sub = f(n, 'subscript')!;
        for (const a of kids(sub)) obj = { k: 'index', ln, obj, idx: expr(a.type === 'argument' ? kids(a)[0] : a) };
        return obj;
      }
      case 'cast_expression':
        return { k: 'cast', ln, ty: typeOf(f(n, 'type')), e: expr(f(n, 'value')!) };
      case 'object_creation_expression': {
        const a = f(n, 'arguments');
        const initNode = f(n, 'initializer');
        const t = typeOf(f(n, 'type'));
        if (initNode && !a) {
          return { k: 'newobj', ln, ty: t, args: [{ k: 'list', ln, kind: 'init', items: kids(initNode).map(expr) }] };
        }
        return { k: 'newobj', ln, ty: t, args: a ? kids(a).map((x) => expr(x.type === 'argument' ? kids(x)[0] : x)) : [] };
      }
      case 'array_creation_expression': {
        const at = kids(n).find((k) => k.type === 'array_type')!;
        const initNode = kids(n).find((k) => k.type === 'initializer_expression');
        // collect rank specifiers from outermost to innermost
        const ranks: Node[] = [];
        let cur: Node | null = at;
        while (cur && cur.type === 'array_type') {
          ranks.unshift(f(cur, 'rank')!);
          cur = f(cur, 'type');
        }
        const base = typeOf(cur);
        // ranks are now in source order: new int[3][] -> ["[3]", "[]"]
        const ordered = ranks;
        const dims: (Expr | null)[] = [];
        for (const r of ordered) {
          const sizes = kids(r).map((s) => expr(s.type === 'argument' ? kids(s)[0] : s));
          const commas = (r.text.match(/,/g) ?? []).length + 1;
          if (sizes.length) dims.push(...sizes);
          else for (let i = 0; i < commas; i++) dims.push(null);
        }
        if (initNode) return arrInit(initNode, { ...base, arr: dims.length });
        return { k: 'newarr', ln, ty: base, dims };
      }
      case 'implicit_array_creation_expression': {
        const initNode = kids(n).find((k) => k.type === 'initializer_expression')!;
        return arrInit(initNode, ty('auto', 1));
      }
      case 'initializer_expression':
        return arrInit(n, ty('auto', 1));
      case 'tuple_expression':
        return { k: 'list', ln, kind: 'tuple', items: kids(n).map((a) => expr(a.type === 'argument' ? kids(a)[0] : a)) };
      case 'interpolated_string_expression': {
        const parts: (string | { e: Expr; spec?: string })[] = [];
        for (const c of kids(n)) {
          if (c.type === 'interpolated_string_text' || c.type === 'string_content') parts.push(unescape(c.text));
          else if (c.type === 'interpolation') {
            const ks = kids(c);
            const fmt = ks.find((k) => k.type === 'interpolation_format_clause');
            const align = ks.find((k) => k.type === 'interpolation_alignment_clause');
            const main = ks.find((k) => k !== fmt && k !== align)!;
            parts.push({ e: expr(main), spec: fmt ? fmt.text.replace(/^:/, '') : align ? ',' + align.text.replace(/^,/, '') : undefined });
          } else if (c.type === 'escape_sequence') parts.push(unescape(c.text));
        }
        return { k: 'fstr', ln, parts };
      }
      case 'generic_name':
        return { k: 'name', ln, name: kids(n).find((k) => k.type === 'identifier')!.text };
      case 'qualified_name':
        return { k: 'name', ln, name: n.text.split('.').pop()! };
      case 'lambda_expression':
        return unsupported(n, 'lambda expressions');
      case 'declaration_expression':
        return unsupported(n, 'out variable declarations');
      default:
        return unsupported(n);
    }
  }

  function walkTop(n: Node) {
    for (const c of kids(n)) {
      switch (c.type) {
        case 'class_declaration':
        case 'struct_declaration':
        case 'record_declaration':
          defineClass(c);
          break;
        case 'namespace_declaration': {
          const b = f(c, 'body');
          if (b) walkTop(b);
          break;
        }
        case 'file_scoped_namespace_declaration':
          walkTop(c);
          break;
        case 'global_statement':
          topLevel.push(...kids(c).flatMap(stmt));
          break;
        case 'interface_declaration':
        case 'enum_declaration':
          unsupported(c, 'interfaces/enums');
          break;
        default:
          break;
      }
    }
  }
  walkTop(root);
  if (!prog.entry && topLevel.length) {
    prog.funcs['Main'] = [{
      name: 'Main', params: [], body: topLevel, ln: 1, endLn: root.endPosition.row + 1, retTy: ty('void'),
      isStatic: true, indexVars: collectIndexVars(topLevel),
    }];
    prog.entry = { name: 'Main' };
  }
  if (!prog.entry) throw new CompileError('No Main method found. Add `static void Main(string[] args) { ... }` inside a class.', 1);
  return prog;
}
