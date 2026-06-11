import { useCallback, useEffect, useState } from "react";
import type { Event, Instance, ProcessDefinition } from "@flowops/types";
import { api } from "./api";
import { ProcessPanel } from "./components/ProcessPanel";
import { InstancePanel } from "./components/InstancePanel";

export default function App() {
  const [tenant, setTenant] = useState("empresa_acme");
  const [tenantDraft, setTenantDraft] = useState("empresa_acme");
  const [processes, setProcesses] = useState<ProcessDefinition[]>([]);
  const [selected, setSelected] = useState<ProcessDefinition | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);
  const [instDef, setInstDef] = useState<ProcessDefinition | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);

  const guard = useCallback(async (fn: () => Promise<void>) => {
    try {
      await fn();
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const refreshProcesses = useCallback(
    () => guard(async () => setProcesses(await api.listProcesses(tenant))),
    [guard, tenant],
  );

  useEffect(() => {
    setSelected(null);
    setInstance(null);
    setInstDef(null);
    setEvents([]);
    void refreshProcesses();
  }, [refreshProcesses]);

  const showInstance = async (inst: Instance, def: ProcessDefinition) => {
    setInstance(inst);
    setInstDef(def);
    setEvents(await api.listEvents(tenant, inst.instance_id));
  };

  return (
    <>
      <header>
        <h1>FlowOps</h1>
        <label className="tenant">
          tenant
          <input
            value={tenantDraft}
            onChange={(e) => setTenantDraft(e.target.value)}
            onBlur={() => setTenant(tenantDraft)}
            onKeyDown={(e) => e.key === "Enter" && setTenant(tenantDraft)}
          />
        </label>
      </header>

      {error && <div className="banner">{error}</div>}

      <main>
        <ProcessPanel
          processes={processes}
          selected={selected}
          onSelect={setSelected}
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
          onLoad={(id) =>
            guard(async () => {
              const inst = await api.getInstance(tenant, id);
              const def = await api.getProcess(tenant, inst.process_id, inst.version);
              await showInstance(inst, def);
            })
          }
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
    </>
  );
}
