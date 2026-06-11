import { useState } from "react";
import type { Event, EventType, Instance, ProcessDefinition } from "@flowops/types";
import { Activity, ArrowRight, Search } from "lucide-react";
import { Button, Card, Input } from "./ui";
import { FlowDiagram } from "./FlowDiagram";

type Props = {
  instance: Instance | null;
  def: ProcessDefinition | null;
  events: Event[];
  onLoad: (instanceId: string) => Promise<void>;
  onAdvance: (to: string, payload?: Record<string, unknown>) => Promise<void>;
};

const EVENT_STYLE: Record<EventType, { dot: string; label: string }> = {
  instance_started: { dot: "bg-sky-400", label: "inicio" },
  step_advanced: { dot: "bg-indigo-400", label: "avance" },
  instance_finished: { dot: "bg-emerald-500", label: "fin" },
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

  const running = instance?.status === "running";
  const targets =
    instance && def && running
      ? def.edges.filter((e) => e.from === instance.current_node).map((e) => e.to)
      : [];
  const visited = events.map((e) => e.node);

  return (
    <Card
      title="Instancia"
      icon={<Activity className="size-4 text-indigo-500" />}
      actions={
        <div className="flex items-center gap-2">
          <Input
            placeholder="buscar por instance_id"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup.trim() && void onLoad(lookup.trim())}
          />
          <Button variant="outline" onClick={() => lookup.trim() && void onLoad(lookup.trim())}>
            <Search className="size-4" />
          </Button>
        </div>
      }
    >
      {!instance && (
        <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 py-10 text-center">
          <p className="text-sm text-slate-400">
            Inicia una instancia con el boton de play
            <br />o carga una existente por id.
          </p>
        </div>
      )}

      {instance && def && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {instance.instance_id}
            </code>
            <span className="text-slate-400">
              {instance.process_id} · v{instance.version} · step {instance.step}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                running
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${running ? "animate-pulse bg-emerald-500" : "bg-rose-500"}`}
              />
              {instance.status}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <FlowDiagram
              def={def}
              currentNode={instance.current_node}
              visited={visited}
              clickable={targets}
              onNodeClick={(id) => void advance(id)}
            />
          </div>
          {running && targets.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Toca un nodo punteado para avanzar, o usa los botones.
            </p>
          )}

          {running && targets.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder='payload opcional, ej: {"cuit": "30-12345678-9"}'
                rows={2}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                spellCheck={false}
              />
              {payloadError && <p className="text-xs text-rose-600">{payloadError}</p>}
              <div className="flex flex-wrap gap-2">
                {def.edges
                  .filter((e) => e.from === instance.current_node)
                  .map((e) => (
                    <Button key={e.to} variant="outline" onClick={() => void advance(e.to)}>
                      <ArrowRight className="size-4" />
                      {e.to}
                      {e.when !== undefined && (
                        <span className="text-xs text-slate-400">when: {e.when}</span>
                      )}
                    </Button>
                  ))}
              </div>
            </div>
          )}

          <h3 className="mt-5 mb-3 text-sm font-semibold text-slate-700">Eventos</h3>
          <ol className="ml-2 border-l-2 border-slate-100">
            {events.map((ev) => {
              const style = EVENT_STYLE[ev.type];
              return (
                <li key={ev.step} className="relative pb-4 pl-5 last:pb-0">
                  <span
                    className={`absolute top-1 -left-[7px] size-3 rounded-full border-2 border-white ${style.dot}`}
                  />
                  <div className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="font-mono text-xs text-slate-400">#{ev.step}</span>
                    <span className="font-medium text-slate-700">{style.label}</span>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {ev.node}
                    </code>
                    <span className="text-xs text-slate-400">
                      {new Date(ev.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  {ev.payload && (
                    <code className="mt-1 block w-fit rounded-md bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500">
                      {JSON.stringify(ev.payload)}
                    </code>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Card>
  );
}
