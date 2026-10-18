import { Layers, Terminal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FrameSnap, SnapVal, Step, Trace } from '../engine/trace';
import { lockedCells, structuresFor, type LockInfo } from '../lib/analysis';
import { ArrayView, cellText } from './ArrayView';
import { GraphView, Grid2D, isAdjacencyMatrix, MapView, MatrixGraphView } from './Structures';

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
  locks: Map<number, LockInfo>;
  code?: string;
  present: boolean;
}

export function Visualizer({ header, trace, stepIndex, locks, code, present }: Props) {
  const step = trace?.steps[stepIndex];
  const prev = trace && stepIndex > 0 ? trace.steps[stepIndex - 1] : undefined;
  const isLast = !!trace && stepIndex === trace.steps.length - 1 && !trace.error;
  return (
    <>
      <div className="viz-header">
        <div className="eyebrow">{header.eyebrow}</div>
        <h1>{header.title}</h1>
        {header.description && <p>{header.description}</p>}
        <div className="pills">
          {header.pills.map((p) => (
            <span key={p.text} className={`pill ${p.tone ?? ''}`}>{p.text}</span>
          ))}
          {header.note && <span className="pill-note">{header.note}</span>}
        </div>
      </div>
      {!step ? (
        <div className="empty-stage">
          <strong>Press Run</strong> (or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>) to see the code run step by step.
          <br />
          Pick a ready-made algorithm from <strong>Examples</strong>, or type your own code.
        </div>
      ) : (
        <>
          <Stage step={step} prev={prev} stepIndex={stepIndex} locks={locks} isLast={isLast} />
          <Status step={step} stepIndex={stepIndex} locks={locks} />
          <div className="counters">
            <Counter k="Step" v={`${stepIndex + 1}/${trace!.steps.length}`} />
            <Counter k="Comparisons" v={step.counts.compares} />
            <Counter k="Swaps" v={step.counts.swaps} />
            <Counter k={step.counts.calls > 1 ? 'Function calls' : 'Array writes'} v={step.counts.calls > 1 ? step.counts.calls : step.counts.writes} />
          </div>
          {present && code && <CodePanel code={code} line={step.ln} />}
          <div className="lower">
            <CallStack step={step} prev={prev} />
            <Console trace={trace!} step={step} />
          </div>
        </>
      )}
    </>
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

function Stage({ step, prev, stepIndex, locks, isLast }: { step: Step; prev?: Step; stepIndex: number; locks: Map<number, LockInfo>; isLast: boolean }) {
  const { arrays, maps, objects } = structuresFor(step);
  const views = [];
  for (const a of arrays.slice(0, 6)) {
    if (a.item.kind !== 'arr') continue;
    const is2D = a.item.items.length > 0 && a.item.items.every((v) => v.t === 'null' || (v.t === 'r' && step.heap[v.id]?.kind === 'arr')) && a.item.items.some((v) => v.t === 'r');
    if (is2D) {
      if (isAdjacencyMatrix(a.names, a.item, step)) {
        views.push(
          <div className="graph-pair" key={a.id}>
            <MatrixGraphView item={a.item} names={a.names} step={step} />
            <Grid2D item={a.item} names={a.names} step={step} />
          </div>,
        );
      } else views.push(<Grid2D key={a.id} item={a.item} names={a.names} step={step} />);
      continue;
    }
    const info = locks.get(a.id);
    const locked = lockedCells(info, stepIndex, isLast);
    const allLocked = !!info && locked.size === a.item.items.length && a.item.items.length > 1;
    views.push(<ArrayView key={a.id} item={a.item} names={a.names} step={step} stepIndex={stepIndex} locked={locked} allLocked={allLocked} />);
  }
  if (objects.roots.length) views.push(<GraphView key="graph" step={step} prev={prev} roots={objects.roots} />);
  for (const m of maps.slice(0, 3)) if (m.item.kind === 'map') views.push(<MapView key={m.id} item={m.item} names={m.names} step={step} />);
  if (!views.length) {
    return (
      <div className="stage">
        <div className="empty-stage">No arrays, lists or nodes yet. Variables appear in the <strong>Call stack</strong> below.</div>
      </div>
    );
  }
  return <div className="stage">{views}</div>;
}

function Status({ step, stepIndex, locks }: { step: Step; stepIndex: number; locks: Map<number, LockInfo> }) {
  // cells that became final at this step
  const notes: string[] = [];
  for (const [id, info] of locks) {
    const h = step.heap[id];
    if (!h || h.kind !== 'arr') continue;
    info.lockedAt.forEach((at, i) => {
      if (at === stepIndex - 1 && at >= 0) notes.push(`${cellText(h.items[i])}`);
    });
  }
  return (
    <div className={`status ${step.kind}`} role="status" aria-live="polite">
      <span>{step.text}</span>
      {notes.length > 0 && step.kind !== 'end' && (
        <span className="lock-note">· LOCKED {notes.join(', ')} (final position)</span>
      )}
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

function Console({ trace, step }: { trace: Trace; step: Step }) {
  const ref = useRef<HTMLPreElement>(null);
  const text = trace.stdout.slice(0, step.out);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);
  return (
    <div className="box">
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
