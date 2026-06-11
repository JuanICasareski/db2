import { ProcessDefinitionSchema, type ProcessDefinition } from "@flowops/types";
import { mongo } from "../db/mongo";
import { redis } from "../db/redis";

const col = () => mongo().collection<ProcessDefinition>("process_definitions");
// Hash tag {tenant}: en modo cluster las keys del tenant van al mismo slot.
const cacheKey = (tenantId: string, processId: string, version: number) =>
  `process_def:{${tenantId}}:${processId}:${version}`;
const CACHE_TTL_S = 300;

export const processesRepo = {
  // Si ya existe (mismo tenant, process_id y version) devuelve la
  // existente: repetir el request no crea duplicados.
  async create(def: ProcessDefinition): Promise<{ def: ProcessDefinition; created: boolean }> {
    try {
      await col().insertOne({ ...def });
      return { def, created: true };
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
      const existing = await this.get(def.tenant_id, def.process_id, def.version);
      return { def: existing!, created: false };
    }
  },

  async list(tenantId: string): Promise<ProcessDefinition[]> {
    return col()
      .find({ tenant_id: tenantId }, { projection: { _id: 0 } })
      .sort({ process_id: 1, version: 1 })
      .toArray();
  },

  // Sin version devuelve la ultima. Con version pasa por el cache Redis;
  // el valor cacheado se valida con el schema antes de usarse.
  async get(
    tenantId: string,
    processId: string,
    version?: number,
  ): Promise<ProcessDefinition | null> {
    if (version !== undefined) {
      const cached = await redis().get(cacheKey(tenantId, processId, version));
      if (cached) return ProcessDefinitionSchema.parse(JSON.parse(cached));
    }
    const filter =
      version === undefined
        ? { tenant_id: tenantId, process_id: processId }
        : { tenant_id: tenantId, process_id: processId, version };
    const def = await col().findOne(filter, { projection: { _id: 0 }, sort: { version: -1 } });
    if (def) {
      await redis().set(cacheKey(tenantId, processId, def.version), JSON.stringify(def), {
        EX: CACHE_TTL_S,
      });
    }
    return def;
  },
};
