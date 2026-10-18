import type { HeapArr, HeapItem, HeapMap, HeapObj, SnapVal, Step } from '../engine/trace';
import { cellText, Label, rolesFor } from './ArrayView';

/** 2D arrays / matrices / DP tables / adjacency lists. */
export function Grid2D({ item, names, step }: { item: HeapArr; names: string[]; step: Step }) {
  const rows = item.items.map((v) => (v.t === 'r' ? step.heap[v.id] : undefined));
  const cols = Math.max(0, ...rows.map((r) => (r && r.kind === 'arr' ? r.items.length : 0)));
  const outerRoles = rolesFor(step, item.id);
  const hotCols = new Set<number>();
  const rowRoles = rows.map((r) => (r && r.kind === 'arr' ? rolesFor(step, r.id) : new Map()));
  rowRoles.forEach((m) => m.forEach((_, c) => hotCols.add(c)));
  const tooBig = cols > 30 || rows.length > 30;
  return (
    <div className="struct">
      <Label names={names} kind="2D" n={rows.length} sorted={false} />
      <div className="graph-wrap">
        <div className="grid2d" style={{ gridTemplateColumns: `auto repeat(${cols}, minmax(${tooBig ? 26 : 40}px, auto))` }}>
          <div />
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className={`ghead ${hotCols.has(c) ? 'hot' : ''}`}>{c}</div>
          ))}
          {rows.map((r, ri) => {
            const hotRow = outerRoles.has(ri) || rowRoles[ri].size > 0;
            return [
              <div key={`h${ri}`} className={`ghead ${hotRow ? 'hot' : ''}`}>{ri}</div>,
              ...Array.from({ length: cols }, (_, c) => {
                if (!r || r.kind !== 'arr' || c >= r.items.length) return <div key={`${ri}-${c}`} />;
                const role = rowRoles[ri].get(c) ?? '';
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
    </div>
  );
}

export function MapView({ item, names, step }: { item: HeapMap; names: string[]; step: Step }) {
  const show = (v: SnapVal) => (v.t === 'r' ? describeRef(step, v.id) : cellText(v));
  return (
    <div className="struct">
      <Label names={names} kind={item.isSet ? 'set' : 'map'} n={item.entries.length} sorted={false} />
      {item.entries.length === 0 ? (
        <div className="map-view set"><div className="mh">empty</div></div>
      ) : item.isSet ? (
        <div className="cells" style={{ paddingTop: 6 }}>
          {item.entries.map(([k], i) => (
            <div className="cell-col" key={i}><div className="cell">{show(k)}</div></div>
          ))}
        </div>
      ) : (
        <div className="map-view">
          <div className="mh mk">key</div>
          <div className="mh">value</div>
          {item.entries.map(([k, v], i) => [
            <div className="mk" key={`k${i}`}>{show(k)}</div>,
            <div key={`v${i}`}>{show(v)}</div>,
          ])}
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

export function GraphView({ step, prev, roots }: { step: Step; prev?: Step; roots: { name: string; id: number; label: boolean }[] }) {
  // collect reachable objects
  const objs = new Map<number, HeapObj>();
  const queue = roots.map((r) => r.id);
  while (queue.length) {
    const id = queue.shift()!;
    if (objs.has(id)) continue;
    const h = step.heap[id];
    if (!h || h.kind !== 'obj') continue;
    objs.set(id, h);
    for (const [, v] of h.fields) {
      if ((v.t === 'r' || v.t === 'ptr') && v.id !== undefined) queue.push(v.id);
    }
  }
  if (!objs.size) return null;

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

  return (
    <div className="struct">
      <div className="struct-label">
        <b>{isTree ? 'tree' : 'linked nodes'}</b>
        <span className="kind">{[...new Set([...objs.values()].map((o) => o.cls))].join(', ')}</span>
        <span>{objs.size} node{objs.size === 1 ? '' : 's'}</span>
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
                <text textAnchor="middle" y={5} fontSize={15} fontWeight={800} fill={vis ? '#fff' : 'var(--text)'}>{i}</text>
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
    </div>
  );
}
