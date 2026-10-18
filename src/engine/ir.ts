// Common program representation shared by every language.
// Each language front-end (src/engine/lower/*) turns its syntax tree into
// these nodes, and the interpreter only ever sees this format.

export type Lang = 'c' | 'cpp' | 'java' | 'csharp' | 'python';

/** A (simplified) static type. `base` is a primitive name, a class name or a library type. */
export interface Ty {
  base: string;
  /** number of array dimensions, e.g. int[][] -> 2 */
  arr: number;
  /** number of pointer levels, e.g. Node** -> 2 */
  ptr: number;
  /** C++ reference parameter (int &x) */
  ref?: boolean;
  /** generic / template arguments, e.g. vector<int> -> [int] */
  args?: Ty[];
}

export const AUTO: Ty = { base: 'auto', arr: 0, ptr: 0 };

export type Expr =
  | { k: 'num'; ln: number; v: number; float: boolean }
  | { k: 'str'; ln: number; v: string }
  | { k: 'char'; ln: number; v: number }
  | { k: 'bool'; ln: number; v: boolean }
  | { k: 'null'; ln: number }
  | { k: 'name'; ln: number; name: string }
  | { k: 'this'; ln: number }
  | { k: 'bin'; ln: number; op: string; l: Expr; r: Expr }
  | { k: 'cmpchain'; ln: number; ops: string[]; items: Expr[] }
  | { k: 'un'; ln: number; op: string; e: Expr }
  | { k: 'assign'; ln: number; op: string; target: Expr; value: Expr }
  | { k: 'incdec'; ln: number; op: '++' | '--'; prefix: boolean; target: Expr }
  | { k: 'cond'; ln: number; c: Expr; t: Expr; f: Expr }
  | { k: 'call'; ln: number; callee: Expr; args: Expr[] }
  | { k: 'index'; ln: number; obj: Expr; idx: Expr }
  | { k: 'slice'; ln: number; obj: Expr; lo?: Expr; hi?: Expr; step?: Expr }
  | { k: 'member'; ln: number; obj: Expr; name: string; arrow?: boolean }
  | { k: 'newarr'; ln: number; ty: Ty; dims: (Expr | null)[]; init?: Expr }
  | { k: 'newobj'; ln: number; ty: Ty; args: Expr[] }
  | { k: 'list'; ln: number; items: Expr[]; kind: 'list' | 'tuple' | 'set' | 'init' }
  | { k: 'dict'; ln: number; entries: [Expr, Expr][] }
  | { k: 'listcomp'; ln: number; body: Expr; clauses: CompClause[] }
  | { k: 'fstr'; ln: number; parts: (string | { e: Expr; spec?: string })[] }
  | { k: 'kw'; ln: number; name: string; value: Expr }
  | { k: 'spread'; ln: number; e: Expr }
  | { k: 'declvar'; ln: number; name: string; ty: Ty }
  | { k: 'cast'; ln: number; ty: Ty; e: Expr }
  | { k: 'sizeof'; ln: number; ty?: Ty; e?: Expr }
  | { k: 'lambda'; ln: number; params: string[]; body: Expr };

export type CompClause = { kind: 'for'; target: Expr; iter: Expr } | { kind: 'if'; c: Expr };

export interface VarDeclItem {
  name: string;
  init?: Expr;
  /** C/C++ array declarator sizes: int a[5][6] -> [5, 6]; int a[] -> [null] */
  dims?: (Expr | null)[];
  /** C++ constructor-style declaration: vector<int> v(5, 0); */
  ctorArgs?: Expr[];
  /** extra pointer levels on this declarator (int *p) */
  ptr?: number;
  /** C++ reference variable (int &r = x): r is another name for x */
  ref?: boolean;
}

export type Stmt =
  | { k: 'vardecl'; ln: number; ty: Ty; decls: VarDeclItem[] }
  | { k: 'expr'; ln: number; e: Expr }
  | { k: 'if'; ln: number; c: Expr; src: string; then: Stmt[]; else?: Stmt[] }
  | { k: 'while'; ln: number; c: Expr; src: string; body: Stmt[] }
  | { k: 'dowhile'; ln: number; c: Expr; src: string; condLn: number; body: Stmt[] }
  | { k: 'for'; ln: number; init: Stmt[]; c?: Expr; src: string; update: Expr[]; body: Stmt[] }
  | { k: 'foreach'; ln: number; target: Expr; ty?: Ty; iter: Expr; body: Stmt[]; elseBody?: Stmt[] }
  | { k: 'return'; ln: number; e?: Expr }
  | { k: 'break'; ln: number }
  | { k: 'continue'; ln: number }
  | { k: 'pass'; ln: number }
  | { k: 'block'; ln: number; body: Stmt[] }
  | { k: 'switch'; ln: number; e: Expr; cases: { tests: Expr[] | null; body: Stmt[] }[] }
  | { k: 'global'; ln: number; names: string[] }
  | { k: 'del'; ln: number; targets: Expr[] }
  | { k: 'try'; ln: number; body: Stmt[]; handlers: CatchClause[]; elseBody?: Stmt[]; finallyBody?: Stmt[] }
  | { k: 'throw'; ln: number; e?: Expr }
  | { k: 'unsupported'; ln: number; what: string };

/** catch (T e) / except T as e. types null = catch everything. */
export interface CatchClause {
  types: string[] | null;
  name?: string;
  ln: number;
  body: Stmt[];
}

export interface Param {
  name: string;
  ty: Ty;
  byRef: boolean;
  def?: Expr;
}

export interface Func {
  name: string;
  params: Param[];
  body: Stmt[];
  ln: number;
  endLn: number;
  retTy: Ty;
  isStatic: boolean;
  cls?: string;
  /** variables used as array indexes inside this function, per array name (for the i/j markers) */
  indexVars: Record<string, string[]>;
  /** Python: names declared `global` */
  globals?: string[];
  /** Python @lru_cache / @cache: results are remembered per argument list */
  memo?: boolean;
}

export interface FieldDef {
  name: string;
  ty: Ty;
  init?: Expr;
  isStatic: boolean;
}

export interface ClassDef {
  name: string;
  fields: FieldDef[];
  methods: Record<string, Func[]>;
  ctors: Func[];
  base?: string;
  ln: number;
}

export interface Program {
  lang: Lang;
  funcs: Record<string, Func[]>;
  classes: Record<string, ClassDef>;
  /** global variable declarations (C/C++) or module-level code (Python) */
  globals: Stmt[];
  /** name of the entry function, if the language has one */
  entry?: { cls?: string; name: string };
}

export class CompileError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.line = line;
  }
}
