import { InstanceStateSchema, type Instance, type InstanceState } from "@flowops/types";
import { redis } from "../db/redis";

// El hash tag {tenant} hace que en modo cluster todas las keys de un
// tenant caigan en el mismo slot: cada tenant vive en un solo shard.
const key = (tenantId: string, instanceId: string) => `instance_state:{${tenantId}}:${instanceId}`;

const toState = (inst: Instance): InstanceState => ({
  instance_id: inst.instance_id,
  process_id: inst.process_id,
  current_node: inst.current_node,
  step: inst.step,
  status: inst.status,
  updated_at: inst.updated_at,
});

export const stateRepo = {
  // SET plano: escribir dos veces el mismo estado da lo mismo.
  async set(inst: Instance): Promise<void> {
    await redis().set(key(inst.tenant_id, inst.instance_id), JSON.stringify(toState(inst)));
  },

  // Redis devuelve string | null: se parsea y valida antes de devolver.
  async get(tenantId: string, instanceId: string): Promise<InstanceState | null> {
    const raw = await redis().get(key(tenantId, instanceId));
    return raw ? InstanceStateSchema.parse(JSON.parse(raw)) : null;
  },
};
