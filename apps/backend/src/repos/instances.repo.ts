import type { Instance, InstanceStatus } from "@flowops/types";
import { mongo } from "../db/mongo";

const col = () => mongo().collection<Instance>("instances");

export const instancesRepo = {
  // Si el instance_id ya existe devuelve la instancia existente:
  // repetir el request de inicio no crea duplicados.
  async create(inst: Instance): Promise<{ inst: Instance; created: boolean }> {
    try {
      await col().insertOne({ ...inst });
      return { inst, created: true };
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
      const existing = await this.get(inst.tenant_id, inst.instance_id);
      return { inst: existing!, created: false };
    }
  },

  async get(tenantId: string, instanceId: string): Promise<Instance | null> {
    return col().findOne(
      { tenant_id: tenantId, instance_id: instanceId },
      { projection: { _id: 0 } },
    );
  },

  // Lock optimista: solo avanza si la instancia sigue en expectedStep y
  // corriendo. Si otro request gano la carrera devuelve null.
  async advance(
    tenantId: string,
    instanceId: string,
    expectedStep: number,
    to: string,
    status: InstanceStatus,
  ): Promise<Instance | null> {
    return col().findOneAndUpdate(
      { tenant_id: tenantId, instance_id: instanceId, step: expectedStep, status: "running" },
      {
        $set: { current_node: to, status, updated_at: new Date().toISOString() },
        $inc: { step: 1 },
      },
      { returnDocument: "after", projection: { _id: 0 } },
    );
  },
};
