import { createClient, createCluster } from "redis";
import { config } from "../config";

type RedisClient = ReturnType<typeof createClient>;
type RedisCluster = ReturnType<typeof createCluster>;
export type RedisConnection = RedisClient | RedisCluster;

let client: RedisClient | undefined;
let cluster: RedisCluster | undefined;

// Con REDIS_CLUSTER_NODES seteado (profile full-size) se usa el cliente
// cluster, que sigue las redirecciones MOVED y redescubre la topologia
// ante un failover. Sin setear, el cliente comun contra el nodo unico.
export async function connectRedis(): Promise<RedisConnection> {
  if (config.redisClusterNodes.length > 0) {
    if (!cluster) {
      cluster = createCluster({
        rootNodes: config.redisClusterNodes.map((node) => ({ url: `redis://${node}` })),
      });
      cluster.on("error", (err) => console.error("Redis Cluster:", err));
      await cluster.connect();
    }
    return cluster;
  }
  if (!client) {
    client = createClient({ url: config.redisUrl });
    client.on("error", (err) => console.error("Redis:", err));
    await client.connect();
  }
  return client;
}

export function redis(): RedisConnection {
  const conn = cluster ?? client;
  if (!conn) throw new Error("Redis no conectado: llamar connectRedis() primero");
  return conn;
}

// FLUSHDB no existe a nivel cluster: hay que correrlo en cada master.
export async function flushRedis(): Promise<void> {
  if (cluster) {
    for (const master of cluster.masters) {
      const node = await cluster.nodeClient(master);
      await node.flushDb();
    }
    return;
  }
  if (!client) throw new Error("Redis no conectado: llamar connectRedis() primero");
  await client.flushDb();
}
