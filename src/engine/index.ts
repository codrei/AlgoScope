// Public entry point: source code in, execution trace out.
import { Language, Parser } from 'web-tree-sitter';
import { CompileError, type Lang, type Program } from './ir';
import { Interp, type RunOptions } from './interp';
import { lowerCFamily } from './lower/cfamily';
import { lowerCSharp } from './lower/csharp';
import { lowerJava } from './lower/java';
import { lowerPython } from './lower/python';
import { findSyntaxError } from './lower/util';
import { suggestEntry, type Suggestion } from './suggest';
import type { Trace } from './trace';

export type { Trace, Step, HeapItem, SnapVal, FrameSnap, Touch } from './trace';
export type { Lang } from './ir';

const GRAMMAR: Record<Lang, string> = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  csharp: 'c_sharp',
  python: 'python',
};

export interface EngineConfig {
  /** where web-tree-sitter's own wasm lives (browser: a URL) */
  runtimeWasm?: string;
  /** maps a grammar name (cpp, java, c_sharp, python) to the .wasm path/URL */
  grammarPath: (name: string) => string;
}

let config: EngineConfig | null = null;
let initPromise: Promise<void> | null = null;
const languages = new Map<string, Language>();

export function configureEngine(c: EngineConfig) {
  config = c;
}

async function ensureInit() {
  if (!config) throw new Error('engine not configured');
  if (!initPromise) {
    const runtime = config.runtimeWasm;
    initPromise = Parser.init(runtime ? { locateFile: () => runtime } : undefined);
  }
  await initPromise;
}

async function languageFor(lang: Lang): Promise<Language> {
  await ensureInit();
  const g = GRAMMAR[lang];
  let l = languages.get(g);
  if (!l) {
    l = await Language.load(config!.grammarPath(g));
    languages.set(g, l);
  }
  return l;
}

/** Preload a language's grammar so the first Run is instant. */
export async function preload(lang: Lang) {
  await languageFor(lang);
}

/**
 * The C++ grammar reads "a.b < c" as the start of a template (b<...>). For that pattern
 * only, parse '<' as '>' (same length and precedence) and remember where, so the
 * front-end can turn it back into '<'.
 */
export function protectComparisons(src: string): { code: string; swapped: Set<number> } {
  const out = src.split('');
  const swapped = new Set<number>();
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      i++;
      while (i < n && src[i] !== c && src[i] !== '\n') i += src[i] === '\\' ? 2 : 1;
      i++;
      continue;
    }
    if (c === '<' && src[i + 1] !== '<' && src[i + 1] !== '=' && src[i - 1] !== '<') {
      // walk back over spaces, an identifier, spaces, then expect '.' or '->'
      let j = i - 1;
      while (j >= 0 && /\s/.test(src[j])) j--;
      const idEnd = j;
      while (j >= 0 && /\w/.test(src[j])) j--;
      if (idEnd > j && /[A-Za-z_]/.test(src[j + 1])) {
        const word = src.slice(j + 1, idEnd + 1);
        while (j >= 0 && /\s/.test(src[j])) j--;
        if (word !== 'template' && (src[j] === '.' || (src[j] === '>' && src[j - 1] === '-'))) {
          out[i] = '>';
          swapped.add(i);
        }
      }
    }
    i++;
  }
  return { code: out.join(''), swapped };
}

export interface RunResult {
  trace?: Trace;
  compileError?: { msg: string; line: number };
  /** things AlgoScope fixed up in the code before running it */
  notices?: string[];
  /** the code with a generated main() (or call) when the code only defines functions */
  suggestion?: Suggestion;
}

const C_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'return', 'sizeof', 'else', 'do', 'case', 'typedef', 'struct', 'enum', 'union']);

/**
 * Code copied from slides and old textbooks: curly quotes, non-breaking spaces and dashes,
 * and K&R C functions written without a return type ("main()" / "factorial(int n)").
 */
export function normalizeSource(lang: Lang, src: string): { code: string; notices: string[] } {
  const notices: string[] = [];
  let code = src;
  if (/[\u201C\u201D\u2018\u2019\u00A0\u2013\u2014\u2212]/.test(code)) {
    code = code
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u00A0/g, ' ')
      .replace(/[\u2013\u2014\u2212]/g, '-');
    notices.push('Curly quotes or dashes (usually copied from slides) were changed to plain " \' and -.');
  }
  if (lang === 'c' || lang === 'cpp') {
    let depth = 0;
    let fixed = false;
    code = code
      .split('\n')
      .map((line) => {
        let out = line;
        const m = /^(\s*)([A-Za-z_]\w*)(\s*\([^;]*\)\s*(\{.*)?)$/.exec(line);
        if (depth === 0 && m && !C_KEYWORDS.has(m[2]) && !/^\s*#/.test(line)) {
          out = `${m[1]}int ${m[2]}${m[3]}`;
          fixed = true;
        }
        for (const ch of line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$/g, '')) {
          if (ch === '{') depth++;
          else if (ch === '}') depth = Math.max(0, depth - 1);
        }
        return out;
      })
      .join('\n');
    if (fixed) notices.push('Old-style C functions without a return type (like "main()") were treated as returning int.');
  }
  return { code, notices };
}

export async function runCode(lang: Lang, source: string, opts: RunOptions = {}): Promise<RunResult> {
  const language = await languageFor(lang);
  const parser = new Parser();
  parser.setLanguage(language);
  const norm = normalizeSource(lang, source);
  const fix = lang === 'cpp' ? protectComparisons(norm.code) : { code: norm.code, swapped: new Set<number>() };
  const tree = parser.parse(fix.code);
  if (!tree) return { compileError: { msg: 'could not parse the code', line: 1 } };
  try {
    const syn = findSyntaxError(tree.rootNode);
    if (syn) {
      return {
        notices: norm.notices.length ? norm.notices : undefined,
        compileError: {
          msg: `Syntax error near ${syn.text ? `"${syn.text}"` : `line ${syn.line}`}. Check for a missing ; ( ) { } or a typo.`,
          line: syn.line,
        },
      };
    }
    let prog: Program;
    switch (lang) {
      case 'c':
      case 'cpp':
        prog = lowerCFamily(tree.rootNode, lang, { source: norm.code, swapped: fix.swapped });
        break;
      case 'java':
        prog = lowerJava(tree.rootNode);
        break;
      case 'csharp':
        prog = lowerCSharp(tree.rootNode);
        break;
      case 'python':
        prog = lowerPython(tree.rootNode);
        break;
    }
    const trace = new Interp(prog, opts).run();
    let suggestion: Suggestion | undefined;
    // Python file that only defines functions: offer to add a call
    if (lang === 'python' && Object.keys(prog.funcs).some((k) => !k.includes('@')) && !prog.globals.some((g) => g.k === 'expr' || g.k === 'if' || g.k === 'for' || g.k === 'foreach' || g.k === 'while')) {
      suggestion = suggestEntry(lang, source, prog) ?? undefined;
    }
    return { trace, notices: norm.notices.length ? norm.notices : undefined, suggestion };
  } catch (e) {
    if (e instanceof CompileError && /^No main/i.test(e.message) && lang !== 'python') {
      // slides often show just the function: offer a main() that calls it
      let suggestion: Suggestion | undefined;
      try {
        const p2 = lang === 'java' ? lowerJava(tree.rootNode, false) : lang === 'csharp' ? lowerCSharp(tree.rootNode, false) : lowerCFamily(tree.rootNode, lang, { source: norm.code, swapped: fix.swapped }, false);
        suggestion = suggestEntry(lang, norm.code, p2) ?? undefined;
      } catch {
        suggestion = undefined;
      }
      return { compileError: { msg: e.message, line: e.line }, suggestion, notices: norm.notices.length ? norm.notices : undefined };
    }
    if (e instanceof CompileError) return { compileError: { msg: e.message, line: e.line } };
    return { compileError: { msg: e instanceof Error ? e.message : String(e), line: 1 } };
  } finally {
    tree.delete();
    parser.delete();
  }
}
