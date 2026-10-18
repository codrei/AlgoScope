// "Add a main() for me": slides often show just a function. This writes a small
// main() that calls it with sample values and prints what happened.
import type { Func, Lang, Param, Program, Stmt, Expr } from './ir';

const SAMPLE = [5, 1, 4, 2, 8, 3];

function isArrayParam(p: Param, fn?: Func): boolean {
  if (p.ty.arr > 0 || (p.ty.ptr > 0 && ['int', 'double', 'char'].includes(p.ty.base)) || ['vector', 'List', 'ArrayList', 'list'].includes(p.ty.base)) return true;
  // untyped (Python): the function indexes it, e.g. arr[mid]
  return p.ty.base === 'auto' && !!fn && p.name in fn.indexVars;
}

/** Every function called anywhere inside these statements. */
function callsIn(body: Stmt[], out: Set<string>) {
  const visitE = (e: Expr | undefined): void => {
    if (!e || typeof e !== 'object') return;
    if (e.k === 'call' && e.callee.k === 'name') out.add(e.callee.name);
    if (e.k === 'call' && e.callee.k === 'member') out.add(e.callee.name);
    for (const v of Object.values(e)) {
      if (Array.isArray(v)) v.forEach((x) => x && typeof x === 'object' && 'k' in x && visitE(x as Expr));
      else if (v && typeof v === 'object' && 'k' in v) visitE(v as Expr);
    }
  };
  const visitS = (s: Stmt): void => {
    for (const v of Object.values(s)) {
      if (Array.isArray(v)) {
        v.forEach((x) => {
          if (x && typeof x === 'object' && 'k' in x) {
            if (['vardecl', 'expr', 'if', 'while', 'dowhile', 'for', 'foreach', 'return', 'block', 'switch', 'try', 'throw'].includes((x as Stmt).k)) visitS(x as Stmt);
            else visitE(x as Expr);
          } else if (x && typeof x === 'object') {
            for (const y of Object.values(x)) {
              if (Array.isArray(y)) y.forEach((z) => z && typeof z === 'object' && 'k' in z && (('ln' in z && ['vardecl', 'expr', 'if', 'while', 'for', 'return', 'block'].includes((z as Stmt).k)) ? visitS(z as Stmt) : visitE(z as Expr)));
              else if (y && typeof y === 'object' && 'k' in y) visitE(y as Expr);
            }
          }
        });
      } else if (v && typeof v === 'object' && 'k' in v) visitE(v as Expr);
    }
  };
  body.forEach(visitS);
}

/** The function a student most likely wants to run: one nobody else calls, defined last. */
function pickTarget(funcs: Func[]): Func | undefined {
  const called = new Set<string>();
  funcs.forEach((f) => callsIn(f.body, called));
  const roots = funcs.filter((f) => !called.has(f.name));
  return (roots.length ? roots : funcs)[(roots.length ? roots : funcs).length - 1];
}

interface Plan {
  decls: string[];
  args: string[];
  arrays: { name: string; size: string }[];
}

function plan(lang: Lang, fn: Func): Plan {
  const decls: string[] = [];
  const args: string[] = [];
  const arrays: { name: string; size: string }[] = [];
  const hasArray = fn.params.some((p) => isArrayParam(p, fn));
  // searching needs sorted data and a key that is in it
  const searching = /search|find|bin|lookup/i.test(fn.name);
  const sample = searching ? [...SAMPLE].sort((a, b) => a - b) : SAMPLE;
  const n = sample.length;
  for (const p of fn.params) {
    const name = p.name.startsWith('_') ? 'x' : p.name;
    const lname = name.toLowerCase();
    if (isArrayParam(p, fn)) {
      const elem = p.ty.base === 'double' ? sample.map((v) => v + 0.5) : sample;
      const list = elem.join(', ');
      if (lang === 'c' || lang === 'cpp') {
        if (p.ty.base === 'vector') decls.push(`vector<int> ${name} = {${list}};`);
        else decls.push(`${p.ty.base === 'double' ? 'double' : 'int'} ${name}[] = {${list}};`);
      } else if (lang === 'java') {
        if (['List', 'ArrayList'].includes(p.ty.base)) decls.push(`List<Integer> ${name} = new ArrayList<>(Arrays.asList(${list}));`);
        else decls.push(`${p.ty.base === 'double' ? 'double' : 'int'}[] ${name} = {${list}};`);
      } else if (lang === 'csharp') {
        if (p.ty.base === 'List') decls.push(`var ${name} = new List<int> { ${list} };`);
        else decls.push(`${p.ty.base === 'double' ? 'double' : 'int'}[] ${name} = { ${list} };`);
      } else decls.push(`${name} = [${list}]`);
      arrays.push({ name, size: String(n) });
      args.push(name);
      continue;
    }
    let value: string;
    const base = p.ty.base;
    if (base === 'double') value = '2.5';
    else if (base === 'char') value = "'A'";
    else if (base === 'bool') value = lang === 'python' ? 'True' : 'true';
    else if (base === 'string') value = '"hello"';
    else if (p.ty.ptr || (base !== 'int' && base !== 'auto')) value = lang === 'python' ? 'None' : lang === 'c' ? 'NULL' : lang === 'cpp' ? 'nullptr' : 'null';
    else if (/^(n|size|len|length|count|num|array_size|arraysize|sz)$/.test(lname)) value = String(n);
    else if (/^(low|lo|start|left|l|first|begin|from|i|s)$/.test(lname)) value = '0';
    else if (/^(high|hi|end|right|r|last|to|j|e)$/.test(lname)) value = String(n - 1);
    else if (/^(x|key|target|value|val|item|search|find|k|element|data|num1)$/.test(lname)) value = hasArray ? String(sample[3]) : '5';
    else value = '5';
    if (lang === 'python') decls.push(`${name} = ${value}`);
    else if (lang === 'csharp' || lang === 'java') decls.push(`${javaType(p, lang)} ${name} = ${value};`);
    else decls.push(`${cType(p)} ${name} = ${value};`);
    args.push(name);
  }
  return { decls, args, arrays };
}

function cType(p: Param): string {
  if (p.ty.ptr) return `${p.ty.base}*`;
  return p.ty.base === 'auto' ? 'int' : p.ty.base;
}

function javaType(p: Param, lang: Lang): string {
  const b = p.ty.base;
  if (b === 'bool') return lang === 'java' ? 'boolean' : 'bool';
  if (b === 'string') return lang === 'java' ? 'String' : 'string';
  if (b === 'auto') return 'int';
  return b;
}

export interface Suggestion {
  /** the full code with the generated entry point added */
  code: string;
  /** name of the function the generated main() calls */
  calls: string;
}

export function suggestEntry(lang: Lang, source: string, prog: Program): Suggestion | null {
  let funcs: Func[];
  let cls: string | undefined;
  if (lang === 'java' || lang === 'csharp') {
    const classes = Object.values(prog.classes).filter((c) => Object.values(c.methods).flat().some((m) => m.isStatic));
    const c = classes[classes.length - 1] ?? Object.values(prog.classes)[0];
    if (!c) return null;
    cls = c.name;
    funcs = Object.values(c.methods).flat().filter((m) => m.isStatic && !m.name.startsWith('__'));
  } else {
    funcs = Object.entries(prog.funcs).filter(([k]) => !k.includes('@')).map(([, v]) => v[0]);
  }
  const fn = pickTarget(funcs);
  if (!fn) return null;
  const pl = plan(lang, fn);
  const call = `${fn.name}(${pl.args.join(', ')})`;
  const returns = fn.retTy.base !== 'void' && !(lang === 'python' && !returnsValue(fn.body));
  const ind = lang === 'java' || lang === 'csharp' ? '        ' : '    ';
  const lines: string[] = [];
  const printArr = (a: { name: string; size: string }) => {
    switch (lang) {
      case 'c': return [`printf("${a.name}:");`, `for (int i = 0; i < ${a.size}; i++) printf(" %d", ${a.name}[i]);`, 'printf("\\n");'];
      case 'cpp': return [`cout << "${a.name}:";`, `for (int i = 0; i < ${a.size}; i++) cout << " " << ${a.name}[i];`, 'cout << endl;'];
      case 'java': return [`System.out.println("${a.name}: " + Arrays.toString(${a.name}));`];
      case 'csharp': return [`Console.WriteLine("${a.name}: " + string.Join(" ", ${a.name}));`];
      default: return [`print("${a.name}:", *${a.name})`];
    }
  };
  if (returns) {
    switch (lang) {
      case 'c': lines.push(`printf("${fn.name} returned %d\\n", ${call});`); break;
      case 'cpp': lines.push(`cout << "${fn.name} returned " << ${call} << endl;`); break;
      case 'java': lines.push(`System.out.println("${fn.name} returned " + ${call});`); break;
      case 'csharp': lines.push(`Console.WriteLine("${fn.name} returned " + ${call});`); break;
      default: lines.push(`print("${fn.name} returned", ${call})`);
    }
  } else lines.push(lang === 'python' ? call : `${call};`);
  for (const a of pl.arrays) lines.push(...printArr(a));
  const body = [...pl.decls, ...lines];
  let code: string;
  const header = lang === 'python' ? `\n\n# Added by AlgoScope: sample values to try ${fn.name}()\n` : `\n// Added by AlgoScope: a main() that tries ${fn.name}() with sample values\n`;
  switch (lang) {
    case 'c':
      code = `${source.trimEnd()}\n${header}int main() {\n${body.map((l) => ind + l).join('\n')}\n    return 0;\n}\n`;
      if (!/#include\s*<stdio\.h>/.test(code)) code = `#include <stdio.h>\n${code}`;
      break;
    case 'cpp':
      code = `${source.trimEnd()}\n${header}int main() {\n${body.map((l) => ind + l).join('\n')}\n    return 0;\n}\n`;
      if (!/#include\s*<iostream/.test(code)) code = `#include <iostream>\nusing namespace std;\n${code}`;
      else if (!/using\s+namespace\s+std/.test(code)) code = code.replace(/(#include\s*<iostream[^>]*>)/, '$1\nusing namespace std;');
      break;
    case 'java':
    case 'csharp': {
      const sig = lang === 'java' ? 'public static void main(String[] args)' : 'static void Main(string[] args)';
      const mainText = `\n    ${header.trim()}\n    ${sig} {\n${body.map((l) => ind + l).join('\n')}\n    }\n`;
      const end = source.lastIndexOf('}');
      code = end > 0 ? `${source.slice(0, end).trimEnd()}\n${mainText}}\n` : `${source}\nclass Main {${mainText}}\n`;
      if (lang === 'csharp' && !/using\s+System\s*;/.test(code)) code = `using System;\n${code}`;
      if (lang === 'csharp' && /List</.test(mainText) && !/System\.Collections\.Generic/.test(code)) code = `using System.Collections.Generic;\n${code}`;
      if (lang === 'java' && !/import\s+java\.util\.(\*|Arrays)/.test(code)) code = `import java.util.*;\n${code}`;
      break;
    }
    default:
      code = `${source.trimEnd()}\n${header}${body.join('\n')}\n`;
  }
  void cls;
  return { code, calls: fn.name };
}

function returnsValue(body: Stmt[]): boolean {
  let found = false;
  const visit = (ss: Stmt[]) => ss.forEach((s) => {
    if (s.k === 'return' && s.e) found = true;
    for (const v of Object.values(s)) if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0] && 'ln' in v[0]) visit(v as Stmt[]);
  });
  visit(body);
  return found;
}
