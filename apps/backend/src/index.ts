import { serve } from "@hono/node-server";
import { app } from "./app";
import { config } from "./config";
import { connectMongo } from "./db/mongo";
import { connectRedis } from "./db/redis";
import { connectCassandra } from "./db/cassandra";

await connectMongo();
await connectRedis();
await connectCassandra();

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`FlowOps API en http://localhost:${info.port} (Swagger UI en /ui)`);
});
