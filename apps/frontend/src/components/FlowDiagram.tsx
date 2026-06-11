import type { ProcessDefinition } from "@flowops/types";

// Alcanza con nodos y edges: sirve tanto para una definicion guardada
// como para el borrador del builder.
export type FlowDef = Pick<ProcessDefinition, "nodes" | "edges">;

type Props = {
  def: FlowDef;
  currentNode?: string;
  visited?: string[];
  clickable?: string[];
  onNodeClick?: (id: string) => void;
};

const W = 116;
const H = 46;
const GX = 64;
const GY = 30;
const PAD = 8;

type Pos = { x: number; y: number };

// Layout por capas: longest-path desde el nodo start, con tope de pasadas
// para no colgarse si la definicion trae un ciclo.
function computeLayout(def: FlowDef) {
  const layer = new Map<string, number>();
  const start = def.nodes.find((n) => n.type === "start") ?? def.nodes[0];
  layer.set(start.id, 0);
  for (let pass = 0; pass <= def.nodes.length; pass++) {
    let changed = false;
    for (const e of def.edges) {
      const from = layer.get(e.from);
      if (from === undefined) continue;
      const next = from + 1;
      if (next <= def.nodes.length && (layer.get(e.to) ?? -1) < next) {
        layer.set(e.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  let maxLayer = 0;
  for (const v of layer.values()) maxLayer = Math.max(maxLayer, v);
  for (const n of def.nodes) {
    if (!layer.has(n.id)) layer.set(n.id, ++maxLayer);
  }

  const byLayer = new Map<number, string[]>();
  for (const n of def.nodes) {
    const l = layer.get(n.id)!;
    byLayer.set(l, [...(byLayer.get(l) ?? []), n.id]);
  }
  const rows = Math.max(...[...byLayer.values()].map((c) => c.length));
  const height = rows * H + (rows - 1) * GY + PAD * 2;
  const pos = new Map<string, Pos>();
  for (const [l, ids] of byLayer) {
    const colH = ids.length * H + (ids.length - 1) * GY;
    ids.forEach((id, i) => {
      pos.set(id, { x: l * (W + GX) + PAD, y: (height - colH) / 2 + i * (H + GY) });
    });
  }
  const width = (maxLayer + 1) * (W + GX) - GX + PAD * 2;
  return { pos, width, height };
}

export function FlowDiagram({ def, currentNode, visited = [], clickable = [], onNodeClick }: Props) {
  const { pos, width, height } = computeLayout(def);
  const visitedSet = new Set(visited);
  const clickSet = new Set(clickable);

  return (
    <svg className="fd" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: width * 1.15 }}>
      <defs>
        <marker
          id="fd-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" />
        </marker>
      </defs>

      {def.edges.map((e, i) => {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) return null;
        const x1 = a.x + W;
        const y1 = a.y + H / 2;
        const x2 = b.x;
        const y2 = b.y + H / 2;
        const dx = Math.max(30, (x2 - x1) / 2);
        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        const active = currentNode === e.from && clickSet.has(e.to);
        return (
          <g key={i} className={active ? "fd-edge active" : "fd-edge"}>
            <path d={d} markerEnd="url(#fd-arrow)" />
            {e.when !== undefined && (
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6}>
                {e.when}
              </text>
            )}
          </g>
        );
      })}

      {def.nodes.map((n) => {
        const p = pos.get(n.id)!;
        const cx = p.x + W / 2;
        const cy = p.y + H / 2;
        const cls = [
          "fd-node",
          `fd-${n.type}`,
          n.id === currentNode ? "is-current" : "",
          visitedSet.has(n.id) ? "is-visited" : "",
          clickSet.has(n.id) ? "is-clickable" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const tooltip = [
          n.type,
          n.assigned_role ? `rol: ${n.assigned_role}` : "",
          n.condition
            ? `${n.condition.field} ${n.condition.op}${n.condition.value !== undefined ? ` ${String(n.condition.value)}` : ""}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <g key={n.id} className={cls} onClick={() => clickSet.has(n.id) && onNodeClick?.(n.id)}>
            {n.type === "decision" ? (
              <polygon points={`${cx},${p.y} ${p.x + W},${cy} ${cx},${p.y + H} ${p.x},${cy}`} />
            ) : (
              <rect
                x={p.x}
                y={p.y}
                width={W}
                height={H}
                rx={n.type === "start" || n.type === "end" ? H / 2 : 10}
              />
            )}
            <text x={cx} y={cy + 4}>
              {n.id}
            </text>
            <title>{tooltip}</title>
          </g>
        );
      })}
    </svg>
  );
}
