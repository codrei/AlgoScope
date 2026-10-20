import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDialogFocus } from '../lib/useDialogFocus';
import type { Lang } from '../engine/ir';
import { EXAMPLES, type Example } from '../examples';
import { growthFn, labKind, measure, SIZES, type CaseKind, type Measurement } from '../lib/complexity';

type Metric = 'compares' | 'swaps' | 'steps';

interface Series {
  key: CaseKind;
  label: string;
  color: string;
  /** short name for line ends and table headers */
  hint: string;
}

/**
 * The three inputs each algorithm runs on. For searches they are the best / average / worst case by
 * construction. For sorts they are named by the input only: which arrangement is worst depends on the
 * algorithm (sorted input is the worst case of a last-element-pivot quick sort), so the chart marks the
 * line that did the most and the least work from the measurements instead.
 */
function seriesFor(kind: 'sort' | 'linear' | 'binary'): Series[] {
  if (kind === 'sort') {
    return [
      { key: 'average', label: 'Random order', color: 'var(--series-1)', hint: 'random' },
      { key: 'worst', label: 'Reversed order', color: 'var(--series-2)', hint: 'reversed' },
      { key: 'best', label: 'Already sorted', color: 'var(--series-3)', hint: 'sorted' },
    ];
  }
  return [
    { key: 'average', label: 'Random target', color: 'var(--series-1)', hint: 'average case' },
    { key: 'worst', label: 'Target not in the array', color: 'var(--series-2)', hint: 'worst case' },
    { key: 'best', label: kind === 'binary' ? 'Target in the middle' : 'Target is the first element', color: 'var(--series-3)', hint: 'best case' },
  ];
}

const METRIC_NAME: Record<Metric, string> = { compares: 'comparisons', swaps: 'swaps', steps: 'lines executed' };

interface Props {
  example: Example;
  lang: Lang;
  langLabel: string;
  onClose: () => void;
}

export function ComplexityLab({ example, lang, langLabel, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef);
  const kind = labKind(example);
  const [data, setData] = useState<Record<CaseKind, Measurement[]> | null>(null);
  const [metric, setMetric] = useState<Metric>('compares');
  const [compare, setCompare] = useState<{ ex: Example; m: Measurement }[] | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  useEffect(() => {
    if (!kind) return;
    let cancelled = false;
    (async () => {
      const out = { average: [], worst: [], best: [] } as Record<CaseKind, Measurement[]>;
      for (const s of seriesFor(kind)) {
        out[s.key] = await measure(example, lang, s.key);
        if (cancelled) return;
      }
      setData(out);
      if (kind === 'sort') {
        const rows: { ex: Example; m: Measurement }[] = [];
        for (const ex of EXAMPLES.filter((e) => e.topic === 'Sorting')) {
          const m = await measure(ex, lang, 'average', [32]);
          if (cancelled) return;
          if (m[0]) rows.push({ ex, m: m[0] });
        }
        setCompare(rows.sort((a, b) => b.m.compares - a.m.compares));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [example, lang, kind]);

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog lab" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="lab-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="ghost-btn dialog-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <h2 id="lab-title">Complexity Lab</h2>
        {!kind ? (
          <p>
            The Complexity Lab works with the <b>Sorting</b> and <b>Searching</b> examples: it reruns them on bigger and
            bigger inputs and counts the work. Pick one of those from Examples, then open the lab again.
          </p>
        ) : (
          <>
            <p>
              <b>{example.title}</b> in {langLabel}, run on inputs of {SIZES.join(', ')} elements. Each point is a real run of
              the code. The dashed line is the shape of <b>{example.time}</b>, scaled to fit, so you can check that
              the counts grow the way the theory says.
            </p>
            <div className="seg" role="tablist" aria-label="What to count">
              <button role="tab" aria-selected={metric === 'compares'} className={metric === 'compares' ? 'active' : ''} onClick={() => setMetric('compares')}>
                Comparisons
              </button>
              {kind === 'sort' && (
                <button role="tab" aria-selected={metric === 'swaps'} className={metric === 'swaps' ? 'active' : ''} onClick={() => setMetric('swaps')}>
                  Swaps
                </button>
              )}
              <button role="tab" aria-selected={metric === 'steps'} className={metric === 'steps' ? 'active' : ''} onClick={() => setMetric('steps')}>
                Lines executed
              </button>
            </div>
            {!data ? (
              <div className="lab-loading"><Loader2 className="spin" size={18} /> Running {SIZES.length * 3} experiments…</div>
            ) : (
              <GrowthChart data={data} metric={metric} big={example.time} series={seriesFor(kind)} isSort={kind === 'sort'} title={example.title} />
            )}
            {kind === 'sort' && (
              <>
                <h3>All sorting algorithms on the same random input (n = 32)</h3>
                {!compare ? (
                  <div className="lab-loading"><Loader2 className="spin" size={18} /> Running the other sorts…</div>
                ) : (
                  <CompareBars rows={compare} current={example.id} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function niceMax(v: number): number {
  if (v <= 10) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * p;
}

interface ChartProps {
  data: Record<CaseKind, Measurement[]>;
  metric: Metric;
  big: string;
  series: Series[];
  isSort: boolean;
  title: string;
}

function GrowthChart({ data, metric, big, series: SERIES, isSort, title }: ChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 300;
  const pad = { l: 56, r: 150, t: 14, b: 40 };
  const all = SERIES.flatMap((s) => data[s.key].map((m) => m[metric]));
  const fn = growthFn(big);
  // scale the reference curve to the line that did the most work at the largest n
  const lastOf = (k: CaseKind) => data[k][data[k].length - 1];
  const ranked = SERIES.filter((s) => lastOf(s.key)).sort((a, b) => lastOf(b.key)![metric] - lastOf(a.key)![metric]);
  const top = ranked[0] ? lastOf(ranked[0].key) : undefined;
  const scale = fn && top ? top[metric] / Math.max(1e-9, fn(top.n)) : 0;
  const maxV = ranked.length ? lastOf(ranked[0].key)![metric] : 0;
  const minV = ranked.length ? lastOf(ranked[ranked.length - 1].key)![metric] : 0;
  const differs = ranked.length > 1 && maxV !== minV;
  // ties count too: sorted and reversed input are both the worst case of a last-element-pivot quick sort
  const most = isSort && differs ? ranked.filter((s) => lastOf(s.key)![metric] === maxV) : [];
  const least = isSort && differs ? ranked.filter((s) => lastOf(s.key)![metric] === minV) : [];
  const tag = (k: CaseKind) => (most.some((s) => s.key === k) ? ' · most work' : least.some((s) => s.key === k) ? ' · least work' : '');
  const names = (ss: Series[]) => ss.map((s) => s.label.toLowerCase()).join(' and ');
  const ref = fn ? SIZES.map((n) => ({ n, v: fn(n) * scale })) : [];
  const yMax = niceMax(Math.max(1, ...all, ...ref.map((r) => r.v)));
  const x = (n: number) => pad.l + ((n - SIZES[0]) / (SIZES[SIZES.length - 1] - SIZES[0])) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const path = (pts: { n: number; v: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.n).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const fmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v)));

  // direct labels at line ends, nudged apart
  const ends = SERIES.map((s) => {
    const last = data[s.key][data[s.key].length - 1];
    return { s, yy: last ? y(last[metric]) : -100 };
  }).sort((a, b) => a.yy - b.yy);
  for (let i = 1; i < ends.length; i++) if (ends[i].yy - ends[i - 1].yy < 16) ends[i].yy = ends[i - 1].yy + 16;

  const hn = hover !== null ? SIZES[hover] : null;
  const same = SIZES.every((n) => {
    const vals = SERIES.map((s) => data[s.key].find((d) => d.n === n)?.[metric]);
    return vals.every((v) => v === vals[0]);
  });
  return (
    <div className="lab-chart">
      {same && (
        <p className="notice">
          All three lines are on top of each other: this algorithm does the same amount of this work no matter how the
          input is arranged (best case = worst case).
        </p>
      )}
      {most.length > 0 && least.length > 0 && (
        <p className="lab-insight">
          For {title}, <b>{names(most)}</b> input {most.length > 1 ? 'need' : 'needs'} the most {METRIC_NAME[metric]} (the worst case
          here) and <b>{names(least)}</b> input the fewest (the best case).
        </p>
      )}
      <div className="legend lab-legend">
        {SERIES.map((s) => (
          <span key={s.key}><i style={{ background: s.color, borderColor: s.color }} /> {s.label} {isSort ? (tag(s.key) && <small>({tag(s.key).slice(3)})</small>) : <small>({s.hint})</small>}</span>
        ))}
        {fn && <span><i className="dash" /> {big} shape</span>}
      </div>
      <div className="lab-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Growth of ${metric} with input size`} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--text-3)">{fmt(t)}</text>
            </g>
          ))}
          {SIZES.map((n) => (
            <text key={n} x={x(n)} y={H - pad.b + 18} textAnchor="middle" fontSize={11} fill="var(--text-3)">n = {n}</text>
          ))}
          {hn !== null && <line x1={x(hn)} x2={x(hn)} y1={pad.t} y2={H - pad.b} stroke="var(--text-3)" strokeWidth={1} strokeDasharray="3 3" />}
          {fn && <path d={path(ref)} fill="none" stroke="var(--text-3)" strokeWidth={2} strokeDasharray="6 5" />}
          {SERIES.map((s) => {
            const pts = data[s.key].map((m) => ({ n: m.n, v: m[metric] }));
            return (
              <g key={s.key}>
                <path d={path(pts)} fill="none" stroke={s.color} strokeWidth={2} />
                {pts.map((p) => (
                  <circle key={p.n} cx={x(p.n)} cy={y(p.v)} r={4.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                ))}
              </g>
            );
          })}
          {ends.map(({ s, yy }) => (
            <text key={s.key} x={W - pad.r + 10} y={yy + 4} fontSize={11.5} fontWeight={600} fill="var(--text-2)">{s.hint}{tag(s.key)}</text>
          ))}
          {SIZES.map((n, i) => (
            <rect key={n} x={x(n) - 40} y={pad.t} width={80} height={H - pad.t - pad.b} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
        </svg>
        {hn !== null && (
          <div className="chart-tip" style={{ left: `${(x(hn) / W) * 100}%` }}>
            <b>n = {hn}</b>
            {SERIES.map((s) => {
              const m = data[s.key].find((d) => d.n === hn);
              return m ? <div key={s.key}><i style={{ background: s.color }} /> {s.hint}: {m[metric].toLocaleString()}</div> : null;
            })}
          </div>
        )}
      </div>
      <table className="lab-table">
        <thead>
          <tr>
            <th>n</th>
            {SERIES.map((s) => <th key={s.key}>{s.hint}</th>)}
            {fn && <th>{big} (scaled)</th>}
          </tr>
        </thead>
        <tbody>
          {SIZES.map((n, i) => (
            <tr key={n}>
              <td>{n}</td>
              {SERIES.map((s) => <td key={s.key}>{data[s.key].find((d) => d.n === n)?.[metric].toLocaleString() ?? '—'}</td>)}
              {fn && <td>{Math.round(ref[i].v).toLocaleString()}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareBars({ rows, current }: { rows: { ex: Example; m: Measurement }[]; current: string }) {
  const max = useMemo(() => Math.max(1, ...rows.map((r) => r.m.compares)), [rows]);
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className={`bar-row ${r.ex.id === current ? 'current' : ''}`} key={r.ex.id} title={`${r.ex.title}: ${r.m.compares} comparisons, ${r.m.swaps} swaps`}>
          <span className="bar-name">{r.ex.title}<small>{r.ex.time}</small></span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(r.m.compares / max) * 100}%` }} />
          </span>
          <span className="bar-val">{r.m.compares.toLocaleString()}</span>
        </div>
      ))}
      <p className="bar-note">Comparisons between array elements. Sorts with fewer comparisons do less work on the same input.</p>
    </div>
  );
}
