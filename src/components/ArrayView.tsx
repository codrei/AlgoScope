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
  /** a cell that is conceptually empty after its value was copied away (insertion sort's shift) */
  gapAt?: number;
  /** the value waiting to be placed while there is a gap: insertion sort's key */
  held?: { name: string; value: string };
}

/** the most cells of one array that are drawn; a bigger array shows a window of it */
export const MAX_SHOWN = 100;

/**
 * Big arrays (int a[1000]): drawing every cell would make each step slow, and tiny cells are unreadable.
 * Only a window is drawn, starting at 0 or around the cells the step is working on.
 */
export function windowFor(n: number, active: Iterable<number>, max = MAX_SHOWN): { first: number; end: number } {
  if (n <= max) return { first: 0, end: n };
  const hot = [...active].filter((i) => i >= 0 && i < n);
  const focus = hot.length ? Math.min(...hot) : 0;
  const first = focus < max - 10 ? 0 : Math.min(Math.max(0, focus - 20), n - max);
  return { first, end: first + max };
}

export function ArrayView({ item, names, step, stepIndex, locked, allLocked, big, fieldMarkers, info, activeRange, gapAt, held }: Props) {
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
  const { first, end } = windowFor(shown, [...roles.keys(), ...markers.keys()]);
  const windowed = end - first < shown;
  const lead = first > 0 ? 1 : 0;
  const visible = item.items.slice(first, end);
  const maxLen = Math.max(1, ...visible.map((v) => cellText(v).length));
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const { cell, font, gap } = sizing(lead + (end - first) + (end < n ? 1 : 0), maxLen, !!big, width);
  const pitch = cell + gap;
  const kind = item.arrKind;

  // pair of cells highlighted together -> bracket with the operator
  const cmp = [...roles].filter(([, r]) => r === 'compare').map(([i]) => i);
  const swp = [...roles].filter(([, r]) => r === 'swap').map(([i]) => i);
  const pairAll = swp.length === 2 ? swp : cmp.length === 2 ? cmp : null;
  const pair = pairAll && pairAll.every((i) => i >= first && i < end) ? pairAll : null;
  const op = swp.length === 2 ? '⇄' : compareOp(step.text) ?? '';
  const swapAnim = swp.length === 2 ? { a: Math.min(...swp), b: Math.max(...swp) } : null;
  // a value copied inside this array slides from where it came from; a value from a variable drops in
  const mine = step.touches.filter((t) => t.id === item.id);
  const wr = mine.filter((t) => t.role === 'write');
  const rd = mine.filter((t) => t.role === 'read');
  const moveAnim = !swapAnim && wr.length === 1 && step.kind !== 'swap'
    ? { to: wr[0].idx, from: rd.length === 1 && rd[0].idx !== wr[0].idx ? rd[0].idx : null }
    : null;

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
          {item.items.map((v, i) => ({ v, i })).slice(-40).reverse().map(({ v, i }) => (
            <div className="stack-row" key={i}>
              <div className={`cell ${roles.get(i) ?? ''} ${v.t === 'null' ? 'null' : ''}`}>{cellText(v)}</div>
              <span className="stack-tag">{i === n - 1 ? '← top' : ''}</span>
            </div>
          ))}
          {n > 40 && <div className="stack-row"><div className="cell null">+{n - 40} below</div></div>}
          <div className="stack-base" />
        </div>
      </div>
    );
  }

  const isQueue = kind === 'queue' || kind === 'deque';
  return (
    <div className="struct" ref={box}>
      <Label names={names} kind={kindLabel(kind)} n={n} sorted={allLocked} info={info} />
      <div className={`cells ${allLocked ? 'all-sorted' : ''}`} style={style}>
        {n === 0 && <div className="cell null">empty</div>}
        {pair && (
          <div
            className={`bracket ${swp.length === 2 ? 'swap' : ''}`}
            style={{ left: 6 + (Math.min(...pair) - first + lead) * pitch + cell / 4, width: Math.abs(pair[1] - pair[0]) * pitch + cell / 2 }}
          >
            <span>{op}</span>
          </div>
        )}
        {lead > 0 && (
          <div className="cell-col" title={`cells 0 to ${first - 1} are not shown`}>
            <div className="cell null">+{first}</div>
            <div className="cell-idx">0…</div>
          </div>
        )}
        {visible.map((v, k) => {
          const i = first + k;
          const role = roles.get(i);
          const isLocked = locked.has(i) && role !== 'compare' && role !== 'swap';
          let anim = '';
          let animStyle: CSSProperties | undefined;
          if (swapAnim && (i === swapAnim.a || i === swapAnim.b)) {
            const from = i === swapAnim.a ? swapAnim.b : swapAnim.a;
            anim = from < i ? 'anim-up' : 'anim-down';
            animStyle = { '--dx': `${(from - i) * pitch}px` } as CSSProperties;
          } else if (moveAnim && i === moveAnim.to) {
            anim = moveAnim.from !== null ? 'anim-slide' : 'anim-drop';
            if (moveAnim.from !== null) animStyle = { '--dx': `${(moveAnim.from - i) * pitch}px` } as CSSProperties;
          }
          const isGap = gapAt === i && role !== 'write';
          // computed values (fib: dp[i] = dp[i-1] + dp[i-2]): the cells read are the sources
          const isSource = role === 'read' && wr.length > 0 && rd.length >= 2;
          const dim = range && (i < range.lo || i > range.hi) && !role && !isLocked;
          const cls = ['cell', isLocked ? 'locked' : isSource ? 'source' : role ?? '', v.t === 'null' ? 'null' : '', v.t === 'r' ? 'ref' : '', anim, dim ? 'dim' : '', isGap ? 'gap' : ''].join(' ');
          const mk = markers.get(i);
          return (
            <div className="cell-col" key={i} style={allLocked ? ({ '--k': i } as CSSProperties) : undefined}>
              {isGap && held && (
                <div className="held" title={`${held.name} holds ${held.value} until it is placed`}>
                  <small>{held.name}</small> {held.value}
                </div>
              )}
              <div key={anim ? `a${stepIndex}` : 's'} className={cls} style={animStyle} title={isGap ? `gap: the value ${cellText(v)} was copied away from here` : `${names[0] ?? 'arr'}[${i}] = ${cellText(v)}`}>
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
        {end < n && (
          <div className="cell-col" title={end < shown ? `${n - end} more cells are not shown` : `${n - shown} more empty cells ('\\0')`}>
            <div className="cell null">+{n - end}</div>
            <div className="cell-idx">…{n - 1}</div>
          </div>
        )}
      </div>
      {windowed && (
        <p className="cells-note">
          Showing cells {first}–{end - 1} of {n}. Arrays of about 10–100 values are easier to follow.
        </p>
      )}
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
