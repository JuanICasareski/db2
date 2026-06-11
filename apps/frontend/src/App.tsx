import { useCallback, useEffect, useState } from "react";
import type { Event, Instance, ProcessDefinition, Tenant } from "@flowops/types";
import { Building2, TriangleAlert, Workflow, X } from "lucide-react";
import { api } from "./api";
import { ProcessPanel } from "./components/ProcessPanel";
import { InstancePanel } from "./components/InstancePanel";

export default function App() {
  const initialTenant = localStorage.getItem("tenant") ?? "empresa_acme";
  const [tenant, setTenant] = useState(initialTenant);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [processes, setProcesses] = useState<ProcessDefinition[]>([]);
  const [selected, setSelected] = useState<ProcessDefinition | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);
  const [instDef, setInstDef] = useState<ProcessDefinition | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [recent, setRecent] = useState<Instance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("tenant", tenant);
  }, [tenant]);

  const guard = useCallback(async (fn: () => Promise<void>) => {
    try {
      await fn();
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void guard(async () => setTenants(await api.listTenants()));
  }, [guard]);

  const refreshProcesses = useCallback(
    () => guard(async () => setProcesses(await api.listProcesses(tenant))),
    [guard, tenant],
  );

  const refreshRecent = useCallback(
    () => guard(async () => setRecent(await api.listInstances(tenant))),
    [guard, tenant],
  );

  useEffect(() => {
    setSelected(null);
    setInstance(null);
    setInstDef(null);
    setEvents([]);
    void refreshProcesses();
    void refreshRecent();
  }, [refreshProcesses, refreshRecent]);

  const showInstance = async (inst: Instance, def: ProcessDefinition) => {
    setInstance(inst);
    setInstDef(def);
    setEvents(await api.listEvents(tenant, inst.instance_id));
    void refreshRecent();
  };

  const loadInstance = (id: string) =>
    guard(async () => {
      const inst = await api.getInstance(tenant, id);
      const def = await api.getProcess(tenant, inst.process_id, inst.version);
      await showInstance(inst, def);
    });

  const clearInstance = () => {
    setInstance(null);
    setInstDef(null);
    setEvents([]);
    void refreshRecent();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <h1 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Workflow className="size-5" />
            </span>
            FlowOps
          </h1>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <Building2 className="size-4 text-slate-400" />
            <select
              className="w-44 cursor-pointer rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-400"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
            >
              {!tenants.some((t) => t.tenant_id === tenant) && (
                <option value={tenant}>{tenant}</option>
              )}
              {tenants.map((t) => (
                <option key={t.tenant_id} value={t.tenant_id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-4 max-w-6xl px-5">
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            <TriangleAlert className="size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="cursor-pointer rounded-md p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-600"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-6xl items-start gap-5 p-5 lg:grid-cols-[5fr_6fr]">
        <ProcessPanel
          processes={processes}
          selected={selected}
          onSelect={(def) => setSelected((cur) => (cur === def ? null : def))}
          onRefresh={refreshProcesses}
          onCreate={(def) =>
            guard(async () => {
              await api.createProcess(tenant, def);
              await refreshProcesses();
            })
          }
          onStart={(def, instanceId) =>
            guard(async () => {
              const inst = await api.startInstance(tenant, {
                process_id: def.process_id,
                version: def.version,
                instance_id: instanceId,
              });
              await showInstance(inst, def);
            })
          }
        />
        <InstancePanel
          instance={instance}
          def={instDef}
          events={events}
          recent={recent}
          onLoad={loadInstance}
          onClear={clearInstance}
          onAdvance={(to, payload) =>
            guard(async () => {
              if (!instance || !instDef) return;
              const updated = await api.advance(tenant, instance.instance_id, {
                to,
                expected_step: instance.step,
                payload,
              });
              await showInstance(updated, instDef);
            })
          }
        />
      </main>
    </div>
  );
}
