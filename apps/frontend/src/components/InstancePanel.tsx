import { useState } from "react";
import type { Event, Instance, ProcessDefinition } from "@flowops/types";

type Props = {
  instance: Instance | null;
  def: ProcessDefinition | null;
  events: Event[];
  onLoad: (instanceId: string) => Promise<void>;
  onAdvance: (to: string, payload?: Record<string, unknown>) => Promise<void>;
};

export function InstancePanel({ instance, def, events, onLoad, onAdvance }: Props) {
  const [lookup, setLookup] = useState("");
  const [payload, setPayload] = useState("");
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const advance = async (to: string) => {
    let parsed: Record<string, unknown> | undefined;
    if (payload.trim()) {
      try {
        parsed = JSON.parse(payload) as Record<string, unknown>;
      } catch {
        setPayloadError("Payload: JSON invalido");
        return;
      }
    }
    setPayloadError(null);
    await onAdvance(to, parsed);
    setPayload("");
  };

  const edges =
    instance && def && instance.status === "running"
      ? def.edges.filter((e) => e.from === instance.current_node)
      : [];

  return (
    <section className="card">
      <div className="card-head">
        <h2>Instancia</h2>
        <div className="row">
          <input
            placeholder="buscar por instance_id"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup && void onLoad(lookup)}
          />
          <button onClick={() => lookup && void onLoad(lookup)}>Cargar</button>
        </div>
      </div>

      {!instance && <p className="dim">Inicia una instancia o carga una existente.</p>}

      {instance && (
        <>
          <p>
            <code>{instance.instance_id}</code> · {instance.process_id} v{instance.version} ·{" "}
            <span className={`status status-${instance.status}`}>{instance.status}</span>
          </p>
          <p>
            Nodo actual: <code>{instance.current_node}</code> (step {instance.step})
          </p>

          {edges.length > 0 && (
            <div className="advance">
              <textarea
                placeholder='payload opcional, ej: {"cuit": "30-12345678-9"}'
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={2}
                spellCheck={false}
              />
              {payloadError && <p className="error">{payloadError}</p>}
              <div className="row wrap">
                {edges.map((e) => (
                  <button key={e.to} onClick={() => void advance(e.to)}>
                    Avanzar a {e.to}
                    {e.when !== undefined ? ` (when: ${e.when})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}
          {instance.status === "finished" && <p className="dim">La instancia finalizo.</p>}

          <h3>Eventos</h3>
          <table className="events">
            <thead>
              <tr>
                <th>step</th>
                <th>tipo</th>
                <th>nodo</th>
                <th>hora</th>
                <th>payload</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.step}>
                  <td>{ev.step}</td>
                  <td>{ev.type}</td>
                  <td>{ev.node}</td>
                  <td>{new Date(ev.ts).toLocaleTimeString()}</td>
                  <td>{ev.payload ? <code>{JSON.stringify(ev.payload)}</code> : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
