import { Client } from "cassandra-driver";
import { config } from "../config";

// Sin keyspace en el constructor: se crea aca mismo si no existe.
const client = new Client({
  contactPoints: config.cassandra.contactPoints,
  localDataCenter: config.cassandra.localDataCenter,
});

export async function connectCassandra(): Promise<Client> {
  const { keyspace, replicationFactor } = config.cassandra;
  await client.connect();
  await client.execute(
    `CREATE KEYSPACE IF NOT EXISTS ${keyspace}
     WITH replication = {'class': 'SimpleStrategy', 'replication_factor': ${replicationFactor}}`,
  );
  // Si el keyspace quedo de una corrida con otro RF (cambio de profile
  // liviano/full-size), se ajusta al valor actual. Solo si difiere, y
  // sin tirar el server: el ALTER falla mientras un nodo se esta
  // uniendo al ring.
  const ks = await client.execute(
    "SELECT replication FROM system_schema.keyspaces WHERE keyspace_name = ?",
    [keyspace],
    { prepare: true },
  );
  const currentRf = Number(ks.rows[0]?.replication?.replication_factor ?? replicationFactor);
  if (currentRf !== replicationFactor) {
    try {
      await client.execute(
        `ALTER KEYSPACE ${keyspace}
         WITH replication = {'class': 'SimpleStrategy', 'replication_factor': ${replicationFactor}}`,
      );
      console.log(`Cassandra: RF de ${keyspace} ajustado de ${currentRf} a ${replicationFactor}`);
    } catch (err) {
      console.warn(
        `Cassandra: no se pudo ajustar el RF de ${currentRf} a ${replicationFactor} ` +
          `(se sigue con ${currentRf}): ${(err as Error).message}`,
      );
    }
  }
  // Particion por (tenant, instancia) y clustering por step: el historial
  // de una instancia queda junto y ordenado, y reinsertar un step es un
  // upsert sobre la misma fila (idempotente).
  await client.execute(
    `CREATE TABLE IF NOT EXISTS ${keyspace}.events (
       tenant_id text,
       instance_id text,
       step int,
       ts timestamp,
       type text,
       node text,
       payload text,
       PRIMARY KEY ((tenant_id, instance_id), step)
     )`,
  );
  return client;
}

export function cassandra(): Client {
  return client;
}
