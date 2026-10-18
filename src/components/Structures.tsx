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
