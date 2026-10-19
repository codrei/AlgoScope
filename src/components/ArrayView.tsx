import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
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

/** width of an element, kept up to date when the panel is resized */
function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function sizing(n: number, maxLen: number, big: boolean, width = 0) {
  let cell = big && n <= 8 ? 72 : big && n <= 10 ? 62 : 56;
  if (n > 24) cell = 30;
  else if (n > 16) cell = 38;
  else if (n > 10) cell = 46;
  // never wider than the panel: on a 1280 or 1024 px projector shrink the cells so every one stays visible
  if (width > 0 && n > 0) {
    const fits = (c: number) => n * c + (n - 1) * (c >= 46 ? 12 : 6) + 16 <= width;
    while (cell > 26 && !fits(cell)) cell -= 2;
  }
  let font = cell >= 72 ? 27 : cell >= 62 ? 23 : cell >= 56 ? 20 : cell >= 46 ? 17 : cell >= 38 ? 14 : 12;
  // keep long values (False, 1000, 'hello') inside the box: about 0.62em per character
  if (maxLen > 3) font = Math.max(10, Math.min(font - (maxLen - 3) * 2.2, (cell - 10) / (maxLen * 0.62)));
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
  big?: boolean;
  fieldMarkers?: Map<number, string[]>;
  info?: string;
  /** the part of the array in use (cells outside are faded) */
  activeRange?: { lo: number; hi: number };
}

export function ArrayView({ item, names, step, stepIndex, locked, allLocked, big, fieldMarkers, info, activeRange }: Props) {
  const roles = rolesFor(step, item.id);
  const n = item.items.length;
  const markers = markersFor(step, item.id, n);
  fieldMarkers?.forEach((ms, i) => markers.set(i, [...(markers.get(i) ?? []), ...ms]));
  // C char buffers (char stack[100], char postfix[20]): leave out the unused '\0' cells at the end
  let shown = n;
  if (n > 12 && item.items.every((v) => v.t === 'p' && /^'.*'$/.test(v.s))) {
    let used = -1;
    item.items.forEach((v, i) => {
      if (v.t === 'p' && v.s !== "'\\0'") used = i;
    });
    for (const i of markers.keys()) used = Math.max(used, i);
    for (const i of roles.keys()) used = Math.max(used, i);
    shown = Math.min(n, used + 2);
  }
  const visible = shown < n ? item.items.slice(0, shown) : item.items;
  const maxLen = Math.max(1, ...visible.map((v) => cellText(v).length));
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const { cell, font, gap } = sizing(shown + (shown < n ? 1 : 0), maxLen, !!big, width);
  const pitch = cell + gap;
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
  const range = activeRange ?? (lo !== undefined && hi !== undefined && lo <= hi ? { lo, hi } : null);

  const style = { '--cell': `${cell}px`, '--cell-font': `${font}px`, '--gap': `${gap}px` } as CSSProperties;

  if (kind === 'stack') {
    return (
      <div className="struct" ref={box}>
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
    <div className="struct" ref={box}>
      <Label names={names} kind={kindLabel(kind)} n={n} sorted={allLocked} info={info} />
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
        {visible.map((v, i) => {
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
        {shown < n && (
          <div className="cell-col" title={`${n - shown} more empty cells ('\\0')`}>
            <div className="cell null">+{n - shown}</div>
            <div className="cell-idx">…{n - 1}</div>
          </div>
        )}
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

export function Label({ names, kind, n, sorted, info }: { names: string[]; kind: string; n: number; sorted: boolean; info?: string }) {
  return (
    <div className="struct-label">
      <b>{names.join(' = ')}</b>
      <span className="kind">{kind}</span>
      <span>{n} item{n === 1 ? '' : 's'}</span>
      {info && <span className="struct-info">{info}</span>}
      {sorted && <span className="sorted-badge">SORTED</span>}
    </div>
  );
}
