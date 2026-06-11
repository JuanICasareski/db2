import { useState } from "react";
import { ProcessDefinitionSchema, type ProcessDefinition } from "@flowops/types";
import { Braces, Check, MousePointerClick, Play, Plus, RefreshCw, Workflow, X } from "lucide-react";
import { Button, Card, Input } from "./ui";
import { FlowDiagram } from "./FlowDiagram";
import { ProcessBuilder } from "./ProcessBuilder";

const InputSchema = ProcessDefinitionSchema.omit({ tenant_id: true });

const JSON_TEMPLATE = JSON.stringify(
  {
    process_id: "mi_proceso",
    version: 1,
    name: "Mi proceso",
    nodes: [
      { id: "start", type: "start" },
      { id: "form", type: "form" },
      { id: "end", type: "end" },
    ],
    edges: [
      { from: "start", to: "form" },
      { from: "form", to: "end" },
    ],
  },
  null,
  2,
);

type Props = {
  processes: ProcessDefinition[];
  selected: ProcessDefinition | null;
  onSelect: (def: ProcessDefinition) => void;
  onRefresh: () => Promise<void>;
  onCreate: (def: unknown) => Promise<void>;
  onStart: (def: ProcessDefinition, instanceId?: string) => Promise<void>;
};

export function ProcessPanel({ processes, selected, onSelect, onRefresh, onCreate, onStart }: Props) {
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [draft, setDraft] = useState(JSON_TEMPLATE);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState("");

  const create = async (def: unknown) => {
    await onCreate(def);
    setCreating(false);
  };

  const submitJson = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setDraftError("JSON invalido");
      return;
    }
    const check = InputSchema.safeParse(parsed);
    if (!check.success) {
      setDraftError(
        check.error.issues.map((i) => `${i.path.join(".") || "raiz"}: ${i.message}`).join(" | "),
      );
      return;
    }
    setDraftError(null);
    await create(check.data);
  };

  return (
    <Card
      title="Procesos"
      icon={<Workflow className="size-4 text-indigo-500" />}
      actions={
        <>
          <Button variant="ghost" title="Recargar" onClick={() => void onRefresh()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant={creating ? "outline" : "primary"} onClick={() => setCreating(!creating)}>
            {creating ? <X className="size-4" /> : <Plus className="size-4" />}
            {creating ? "Cancelar" : "Nuevo proceso"}
          </Button>
        </>
      }
    >
      {creating && (
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium w-fit">
            <button
              onClick={() => setMode("visual")}
              className={`cursor-pointer rounded-md px-3 py-1 transition-colors ${
                mode === "visual" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <MousePointerClick className="size-3.5" /> Visual
              </span>
            </button>
            <button
              onClick={() => setMode("json")}
              className={`cursor-pointer rounded-md px-3 py-1 transition-colors ${
                mode === "json" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Braces className="size-3.5" /> JSON
              </span>
            </button>
          </div>

          {mode === "visual" ? (
            <ProcessBuilder onCreate={create} />
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                className="h-72 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
              />
              {draftError && <p className="text-xs text-rose-600">{draftError}</p>}
              <Button className="self-end" onClick={() => void submitJson()}>
                <Check className="size-4" />
                Crear proceso
              </Button>
            </div>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        {processes.map((p) => {
          const active = selected === p;
          return (
            <li key={`${p.process_id}:${p.version}`} className="flex items-center gap-2">
              <button
                onClick={() => onSelect(p)}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "border-indigo-300 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-medium">{p.name}</span>{" "}
                <span className="text-xs text-slate-400">
                  {p.process_id} · v{p.version}
                </span>
              </button>
              <button
                title="Iniciar instancia"
                onClick={() => void onStart(p)}
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-indigo-100 text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
              >
                <Play className="size-4 fill-current" />
              </button>
            </li>
          );
        })}
        {processes.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
            Sin procesos para este tenant. Crea uno con "Nuevo proceso".
          </li>
        )}
      </ul>

      {selected && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">{selected.name}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <FlowDiagram def={selected} />
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              className="flex-1"
              placeholder="instance_id (opcional, para idempotencia)"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
            />
            <Button onClick={() => void onStart(selected, instanceId.trim() || undefined)}>
              <Play className="size-4 fill-current" />
              Iniciar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
