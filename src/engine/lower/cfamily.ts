// C and C++ front-end (both parsed with the tree-sitter C++ grammar).
import type { Node } from 'web-tree-sitter';
import type { CatchClause, ClassDef, Expr, FieldDef, Func, Lang, Param, Program, Stmt, Ty, VarDeclItem } from '../ir';
import { AUTO, CompileError } from '../ir';
import {
  allKids, collectIndexVars, endLineOf, f, fail, fields, kids, lineOf, parseNumber, primName, ty, unescape, unsupported,
} from './util';

interface Declarator {
  name: string;
  ptr: number;
  ref: boolean;
  dims: (Expr | null)[];
  params?: Node;
  cls?: string;
  node: Node;
}

export function lowerCFamily(root: Node, lang: Lang, fix?: { source: string; swapped: Set<number> }, requireEntry = true): Program {
  const prog: Program = { lang, funcs: Object.create(null), classes: Object.create(null), globals: [] };
  // source text of a node, with any protected '<' restored
  const txt = (n: Node) => (fix ? fix.source.slice(n.startIndex, n.endIndex) : n.text);
  const typedefs = new Map<string, string>();
  // template type parameters (T, U...) are treated as "any type"
  const typeParams = new Set<string>();
  const templateParams = (n: Node) => {
    const ps = f(n, 'parameters');
    if (ps) for (const p of kids(ps)) {
      const id = kids(p).find((k) => k.type === 'type_identifier');
      if (id) typeParams.add(id.text);
    }
  };
  let lambdaSeq = 0;

  // ---------- types ----------
  function typeOf(n: Node | null): Ty {
    if (!n) return AUTO;
    switch (n.type) {
      case 'primitive_type':
      case 'sized_type_specifier':
        return ty(primName(n.text));
      case 'type_identifier': {
        if (typeParams.has(n.text)) return AUTO;
        const t = typedefs.get(n.text) ?? n.text;
        return ty(primName(t));
      }
      case 'placeholder_type_specifier':
      case 'auto':
        return AUTO;
      case 'struct_specifier':
      case 'class_specifier':
      case 'union_specifier': {
        const name = f(n, 'name');
        if (f(n, 'body')) defineClass(n);
        return ty(name ? name.text : 'anon');
      }
      case 'enum_specifier':
        return ty('int');
      case 'qualified_identifier': {
        const last = f(n, 'name');
        return last ? typeOf(last) : ty(n.text.replace(/^std::/, ''));
      }
      case 'template_type': {
        const name = f(n, 'name')!.text.replace(/^std::/, '');
        const argsNode = f(n, 'arguments');
        const args = argsNode ? kids(argsNode).map((a) => typeOf(a.type === 'type_descriptor' ? a : a)) : [];
        return ty(name, 0, 0, args);
      }
      case 'type_descriptor': {
        const base = typeOf(f(n, 'type'));
        const d = f(n, 'declarator');
        let ptr = 0;
        let cur: Node | null = d;
        while (cur) {
          if (cur.type === 'abstract_pointer_declarator') ptr++;
          cur = f(cur, 'declarator');
        }
        return { ...base, ptr: base.ptr + ptr };
      }
      default:
        return ty(primName(n.text.replace(/^std::/, '')));
    }
  }

  function declTypeNode(n: Node): Node | null {
    return f(n, 'type');
  }

  // ---------- declarators ----------
  function unwrap(d: Node | null): Declarator {
    const out: Declarator = { name: '', ptr: 0, ref: false, dims: [], node: d! };
    let cur: Node | null = d;
    while (cur) {
      switch (cur.type) {
        case 'identifier':
        case 'field_identifier':
        case 'type_identifier':
          out.name = cur.text;
          cur = null;
          break;
        case 'destructor_name':
          out.name = cur.text;
          cur = null;
          break;
        case 'operator_name':
          out.name = cur.text;
          cur = null;
          break;
        case 'qualified_identifier': {
          const scope = f(cur, 'scope');
          if (scope) out.cls = scope.text;
          cur = f(cur, 'name');
          break;
        }
        case 'init_declarator':
          cur = f(cur, 'declarator');
          break;
        case 'pointer_declarator':
          out.ptr++;
          cur = f(cur, 'declarator');
          break;
        case 'reference_declarator':
          out.ref = true;
          cur = kids(cur)[0] ?? null;
          break;
        case 'array_declarator': {
          const size = f(cur, 'size');
          out.dims.unshift(size ? expr(size) : null);
          cur = f(cur, 'declarator');
          break;
        }
        case 'function_declarator':
          out.params = f(cur, 'parameters') ?? undefined;
          cur = f(cur, 'declarator');
          break;
        case 'parenthesized_declarator':
          cur = kids(cur)[0] ?? null;
          break;
        default:
          unsupported(cur, 'this declaration');
      }
    }
    return out;
  }

  function withDecl(base: Ty, d: Declarator): Ty {
    return { ...base, ptr: base.ptr + d.ptr, ref: d.ref || undefined };
  }

  function params(list: Node | undefined): Param[] {
    if (!list) return [];
    const out: Param[] = [];
    for (const p of kids(list)) {
      if (p.type === 'parameter_declaration' || p.type === 'optional_parameter_declaration') {
        const base = typeOf(declTypeNode(p));
        const dn = f(p, 'declarator');
        if (!dn) {
          if (base.base === 'void') continue;
          out.push({ name: `_${out.length}`, ty: base, byRef: false });
          continue;
        }
        const d = unwrap(dn);
        const t = withDecl(base, d);
        if (d.dims.length) t.arr = d.dims.length;
        const def = f(p, 'default_value');
        out.push({ name: d.name, ty: t, byRef: d.ref, def: def ? expr(def) : undefined });
      } else if (p.type === 'variadic_parameter') {
        continue;
      } else unsupported(p, 'this parameter');
    }
    return out;
  }

  // ---------- classes / structs ----------
  function defineClass(n: Node) {
    const nameNode = f(n, 'name');
    const name = nameNode ? nameNode.text : `anon${lineOf(n)}`;
    if (prog.classes[name]) return;
    const cls: ClassDef = { name, fields: [], methods: Object.create(null), ctors: [], ln: lineOf(n) };
    prog.classes[name] = cls;
    const baseClause = kids(n).find((k) => k.type === 'base_class_clause');
    if (baseClause) {
      const b = kids(baseClause).find((k) => k.type === 'type_identifier' || k.type === 'qualified_identifier');
      if (b) cls.base = b.text;
    }
    const body = f(n, 'body')!;
    for (const m of kids(body)) {
      switch (m.type) {
        case 'field_declaration': {
          const base = typeOf(declTypeNode(m));
          const isStatic = allKids(m).some((k) => k.type === 'storage_class_specifier' && k.text === 'static');
          const decls = fields(m, 'declarator');
          const def = f(m, 'default_value');
          for (const dn of decls) {
            const d = unwrap(dn);
            if (d.params) continue; // method prototype
            const t = withDecl(base, d);
            const fd: FieldDef = { name: d.name, ty: t, isStatic };
            if (d.dims.length) {
              t.arr = d.dims.length;
              fd.init = { k: 'newarr', ln: lineOf(dn), ty: { ...base, arr: 0 }, dims: d.dims };
            }
            if (def) fd.init = def.type === 'initializer_list' ? initList(def) : expr(def);
            cls.fields.push(fd);
          }
          break;
        }
        case 'function_definition': {
          const fn = funcDef(m, name);
          if (fn.name === name) cls.ctors.push(fn);
          else if (!fn.name.startsWith('~')) (cls.methods[fn.name] ??= []).push(fn);
          break;
        }
        case 'declaration': {
          // constructor declared with initializer list body-less, or static fields
          break;
        }
        case 'access_specifier':
        case 'template_declaration': {
          templateParams(m);
          const inner = kids(m).find((k) => k.type === 'function_definition');
          if (inner) {
            const fn = funcDef(inner, name);
            if (fn.name === name) cls.ctors.push(fn);
            else (cls.methods[fn.name] ??= []).push(fn);
          }
          break;
        }
        case 'friend_declaration':
        case 'using_declaration':
        case 'alias_declaration':
        case 'type_definition':
          break;
        default:
          break;
      }
    }
  }

  // ---------- functions ----------
  function funcDef(n: Node, cls?: string): Func {
    const d = unwrap(f(n, 'declarator'));
    const retBase = f(n, 'type') ? typeOf(f(n, 'type')) : ty('void');
    const body: Stmt[] = [];
    const inits = kids(n).find((k) => k.type === 'field_initializer_list');
    if (inits) {
      for (const fi of kids(inits)) {
        const fname = kids(fi).find((k) => k.type === 'field_identifier' || k.type === 'identifier');
        const args = kids(fi).find((k) => k.type === 'argument_list' || k.type === 'initializer_list');
        if (!fname || !args) continue;
        const a = kids(args).map(expr);
        body.push({
          k: 'expr',
          ln: lineOf(fi),
          e: {
            k: 'assign', ln: lineOf(fi), op: '=',
            target: { k: 'member', ln: lineOf(fi), obj: { k: 'this', ln: lineOf(fi) }, name: fname.text },
            value: {
              k: 'call', ln: lineOf(fi), callee: { k: 'name', ln: lineOf(fi), name: '__fieldinit__' },
              args: [{ k: 'str', ln: lineOf(fi), v: fname.text }, ...a],
            },
          },
        });
      }
    }
    const b = f(n, 'body');
    if (b) body.push(...block(b));
    const owner = cls ?? d.cls;
    const fn: Func = {
      name: d.name,
      params: params(d.params),
      body,
      ln: lineOf(n),
      endLn: endLineOf(n),
      retTy: withDecl(retBase, { ...d, ref: false }),
      isStatic: !owner,
      cls: owner,
      indexVars: {},
    };
    fn.indexVars = collectIndexVars(body);
    return fn;
  }

  // ---------- statements ----------
  function block(n: Node): Stmt[] {
    if (n.type === 'compound_statement') return kids(n).flatMap(stmt);
    return stmt(n);
  }

  function bodyOf(n: Node | null): Stmt[] {
    if (!n) return [];
    if (n.type === 'compound_statement') return [{ k: 'block', ln: lineOf(n), body: block(n) }];
    return stmt(n);
  }

  function condOf(n: Node): Node {
    // condition_clause / parenthesized_expression wrap the real expression
    if (n.type === 'condition_clause') {
      const v = f(n, 'value') ?? kids(n)[0];
      return v;
    }
    if (n.type === 'parenthesized_expression') return kids(n)[0];
    return n;
  }

  function stmt(n: Node): Stmt[] {
    const ln = lineOf(n);
    switch (n.type) {
      case 'compound_statement':
        return [{ k: 'block', ln, body: block(n) }];
      case 'declaration':
        return declaration(n);
      case 'expression_statement': {
        const e = kids(n)[0];
        if (!e) return [];
        if (e.type === 'comma_expression') return commaList(e).map((x) => ({ k: 'expr', ln, e: x }) as Stmt);
        return [{ k: 'expr', ln, e: expr(e) }];
      }
      case 'if_statement': {
        const cn = condOf(f(n, 'condition')!);
        const alt = f(n, 'alternative');
        let elseBody: Stmt[] | undefined;
        if (alt) {
          const inner = alt.type === 'else_clause' ? kids(alt)[0] : alt;
          elseBody = inner ? bodyOf(inner) : [];
        }
        return [{ k: 'if', ln, c: expr(cn), src: txt(cn), then: bodyOf(f(n, 'consequence')), else: elseBody }];
      }
      case 'while_statement': {
        const cn = condOf(f(n, 'condition')!);
        return [{ k: 'while', ln, c: expr(cn), src: txt(cn), body: bodyOf(f(n, 'body')) }];
      }
      case 'do_statement': {
        const cnode = f(n, 'condition')!;
        const cn = condOf(cnode);
        return [{ k: 'dowhile', ln, c: expr(cn), src: txt(cn), condLn: lineOf(cnode), body: bodyOf(f(n, 'body')) }];
      }
      case 'for_statement': {
        const init: Stmt[] = [];
        const ini = f(n, 'initializer');
        if (ini) {
          if (ini.type === 'declaration') init.push(...declaration(ini));
          else if (ini.type === 'comma_expression') commaList(ini).forEach((e) => init.push({ k: 'expr', ln, e }));
          else init.push({ k: 'expr', ln, e: expr(ini) });
        }
        const c = f(n, 'condition');
        const upd = f(n, 'update');
        const update = upd ? (upd.type === 'comma_expression' ? commaList(upd) : [expr(upd)]) : [];
        return [{ k: 'for', ln, init, c: c ? expr(c) : undefined, src: c ? txt(c) : 'true', update, body: bodyOf(f(n, 'body')) }];
      }
      case 'for_range_loop': {
        const t = typeOf(f(n, 'type'));
        const dn = f(n, 'declarator');
        // C++17: for (auto [name, qty] : v)
        const sb = dn && (dn.type === 'structured_binding_declarator' ? dn : kids(dn).find((k) => k.type === 'structured_binding_declarator'));
        if (sb) {
          const items = kids(sb).filter((k) => k.type === 'identifier').map((k) => ({ k: 'name', ln, name: k.text }) as Expr);
          return [{ k: 'foreach', ln, target: { k: 'list', ln, kind: 'tuple', items }, ty: t, iter: expr(f(n, 'right')!), body: bodyOf(f(n, 'body')) }];
        }
        const d = unwrap(dn);
        return [{
          k: 'foreach', ln, target: { k: 'name', ln, name: d.name }, ty: withDecl(t, d), iter: expr(f(n, 'right')!),
          body: bodyOf(f(n, 'body')),
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
        const e = expr(condOf(f(n, 'condition')!));
        const cases: { tests: Expr[] | null; body: Stmt[] }[] = [];
        for (const c of kids(f(n, 'body')!)) {
          if (c.type !== 'case_statement') continue;
          const v = f(c, 'value');
          const bodyNodes = kids(c).filter((k) => !v || k.startIndex !== v.startIndex);
          cases.push({ tests: v ? [expr(v)] : null, body: bodyNodes.flatMap(stmt) });
        }
        return [{ k: 'switch', ln, e, cases }];
      }
      case 'struct_specifier':
      case 'class_specifier':
        defineClass(n);
        return [];
      case 'type_definition': {
        typedef(n);
        return [];
      }
      case 'try_statement': {
        const handlers: CatchClause[] = [];
        for (const c of kids(n)) {
          if (c.type !== 'catch_clause') continue;
          const ps = f(c, 'parameters');
          const pd = ps && kids(ps).find((k) => k.type === 'parameter_declaration');
          const t = pd && f(pd, 'type');
          const dn = pd && f(pd, 'declarator');
          handlers.push({
            types: t ? [t.text.replace(/^std::/, '')] : null,
            name: dn ? unwrap(dn).name : undefined,
            ln: lineOf(c),
            body: block(f(c, 'body')!),
          });
        }
        return [{ k: 'try', ln, body: block(f(n, 'body')!), handlers }];
      }
      case 'throw_statement': {
        const e = kids(n)[0];
        return [{ k: 'throw', ln, e: e ? expr(e) : undefined }];
      }
      case 'labeled_statement':
      case 'goto_statement':
        return unsupported(n, 'goto/labels');
      case 'comment':
      case 'preproc_include':
      case 'using_declaration':
      case 'alias_declaration':
        return [];
      default:
        if (n.type.startsWith('preproc')) return [];
        return unsupported(n);
    }
  }

  function typedef(n: Node) {
    const t = f(n, 'type');
    if (t && (t.type === 'struct_specifier' || t.type === 'class_specifier') && f(t, 'body')) {
      if (!f(t, 'name')) {
        // typedef struct { ... } Name;
        const alias = fields(n, 'declarator').map((d) => unwrap(d).name)[0];
        if (alias) {
          const fake = alias;
          const cls: ClassDef = { name: fake, fields: [], methods: Object.create(null), ctors: [], ln: lineOf(n) };
          prog.classes[fake] = cls;
          for (const m of kids(f(t, 'body')!)) {
            if (m.type !== 'field_declaration') continue;
            const base = typeOf(declTypeNode(m));
            for (const dn of fields(m, 'declarator')) {
              const d = unwrap(dn);
              const tt = withDecl(base, d);
              const fd: FieldDef = { name: d.name, ty: tt, isStatic: false };
              if (d.dims.length) {
                tt.arr = d.dims.length;
                fd.init = { k: 'newarr', ln: lineOf(dn), ty: { ...base, arr: 0 }, dims: d.dims };
              }
              cls.fields.push(fd);
            }
          }
        }
        return;
      }
      defineClass(t);
    }
    const target = t ? typeOf(t).base : 'int';
    for (const dn of fields(n, 'declarator')) {
      const d = unwrap(dn);
      if (d.name && d.name !== target) typedefs.set(d.name, target);
    }
  }

  function commaList(n: Node): Expr[] {
    if (n.type !== 'comma_expression') return [expr(n)];
    return [...commaList(f(n, 'left')!), ...commaList(f(n, 'right')!)];
  }

  function initList(n: Node): Expr {
    return {
      k: 'list', ln: lineOf(n), kind: 'init',
      items: kids(n).map((c) => (c.type === 'initializer_list' ? initList(c) : expr(c))),
    };
  }

  function declaration(n: Node, local = true): Stmt[] {
    const ln = lineOf(n);
    const base = typeOf(declTypeNode(n));
    const decls: VarDeclItem[] = [];
    const out: Stmt[] = [];
    for (const dn of fields(n, 'declarator')) {
      // C++17: auto [a, b] = p;  declare a and b, then unpack
      const sb = dn.type === 'init_declarator' ? kids(dn).find((k) => k.type === 'structured_binding_declarator') : undefined;
      if (sb) {
        const names = kids(sb).filter((k) => k.type === 'identifier').map((k) => k.text);
        out.push({ k: 'vardecl', ln, ty: base, decls: names.map((name) => ({ name })) });
        out.push({ k: 'expr', ln, e: { k: 'assign', ln, op: '=', target: { k: 'list', ln, kind: 'tuple', items: names.map((name) => ({ k: 'name', ln, name }) as Expr) }, value: expr(f(dn, 'value')!) } });
        continue;
      }
      const d = unwrap(dn);
      if (d.params) {
        // inside a function, "vector<int> L(n1);" is a constructor call, not a prototype
        if (!local || dn.type !== 'function_declarator') continue;
        const args = kids(d.params).map((p) => {
          const t = f(p, 'type');
          if (p.type === 'parameter_declaration' && t && !f(p, 'declarator')) return { k: 'name', ln: lineOf(p), name: t.text } as Expr;
          return unsupported(p, 'this declaration');
        });
        decls.push({ name: d.name, ctorArgs: args });
        continue;
      }
      const item: VarDeclItem = { name: d.name };
      if (d.ptr) item.ptr = d.ptr;
      if (d.ref) item.ref = true;
      if (d.dims.length) item.dims = d.dims;
      if (dn.type === 'init_declarator') {
        const v = f(dn, 'value')!;
        if (v.type === 'argument_list') item.ctorArgs = kids(v).map(expr);
        else if (v.type === 'initializer_list') item.init = initList(v);
        else item.init = expr(v);
      }
      decls.push(item);
    }
    if (!decls.length) return out;
    // per-declarator pointer levels are kept on each item; the shared type is the base
    return [...out, { k: 'vardecl', ln, ty: base, decls }];
  }

  // ---------- expressions ----------
  function expr(n: Node): Expr {
    const ln = lineOf(n);
    switch (n.type) {
      case 'number_literal': {
        const { v, float } = parseNumber(n.text);
        return { k: 'num', ln, v, float };
      }
      case 'string_literal':
      case 'raw_string_literal': {
        const raw = n.text.replace(/^(u8|u|U|L)?"/, '').replace(/"$/, '');
        return { k: 'str', ln, v: n.type === 'raw_string_literal' ? raw : unescape(raw) };
      }
      case 'concatenated_string':
        return { k: 'str', ln, v: kids(n).map((k) => (expr(k) as { v: string }).v).join('') };
      case 'char_literal': {
        const raw = unescape(n.text.replace(/^(u8|u|U|L)?'/, '').replace(/'$/, ''));
        return { k: 'char', ln, v: raw.charCodeAt(0) || 0 };
      }
      case 'true':
        return { k: 'bool', ln, v: true };
      case 'false':
        return { k: 'bool', ln, v: false };
      case 'null':
      case 'nullptr':
        return { k: 'null', ln };
      case 'identifier':
      case 'field_identifier':
      case 'type_identifier':
        if (n.text === 'NULL') return { k: 'null', ln };
        return { k: 'name', ln, name: n.text };
      case 'qualified_identifier': {
        const name = f(n, 'name')!;
        const scope = f(n, 'scope');
        if (scope && scope.text !== 'std' && prog.classes[scope.text]) {
          return { k: 'member', ln, obj: { k: 'name', ln, name: scope.text }, name: name.text };
        }
        return expr(name);
      }
      case 'this':
        return { k: 'this', ln };
      case 'parenthesized_expression':
        return expr(kids(n)[0]);
      case 'binary_expression': {
        const opNode = f(n, 'operator')!;
        const op = fix?.swapped.has(opNode.startIndex) ? '<' : opNode.text;
        return { k: 'bin', ln, op, l: expr(f(n, 'left')!), r: expr(f(n, 'right')!) };
      }
      case 'unary_expression':
        return { k: 'un', ln, op: f(n, 'operator')!.text, e: expr(f(n, 'argument')!) };
      case 'pointer_expression': {
        const op = f(n, 'operator')!.text;
        return { k: 'un', ln, op: op === '*' ? 'deref' : 'addr', e: expr(f(n, 'argument')!) };
      }
      case 'update_expression': {
        const op = f(n, 'operator')!;
        const arg = f(n, 'argument')!;
        return { k: 'incdec', ln, op: op.text as '++' | '--', prefix: op.startIndex < arg.startIndex, target: expr(arg) };
      }
      case 'assignment_expression':
        return { k: 'assign', ln, op: f(n, 'operator')!.text, target: expr(f(n, 'left')!), value: rhs(f(n, 'right')!) };
      case 'conditional_expression':
        return { k: 'cond', ln, c: expr(f(n, 'condition')!), t: expr(f(n, 'consequence')!), f: expr(f(n, 'alternative')!) };
      case 'comma_expression': {
        const list = commaList(n);
        return list[list.length - 1];
      }
      case 'call_expression': {
        const fn = f(n, 'function')!;
        const args = kids(f(n, 'arguments')!).map(rhs);
        if (fn.type === 'template_function') {
          const name = f(fn, 'name')!.text.replace(/^std::/, '');
          const targs = kids(f(fn, 'arguments')!).map((a) => typeOf(a));
          if (/^(static|dynamic|reinterpret|const)_cast$/.test(name)) return { k: 'cast', ln, ty: targs[0], e: args[0] };
          if (['vector', 'stack', 'queue', 'deque', 'pair', 'priority_queue', 'list'].includes(name)) {
            return { k: 'newobj', ln, ty: ty(name, 0, 0, targs), args };
          }
          return { k: 'call', ln, callee: { k: 'name', ln, name }, args };
        }
        if (fn.type === 'primitive_type') {
          return { k: 'cast', ln, ty: ty(primName(fn.text)), e: args[0] };
        }
        return { k: 'call', ln, callee: expr(fn), args };
      }
      case 'subscript_expression': {
        const obj = expr(f(n, 'argument')!);
        const idxs = f(n, 'indices') ?? f(n, 'index');
        const ix = idxs ? (idxs.type === 'subscript_argument_list' ? kids(idxs)[0] : idxs) : null;
        if (!ix) fail(n, 'missing array index');
        return { k: 'index', ln, obj, idx: expr(ix) };
      }
      case 'field_expression':
        return { k: 'member', ln, obj: expr(f(n, 'argument')!), name: f(n, 'field')!.text, arrow: f(n, 'operator')?.text === '->' };
      case 'cast_expression':
        return { k: 'cast', ln, ty: typeOf(f(n, 'type')), e: expr(f(n, 'value')!) };
      case 'sizeof_expression': {
        const t = f(n, 'type');
        if (t) return { k: 'sizeof', ln, ty: typeOf(t) };
        const v = f(n, 'value')!;
        const inner = v.type === 'parenthesized_expression' ? kids(v)[0] : v;
        if (inner && inner.type === 'identifier' && (typedefs.has(inner.text) || prog.classes[inner.text])) {
          return { k: 'sizeof', ln, ty: ty(typedefs.get(inner.text) ?? inner.text) };
        }
        return { k: 'sizeof', ln, e: expr(v) };
      }
      case 'new_expression': {
        const t = typeOf(f(n, 'type'));
        const decl = f(n, 'declarator');
        if (decl && decl.type === 'new_declarator') {
          const dims: (Expr | null)[] = [];
          let cur: Node | null = decl;
          while (cur && cur.type === 'new_declarator') {
            const k0 = kids(cur).find((k) => k.type !== 'new_declarator');
            dims.push(k0 ? expr(k0) : null);
            cur = kids(cur).find((k) => k.type === 'new_declarator') ?? null;
          }
          return { k: 'newarr', ln, ty: t, dims };
        }
        const a = f(n, 'arguments');
        if (a && a.type === 'initializer_list' && t.base !== 'auto' && !prog.classes[t.base]) {
          return { k: 'newarr', ln, ty: t, dims: [null], init: initList(a) };
        }
        return { k: 'newobj', ln, ty: t, args: a ? kids(a).map(expr) : [] };
      }
      case 'delete_expression':
        return { k: 'call', ln, callee: { k: 'name', ln, name: 'free' }, args: [] };
      case 'initializer_list':
        return initList(n);
      case 'compound_literal_expression': {
        const v = f(n, 'value')!;
        return { k: 'newobj', ln, ty: typeOf(f(n, 'type')), args: kids(v).map(expr) };
      }
      case 'lambda_expression': {
        // a lambda becomes a nested function that captures the surrounding variables
        const decl = f(n, 'declarator');
        const body = f(n, 'body')!;
        const stmts = block(body);
        const fn: Func = {
          name: 'lambda', params: params(decl ? (f(decl, 'parameters') ?? undefined) : undefined), body: stmts,
          ln, endLn: endLineOf(n), retTy: AUTO, isStatic: true, indexVars: collectIndexVars(stmts),
        };
        const id = `lambda@${ln}:${n.startPosition.column}:${lambdaSeq++}`;
        prog.funcs[id] = [fn];
        return { k: 'call', ln, callee: { k: 'name', ln, name: '__closure__' }, args: [{ k: 'str', ln, v: id }] };
      }
      case 'char':
        return { k: 'char', ln, v: n.text.charCodeAt(0) };
      default:
        return unsupported(n);
    }
  }

  function rhs(n: Node): Expr {
    return n.type === 'initializer_list' ? initList(n) : expr(n);
  }

  // ---------- top level ----------
  function top(n: Node) {
    switch (n.type) {
      case 'function_definition': {
        const fn = funcDef(n);
        if (fn.cls) {
          const cls = prog.classes[fn.cls];
          if (!cls) fail(n, `unknown class ${fn.cls}`);
          if (fn.name === fn.cls) cls.ctors.push(fn);
          else (cls.methods[fn.name] ??= []).push(fn);
        } else (prog.funcs[fn.name] ??= []).push(fn);
        break;
      }
      case 'declaration': {
        const t = f(n, 'type');
        if (t && (t.type === 'struct_specifier' || t.type === 'class_specifier') && f(t, 'body')) defineClass(t);
        prog.globals.push(...declaration(n, false));
        break;
      }
      case 'struct_specifier':
      case 'class_specifier':
        defineClass(n);
        break;
      case 'type_definition':
        typedef(n);
        break;
      case 'preproc_def': {
        const name = f(n, 'name')!.text;
        const val = f(n, 'value');
        if (val) {
          const txt = val.text.trim();
          if (/^[-+]?[0-9.]+[a-zA-Z]*$/.test(txt) || /^0x/i.test(txt)) {
            const { v, float } = parseNumber(txt.replace(/^\+/, ''));
            prog.globals.push({
              k: 'vardecl', ln: lineOf(n), ty: ty(float ? 'double' : 'int'),
              decls: [{ name, init: { k: 'num', ln: lineOf(n), v, float } }],
            });
          }
        }
        break;
      }
      case 'namespace_definition': {
        const body = f(n, 'body');
        if (body) kids(body).forEach(top);
        break;
      }
      case 'template_declaration': {
        templateParams(n);
        const inner = kids(n).find((k) => k.type !== 'template_parameter_list');
        if (inner && inner.type !== 'class_specifier' && inner.type !== 'struct_specifier') top(inner);
        break;
      }
      case 'expression_statement':
        if (kids(n).length) unsupported(n, 'code outside of a function');
        break;
      default:
        break;
    }
  }

  // classes first so types resolve, then everything else
  const tops = kids(root);
  for (const n of tops) {
    if (n.type === 'type_definition') typedef(n);
    if (n.type === 'struct_specifier' || n.type === 'class_specifier') defineClass(n);
    if (n.type === 'template_declaration') {
      templateParams(n);
      const inner = kids(n).find((k) => k.type === 'class_specifier' || k.type === 'struct_specifier');
      if (inner) defineClass(inner);
    }
  }
  for (const n of tops) {
    if (n.type === 'type_definition' || n.type === 'struct_specifier' || n.type === 'class_specifier') continue;
    top(n);
  }
  if (!prog.funcs['main'] && requireEntry) {
    throw new CompileError('No main() function found. Add `int main() { ... }` that calls your code.', 1);
  }
  prog.entry = { name: 'main' };
  return prog;
}
