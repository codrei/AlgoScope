import type { HeapArr, HeapItem, HeapMap, HeapObj, SnapVal, Step } from '../engine/trace';
import type { CallNode } from '../lib/analysis';
import { cellText, Label, rolesFor, windowFor } from './ArrayView';

/** 2D arrays / matrices / DP tables / adjacency lists. */
export function Grid2D({ item, names, step }: { item: HeapArr; names: string[]; step: Step }) {
  const rows = item.items.map((v) => (v.t === 'r' ? step.heap[v.id] : undefined));
  const cols = Math.max(0, ...rows.map((r) => (r && r.kind === 'arr' ? r.items.length : 0)));
  const outerRoles = rolesFor(step, item.id);
  const hotCols = new Set<number>();
  const rowRoles = rows.map((r) => (r && r.kind === 'arr' ? rolesFor(step, r.id) : new Map()));
  rowRoles.forEach((m) => m.forEach((_, c) => hotCols.add(c)));
  // when a cell is being computed, the cells it was read from are its sources (DP: "built from")
  const computing = rowRoles.some((m) => [...m.values()].includes('write'));
  const tooBig = cols > 30 || rows.length > 30;
  // big tables (int g[1000][1000]): only a 30 × 30 window around the cells in use is drawn
  const rw = windowFor(rows.length, [...outerRoles.keys(), ...rowRoles.flatMap((m, i) => (m.size ? [i] : []))], 30);
  const cw = windowFor(cols, hotCols, 30);
  const colIdx = Array.from({ length: cw.end - cw.first }, (_, k) => cw.first + k);
  const windowed = rw.end - rw.first < rows.length || cw.end - cw.first < cols;
  return (
    <div className="struct">
      <Label names={names} kind="2D" n={rows.length} sorted={false} />
      <div className="graph-wrap">
        <div className="grid2d" style={{ gridTemplateColumns: `auto repeat(${colIdx.length}, minmax(${tooBig ? 26 : 40}px, auto))` }}>
          <div />
          {colIdx.map((c) => (
            <div key={c} className={`ghead ${hotCols.has(c) ? 'hot' : ''}`}>{c}</div>
          ))}
          {rows.slice(rw.first, rw.end).map((r, k) => {
            const ri = rw.first + k;
            const hotRow = outerRoles.has(ri) || rowRoles[ri].size > 0;
            return [
              <div key={`h${ri}`} className={`ghead ${hotRow ? 'hot' : ''}`}>{ri}</div>,
              ...colIdx.map((c) => {
                if (!r || r.kind !== 'arr' || c >= r.items.length) return <div key={`${ri}-${c}`} />;
                const r0 = rowRoles[ri].get(c) ?? '';
                const role = r0 === 'read' && computing ? 'source' : r0;
                return (
                  <div key={`${ri}-${c}`} className={`gcell ${role}`} style={tooBig ? { minWidth: 26, height: 26, fontSize: 11 } : undefined}>
                    {cellText(r.items[c])}
                  </div>
                );
              }),
            ];
          })}
        </div>
      </div>
      {windowed && (
        <p className="cells-note">
          Showing rows {rw.first}–{rw.end - 1} and columns {cw.first}–{cw.end - 1} of {rows.length} × {cols}. Tables of about 10 × 10 are easier to follow.
        </p>
      )}
    </div>
  );
}

export function MapView({ item, names, step }: { item: HeapMap; names: string[]; step: Step }) {
  const show = (v: SnapVal) => (v.t === 'r' ? describeRef(step, v.id) : cellText(v));
  // a dictionary with thousands of keys: the first 100 are drawn
  const entries = item.entries.length > 100 ? item.entries.slice(0, 100) : item.entries;
  const more = item.entries.length - entries.length;
  return (
    <div className="struct">
      <Label names={names} kind={item.isSet ? 'set' : 'map'} n={item.entries.length} sorted={false} />
      {item.entries.length === 0 ? (
        <div className="map-view set"><div className="mh">empty</div></div>
      ) : item.isSet ? (
        <div className="cells" style={{ paddingTop: 6 }}>
          {entries.map(([k], i) => (
            <div className="cell-col" key={i}><div className="cell">{show(k)}</div></div>
          ))}
          {more > 0 && <div className="cell-col"><div className="cell null">+{more}</div></div>}
        </div>
      ) : (
        <div className="map-view">
          <div className="mh mk">key</div>
          <div className="mh">value</div>
          {entries.map(([k, v], i) => [
            <div className="mk" key={`k${i}`}>{show(k)}</div>,
            <div key={`v${i}`}>{show(v)}</div>,
          ])}
          {more > 0 && [<div className="mk" key="more">…</div>, <div key="more-v">{more} more</div>]}
        </div>
      )}
    </div>
  );
}

function describeRef(step: Step, id: number): string {
  const h = step.heap[id];
  if (!h) return `#${id}`;
  if (h.kind === 'arr') return '[' + h.items.slice(0, 6).map(cellText).join(', ') + (h.items.length > 6 ? ', …' : '') + ']';
  if (h.kind === 'obj') return `${h.cls} #${id}`;
  return `{${h.entries.length}}`;
}

// ---------------------------------------------------------------- object graph

interface GNode {
  id: number;
  obj: HeapObj;
  x: number;
  y: number;
  w: number;
  label: string;
  children: { field: string; id: number | null }[];
  changed: boolean;
}

const NODE_H = 46;

function scalarLabel(o: HeapObj): string {
  const scalars = o.fields.filter(([, v]) => v.t === 'p');
  if (!scalars.length) return o.cls;
  const pref = ['data', 'val', 'value', 'key', 'item', 'info', 'element', 'num'];
  scalars.sort((a, b) => {
    const ia = pref.indexOf(a[0].toLowerCase());
    const ib = pref.indexOf(b[0].toLowerCase());
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return scalars.slice(0, 2).map(([, v]) => cellText(v)).join(' · ');
}

const BACK_FIELDS = new Set(['prev', 'parent', 'previous', 'back']);

/** the most nodes of a linked list or tree that are drawn */
const MAX_NODES = 60;

export function GraphView({ step, prev, roots }: { step: Step; prev?: Step; roots: { name: string; id: number; label: boolean }[] }) {
  // collect reachable objects, nearest first; a list or tree of hundreds of nodes draws only the first 60
  const all = new Map<number, HeapObj>();
  const queue = roots.map((r) => r.id);
  for (let q = 0; q < queue.length; q++) {
    const id = queue[q];
    if (all.has(id)) continue;
    const h = step.heap[id];
    if (!h || h.kind !== 'obj') continue;
    all.set(id, h);
    for (const [, v] of h.fields) {
      if ((v.t === 'r' || v.t === 'ptr') && v.id !== undefined) queue.push(v.id);
    }
  }
  if (!all.size) return null;
  const objs = all.size > MAX_NODES ? new Map([...all].slice(0, MAX_NODES)) : all;

  const childRefs = (o: HeapObj) =>
    o.fields
      .filter(([f, v]) => !BACK_FIELDS.has(f.toLowerCase()) && (v.t === 'null' || ((v.t === 'r' || v.t === 'ptr') && v.id !== undefined && step.heap[v.id]?.kind === 'obj')))
      .map(([f, v]) => ({ field: f, id: v.t === 'null' ? null : (v as { id: number }).id }));

  const isTree = [...objs.values()].some((o) => childRefs(o).length >= 2);
  const nodes = new Map<number, GNode>();
  const changedSet = new Set<number>();
  for (const [id, o] of objs) {
    const p = prev?.heap[id] as HeapItem | undefined;
    if (!p || JSON.stringify(p) !== JSON.stringify(o)) changedSet.add(id);
  }
  const mk = (id: number): GNode => {
    const o = objs.get(id)!;
    const label = scalarLabel(o);
    const kids = childRefs(o);
    const w = Math.max(54, label.length * 9 + 22) + (isTree ? 0 : 26);
    return { id, obj: o, x: 0, y: 0, w, label, children: kids, changed: changedSet.has(id) && !!prev };
  };
  objs.forEach((_, id) => nodes.set(id, mk(id)));

  // incoming edges to find heads / roots
  const incoming = new Map<number, number>();
  nodes.forEach((n) => n.children.forEach((c) => c.id !== null && incoming.set(c.id, (incoming.get(c.id) ?? 0) + 1)));
  const rootOrder: number[] = [];
  for (const r of roots) if (objs.has(r.id) && !incoming.has(r.id) && !rootOrder.includes(r.id)) rootOrder.push(r.id);
  for (const id of objs.keys()) if (!incoming.has(id) && !rootOrder.includes(id)) rootOrder.push(id);
  if (!rootOrder.length) rootOrder.push(roots[0]?.id ?? [...objs.keys()][0]);

  const placed = new Set<number>();
  let width = 0;
  let height = 0;
  const gapX = isTree ? 18 : 46;
  const levelH = isTree ? 78 : 96;
  const top = 34;

  if (isTree) {
    let cursor = 10;
    const place = (id: number | null, depth: number) => {
      if (id === null || placed.has(id) || !nodes.has(id)) return;
      placed.add(id);
      const n = nodes.get(id)!;
      const kids = n.children;
      const left = kids.find((k) => /left|^l$|lchild/i.test(k.field)) ?? kids[0];
      const right = kids.find((k) => /right|^r$|rchild/i.test(k.field)) ?? kids[1];
      const others = kids.filter((k) => k !== left && k !== right);
      if (left) place(left.id, depth + 1);
      n.x = cursor;
      n.y = top + depth * levelH;
      cursor += n.w + gapX;
      if (right) place(right.id, depth + 1);
      others.forEach((k) => place(k.id, depth + 1));
      width = Math.max(width, n.x + n.w);
      height = Math.max(height, n.y + NODE_H);
    };
    rootOrder.forEach((r) => {
      place(r, 0);
      cursor += 30;
    });
  } else {
    let row = 0;
    for (const head of rootOrder) {
      if (placed.has(head)) continue;
      let x = 10;
      let cur: number | null = head;
      while (cur !== null && nodes.has(cur) && !placed.has(cur)) {
        placed.add(cur);
        const n: GNode = nodes.get(cur)!;
        n.x = x;
        n.y = top + row * levelH;
        x += n.w + gapX;
        width = Math.max(width, n.x + n.w + 40);
        height = Math.max(height, n.y + NODE_H);
        const nxt: { field: string; id: number | null } | undefined = n.children.find((c) => /next|link/i.test(c.field)) ?? n.children[0];
        cur = nxt ? nxt.id : null;
      }
      row++;
    }
  }
  // anything not placed (cycles etc.)
  let extraX = 10;
  nodes.forEach((n) => {
    if (placed.has(n.id)) return;
    n.x = extraX;
    n.y = height + 40;
    extraX += n.w + gapX;
    width = Math.max(width, n.x + n.w);
  });
  height = Math.max(height, ...[...nodes.values()].map((n) => n.y + NODE_H)) + 26;

  // pointer variables above nodes
  const varLabels = new Map<number, string[]>();
  for (const r of roots) {
    if (!nodes.has(r.id) || !r.label) continue;
    const l = varLabels.get(r.id) ?? [];
    if (!l.includes(r.name)) l.push(r.name);
    varLabels.set(r.id, l);
  }

  const edges: { x1: number; y1: number; x2: number; y2: number; nullEnd?: boolean; field: string }[] = [];
  nodes.forEach((n) => {
    n.children.forEach((c, ci) => {
      if (isTree) {
        const fromX = n.x + (n.children.length > 1 ? (ci === 0 ? n.w * 0.25 : n.w * 0.75) : n.w / 2);
        if (c.id === null) return;
        const t = nodes.get(c.id);
        if (!t) return;
        edges.push({ x1: fromX, y1: n.y + NODE_H, x2: t.x + t.w / 2, y2: t.y, field: c.field });
      } else {
        const fromX = n.x + n.w - 13;
        const fromY = n.y + NODE_H / 2;
        if (c.id === null) {
          if (/next|link/i.test(c.field) || n.children.length === 1) edges.push({ x1: fromX, y1: fromY, x2: fromX + 30, y2: fromY, nullEnd: true, field: c.field });
          return;
        }
        const t = nodes.get(c.id);
        if (!t) return;
        if (t.y === n.y && t.x > n.x) edges.push({ x1: fromX, y1: fromY, x2: t.x, y2: t.y + NODE_H / 2, field: c.field });
        else edges.push({ x1: fromX, y1: fromY + 8, x2: t.x + t.w / 2, y2: t.y + (t.y > n.y ? 0 : NODE_H), field: c.field });
      }
    });
  });

  // doubly linked lists: prev links curve back underneath the nodes
  const backEdges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (!isTree) {
    nodes.forEach((n) => {
      for (const [f, v] of n.obj.fields) {
        if (!BACK_FIELDS.has(f.toLowerCase()) || (v.t !== 'r' && v.t !== 'ptr') || v.id === undefined) continue;
        const t = nodes.get(v.id);
        if (t && t.y === n.y && t.x < n.x) backEdges.push({ x1: n.x + 14, y1: n.y + NODE_H, x2: t.x + t.w - 40, y2: t.y + NODE_H });
      }
    });
  }
  if (backEdges.length) height += 14;

  return (
    <div className="struct">
      <div className="struct-label">
        <b>{isTree ? 'tree' : backEdges.length ? 'doubly linked nodes' : 'linked nodes'}</b>
        <span className="kind">{[...new Set([...objs.values()].map((o) => o.cls))].join(', ')}</span>
        <span>{all.size} node{all.size === 1 ? '' : 's'}</span>
        {objs.size < all.size && <span className="struct-info">showing the first {objs.size}</span>}
      </div>
      <div className="graph-wrap">
        <svg className="graph-svg" width={Math.max(width + 20, 200)} height={height} role="img" aria-label="linked structure">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-2)" />
            </marker>
          </defs>
          {edges.map((e, i) =>
            e.nullEnd ? (
              <g key={i}>
                <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="var(--text-3)" strokeWidth={2} />
                <text x={e.x2 + 4} y={e.y2 + 4} fontSize={11} fill="var(--text-3)">null</text>
              </g>
            ) : (
              <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="var(--text-2)" strokeWidth={2} markerEnd="url(#arrow)" />
            ),
          )}
          {backEdges.map((e, i) => (
            <path key={`b${i}`} d={`M${e.x1},${e.y1} C${e.x1},${e.y1 + 26} ${e.x2},${e.y2 + 26} ${e.x2},${e.y2 + 2}`} fill="none" stroke="var(--text-3)" strokeWidth={1.6} strokeDasharray="4 3" markerEnd="url(#arrow)">
              <title>prev</title>
            </path>
          ))}
          {[...nodes.values()].map((n) => (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              <rect
                width={n.w}
                height={NODE_H}
                rx={isTree ? 23 : 10}
                fill={n.changed ? 'var(--write-bg)' : 'var(--cell-bg)'}
                stroke={n.changed ? 'var(--write)' : 'var(--cell-border)'}
                strokeWidth={2}
              />
              {!isTree && <line x1={n.w - 26} y1={0} x2={n.w - 26} y2={NODE_H} stroke="var(--cell-border)" strokeWidth={2} />}
              {!isTree && <circle cx={n.w - 13} cy={NODE_H / 2} r={3.5} fill="var(--text-2)" />}
              <text x={(isTree ? n.w : n.w - 26) / 2} y={NODE_H / 2 + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--text)">
                {n.label}
              </text>
              <title>{`${n.obj.cls} #${n.id}\n` + n.obj.fields.map(([f, v]) => `${f}: ${v.t === 'r' ? '→ #' + v.id : cellText(v)}`).join('\n')}</title>
            </g>
          ))}
          {[...varLabels].map(([id, names]) => {
            const n = nodes.get(id)!;
            const text = names.join(', ');
            const w = text.length * 7.4 + 12;
            return (
              <g key={`v${id}`} transform={`translate(${n.x + (isTree ? n.w : n.w - 26) / 2 - w / 2},${n.y - 26})`}>
                <rect width={w} height={18} rx={5} fill="var(--nu-gold)" />
                <text x={w / 2} y={13} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#24235e">{text}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- graph from an adjacency matrix

const CURRENT_NAMES = ['node', 'u', 'current', 'cur', 'curr', 'vertex'];
const NEIGHBOR_NAMES = ['neighbor', 'neighbour', 'v', 'next', 'nbr', 'adj', 'w'];

/** A square numeric matrix named like a graph (graph, adj, matrix...). */
export function isAdjacencyMatrix(names: string[], item: HeapArr, step: Step): boolean {
  if (!names.some((n) => /graph|adj|matrix|^g$|edges/i.test(n))) return false;
  const n = item.items.length;
  if (n < 2 || n > 12) return false;
  return item.items.every((v) => {
    if (v.t !== 'r') return false;
    const row = step.heap[v.id];
    return row?.kind === 'arr' && row.items.length === n && row.items.every((x) => x.t === 'p' && x.n !== undefined);
  });
}

export function MatrixGraphView({ item, names, step }: { item: HeapArr; names: string[]; step: Step }) {
  const n = item.items.length;
  const m: number[][] = item.items.map((v) => {
    const row = step.heap[(v as { id: number }).id] as HeapArr;
    return row.items.map((x) => (x.t === 'p' ? x.n ?? 0 : 0));
  });
  const weighted = m.some((r) => r.some((x) => x > 1));
  const directed = m.some((r, i) => r.some((x, j) => x !== m[j][i]));

  // helper arrays and variables, searched from the innermost frame outwards
  const frames = [...step.frames].reverse();
  const findArr = (re: RegExp): SnapVal[] | null => {
    for (const f of frames) {
      for (const [name, v] of f.vars) {
        if (!re.test(name) || v.t !== 'r') continue;
        const h = step.heap[v.id];
        if (h?.kind === 'arr' && h.items.length === n) return h.items;
      }
    }
    return null;
  };
  const findInt = (names: string[]): number | null => {
    const f = step.frames[step.frames.length - 1];
    for (const [name, v] of f.vars) {
      if (names.includes(name) && v.t === 'p' && v.n !== undefined && Number.isInteger(v.n) && v.n >= 0 && v.n < n) return v.n;
    }
    return null;
  };
  const visited = findArr(/^(visited|seen|vis|done|marked)$/i);
  const dist = findArr(/^(dist|distance|distances|d)$/i);
  const cur = findInt(CURRENT_NAMES);
  const nb = findInt(NEIGHBOR_NAMES);

  const size = 300;
  const R = 118;
  const cx = size / 2 + 20;
  const cy = size / 2 + 6;
  const pos = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const isOn = (v: SnapVal | undefined) => !!v && v.t === 'p' && (v.n ?? 0) !== 0 && v.s !== 'false' && v.s !== 'False';
  const edges: { a: number; b: number; w: number }[] = [];
  for (let i = 0; i < n; i++) for (let j = directed ? 0 : i + 1; j < n; j++) if (m[i][j] && i !== j) edges.push({ a: i, b: j, w: m[i][j] });
  const nodeR = 19;

  return (
    <div className="struct">
      <div className="struct-label">
        <b>{names.join(' = ')}</b>
        <span className="kind">graph</span>
        <span>{n} vertices · {edges.length} edges</span>
      </div>
      <div className="graph-wrap">
        <svg className="graph-svg" width={size + 40} height={size + (dist ? 30 : 12)} role="img" aria-label="graph">
          <defs>
            <marker id="garrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-3)" />
            </marker>
          </defs>
          {edges.map((e, k) => {
            const p = pos[e.a];
            const q = pos[e.b];
            const hot = cur !== null && nb !== null && ((e.a === cur && e.b === nb) || (!directed && e.b === cur && e.a === nb));
            const dx = q.x - p.x;
            const dy = q.y - p.y;
            const len = Math.hypot(dx, dy) || 1;
            const x1 = p.x + (dx / len) * nodeR;
            const y1 = p.y + (dy / len) * nodeR;
            const x2 = q.x - (dx / len) * nodeR;
            const y2 = q.y - (dy / len) * nodeR;
            return (
              <g key={k}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={hot ? 'var(--compare)' : 'var(--cell-border)'}
                  strokeWidth={hot ? 4 : 2}
                  markerEnd={directed ? 'url(#garrow)' : undefined}
                />
                {weighted && (
                  <g transform={`translate(${(p.x + q.x) / 2},${(p.y + q.y) / 2})`}>
                    <rect x={-11} y={-9} width={22} height={17} rx={4} fill="var(--surface)" stroke="var(--border)" />
                    <text textAnchor="middle" y={4} fontSize={11} fontWeight={700} fill="var(--text-2)">{e.w}</text>
                  </g>
                )}
              </g>
            );
          })}
          {pos.map((p, i) => {
            const vis = visited ? isOn(visited[i]) : false;
            const isCur = i === cur;
            const isNb = i === nb && !isCur;
            const fill = vis ? 'var(--locked-bg)' : isNb ? 'var(--compare-bg)' : 'var(--cell-bg)';
            const stroke = isCur ? 'var(--nu-gold)' : vis ? 'var(--locked-bg)' : isNb ? 'var(--compare)' : 'var(--cell-border)';
            const d = dist?.[i];
            return (
              <g key={i} transform={`translate(${p.x},${p.y})`}>
                {isCur && <circle r={nodeR + 6} fill="none" stroke="var(--nu-gold)" strokeWidth={3} opacity={0.6} />}
                <circle r={nodeR} fill={fill} stroke={stroke} strokeWidth={isCur ? 4 : 2.5} />
                <text textAnchor="middle" y={5} fontSize={15} fontWeight={800} fill={vis ? 'var(--locked-text)' : 'var(--text)'}>{i}</text>
                {d && (
                  <text textAnchor="middle" y={nodeR + 15} fontSize={11.5} fontWeight={700} fill="var(--nu-gold-text)">
                    {cellText(d)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="legend stage-legend">
        {visited && <span><i className="locked" /> visited</span>}
        {cur !== null && <span><i className="current-ring" /> current vertex</span>}
        {nb !== null && <span><i className="compare" /> neighbor being checked</span>}
        {dist && <span><b className="dist-key">9</b> shortest distance found so far</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- recursion tree


export function RecursionTree({ nodes, root, step, stepIndex }: { nodes: Map<number, CallNode>; root: number; step: Step; stepIndex: number }) {
  const active = new Set(step.frames.map((f) => f.fid));
  const topFid = step.frames[step.frames.length - 1]?.fid;
  // nodes that have started by this step
  const visible = (fid: number) => (nodes.get(fid)?.start ?? Infinity) <= stepIndex;
  const pos = new Map<number, { x: number; y: number; w: number }>();
  let cursor = 10;
  let maxDepth = 0;
  let count = 0;
  const place = (fid: number, depth: number): number => {
    const n = nodes.get(fid)!;
    count++;
    const label = n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label;
    const retLen = n.ret !== undefined ? n.ret.length + 3 : 0;
    const w = Math.max(56, (label.length + retLen) * 7.6 + 18);
    const kids = n.children.filter(visible);
    maxDepth = Math.max(maxDepth, depth);
    let x: number;
    if (!kids.length || count > 80) {
      x = cursor + w / 2;
      cursor += w + 12;
    } else {
      const xs = kids.map((c) => place(c, depth + 1));
      x = Math.max((xs[0] + xs[xs.length - 1]) / 2, cursor - w / 2 - 6);
      if (x - w / 2 < 10) x = 10 + w / 2;
      cursor = Math.max(cursor, x + w / 2 + 12);
    }
    pos.set(fid, { x, y: 14 + depth * 52, w });
    return x;
  };
  place(root, 0);
  const width = cursor + 10;
  const height = 14 + (maxDepth + 1) * 52;
  const edges: { a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
  pos.forEach((p, fid) => {
    const n = nodes.get(fid)!;
    if (n.parent !== null && pos.has(n.parent)) {
      const q = pos.get(n.parent)!;
      edges.push({ a: { x: q.x, y: q.y + 30 }, b: { x: p.x, y: p.y } });
    }
  });
  const total = [...pos.keys()].length;
  return (
    <div className="struct">
      <div className="struct-label">
        <b>recursion tree</b>
        <span className="kind">calls</span>
        <span>{total} call{total === 1 ? '' : 's'} so far</span>
      </div>
      <div className="graph-wrap">
        <svg className="graph-svg" width={width} height={height} role="img" aria-label="recursion tree">
          {edges.map((e, i) => (
            <line key={i} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="var(--cell-border)" strokeWidth={2} />
          ))}
          {[...pos].map(([fid, p]) => {
            const n = nodes.get(fid)!;
            const isTop = fid === topFid;
            const onStack = active.has(fid);
            const done = !onStack && n.end < stepIndex;
            const fill = isTop ? 'color-mix(in srgb, var(--nu-gold) 45%, var(--surface))' : onStack ? 'var(--compare-bg)' : done ? 'var(--surface-2)' : 'var(--cell-bg)';
            const stroke = isTop ? 'var(--nu-gold-deep)' : onStack ? 'var(--compare)' : 'var(--cell-border)';
            const label = n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label;
            return (
              <g key={fid} transform={`translate(${p.x - p.w / 2},${p.y})`}>
                <rect width={p.w} height={30} rx={8} fill={fill} stroke={stroke} strokeWidth={isTop ? 3 : 2} />
                <text x={p.w / 2} y={20} textAnchor="middle" fontSize={12.5} fontWeight={700} fill={done ? 'var(--text-2)' : 'var(--text)'}>
                  {label}
                  {done && n.ret !== undefined && <tspan fill="var(--locked)" fontWeight={800}>{` = ${n.ret}`}</tspan>}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- an array drawn as a binary heap

/** The array as the binary tree it represents: children of i are 2i+1 and 2i+2. */
export function HeapTree({ item, step, size }: { item: HeapArr; step: Step; size: number }) {
  const roles = new Map<number, string>();
  for (const t of step.touches) {
    if (t.id !== item.id) continue;
    const rank = { read: 1, write: 2, compare: 3, swap: 4 } as const;
    const cur = roles.get(t.idx) as keyof typeof rank | undefined;
    if (!cur || rank[t.role] > rank[cur]) roles.set(t.idx, t.role);
  }
  const n = Math.min(size, item.items.length, 31);
  if (n < 1) return null;
  const depth = Math.floor(Math.log2(n)) + 1;
  const W = Math.max(260, Math.pow(2, depth - 1) * 52);
  const levelH = 58;
  const pos = (i: number) => {
    const d = Math.floor(Math.log2(i + 1));
    const first = Math.pow(2, d) - 1;
    const slots = Math.pow(2, d);
    return { x: ((i - first + 0.5) / slots) * W, y: 24 + d * levelH };
  };
  const r = 18;
  const fill = (i: number) => {
    const role = roles.get(i);
    if (role === 'swap') return ['var(--swap-bg)', 'var(--swap)'];
    if (role === 'compare') return ['var(--compare-bg)', 'var(--compare)'];
    if (role === 'write') return ['var(--write-bg)', 'var(--write)'];
    return ['var(--cell-bg)', 'var(--cell-border)'];
  };
  return (
    <div className="struct">
      <div className="struct-label">
        <b>as a heap (tree)</b>
        <span className="kind">heap</span>
        <span>children of index i are 2i+1 and 2i+2{size < item.items.length ? ` · heap size ${size}` : ''}</span>
      </div>
      <div className="graph-wrap">
        <svg className="graph-svg" width={W} height={24 + depth * levelH} role="img" aria-label="array drawn as a heap">
          {Array.from({ length: n }, (_, i) => i).filter((i) => i > 0).map((i) => {
            const a = pos(Math.floor((i - 1) / 2));
            const b = pos(i);
            return <line key={`e${i}`} x1={a.x} y1={a.y + r} x2={b.x} y2={b.y - r} stroke="var(--cell-border)" strokeWidth={2} />;
          })}
          {Array.from({ length: n }, (_, i) => {
            const p = pos(i);
            const [bg, stroke] = fill(i);
            return (
              <g key={i} transform={`translate(${p.x},${p.y})`}>
                <circle r={r} fill={bg} stroke={stroke} strokeWidth={2.5} />
                <text textAnchor="middle" y={5} fontSize={14} fontWeight={800} fill="var(--text)">{cellText(item.items[i])}</text>
                <text textAnchor="middle" y={r + 12} fontSize={9.5} fill="var(--text-3)">{i}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
