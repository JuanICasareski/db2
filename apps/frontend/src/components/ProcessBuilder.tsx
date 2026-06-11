import { useMemo, useState } from "react";
import {
  ProcessDefinitionSchema,
  type ProcessEdge,
  type ProcessNode,
} from "@flowops/types";
import { ArrowRight, Check, FileText, GitBranch, Plus, Trash2, UserCheck } from "lucide-react";
import { Button, Input } from "./ui";
import { FlowDiagram } from "./FlowDiagram";

const InputSchema = ProcessDefinitionSchema.omit({ tenant_id: true });

const OPS = ["not_null", "eq", "neq", "gt", "lt"] as const;

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const selectCls =
  "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400";

type Props = { onCreate: (def: unknown) => Promise<void> };

export function ProcessBuilder({ onCreate }: Props) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState(1);
  const [nodes, setNodes] = useState<ProcessNode[]>([
    { id: "start", type: "start" },
    { id: "end", type: "end" },
  ]);
  const [edges, setEdges] = useState<ProcessEdge[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processId = slug(name) || "proceso";
  const draft = useMemo(
    () => ({ process_id: processId, version, name: name.trim() || "Proceso", nodes, edges }),
    [processId, version, name, nodes, edges],
  );

  const addNode = (type: "form" | "decision" | "task") => {
    let i = 1;
    while (nodes.some((n) => n.id === `${type}_${i}`)) i++;
    const node: ProcessNode = { id: `${type}_${i}`, type };
    if (type === "decision") node.condition = { field: "campo", op: "not_null" };
    if (type === "task") node.assigned_role = "operador";
    // se inserta antes del end para mantener el orden natural
    setNodes((ns) => [...ns.slice(0, -1), node, ns[ns.length - 1]!]);
  };

  const renameNode = (oldId: string, newId: string) => {
    setNodes((ns) => ns.map((n) => (n.id === oldId ? { ...n, id: newId } : n)));
    setEdges((es) =>
      es.map((e) => ({
        ...e,
        from: e.from === oldId ? newId : e.from,
        to: e.to === oldId ? newId : e.to,
      })),
    );
  };

  const updateNode = (id: string, patch: Partial<ProcessNode>) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const removeNode = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id));
  };

  const updateEdge = (i: number, patch: Partial<ProcessEdge>) =>
    setEdges((es) => es.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const submit = async () => {
    if (edges.length === 0) {
      setError("Agrega al menos una conexion entre nodos");
      return;
    }
    const ids = nodes.map((n) => n.id);
    if (new Set(ids).size !== ids.length) {
      setError("Hay ids de nodo repetidos");
      return;
    }
    const check = InputSchema.safeParse(draft);
    if (!check.success) {
      setError(
        check.error.issues.map((i) => `${i.path.join(".") || "raiz"}: ${i.message}`).join(" | "),
      );
      return;
    }
    setError(null);
    await onCreate(check.data);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            className="w-full"
            placeholder="Nombre del proceso (ej: Alta de proveedor)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            id: <code>{processId}</code>
          </p>
        </div>
        <label className="flex items-center gap-1.5 self-start text-xs text-slate-500">
          v
          <Input
            type="number"
            min={1}
            className="w-16"
            value={version}
            onChange={(e) => setVersion(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Pasos</span>
          <Button variant="outline" onClick={() => addNode("form")}>
            <FileText className="size-3.5" /> Formulario
          </Button>
          <Button variant="outline" onClick={() => addNode("decision")}>
            <GitBranch className="size-3.5" /> Decision
          </Button>
          <Button variant="outline" onClick={() => addNode("task")}>
            <UserCheck className="size-3.5" /> Tarea
          </Button>
        </div>
        <ul className="flex flex-col gap-1.5">
          {nodes.map((n, idx) => {
            const fixed = n.type === "start" || n.type === "end";
            return (
              <li
                key={idx}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2"
              >
                <span className="w-20 text-xs font-medium text-slate-400">{n.type}</span>
                <Input
                  className="w-36 font-mono text-xs"
                  value={n.id}
                  disabled={fixed}
                  onChange={(e) => renameNode(n.id, slug(e.target.value) || n.id)}
                />
                {n.type === "decision" && n.condition && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Input
                      className="w-28 font-mono text-xs"
                      placeholder="campo"
                      value={n.condition.field}
                      onChange={(e) =>
                        updateNode(n.id, { condition: { ...n.condition!, field: e.target.value } })
                      }
                    />
                    <select
                      className={selectCls}
                      value={n.condition.op}
                      onChange={(e) =>
                        updateNode(n.id, {
                          condition: {
                            ...n.condition!,
                            op: e.target.value as (typeof OPS)[number],
                          },
                        })
                      }
                    >
                      {OPS.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                    {n.condition.op !== "not_null" && (
                      <Input
                        className="w-24 font-mono text-xs"
                        placeholder="valor"
                        value={String(n.condition.value ?? "")}
                        onChange={(e) =>
                          updateNode(n.id, {
                            condition: { ...n.condition!, value: e.target.value },
                          })
                        }
                      />
                    )}
                  </span>
                )}
                {n.type === "task" && (
                  <Input
                    className="w-32 text-xs"
                    placeholder="rol asignado"
                    value={n.assigned_role ?? ""}
                    onChange={(e) => updateNode(n.id, { assigned_role: e.target.value })}
                  />
                )}
                {!fixed && (
                  <button
                    title="Eliminar paso"
                    onClick={() => removeNode(n.id)}
                    className="ml-auto cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Conexiones
          </span>
          <Button variant="outline" onClick={() => setEdges((es) => [...es, { from: "start", to: "end" }])}>
            <Plus className="size-3.5" /> Conexion
          </Button>
        </div>
        <ul className="flex flex-col gap-1.5">
          {edges.map((e, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2"
            >
              <select
                className={selectCls}
                value={e.from}
                onChange={(ev) => updateEdge(i, { from: ev.target.value })}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id}
                  </option>
                ))}
              </select>
              <ArrowRight className="size-4 text-slate-400" />
              <select
                className={selectCls}
                value={e.to}
                onChange={(ev) => updateEdge(i, { to: ev.target.value })}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id}
                  </option>
                ))}
              </select>
              <select
                className={selectCls}
                value={e.when ?? ""}
                onChange={(ev) => updateEdge(i, { when: ev.target.value || undefined })}
              >
                <option value="">sin etiqueta</option>
                <option value="true">when: true</option>
                <option value="false">when: false</option>
              </select>
              <button
                title="Eliminar conexion"
                onClick={() => setEdges((es) => es.filter((_, j) => j !== i))}
                className="ml-auto cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {edges.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400">
              Sin conexiones todavia. Agrega una con "+ Conexion".
            </li>
          )}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Vista previa
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <FlowDiagram def={draft} />
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}
      <Button className="self-end" onClick={() => void submit()}>
        <Check className="size-4" />
        Crear proceso
      </Button>
    </div>
  );
}
