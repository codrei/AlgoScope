import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorPane } from './components/EditorPane';
import { ComplexityLab } from './components/ComplexityLab';
import { LANGS } from './components/EditorPane';
import { HelpDialog } from './components/HelpDialog';
import { MobileBar } from './components/MobileBar';
import { ChapterBar, Playback } from './components/Playback';
import { DEFAULT_PREFS, SettingsPanel, ZOOM_MAX, ZOOM_MIN, type Palette, type Prefs, type Theme } from './components/SettingsPanel';
import { TopBar } from './components/TopBar';
import { Visualizer, type HeaderInfo, type ViewMode } from './components/Visualizer';
import { configureEngine, preload, runCode, type Trace } from './engine';
import type { Lang } from './engine/ir';
import type { Step } from './engine/trace';
import { EXAMPLES, type Example } from './examples';
import { buildCallTree, computeGaps, computeImportance, computeLocks, keySteps, type CallNode, type LockInfo } from './lib/analysis';
import { captionFor, momentFor, runInfo } from './lib/captions';
import { chapterPositions, chaptersFor } from './lib/chapters';
import { labKind } from './lib/complexity';
import { COMPACT_QUERY, useMediaQuery } from './lib/useMedia';

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
  return `${comment} "${e.title}" is written in ${other} only.\n${comment} Switch to the ${other} tab to run it, or write your own ${LANG_NAMES[l]} version here.\n`;
}

/**
 * Predict mode asks before comparisons ("is 5 bigger than 1?") and before if-decisions ("is n <= 1
 * true?"), not before loop checks, which repeat every round.
 */
function isQuestionStep(st: Step): boolean {
  if (!/\? (Yes|No)\b/.test(st.say)) return false;
  return st.kind === 'compare' || (st.kind === 'check' && /^IF /.test(st.text));
}
/** a loop check ("is b != 0 true?"): asked only in runs that have no comparisons or decisions */
function isLoopQuestion(st: Step): boolean {
  return st.kind === 'check' && /\? (Yes|No)\b/.test(st.say) && /^(WHILE |(.* · )?CHECK )/.test(st.text);
}
const answerOf = (st: Step) => /^(.*?\?) (Yes|No)\b/.exec(st.say)?.[2] as 'Yes' | 'No' | undefined;

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
  settings: params.get('settings') === '1',
};

const THEMES: Theme[] = ['light', 'dark', 'system'];
function initialTheme(): Theme {
  if (P.theme && THEMES.includes(P.theme as Theme)) return P.theme as Theme;
  const t = load<Theme | null>('as.theme', null);
  // before Settings there was only a dark / light switch
  return t && THEMES.includes(t) ? t : load('as.dark', false) ? 'dark' : 'light';
}

function initialExample(): Example {
  return EXAMPLES.find((e) => e.id === (P.example ?? load('as.example', ''))) ?? EXAMPLES.find((e) => e.id === 'bubble-sort') ?? EXAMPLES[0];
}

function initialLang(example: Example): Lang {
  const l = P.lang ?? load<Lang>('as.lang', 'cpp');
  const ok = LANG_IDS.includes(l) ? l : 'cpp';
  // a single-language example (the Turbo C++ maze, the C structs) opens in its own language,
  // even from a link without &lang= or after last using another language
  return example.only && example.code[ok] === undefined ? example.only : ok;
}

export default function App() {
  const [example, setExample] = useState<Example>(initialExample);
  const [lang, setLang] = useState<Lang>(() => initialLang(example));
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
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const deviceDark = useMediaQuery('(prefers-color-scheme: dark)');
  const dark = theme === 'dark' || (theme === 'system' && deviceDark);
  const [palette, setPalette] = useState<Palette>(() => (load<Palette>('as.palette', 'standard') === 'colorblind' ? 'colorblind' : 'standard'));
  const [motion, setMotion] = useState(() => load('as.motion', true));
  const [autoplay, setAutoplay] = useState(() => load('as.autoplay', true));
  const [settingsOpen, setSettingsOpen] = useState(P.settings);
  const [present, setPresent] = useState(P.present);
  const [help, setHelp] = useState(false);
  const [lab, setLab] = useState(P.lab);
  const [zoom, setZoom] = useState(() => load('as.zoom', 1));
  const [predict, setPredict] = useState(() => load('as.predict', false));
  const [quiz, setQuiz] = useState<{ step: number; answer?: 'Yes' | 'No' } | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [keyOnly, setKeyOnly] = useState(() => load('as.keyOnly', true));
  // phones: separate Code and Watch views, controls at the bottom
  const phone = useMediaQuery(COMPACT_QUERY);
  const [mview, setMview] = useState<'code' | 'watch'>(() => (P.run || P.present ? 'watch' : 'code'));
  const [mode, setMode] = useState<ViewMode>(() => (params.get('mode') === 'detailed' ? 'detailed' : load<ViewMode>('as.mode', 'beginner')));

  const code = codes[lang];
  const stale = !!trace && traceCode !== code;
  const locks = useMemo(() => (trace ? computeLocks(trace) : new Map<number, LockInfo>()), [trace]);
  const calls = useMemo(() => (trace ? buildCallTree(trace) : new Map<number, CallNode>()), [trace]);
  const importance = useMemo(() => (trace ? computeImportance(trace) : new Map<number, number>()), [trace]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(() => save('as.theme', theme), [theme]);
  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    save('as.palette', palette);
  }, [palette]);
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    save('as.motion', motion);
  }, [motion]);
  useEffect(() => save('as.autoplay', autoplay), [autoplay]);
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
      // phones: show the run (a compile error keeps the Code view, where the error is shown)
      setMview('watch');
      if (startStep.current !== null) {
        setStepIndex(Math.max(0, Math.min(startStep.current, r.trace!.steps.length - 1)));
        startStep.current = null;
        setPlaying(false);
      } else {
        setStepIndex(0);
        setPlaying(autoplay && r.trace!.steps.length > 1);
      }
    } catch (e) {
      setCompileError({ msg: `Could not run the code: ${e instanceof Error ? e.message : String(e)}`, line: 0 });
      setTrace(null);
    } finally {
      setRunning(false);
    }
  }, [code, lang, stdin, autoplay]);

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
  const gaps = useMemo(() => (trace ? computeGaps(trace) : []), [trace]);
  // Predict mode also stops on the questions that Key steps would skip (if-decisions)
  const questionIdx = useMemo(() => {
    if (!trace) return [];
    const q = trace.steps.flatMap((st, i) => (isQuestionStep(st) ? [i] : []));
    if (q.length) return q;
    // only loops (Euclid's GCD, a DP table filled by a loop): ask the loop checks, unless there are too many
    const loops = trace.steps.flatMap((st, i) => (isLoopQuestion(st) ? [i] : []));
    return loops.length <= 40 ? loops : [];
  }, [trace]);
  const questionSet = useMemo(() => new Set(questionIdx), [questionIdx]);
  const view = useMemo(() => {
    if (!trace) return [];
    if (!(keyOnly && keyIdx.length > 1)) return trace.steps.map((_, i) => i);
    if (!predict) return keyIdx;
    return [...new Set([...keyIdx, ...questionIdx])].sort((a, b) => a - b);
  }, [trace, keyOnly, keyIdx, predict, questionIdx]);
  const pos = useMemo(() => {
    let p = 0;
    for (let k = 0; k < view.length; k++) if (view[k] <= stepIndex) p = k;
    return p;
  }, [view, stepIndex]);
  const total = view.length;

  // chapters: the parts of the algorithm (Pass 2 of 5, Merge [0..2], push(10)...)
  const exampleRun = !!trace && traceCode.trim() === exampleCode(example, lang).trim();
  const info = useMemo(() => (trace && exampleRun ? runInfo(example.id, trace.steps) : {}), [trace, exampleRun, example.id]);
  const chapters = useMemo(() => (trace ? chaptersFor(trace, exampleRun ? example.id : null, info) : []), [trace, exampleRun, example.id, info]);
  const chPos = useMemo(() => chapterPositions(chapters, view), [chapters, view]);

  // Predict mode: moving forward onto a comparison or a decision asks the class first.
  const isQuestion = useCallback((i: number) => questionSet.has(i), [questionSet]);
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
  const answer = useCallback(
    (a: 'Yes' | 'No') => {
      if (!quiz || quiz.answer || !trace) return;
      setQuiz({ ...quiz, answer: a });
      setScore((sc) => ({ right: sc.right + (answerOf(trace.steps[quiz.step]) === a ? 1 : 0), asked: sc.asked + 1 }));
    },
    [quiz, trace],
  );
  // a new run starts a new score
  useEffect(() => {
    setScore({ right: 0, asked: 0 });
    setQuiz(null);
  }, [trace]);

  // short messages that disappear by themselves (turning Predict on or off)
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [toast]);
  const changePredict = (on: boolean) => {
    setPredict(on);
    if (!on) {
      setToast('Predict is off.');
      return;
    }
    const n = questionIdx.length;
    const atLast = !!trace && pos >= total - 1;
    setToast(
      !trace
        ? 'Predict is on. Press Run: the run will stop before each comparison and decision and ask you to guess Yes or No.'
        : n === 0
        ? 'Predict is on, but this run has no comparisons or decisions to guess (only loops). Try a sorting, searching or recursion example.'
        : `Predict is on: the run will stop before each of its ${n} comparisons and decisions and ask you to guess Yes or No. ${atLast ? 'Press Play to watch it again from the start.' : 'Press Play or Next.'}`,
    );
  };
  const quizOpen = !!quiz && quiz.step === stepIndex && !quiz.answer;
  // the question is on screen: the "Predict is on" message must not cover the Yes / No buttons
  useEffect(() => {
    if (quizOpen) setToast(null);
  }, [quizOpen]);
  const jumpChapter = useCallback(
    (dir: 1 | -1) => {
      if (!chPos.length) return;
      let cur = -1;
      chPos.forEach((c, k) => {
        if (c.pos <= pos) cur = k;
      });
      // back: to the start of this part, or the part before if already there
      const target = dir > 0 ? chPos[cur + 1]?.pos : cur >= 0 && chPos[cur].pos < pos ? chPos[cur].pos : chPos[Math.max(0, cur - 1)]?.pos;
      if (target !== undefined) goto(target);
    },
    [chPos, pos, goto],
  );
  const keyRef = useRef({ goto, togglePlay, pos, total, answer, quizOpen, jumpChapter });
  keyRef.current = { goto, togglePlay, pos, total, answer, quizOpen, jumpChapter };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('.monaco-editor') || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
      // Settings, Help, the Complexity Lab: the keys belong to the open panel, not to the run behind it
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
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
      } else if (e.key === 'PageDown' || e.key === 'PageUp') {
        e.preventDefault();
        k.jumpChapter(e.key === 'PageDown' ? 1 : -1);
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
  // phones never use Present mode or Full detail: one calm column
  // touch layout: swipe the picture left for the next step, right for the step before
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const el = e.target as HTMLElement;
    // leave alone anything that scrolls sideways by itself (wide graphs, tables, the code)
    let n: HTMLElement | null = el;
    while (n && !n.classList.contains('viz')) {
      if (n.scrollWidth > n.clientWidth + 4 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) {
        swipe.current = null;
        return;
      }
      n = n.parentElement;
    }
    if (el.closest('button, input, textarea, select, summary, .present-code, .m-code')) {
      swipe.current = null;
      return;
    }
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s0 = swipe.current;
    swipe.current = null;
    if (!s0 || !trace) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s0.x;
    const dy = t.clientY - s0.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.6 * Math.abs(dy) && Date.now() - s0.t < 700) goto(pos + (dx < 0 ? 1 : -1));
  };
  const isPresent = present && !phone;
  const viewMode: ViewMode = phone ? 'beginner' : mode;
  useEffect(() => {
    if (phone) document.querySelector('.main')?.scrollTo({ top: 0 });
  }, [mview, phone]);
  const prefs: Prefs = { theme, zoom, palette, motion, mode, keyOnly, speed, predict, autoplay };
  const setters: { [P in keyof Prefs]: (v: Prefs[P]) => void } = {
    theme: setTheme, zoom: setZoom, palette: setPalette, motion: setMotion, mode: setMode,
    keyOnly: setKeyOnly, speed: setSpeed, predict: setPredict, autoplay: setAutoplay,
  };
  // turning Predict on or off from Settings explains it, like the Predict button does
  const setPref = <K extends keyof Prefs>(key: K, value: Prefs[K]) => (key === 'predict' ? changePredict(value as boolean) : setters[key](value));
  const changeZoom = (d: number) => setZoom((z: number) => (d === 0 ? 1 : Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + d * 0.1) * 10) / 10))));
  const resetPrefs = () => (Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]).forEach(<K extends keyof Prefs>(k: K) => setters[k](DEFAULT_PREFS[k]));
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
        onHelp={() => setHelp(true)}
        onLab={() => setLab(true)}
        onSettings={() => setSettingsOpen(true)}
        compact={phone}
      />
      {phone && (
        <div className="m-switch" role="tablist" aria-label="View">
          <button role="tab" aria-selected={mview === 'code'} className={mview === 'code' ? 'active' : ''} onClick={() => setMview('code')}>Code</button>
          <button role="tab" aria-selected={mview === 'watch'} className={mview === 'watch' ? 'active' : ''} onClick={() => setMview('watch')}>Watch</button>
        </div>
      )}
      <main className={`main ${isPresent ? 'present' : ''} ${phone ? `phone view-${mview}` : ''}`}>
        {!isPresent && (
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
            fontSize={phone ? 16 : Math.round(14 * zoom)}
            wrap={phone}
          />
        )}
        <section className="panel viz" aria-label="Visualization" onTouchStart={phone ? onTouchStart : undefined} onTouchEnd={phone ? onTouchEnd : undefined}>
          <div className="viz-scroll" style={phone ? undefined : { zoom }}>
            {phone && stale && !compileError && (
              <div className="notice m-stale">
                The code changed since this run. <button className="m-link" onClick={run}>Run the new code</button>
              </div>
            )}
            {/* at the last step the controls reach (Key steps may skip the very last saved step) */}
            {trace?.truncated && total > 0 && pos >= total - 1 && (
              <div className="notice" role="status">
                {trace.truncatedBy === 'size' ? (
                  <>
                    Stopped after {trace.steps.length.toLocaleString()} steps: the arrays, lists or strings got too big to save at
                    every step (over 3 million values in all). Use smaller data, about 10–100 values, to watch it; the Complexity
                    Lab measures big inputs.
                  </>
                ) : (
                  <>
                    Stopped after {trace.steps.length.toLocaleString()} steps so the animation stays readable. If a loop never ends,
                    check that its condition can become false (is the counter changing?). Otherwise try a smaller input.
                  </>
                )}
              </div>
            )}
            <Visualizer header={header} trace={trace} stepIndex={stepIndex} position={pos} viewTotal={total} caption={step && !edited && !stale ? captionFor(example.id, step, stepIndex, info) : null} moment={step && !edited && !stale ? momentFor(example.id, step, stepIndex, info) : null} quiz={quiz && quiz.step === stepIndex ? quiz : null} onAnswer={answer} score={score} locks={locks} calls={calls} importance={importance} gaps={gaps[stepIndex]} mode={viewMode} onMode={setMode} code={traceCode || code} present={isPresent} phone={phone} summary={exampleRun ? { title: example.title, time: example.time, topic: example.topic } : null} onLab={exampleRun && labKind(example) ? () => setLab(true) : undefined} />
          </div>
          {!phone && chPos.length >= 2 && <ChapterBar chapters={chPos} pos={pos} total={total} onJump={goto} onStep={jumpChapter} />}
          {!phone && <Playback index={pos} total={total} playing={playing} speed={speed} onIndex={goto} onPlay={togglePlay} onSpeed={setSpeed} keyOnly={keyOnly} onKeyOnly={setKeyOnly} predict={predict} onPredict={changePredict} />}
        </section>
      </main>
      {phone && (
        <MobileBar view={mview} running={running} onRun={run} chapters={chPos} pos={pos} total={total} playing={playing} onIndex={goto} onPlay={togglePlay} onSettings={() => setSettingsOpen(true)} />
      )}
      {settingsOpen && (
        <SettingsPanel prefs={prefs} onChange={setPref} onZoom={changeZoom} onReset={resetPrefs} onClose={() => setSettingsOpen(false)} touch={phone} />
      )}
      {toast && (
        <div className={`toast ${phone ? 'm-toast' : ''}`} role="status" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}
      {help && <HelpDialog onClose={() => setHelp(false)} phone={phone} />}
      {lab && <ComplexityLab example={example} lang={lang} langLabel={LANGS.find((l) => l.id === lang)!.label} onClose={() => setLab(false)} />}
    </div>
  );
}
