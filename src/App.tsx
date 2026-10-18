import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorPane } from './components/EditorPane';
import { ComplexityLab } from './components/ComplexityLab';
import { LANGS } from './components/EditorPane';
import { HelpDialog } from './components/HelpDialog';
import { Playback } from './components/Playback';
import { TopBar } from './components/TopBar';
import { Visualizer, type HeaderInfo, type ViewMode } from './components/Visualizer';
import { configureEngine, preload, runCode, type Trace } from './engine';
import type { Lang } from './engine/ir';
import { EXAMPLES, type Example } from './examples';
import { buildCallTree, computeImportance, computeLocks, keySteps, type CallNode, type LockInfo } from './lib/analysis';
import { captionFor } from './lib/captions';

const BASE = import.meta.env.BASE_URL;
configureEngine({
  runtimeWasm: `${BASE}grammars/tree-sitter.wasm`,
  grammarPath: (name) => `${BASE}grammars/tree-sitter-${name}.wasm`,
});

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable (private window) */
  }
}

const LANG_IDS: Lang[] = ['c', 'cpp', 'java', 'csharp', 'python'];
const LANG_NAMES: Record<Lang, string> = { c: 'C', cpp: 'C++', java: 'Java', csharp: 'C#', python: 'Python' };

/** An example's code for a language; lesson examples exist only in the language used in class. */
function exampleCode(e: Example, l: Lang): string {
  const c = e.code[l];
  if (c !== undefined) return c;
  const comment = l === 'python' ? '#' : '//';
  const other = e.only ? LANG_NAMES[e.only] : 'another language';
  return `${comment} "${e.title}" is written in ${other}, the language used in the lesson.\n${comment} Switch to the ${other} tab to run it, or write your own ${LANG_NAMES[l]} version here.\n`;
}

const allCodes = (e: Example) => Object.fromEntries(LANG_IDS.map((l) => [l, exampleCode(e, l)])) as Record<Lang, string>;

// Link parameters, e.g. ?example=merge-sort&lang=java&run=1&step=40&present=1&theme=dark
const params = new URLSearchParams(window.location.search);
const P = {
  example: params.get('example'),
  lang: params.get('lang') as Lang | null,
  run: params.get('run') === '1',
  step: params.get('step') ? Number(params.get('step')) : null,
  present: params.get('present') === '1',
  theme: params.get('theme'),
  lab: params.get('lab') === '1',
};

export default function App() {
  const [example, setExample] = useState<Example>(() => EXAMPLES.find((e) => e.id === (P.example ?? load('as.example', ''))) ?? EXAMPLES.find((e) => e.id === 'bubble-sort') ?? EXAMPLES[0]);
  const [lang, setLang] = useState<Lang>(() => {
    const l = P.lang ?? load<Lang>('as.lang', 'cpp');
    return LANG_IDS.includes(l) ? l : 'cpp';
  });
  const [codes, setCodes] = useState<Record<Lang, string>>(() => allCodes(example));
  const [stdin, setStdin] = useState(example.stdin ?? '');
  const [trace, setTrace] = useState<Trace | null>(null);
  const [traceCode, setTraceCode] = useState('');
  const [compileError, setCompileError] = useState<{ msg: string; line: number } | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<{ code: string; calls: string } | null>(null);
  const pendingRun = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(() => load('as.speed', 1));
  const [running, setRunning] = useState(false);
  const [dark, setDark] = useState(() => (P.theme ? P.theme === 'dark' : load('as.dark', false)));
  const [present, setPresent] = useState(P.present);
  const [help, setHelp] = useState(false);
  const [lab, setLab] = useState(P.lab);
  const [zoom, setZoom] = useState(() => load('as.zoom', 1));
  const [predict, setPredict] = useState(() => load('as.predict', false));
  const [quiz, setQuiz] = useState<{ step: number; answer?: 'Yes' | 'No' } | null>(null);
  const [keyOnly, setKeyOnly] = useState(() => load('as.keyOnly', true));
  const [mode, setMode] = useState<ViewMode>(() => (params.get('mode') === 'detailed' ? 'detailed' : load<ViewMode>('as.mode', 'beginner')));

  const code = codes[lang];
  const stale = !!trace && traceCode !== code;
  const locks = useMemo(() => (trace ? computeLocks(trace) : new Map<number, LockInfo>()), [trace]);
  const calls = useMemo(() => (trace ? buildCallTree(trace) : new Map<number, CallNode>()), [trace]);
  const importance = useMemo(() => (trace ? computeImportance(trace) : new Map<number, number>()), [trace]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    save('as.dark', dark);
  }, [dark]);
  useEffect(() => save('as.lang', lang), [lang]);
  useEffect(() => save('as.speed', speed), [speed]);
  useEffect(() => save('as.zoom', zoom), [zoom]);
  useEffect(() => save('as.mode', mode), [mode]);
  useEffect(() => save('as.keyOnly', keyOnly), [keyOnly]);
  useEffect(() => save('as.predict', predict), [predict]);
  useEffect(() => save('as.example', example.id), [example]);
  useEffect(() => {
    preload(lang).catch(() => undefined);
  }, [lang]);

  const startStep = useRef<number | null>(P.step);
  const run = useCallback(async () => {
    setRunning(true);
    setPlaying(false);
    try {
      const src = code;
      const r = await runCode(lang, src, { stdin });
      setTraceCode(src);
      setNotices(r.notices ?? []);
      setSuggestion(r.suggestion ?? null);
      if (r.compileError) {
        setCompileError(r.compileError);
        setTrace(null);
        return;
      }
      setCompileError(null);
      setTrace(r.trace!);
      if (startStep.current !== null) {
        setStepIndex(Math.max(0, Math.min(startStep.current, r.trace!.steps.length - 1)));
        startStep.current = null;
        setPlaying(false);
      } else {
        setStepIndex(0);
        setPlaying(r.trace!.steps.length > 1);
      }
    } catch (e) {
      setCompileError({ msg: `Could not run the code: ${e instanceof Error ? e.message : String(e)}`, line: 0 });
      setTrace(null);
    } finally {
      setRunning(false);
    }
  }, [code, lang, stdin]);

  // run again right after "Add a main() for me" put the new code in the editor
  useEffect(() => {
    if (pendingRun.current) {
      pendingRun.current = false;
      run();
    }
  }, [code, run]);

  // ?run=1 runs the code as soon as the page opens
  const autoRan = useRef(false);
  useEffect(() => {
    if ((P.run || P.present) && !autoRan.current) {
      autoRan.current = true;
      run();
    }
  }, [run]);

  // In "key steps" mode playback only stops on steps that matter (compares, swaps,
  // changes, calls...). `view` lists the trace indexes the controls move through.
  const keyIdx = useMemo(() => (trace ? keySteps(trace) : []), [trace]);
  const view = useMemo(
    () => (!trace ? [] : keyOnly && keyIdx.length > 1 ? keyIdx : trace.steps.map((_, i) => i)),
    [trace, keyOnly, keyIdx],
  );
  const pos = useMemo(() => {
    let p = 0;
    for (let k = 0; k < view.length; k++) if (view[k] <= stepIndex) p = k;
    return p;
  }, [view, stepIndex]);
  const total = view.length;

  // Predict mode: moving forward onto a comparison asks the class first.
  const isQuestion = useCallback((i: number) => {
    const st = trace?.steps[i];
    return !!st && st.kind === 'compare' && /\? (Yes|No)\b/.test(st.say);
  }, [trace]);
  const moveTo = useCallback(
    (i: number, forward: boolean) => {
      setStepIndex(i);
      if (predict && forward && isQuestion(i)) {
        setQuiz({ step: i });
        setPlaying(false);
      }
    },
    [predict, isQuestion],
  );

  // playback timer
  useEffect(() => {
    if (!playing || !trace) return;
    if (pos >= total - 1) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => moveTo(view[pos + 1], true), 1000 / speed);
    return () => window.clearTimeout(t);
  }, [playing, pos, speed, total, trace, view, moveTo]);

  const goto = useCallback(
    (p: number) => {
      setPlaying(false);
      if (!view.length) return;
      const target = view[Math.max(0, Math.min(p, view.length - 1))];
      moveTo(target, p === pos + 1);
    },
    [view, pos, moveTo],
  );

  const togglePlay = useCallback(() => {
    if (!trace) return;
    if (!playing && pos >= total - 1) setStepIndex(view[0] ?? 0);
    setPlaying(!playing);
  }, [trace, playing, pos, total, view]);

  // keyboard shortcuts (ignored while typing in the editor or a field)
  const answer = useCallback((a: 'Yes' | 'No') => setQuiz((q) => (q ? { ...q, answer: a } : q)), []);
  const quizOpen = !!quiz && quiz.step === stepIndex && !quiz.answer;
  const keyRef = useRef({ goto, togglePlay, pos, total, answer, quizOpen });
  keyRef.current = { goto, togglePlay, pos, total, answer, quizOpen };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('.monaco-editor') || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
      const k = keyRef.current;
      if (!k.total) return;
      if (e.key === ' ') {
        e.preventDefault();
        k.togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        k.goto(k.pos + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        k.goto(k.pos - 1);
      } else if ((e.key === 'y' || e.key === 'n') && k.quizOpen) {
        k.answer(e.key === 'y' ? 'Yes' : 'No');
      } else if (e.key === 'Home') k.goto(0);
      else if (e.key === 'End') k.goto(k.total - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const chooseExample = (e: Example) => {
    setExample(e);
    setCodes(allCodes(e));
    if (e.only) setLang(e.only);
    setStdin(e.stdin ?? '');
    setTrace(null);
    setCompileError(null);
    setPlaying(false);
  };

  const edited = code.trim() !== exampleCode(example, lang).trim();
  // mostly different from the example = the user's own program
  const exampleLines = new Set(exampleCode(example, lang).split('\n').map((l) => l.trim()).filter(Boolean));
  const codeLines = code.split('\n').map((l) => l.trim()).filter(Boolean);
  const shared = codeLines.filter((l) => exampleLines.has(l)).length;
  const ownCode = edited && shared < codeLines.length * 0.5;
  const langName = { c: 'C', cpp: 'C++', java: 'Java', csharp: 'C#', python: 'Python' }[lang];
  const header: HeaderInfo = ownCode
    ? {
        eyebrow: `${langName} · your code`,
        title: 'Your program',
        description: 'Your own code, running one step at a time.',
        pills: [],
      }
    : edited
    ? {
        eyebrow: `${example.topic} · edited code`,
        title: code.trim() ? 'Your program' : 'New program',
        description: `Started from the ${example.title} example. The badges show the original example's complexity.`,
        pills: [
          { text: `TIME · ${example.time}`, tone: 'muted' },
          { text: `SPACE · ${example.space}`, tone: 'muted' },
        ],
      }
    : {
        eyebrow: example.topic,
        title: example.title,
        description: example.description,
        pills: [{ text: `TIME · ${example.time}` }, { text: `SPACE · ${example.space}`, tone: 'gold' }],
        note: example.notes,
      };

  const step = trace?.steps[stepIndex];
  const atEnd = !!trace && stepIndex === trace.steps.length - 1;
  const errorLine = compileError?.line || (trace?.error && atEnd ? trace.error.line : 0) || null;
  const errorMsg = compileError?.msg ?? (trace?.error && atEnd ? trace.error.msg : null);

  return (
    <div className="app">
      <TopBar
        exampleId={edited ? null : example.id}
        onExample={chooseExample}
        present={present}
        onPresent={() => {
          if (!present && !trace) run();
          setPresent(!present);
        }}
        dark={dark}
        onDark={() => setDark(!dark)}
        onHelp={() => setHelp(true)}
        onLab={() => setLab(true)}
        onZoom={(d) => setZoom((z: number) => Math.min(1.8, Math.max(0.7, Math.round((z + d * 0.1) * 10) / 10)))}
      />
      <main className={`main ${present ? 'present' : ''}`}>
        {!present && (
          <EditorPane
            lang={lang}
            code={code}
            onLang={(l) => {
              setLang(l);
              setTrace(null);
              setCompileError(null);
              setPlaying(false);
            }}
            onCode={(c) => setCodes((cs) => ({ ...cs, [lang]: c }))}
            onRun={run}
            onReset={() => {
              setCodes((cs) => ({ ...cs, [lang]: exampleCode(example, lang) }));
              setStdin(example.stdin ?? '');
            }}
            running={running}
            execLine={step && !stale ? step.ln : null}
            errorLine={errorLine}
            error={errorMsg}
            stale={stale}
            notices={stale ? [] : notices}
            suggestion={stale ? null : suggestion}
            onUseSuggestion={() => {
              if (!suggestion) return;
              setCodes((cs) => ({ ...cs, [lang]: suggestion.code }));
              setSuggestion(null);
              pendingRun.current = true;
            }}
            stdin={stdin}
            onStdin={setStdin}
            dark={dark}
            fontSize={Math.round(14 * zoom)}
          />
        )}
        <section className="panel viz" aria-label="Visualization">
          <div className="viz-scroll" style={{ zoom }}>
            <Visualizer header={header} trace={trace} stepIndex={stepIndex} position={pos} viewTotal={total} caption={step && !edited && !stale ? captionFor(example.id, step) : null} quiz={quiz && quiz.step === stepIndex ? quiz : null} onAnswer={answer} locks={locks} calls={calls} importance={importance} mode={mode} onMode={setMode} code={traceCode || code} present={present} />
            {trace?.truncated && atEnd && (
              <div className="notice">
                Stopped after {trace.steps.length.toLocaleString()} steps so the animation stays readable. Try a smaller input (fewer elements or a smaller n).
              </div>
            )}
          </div>
          <Playback index={pos} total={total} playing={playing} speed={speed} onIndex={goto} onPlay={togglePlay} onSpeed={setSpeed} keyOnly={keyOnly} onKeyOnly={setKeyOnly} predict={predict} onPredict={setPredict} />
        </section>
      </main>
      {help && <HelpDialog onClose={() => setHelp(false)} />}
      {lab && <ComplexityLab example={example} lang={lang} langLabel={LANGS.find((l) => l.id === lang)!.label} onClose={() => setLab(false)} />}
    </div>
  );
}
