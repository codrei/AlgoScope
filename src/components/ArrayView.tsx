import type { CSSProperties } from 'react';
import type { HeapArr, SnapVal, Step, TouchRole } from '../engine/trace';
import { compareOp, markersFor } from '../lib/analysis';

const ROLE_RANK: Record<TouchRole, number> = { read: 1, write: 2, compare: 3, swap: 4 };

export function rolesFor(step: Step, id: number): Map<number, TouchRole> {
  const m = new Map<number, TouchRole>();
  for (const t of step.touches) {
    if (t.id !== id) continue;
    const cur = m.get(t.idx);
    if (!cur || ROLE_RANK[t.role] > ROLE_RANK[cur]) m.set(t.idx, t.role);
  }
  return m;
}

export function cellText(v: SnapVal | undefined): string {
  if (!v) return '';
  switch (v.t) {
    case 'p': return v.s;
    case 'null': return 'null';
    case 'r': return `#${v.id}`;
    case 'ptr': return v.s;
  }
}

function sizing(n: number, maxLen: number) {
  let cell = 56;
  if (n > 24) cell = 30;
  else if (n > 16) cell = 38;
  else if (n > 10) cell = 46;
  let font = cell >= 56 ? 20 : cell >= 46 ? 17 : cell >= 38 ? 14 : 12;
  if (maxLen > 3) font = Math.max(10, font - (maxLen - 3) * 2.2);
  const gap = cell >= 46 ? 12 : 6;
  return { cell, font, gap };
}

interface Props {
  item: HeapArr;
  names: string[];
  step: Step;
  stepIndex: number;
  locked: Set<number>;
  allLocked: boolean;
}

export function ArrayView({ item, names, step, stepIndex, locked, allLocked }: Props) {
  const roles = rolesFor(step, item.id);
  const n = item.items.length;
  const maxLen = Math.max(1, ...item.items.map((v) => cellText(v).length));
  const { cell, font, gap } = sizing(n, maxLen);
  const pitch = cell + gap;
  const markers = markersFor(step, item.id, n);
  const kind = item.arrKind;

  // pair of cells highlighted together -> bracket with the operator
  const cmp = [...roles].filter(([, r]) => r === 'compare').map(([i]) => i);
  const swp = [...roles].filter(([, r]) => r === 'swap').map(([i]) => i);
  const pair = swp.length === 2 ? swp : cmp.length === 2 ? cmp : null;
  const op = swp.length === 2 ? '⇄' : compareOp(step.text) ?? '';
  const swapAnim = swp.length === 2 ? { a: Math.min(...swp), b: Math.max(...swp) } : null;

  // active range (left..right / low..high): cells outside it are dimmed
  const find = (names: string[]) => {
    for (const [i, ms] of markers) if (ms.some((m) => names.includes(m))) return i;
    return undefined;
  };
  const lo = find(['left', 'low', 'lo', 'l', 'start']);
  const hi = find(['right', 'high', 'hi', 'r', 'end']);
  const range = lo !== undefined && hi !== undefined && lo <= hi ? { lo, hi } : null;

  const style = { '--cell': `${cell}px`, '--cell-font': `${font}px`, '--gap': `${gap}px` } as CSSProperties;

  if (kind === 'stack') {
    return (
      <div className="struct">
        <Label names={names} kind="stack" n={n} sorted={false} />
        <div className="stack-view" style={style}>
          {n === 0 && <div className="cell null" style={{ width: 104, height: 40 }}>empty</div>}
          {[...item.items].map((v, i) => ({ v, i })).reverse().map(({ v, i }) => (
            <div className="stack-row" key={i}>
              <div className={`cell ${roles.get(i) ?? ''} ${v.t === 'null' ? 'null' : ''}`}>{cellText(v)}</div>
              <span className="stack-tag">{i === n - 1 ? '← top' : ''}</span>
            </div>
          ))}
          <div className="stack-base" />
        </div>
      </div>
    );
  }

  const isQueue = kind === 'queue' || kind === 'deque';
  return (
    <div className="struct">
      <Label names={names} kind={kindLabel(kind)} n={n} sorted={allLocked} />
      <div className="cells" style={style}>
        {n === 0 && <div className="cell null">empty</div>}
        {pair && (
          <div
            className={`bracket ${swp.length === 2 ? 'swap' : ''}`}
            style={{ left: 6 + Math.min(...pair) * pitch + cell / 4, width: Math.abs(pair[1] - pair[0]) * pitch + cell / 2 }}
          >
            <span>{op}</span>
          </div>
        )}
        {item.items.map((v, i) => {
          const role = roles.get(i);
          const isLocked = locked.has(i) && role !== 'compare' && role !== 'swap';
          let anim = '';
          let animStyle: CSSProperties | undefined;
          if (swapAnim && (i === swapAnim.a || i === swapAnim.b)) {
            const from = i === swapAnim.a ? swapAnim.b : swapAnim.a;
            anim = from < i ? 'anim-up' : 'anim-down';
            animStyle = { '--dx': `${(from - i) * pitch}px` } as CSSProperties;
          }
          const dim = range && (i < range.lo || i > range.hi) && !role && !isLocked;
          const cls = ['cell', isLocked ? 'locked' : role ?? '', v.t === 'null' ? 'null' : '', v.t === 'r' ? 'ref' : '', anim, dim ? 'dim' : ''].join(' ');
          const mk = markers.get(i);
          return (
            <div className="cell-col" key={i}>
              <div key={anim ? `a${stepIndex}` : 's'} className={cls} style={animStyle} title={`${names[0] ?? 'arr'}[${i}] = ${cellText(v)}`}>
                {cellText(v)}
              </div>
              <div className="cell-idx">{i}</div>
              <div className="markers">
                {mk?.map((m) => <span className="marker" key={m}>{m}</span>)}
                {isQueue && i === 0 && <span className="queue-tags">front</span>}
                {isQueue && i === n - 1 && n > 1 && <span className="queue-tags">rear</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function kindLabel(k: HeapArr['arrKind']): string {
  switch (k) {
    case 'array': return 'array';
    case 'list': return 'list';
    case 'vector': return 'vector';
    case 'queue': return 'queue';
    case 'deque': return 'deque';
    case 'tuple': return 'tuple';
    case 'pq': return 'heap';
    default: return k;
  }
}

export function Label({ names, kind, n, sorted }: { names: string[]; kind: string; n: number; sorted: boolean }) {
  return (
    <div className="struct-label">
      <b>{names.join(' = ')}</b>
      <span className="kind">{kind}</span>
      <span>{n} item{n === 1 ? '' : 's'}</span>
      {sorted && <span className="sorted-badge">SORTED</span>}
    </div>
  );
}
