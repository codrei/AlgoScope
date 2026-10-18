// Java front-end.
import type { Node } from 'web-tree-sitter';
import { AUTO, CompileError, type ClassDef, type Expr, type Func, type Param, type Program, type Stmt, type Ty, type VarDeclItem } from '../ir';
import { allKids, collectIndexVars, endLineOf, f, fields, kids, lineOf, parseNumber, primName, ty, unescape, unsupported } from './util';

export function lowerJava(root: Node): Program {
  const prog: Program = { lang: 'java', funcs: {}, classes: {}, globals: [] };

  function typeOf(n: Node | null): Ty {
    if (!n) return AUTO;
    switch (n.type) {
      case 'integral_type':
      case 'floating_point_type':
      case 'boolean_type':
      case 'void_type':
        return ty(primName(n.text));
      case 'type_identifier':
        return ty(primName(n.text));
      case 'scoped_type_identifier':
        return ty(primName(n.text.split('.').pop()!));
      case 'generic_type': {
        const base = kids(n).find((k) => k.type === 'type_identifier' || k.type === 'scoped_type_identifier')!;
        const ta = kids(n).find((k) => k.type === 'type_arguments');
        return ty(base.text.split('.').pop()!, 0, 0, ta ? kids(ta).map(typeOf) : []);
      }
      case 'array_type': {
        const el = typeOf(f(n, 'element'));
        const dims = (f(n, 'dimensions')?.text.match(/\[/g) ?? []).length;
        return { ...el, arr: el.arr + dims };
      }
      default:
        return ty(primName(n.text));
    }
  }

  const isStatic = (n: Node) => kids(n).some((k) => k.type === 'modifiers' && /\bstatic\b/.test(k.text));

  function params(n: Node | null): Param[] {
    if (!n) return [];
    return kids(n)
      .filter((p) => p.type === 'formal_parameter' || p.type === 'spread_parameter')
      .map((p) => {
        let t = typeOf(f(p, 'type'));
        const dims = f(p, 'dimensions');
        if (dims) t = { ...t, arr: t.arr + (dims.text.match(/\[/g) ?? []).length };
        const name = f(p, 'name') ?? kids(p).find((k) => k.type === 'identifier' || k.type === 'variable_declarator');
        return { name: name!.type === 'variable_declarator' ? f(name!, 'name')!.text : name!.text, ty: t, byRef: false };
      });
  }

  function defineClass(n: Node) {
    const name = f(n, 'name')!.text;
    const cls: ClassDef = { name, fields: [], methods: {}, ctors: [], ln: lineOf(n) };
    const sup = f(n, 'superclass');
    if (sup) cls.base = kids(sup)[0]?.text;
    prog.classes[name] = cls;
    for (const m of kids(f(n, 'body')!)) {
      switch (m.type) {
        case 'field_declaration': {
          const t = typeOf(f(m, 'type'));
          const st = isStatic(m);
          for (const d of fields(m, 'declarator')) {
            const v = f(d, 'value');
            const dims = f(d, 'dimensions');
            const ft = dims ? { ...t, arr: t.arr + (dims.text.match(/\[/g) ?? []).length } : t;
            cls.fields.push({ name: f(d, 'name')!.text, ty: ft, isStatic: st, init: v ? init(v, ft) : undefined });
          }
          break;
        }
        case 'method_declaration': {
          const fn = method(m, name);
          (cls.methods[fn.name] ??= []).push(fn);
          if (fn.name === 'main' && fn.isStatic) prog.entry = { cls: name, name: 'main' };
          break;
        }
        case 'constructor_declaration':
          cls.ctors.push(method(m, name));
          break;
        case 'class_declaration':
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
    const stmts = body ? kids(body).flatMap(stmt) : [];
    const fn: Func = {
      name: f(n, 'name')!.text,
      params: params(f(n, 'parameters')),
      body: stmts,
      ln: lineOf(n),
      endLn: endLineOf(n),
      retTy: n.type === 'constructor_declaration' ? ty('void') : typeOf(f(n, 'type')),
      isStatic: isStatic(n),
      cls,
      indexVars: collectIndexVars(stmts),
    };
    return fn;
  }

  function bodyOf(n: Node | null): Stmt[] {
    if (!n) return [];
    if (n.type === 'block') return [{ k: 'block', ln: lineOf(n), body: kids(n).flatMap(stmt) }];
    return stmt(n);
  }

  const cond = (n: Node) => (n.type === 'parenthesized_expression' || n.type === 'condition' ? kids(n)[0] : n);

  function localDecl(n: Node): Stmt {
    const t = typeOf(f(n, 'type'));
    const decls: VarDeclItem[] = fields(n, 'declarator').map((d) => {
      const v = f(d, 'value');
      return { name: f(d, 'name')!.text, init: v ? init(v, t) : undefined };
    });
    return { k: 'vardecl', ln: lineOf(n), ty: t, decls };
  }

  function init(v: Node, t: Ty): Expr {
    if (v.type === 'array_initializer') return arrInit(v, t);
    return expr(v);
  }

  function arrInit(n: Node, t: Ty): Expr {
    const elem: Ty = { ...t, arr: Math.max(0, t.arr - 1) };
    return {
      k: 'newarr', ln: lineOf(n), ty: { ...t, arr: 0 }, dims: [null],
      init: { k: 'list', ln: lineOf(n), kind: 'init', items: kids(n).map((c) => (c.type === 'array_initializer' ? arrInit(c, elem) : expr(c))) },
    };
  }

  function stmt(n: Node): Stmt[] {
    const ln = lineOf(n);
    switch (n.type) {
      case 'block':
        return [{ k: 'block', ln, body: kids(n).flatMap(stmt) }];
      case 'local_variable_declaration':
        return [localDecl(n)];
      case 'expression_statement':
        return [{ k: 'expr', ln, e: expr(kids(n)[0]) }];
      case 'if_statement': {
        const c = cond(f(n, 'condition')!);
        const alt = f(n, 'alternative');
        return [{ k: 'if', ln, c: expr(c), src: c.text, then: bodyOf(f(n, 'consequence')), else: alt ? bodyOf(alt) : undefined }];
      }
      case 'while_statement': {
        const c = cond(f(n, 'condition')!);
        return [{ k: 'while', ln, c: expr(c), src: c.text, body: bodyOf(f(n, 'body')) }];
      }
      case 'do_statement': {
        const cn = f(n, 'condition')!;
        const c = cond(cn);
        return [{ k: 'dowhile', ln, c: expr(c), src: c.text, condLn: lineOf(cn), body: bodyOf(f(n, 'body')) }];
      }
      case 'for_statement': {
        const init: Stmt[] = fields(n, 'init').map((i) =>
          i.type === 'local_variable_declaration' ? localDecl(i) : ({ k: 'expr', ln, e: expr(i) } as Stmt),
        );
        const c = f(n, 'condition');
        return [{
          k: 'for', ln, init, c: c ? expr(c) : undefined, src: c ? c.text : 'true',
          update: fields(n, 'update').map(expr), body: bodyOf(f(n, 'body')),
        }];
      }
      case 'enhanced_for_statement': {
        const name = f(n, 'name')!;
        return [{
          k: 'foreach', ln, target: { k: 'name', ln, name: name.text }, ty: typeOf(f(n, 'type')),
          iter: expr(f(n, 'value')!), body: bodyOf(f(n, 'body')),
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
      case 'switch_expression':
      case 'switch_statement': {
        const e = expr(cond(f(n, 'condition')!));
        const cases: { tests: Expr[] | null; body: Stmt[] }[] = [];
        const body = f(n, 'body')!;
        for (const g of kids(body)) {
          if (g.type === 'switch_block_statement_group' || g.type === 'switch_rule') {
            const labels = kids(g).filter((k) => k.type === 'switch_label');
            const rest = kids(g).filter((k) => k.type !== 'switch_label');
            const isDefault = labels.some((l) => l.text.startsWith('default'));
            const tests = labels.flatMap((l) => kids(l).map(expr));
            let stmts = rest.flatMap(stmt);
            if (g.type === 'switch_rule') stmts = [...stmts, { k: 'break', ln: lineOf(g) }];
            cases.push({ tests: isDefault ? null : tests, body: stmts });
          }
        }
        return [{ k: 'switch', ln, e, cases }];
      }
      case 'try_statement':
      case 'try_with_resources_statement': {
        const b = f(n, 'body');
        return b ? bodyOf(b) : [];
      }
      case 'throw_statement':
        return [{ k: 'unsupported', ln, what: 'throw (exceptions)' }];
      case 'local_class_declaration':
      case 'class_declaration':
        defineClass(n);
        return [];
      case ';':
      case 'empty_statement':
        return [];
      default:
        return unsupported(n);
    }
  }

  function str(n: Node): string {
    return unescape(n.text.replace(/^"/, '').replace(/"$/, ''));
  }

  function expr(n: Node): Expr {
    const ln = lineOf(n);
    switch (n.type) {
      case 'decimal_integer_literal':
      case 'hex_integer_literal':
      case 'octal_integer_literal':
      case 'binary_integer_literal':
      case 'decimal_floating_point_literal':
      case 'hex_floating_point_literal': {
        const { v, float } = parseNumber(n.text);
        return { k: 'num', ln, v, float };
      }
      case 'string_literal':
        return { k: 'str', ln, v: str(n) };
      case 'text_block':
        return { k: 'str', ln, v: n.text.replace(/^"""\s*\n?/, '').replace(/"""$/, '') };
      case 'character_literal':
        return { k: 'char', ln, v: unescape(n.text.slice(1, -1)).charCodeAt(0) };
      case 'true':
        return { k: 'bool', ln, v: true };
      case 'false':
        return { k: 'bool', ln, v: false };
      case 'null_literal':
        return { k: 'null', ln };
      case 'identifier':
      case 'type_identifier':
        return { k: 'name', ln, name: n.text };
      case 'this':
        return { k: 'this', ln };
      case 'parenthesized_expression':
        return expr(kids(n)[0]);
      case 'binary_expression':
        return { k: 'bin', ln, op: f(n, 'operator')!.text, l: expr(f(n, 'left')!), r: expr(f(n, 'right')!) };
      case 'unary_expression':
        return { k: 'un', ln, op: f(n, 'operator')!.text, e: expr(f(n, 'operand')!) };
      case 'update_expression': {
        const ch = allKids(n);
        const prefix = !ch[0].isNamed;
        const op = (prefix ? ch[0] : ch[ch.length - 1]).text as '++' | '--';
        const target = kids(n)[0];
        return { k: 'incdec', ln, op, prefix, target: expr(target) };
      }
      case 'assignment_expression':
        return { k: 'assign', ln, op: f(n, 'operator')!.text, target: expr(f(n, 'left')!), value: expr(f(n, 'right')!) };
      case 'ternary_expression':
        return { k: 'cond', ln, c: expr(f(n, 'condition')!), t: expr(f(n, 'consequence')!), f: expr(f(n, 'alternative')!) };
      case 'method_invocation': {
        const obj = f(n, 'object');
        const name = f(n, 'name')!.text;
        const args = kids(f(n, 'arguments')!).map(expr);
        const callee: Expr = obj ? { k: 'member', ln, obj: expr(obj), name } : { k: 'name', ln, name };
        return { k: 'call', ln, callee, args };
      }
      case 'field_access':
        return { k: 'member', ln, obj: expr(f(n, 'object')!), name: f(n, 'field')!.text };
      case 'array_access':
        return { k: 'index', ln, obj: expr(f(n, 'array')!), idx: expr(f(n, 'index')!) };
      case 'cast_expression':
        return { k: 'cast', ln, ty: typeOf(f(n, 'type')), e: expr(f(n, 'value')!) };
      case 'object_creation_expression':
        return { k: 'newobj', ln, ty: typeOf(f(n, 'type')), args: kids(f(n, 'arguments')!).map(expr) };
      case 'array_creation_expression': {
        const t = typeOf(f(n, 'type'));
        const dimExprs = fields(n, 'dimensions').filter((d) => d.type === 'dimensions_expr').map((d) => expr(kids(d)[0]));
        const extra = fields(n, 'dimensions').filter((d) => d.type === 'dimensions');
        const extraCount = extra.reduce((s, d) => s + (d.text.match(/\[/g) ?? []).length, 0);
        const v = f(n, 'value');
        if (v) {
          const total = dimExprs.length + extraCount;
          return arrInit(v, { ...t, arr: total });
        }
        return { k: 'newarr', ln, ty: t, dims: [...dimExprs, ...Array(extraCount).fill(null)] };
      }
      case 'array_initializer':
        return arrInit(n, ty('auto', 1));
      case 'instanceof_expression':
        return unsupported(n, 'instanceof');
      case 'lambda_expression':
        return unsupported(n, 'lambda expressions');
      case 'method_reference':
        return unsupported(n, 'method references');
      case 'class_literal':
        return unsupported(n);
      default:
        return unsupported(n);
    }
  }

  for (const n of kids(root)) {
    if (n.type === 'class_declaration' || n.type === 'record_declaration') defineClass(n);
    else if (n.type === 'interface_declaration' || n.type === 'enum_declaration') unsupported(n, 'interfaces/enums');
  }
  if (!prog.entry) throw new CompileError('No main method found. Add `public static void main(String[] args) { ... }` inside a class.', 1);
  return prog;
}
