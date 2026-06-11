import { useState } from "react";
import { ProcessDefinitionSchema, type ProcessDefinition } from "@flowops/types";

const InputSchema = ProcessDefinitionSchema.omit({ tenant_id: true });

const TEMPLATE = JSON.stringify(
  {
    process_id: "onboarding_cliente",
    version: 1,
    name: "Onboarding de cliente",
    nodes: [
      { id: "start", type: "start" },
      { id: "form", type: "form" },
      { id: "revision", type: "decision", condition: { field: "email", op: "not_null" } },
      { id: "verificacion", type: "task", assigned_role: "ventas" },
      { id: "end", type: "end" },
    ],
    edges: [
      { from: "start", to: "form" },
      { from: "form", to: "revision" },
      { from: "revision", to: "verificacion", when: "true" },
      { from: "revision", to: "end", when: "false" },
      { from: "verificacion", to: "end" },
    ],
  },
  null,
  2,
);

type Props = {
  processes: ProcessDefinition[];
  selected: ProcessDefinition | null;
  onSelect: (def: ProcessDefinition) => void;
  onCreate: (def: unknown) => Promise<void>;
  onStart: (def: ProcessDefinition, instanceId?: string) => Promise<void>;
};

export function ProcessPanel({ processes, selected, onSelect, onCreate, onStart }: Props) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(TEMPLATE);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState("");

  const submit = async () => {
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
    await onCreate(check.data);
    setCreating(false);
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Procesos</h2>
        <button onClick={() => setCreating(!creating)}>
          {creating ? "Cancelar" : "Nuevo proceso"}
        </button>
      </div>

      {creating && (
        <div className="create">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={18}
            spellCheck={false}
          />
          {draftError && <p className="error">{draftError}</p>}
          <button onClick={() => void submit()}>Crear</button>
        </div>
      )}

      <ul className="list">
        {processes.map((p) => (
          <li key={`${p.process_id}:${p.version}`}>
            <button
              className={selected === p ? "item active" : "item"}
              onClick={() => onSelect(p)}
            >
              {p.name}{" "}
              <span className="dim">
                ({p.process_id} v{p.version})
              </span>
            </button>
          </li>
        ))}
        {processes.length === 0 && <li className="dim">Sin procesos para este tenant.</li>}
      </ul>

      {selected && (
        <div className="detail">
          <h3>{selected.name}</h3>
          <div className="flow">
            {selected.nodes.map((n) => (
              <span key={n.id} className={`node node-${n.type}`} title={n.type}>
                {n.id}
              </span>
            ))}
          </div>
          <div className="row">
            <input
              placeholder="instance_id (opcional)"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
            />
            <button onClick={() => void onStart(selected, instanceId || undefined)}>
              Iniciar instancia
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
