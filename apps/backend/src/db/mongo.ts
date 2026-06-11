import { MongoClient, type Db } from "mongodb";
import { config } from "../config";

const client = new MongoClient(config.mongoUrl);
let db: Db | undefined;

export async function connectMongo(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db(config.mongoDb);
    await Promise.all([
      db
        .collection("process_definitions")
        .createIndex({ tenant_id: 1, process_id: 1, version: 1 }, { unique: true }),
      db.collection("instances").createIndex({ tenant_id: 1, instance_id: 1 }, { unique: true }),
      db.collection("tenants").createIndex({ tenant_id: 1 }, { unique: true }),
    ]);
  }
  return db;
}

export function mongo(): Db {
  if (!db) throw new Error("Mongo no conectado: llamar connectMongo() primero");
  return db;
}
