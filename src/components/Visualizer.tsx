import { ChevronDown, ChevronRight, Layers, Terminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FrameSnap, SnapVal, Step, Trace } from '../engine/trace';
import { lockedCells, recursionRoot, structuresFor, type CallNode, type LockInfo, type StructRef } from '../lib/analysis';
import { ArrayView, cellText, rolesFor } from './ArrayView';
import { GraphView, Grid2D, isAdjacencyMatrix, MapView, MatrixGraphView, RecursionTree } from './Structures';

export type ViewMode = 'beginner' | 'detailed';

export interface HeaderInfo {
  eyebrow: string;
  title: string;
  description: string;
  pills: { text: string; tone?: 'gold' | 'muted' }[];
  note?: string;
}

interface Props {
  header: HeaderInfo;
  trace: Trace | null;
  stepIndex: number;
  /** position among the steps the controls move through, and how many there are */
  position: number;
  viewTotal: number;
  caption: string | null;
  quiz: { step: number; answer?: 'Yes' | 'No' } | null;
  onAnswer: (a: 'Yes' | 'No') => void;
  locks: Map<number, LockInfo>;
  calls: Map<number, CallNode>;
  importance: Map<number, number>;
  mode: ViewMode;
  onMode: (m: ViewMode) => void;
  code?: string;
  present: boolean;
}

export function Visualizer({ header, trace, stepIndex, position, viewTotal, caption, quiz, onAnswer, locks, calls, importance, mode, onMode, code, present }: Props) {
  const step = trace?.steps[stepIndex];
  const prev = trace && stepIndex > 0 ? trace.steps[stepIndex - 1] : undefined;
  const isLast = !!trace && stepIndex === trace.steps.length - 1 && !trace.error;
  const beginner = mode === 'beginner';
  return (
    <>
      <div className={`viz-header ${beginner ? 'compact' : ''}`}>
        <div className="viz-header-row">
          <div>
            <div className="eyebrow">{header.eyebrow}</div>
            <h1>{header.title}</h1>
          </div>
          <div className="seg mode-toggle" role="tablist" aria-label="How much to show">
            <button role="tab" aria-selected={beginner} className={beginner ? 'active' : ''} onClick={() => onMode('beginner')} title="Only the main picture, the explanation and the current variables">
              Focus
            </button>
            <button role="tab" aria-selected={!beginner} className={!beginner ? 'active' : ''} onClick={() => onMode('detailed')} title="Everything: counters, call stack, Big-O, all data">
              Full detail
            </button>
          </div>
        </div>
        {header.description && <p>{header.description}</p>}
        {!beginner && (
          <div className="pills">
            {header.pills.map((p) => (
              <span key={p.text} className={`pill ${p.tone ?? ''}`}>{p.text}</span>
            ))}
            {header.note && <span className="pill-note">{header.note}</span>}
          </div>
        )}
      </div>
      {!step ? (
        <Welcome />
      ) : present && code ? (
        <div className="present-grid">
          <div className="present-main">
            <Stage step={step} prev={prev} stepIndex={stepIndex} locks={locks} calls={calls} importance={importance} isLast={isLast} beginner={beginner} />
            <StepCard step={step} stepIndex={stepIndex} position={position} total={viewTotal} caption={caption} quiz={quiz} onAnswer={onAnswer} locks={locks} />
            <VarChips step={step} prev={prev} />
            <OutputBox trace={trace!} step={step} compact />
          </div>
          <div className="present-side">
            <CodePanel code={code} line={step.ln} />
          </div>
        </div>
      ) : (
        <>
          <Stage step={step} prev={prev} stepIndex={stepIndex} locks={locks} calls={calls} importance={importance} isLast={isLast} beginner={beginner} />
          <StepCard step={step} stepIndex={stepIndex} position={position} total={viewTotal} caption={caption} quiz={quiz} onAnswer={onAnswer} locks={locks} />
          {beginner ? (
            <>
              <VarChips step={step} prev={prev} />
              <OutputBox trace={trace!} step={step} compact />
            </>
          ) : (
            <>
              <div className="counters">
                <Counter k="Comparisons" v={step.counts.compares} />
                <Counter k="Swaps" v={step.counts.swaps} />
                <Counter k="Array writes" v={step.counts.writes} />
                <Counter k="Function calls" v={step.counts.calls} />
              </div>
              <div className="lower">
                <CallStack step={step} prev={prev} />
                <OutputBox trace={trace!} step={step} />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

function Welcome() {
  return (
    <div className="welcome">
      <h2>How to use AlgoScope</h2>
      <ol>
        <li><b>Pick an algorithm</b> from <b>Examples</b> at the top, or type your own code on the left.</li>
        <li>Press the yellow <b>Run</b> button.</li>
        <li>Watch the picture here. Press <b>Pause</b>, then use <b>Back</b> and <b>Next</b> to go one step at a time.</li>
      </ol>
      <p>Every step is explained in plain English, and the line that just ran is highlighted in the code.</p>
    </div>
  );
}

function Counter({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="counter">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

const HELPER_NAMES = /^(visited|seen|vis|done|marked|dist|distance|distances|d)$/i;

function Stage(p: {
  step: Step;
  prev?: Step;
  stepIndex: number;
  locks: Map<number, LockInfo>;
  calls: Map<number, CallNode>;
  importance: Map<number, number>;
  isLast: boolean;
  beginner: boolean;
}) {
  const { step, prev, stepIndex, locks, calls, importance, isLast, beginner } = p;
  const { arrays: allArrays, maps, objects } = structuresFor(step);
  const is2D = (a: StructRef) =>
    a.item.kind === 'arr' && a.item.items.length > 0 && a.item.items.some((v) => v.t === 'r') &&
    a.item.items.every((v) => v.t === 'null' || (v.t === 'r' && step.heap[v.id]?.kind === 'arr'));
  const isMatrixGraph = (a: StructRef) => a.item.kind === 'arr' && is2D(a) && isAdjacencyMatrix(a.names, a.item, step);
  const hasGraph = allArrays.some(isMatrixGraph);

  // Beginners only see the structures the algorithm actually works on.
  let arrays = allArrays;
  if (beginner) {
    const score = (a: StructRef) => {
      if (a.item.kind !== 'arr') return 0;
      let s = importance.get(a.id) ?? 0;
      if (is2D(a)) for (const v of a.item.items) if (v.t === 'r') s += importance.get(v.id) ?? 0;
      return s;
    };
    let keep = arrays.filter((a) => score(a) > 0 || isMatrixGraph(a));
    if (hasGraph) keep = keep.filter((a) => !a.names.some((n) => HELPER_NAMES.test(n)));
    if (!keep.length && !objects.roots.length) keep = arrays.slice(0, 1);
    const top = new Set(
      [...keep]
        .sort((a, b) => (isMatrixGraph(b) ? 1e9 : score(b)) - (isMatrixGraph(a) ? 1e9 : score(a)))
        .slice(0, 3)
        .map((a) => a.id),
    );
    arrays = keep.filter((a) => top.has(a.id));
  }

  const views = [];
  for (const a of arrays.slice(0, 6)) {
    if (a.item.kind !== 'arr') continue;
    if (is2D(a)) {
      if (isMatrixGraph(a)) {
        views.push(
          beginner ? (
            <MatrixGraphView key={a.id} item={a.item} names={a.names} step={step} />
          ) : (
            <div className="graph-pair" key={a.id}>
              <MatrixGraphView item={a.item} names={a.names} step={step} />
              <Grid2D item={a.item} names={a.names} step={step} />
            </div>
          ),
        );
      } else views.push(<Grid2D key={a.id} item={a.item} names={a.names} step={step} />);
      continue;
    }
    const info = locks.get(a.id);
    const locked = lockedCells(info, stepIndex, isLast);
    const allLocked = !!info && locked.size === a.item.items.length && a.item.items.length > 1;
    views.push(<ArrayView key={a.id} item={a.item} names={a.names} step={step} stepIndex={stepIndex} locked={locked} allLocked={allLocked} big={beginner && arrays.length === 1} />);
  }
  if (objects.roots.length) views.push(<GraphView key="graph" step={step} prev={prev} roots={objects.roots} />);
  for (const m of maps.slice(0, beginner ? 1 : 3)) if (m.item.kind === 'map') views.push(<MapView key={m.id} item={m.item} names={m.names} step={step} />);
  const rec = recursionRoot(calls, step, stepIndex);
  if (rec !== null && (!beginner || views.length === 0)) views.push(<RecursionTree key="rec" nodes={calls} root={rec} step={step} stepIndex={stepIndex} />);

  if (!views.length) {
    return (
      <div className="stage">
        <div className="empty-stage">Nothing to draw yet. The variables are listed under the explanation.</div>
      </div>
    );
  }
  return (
    <div className={`stage ${beginner ? 'stage-big' : ''}`}>
      {views}
      <Legend step={step} arrays={arrays} locks={locks} stepIndex={stepIndex} isLast={isLast} />
    </div>
  );
}

/** Explains only the colors that are on screen right now. */
function Legend({ step, arrays, locks, stepIndex, isLast }: { step: Step; arrays: StructRef[]; locks: Map<number, LockInfo>; stepIndex: number; isLast: boolean }) {
  const roles = new Set<string>();
  let anyLocked = false;
  for (const a of arrays) {
    rolesFor(step, a.id).forEach((r) => roles.add(r));
    if (a.item.kind === 'arr') {
      for (const v of a.item.items) if (v.t === 'r') rolesFor(step, v.id).forEach((r) => roles.add(r));
    }
    if (lockedCells(locks.get(a.id), stepIndex, isLast).size) anyLocked = true;
  }
  const items: { cls: string; label: string }[] = [];
  if (roles.has('compare')) items.push({ cls: 'compare', label: 'being compared' });
  if (roles.has('swap')) items.push({ cls: 'swap', label: 'just swapped' });
  if (roles.has('write')) items.push({ cls: 'write', label: 'just changed' });
  if (anyLocked) items.push({ cls: 'locked', label: 'in its final place' });
  if (!items.length) return null;
  return (
    <div className="legend stage-legend" aria-label="Color key">
      {items.map((i) => (
        <span key={i.cls}><i className={i.cls} /> {i.label}</span>
      ))}
    </div>
  );
}

function StepCard(p: {
  step: Step;
  stepIndex: number;
  position: number;
  total: number;
  caption: string | null;
  quiz: { step: number; answer?: 'Yes' | 'No' } | null;
  onAnswer: (a: 'Yes' | 'No') => void;
  locks: Map<number, LockInfo>;
}) {
  const { step, stepIndex, position, total, caption, quiz, onAnswer, locks } = p;
  const [showCode, setShowCode] = useState(false);
  const m = /^(.*?\?) (Yes|No)\b/.exec(step.say);
  if (quiz && m && !quiz.answer) {
    return (
      <div className="step-card quiz" role="status" aria-live="polite">
        <div className="step-card-top">
          <span className="step-label">Predict</span>
          <span className="step-num">Step {position + 1} of {total}</span>
        </div>
        {caption && <p className="step-caption">{caption}</p>}
        <p className="step-say">{m[1]}</p>
        <div className="quiz-buttons">
          <button className="quiz-btn" onClick={() => onAnswer('Yes')}>Yes <kbd>Y</kbd></button>
          <button className="quiz-btn" onClick={() => onAnswer('No')}>No <kbd>N</kbd></button>
        </div>
      </div>
    );
  }
  const verdict = quiz?.answer && m ? (quiz.answer === m[2] ? 'right' : 'wrong') : null;
  const notes: string[] = [];
  for (const [id, info] of locks) {
    const h = step.heap[id];
    if (!h || h.kind !== 'arr') continue;
    info.lockedAt.forEach((at, i) => {
      if (at === stepIndex - 1 && at >= 0) notes.push(cellText(h.items[i]));
    });
  }
  return (
    <div className={`step-card ${step.kind}`} role="status" aria-live="polite">
      <div className="step-card-top">
        <span className="step-label">What just happened</span>
        <span className="step-num">Step {position + 1} of {total}</span>
      </div>
      {caption && <p className="step-caption">{caption}</p>}
      {verdict && (
        <p className={`quiz-verdict ${verdict}`}>{verdict === 'right' ? '✓ Correct!' : `✗ Not this time: the answer is ${m![2]}.`}</p>
      )}
      <p className="step-say">{step.say}</p>
      {notes.length > 0 && step.kind !== 'end' && (
        <p className="step-lock">{notes.join(', ')} {notes.length > 1 ? 'are' : 'is'} now in the final sorted place.</p>
      )}
      <button className="code-toggle" onClick={() => setShowCode(!showCode)} aria-expanded={showCode}>
        {showCode ? <ChevronDown size={13} /> : <ChevronRight size={13} />} In code terms
      </button>
      {showCode && <p className="step-code">{step.text}</p>}
    </div>
  );
}

function scalarText(step: Step, v: SnapVal): string | null {
  if (v.t === 'p') return v.s;
  if (v.t === 'null') return cellText(v);
  if (v.t === 'r') {
    const h = step.heap[v.id];
    if (h?.kind === 'obj') {
      const first = h.fields.find(([, x]) => x.t === 'p');
      return `→ ${h.cls}${first ? `(${cellText(first[1])})` : ''}`;
    }
  }
  return null;
}

/** The current function's simple variables (numbers, text, pointers) as chips. */
function VarChips({ step, prev }: { step: Step; prev?: Step }) {
  const f = step.frames[step.frames.length - 1];
  if (!f) return null;
  const pf = prev?.frames.find((x) => x.fid === f.fid);
  const before = new Map(pf?.vars.map(([n, v]) => [n, JSON.stringify(v)]));
  const chips = f.vars
    .map(([n, v]) => ({ n, text: scalarText(step, v), changed: !!pf && before.get(n) !== JSON.stringify(v) }))
    .filter((c) => c.text !== null && c.n !== 'this' && c.n !== 'self');
  if (!chips.length) return null;
  return (
    <div className="var-chips" aria-label="Variables">
      <span className="var-title">Variables in {f.name}{f.fid !== 0 ? '()' : ''}</span>
      {chips.map((c) => (
        <span key={c.n} className={`var-chip ${c.changed ? 'changed' : ''}`}>
          <b>{c.n}</b> = {c.text}
        </span>
      ))}
    </div>
  );
}

function valText(step: Step, v: SnapVal): { text: string; ref: boolean } {
  if (v.t === 'r') {
    const h = step.heap[v.id];
    if (!h) return { text: `#${v.id}`, ref: true };
    if (h.kind === 'arr') {
      const inner = h.items.slice(0, 8).map((x) => (x.t === 'r' ? '[…]' : cellText(x))).join(', ');
      return { text: `[${inner}${h.items.length > 8 ? ', …' : ''}]`, ref: true };
    }
    if (h.kind === 'obj') return { text: `→ ${h.cls} #${v.id}`, ref: true };
    return { text: `${h.isSet ? 'set' : 'map'} (${h.entries.length})`, ref: true };
  }
  if (v.t === 'ptr') return { text: `→ ${v.s.replace(/^&/, '')}`, ref: true };
  return { text: cellText(v), ref: false };
}

function CallStack({ step, prev }: { step: Step; prev?: Step }) {
  const prevVars = new Map<number, Map<string, string>>();
  prev?.frames.forEach((f) => prevVars.set(f.fid, new Map(f.vars.map(([n, v]) => [n, JSON.stringify(v)]))));
  const frames = [...step.frames].reverse();
  return (
    <div className="box">
      <div className="box-title"><Layers size={13} /> Call stack &amp; variables</div>
      <div className="frames">
        {frames.map((f: FrameSnap, i) => {
          const pv = prevVars.get(f.fid);
          return (
            <div className={`frame ${i === 0 && f.fid !== 0 ? 'current' : ''}`} key={f.fid}>
              <div className="frame-name">
                <span>{f.name}{f.fid !== 0 ? '()' : ''}</span>
                {f.fid !== 0 && <small>line {f.ln}</small>}
              </div>
              <div className="vars">
                {f.vars.length === 0 && <div className="empty">no variables yet</div>}
                {f.vars.map(([n, v]) => {
                  const { text, ref } = valText(step, v);
                  const changed = !!pv && pv.get(n) !== JSON.stringify(v);
                  return [
                    <div className="vn" key={`n${n}`}>{n}</div>,
                    <div className={`vv ${changed ? 'changed' : ''} ${ref ? 'ref' : ''}`} key={`v${n}`} title={text}>{text}</div>,
                  ];
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OutputBox({ trace, step, compact }: { trace: Trace; step: Step; compact?: boolean }) {
  const ref = useRef<HTMLPreElement>(null);
  const text = trace.stdout.slice(0, step.out);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);
  if (compact && !text) return null;
  return (
    <div className={`box ${compact ? 'output-compact' : ''}`}>
      <div className="box-title"><Terminal size={13} /> Output</div>
      <pre className="console" ref={ref}>{text || <span className="muted">(nothing printed yet)</span>}</pre>
    </div>
  );
}

const KW = /\b(if|else|for|while|do|return|break|continue|switch|case|default|def|class|struct|public|private|static|void|new|import|using|include|from|in|and|or|not|elif|pass|None|True|False|null|nullptr|NULL|true|false|this|self|foreach|namespace|const|final|lambda|try|catch|print)\b/;
const TY = /\b(int|long|double|float|char|bool|boolean|string|String|var|auto|vector|List|ArrayList|Stack|Queue|Node|Console|System)\b/;

function highlight(line: string) {
  const out: (string | { t: string; c: string })[] = [];
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|#.*$|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const tok = m[0];
    let cls = '';
    if (tok.startsWith('"') || tok.startsWith("'")) cls = 'tok-str';
    else if (tok.startsWith('//') || (tok.startsWith('#') && !/^#include/.test(tok))) cls = 'tok-com';
    else if (/^\d/.test(tok)) cls = 'tok-num';
    else if (KW.test(tok)) cls = 'tok-kw';
    else if (TY.test(tok)) cls = 'tok-ty';
    out.push(cls ? { t: tok, c: cls } : tok);
    last = m.index + tok.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out.map((p, i) => (typeof p === 'string' ? p : <span key={i} className={p.c}>{p.t}</span>));
}

function CodePanel({ code, line }: { code: string; line: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector('.pc-line.active') as HTMLElement | null;
    if (el && ref.current) {
      const box = ref.current;
      const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
      box.scrollTo({ top, behavior: Math.abs(box.scrollTop - top) > box.clientHeight ? 'auto' : 'smooth' });
    }
  }, [line]);
  return (
    <div className="present-code" ref={ref}>
      {code.split('\n').map((l, i) => (
        <div key={i} className={`pc-line ${i + 1 === line ? 'active' : ''}`}>
          <span className="no">{i + 1}</span>
          <span>{highlight(l)}</span>
        </div>
      ))}
    </div>
  );
}
