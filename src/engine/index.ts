// Public entry point: source code in, execution trace out.
import { Language, Parser } from 'web-tree-sitter';
import { CompileError, type Lang, type Program } from './ir';
import { Interp, type RunOptions } from './interp';
import { lowerCFamily } from './lower/cfamily';
import { lowerCSharp } from './lower/csharp';
import { lowerJava } from './lower/java';
import { lowerPython } from './lower/python';
import { findSyntaxError } from './lower/util';
import type { Trace } from './trace';

export type { Trace, Step, HeapItem, SnapVal, FrameSnap, Touch } from './trace';
export type { Lang } from './ir';

const GRAMMAR: Record<Lang, string> = {
  c: 'cpp',
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

export interface RunResult {
  trace?: Trace;
  compileError?: { msg: string; line: number };
}

export async function runCode(lang: Lang, source: string, opts: RunOptions = {}): Promise<RunResult> {
  const language = await languageFor(lang);
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse(source);
  if (!tree) return { compileError: { msg: 'could not parse the code', line: 1 } };
  try {
    const syn = findSyntaxError(tree.rootNode);
    if (syn) {
      return {
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
        prog = lowerCFamily(tree.rootNode, lang);
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
    return { trace };
  } catch (e) {
    if (e instanceof CompileError) return { compileError: { msg: e.message, line: e.line } };
    return { compileError: { msg: e instanceof Error ? e.message : String(e), line: 1 } };
  } finally {
    tree.delete();
    parser.delete();
  }
}
