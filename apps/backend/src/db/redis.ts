import { createClient } from "redis";
import { config } from "../config";

type RedisClient = ReturnType<typeof createClient>;
let client: RedisClient | undefined;

export async function connectRedis(): Promise<RedisClient> {
  if (!client) {
    client = createClient({ url: config.redisUrl });
    client.on("error", (err) => console.error("Redis:", err));
    await client.connect();
  }
  return client;
}

export function redis(): RedisClient {
  if (!client) throw new Error("Redis no conectado: llamar connectRedis() primero");
  return client;
}
