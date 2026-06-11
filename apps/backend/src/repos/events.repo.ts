import { types } from "cassandra-driver";
import { EventSchema, type Event } from "@flowops/types";
import { cassandra } from "../db/cassandra";
import { config } from "../config";

const table = () => `${config.cassandra.keyspace}.events`;

export const eventsRepo = {
  // Escritura con ONE (append masivo, Actividad 6 parte E). La PK es
  // (tenant, instancia) + step: reinsertar el mismo evento es un upsert.
  async append(event: Event): Promise<void> {
    await cassandra().execute(
      `INSERT INTO ${table()} (tenant_id, instance_id, step, ts, type, node, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event.tenant_id,
        event.instance_id,
        event.step,
        new Date(event.ts),
        event.type,
        event.node,
        event.payload ? JSON.stringify(event.payload) : null,
      ],
      { prepare: true, consistency: types.consistencies.one },
    );
  },

  // Lectura con QUORUM: el historial de una instancia viva alimenta
  // decisiones, no se quiere leer una replica atrasada.
  async listByInstance(tenantId: string, instanceId: string): Promise<Event[]> {
    const result = await cassandra().execute(
      `SELECT tenant_id, instance_id, step, ts, type, node, payload
       FROM ${table()} WHERE tenant_id = ? AND instance_id = ?`,
      [tenantId, instanceId],
      { prepare: true, consistency: types.consistencies.quorum },
    );
    // Los rows del driver salen sin tipo: se valida cada uno.
    return result.rows.map((row) =>
      EventSchema.parse({
        tenant_id: row.tenant_id,
        instance_id: row.instance_id,
        step: row.step,
        ts: (row.ts as Date).toISOString(),
        type: row.type,
        node: row.node,
        payload: row.payload ? JSON.parse(row.payload) : undefined,
      }),
    );
  },
};
