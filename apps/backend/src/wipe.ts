// Vacia todos los datos de los cuatro motores. Deja contenedores,
// colecciones, keyspace y bucket en pie, listos para reusar (los
// esquemas y indices no se tocan). Para empezar de cero: pnpm db wipe
// y despues pnpm db seed.
import { config } from "./config";
import { connectMongo, mongo } from "./db/mongo";
import { connectRedis, flushRedis } from "./db/redis";
import { connectCassandra, cassandra } from "./db/cassandra";

await connectMongo();
const collections = await mongo().listCollections().toArray();
for (const c of collections) {
  await mongo().collection(c.name).deleteMany({});
}
console.log(`Mongo: ${collections.map((c) => c.name).join(", ") || "sin colecciones"} vaciadas`);

await connectRedis();
await flushRedis();
console.log("Redis: FLUSHDB");

await connectCassandra();
await cassandra().execute(`TRUNCATE ${config.cassandra.keyspace}.events`);
console.log("Cassandra: tabla events truncada");

// Sin predicado borra todas las series del bucket en el rango.
const stop = new Date(Date.now() + 60_000).toISOString();
const res = await fetch(
  `${config.influx.url}/api/v2/delete?org=${config.influx.org}&bucket=${config.influx.bucket}`,
  {
    method: "POST",
    headers: {
      Authorization: `Token ${config.influx.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ start: "1970-01-01T00:00:00Z", stop }),
  },
);
if (!res.ok) {
  throw new Error(`Influx: el delete fallo con ${res.status}: ${await res.text()}`);
}
console.log("Influx: bucket vaciado");

console.log("Listo: todas las bases quedaron vacias.");
process.exit(0);
