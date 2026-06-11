// Datos de prueba: tenant demo y flujo alta_proveedor de la consigna.
// Upserts: correrlo dos veces deja lo mismo.
import { ProcessDefinitionSchema, TenantSchema } from "@flowops/types";
import { connectMongo, mongo } from "./db/mongo";

const tenant = TenantSchema.parse({
  tenant_id: "empresa_acme",
  name: "ACME S.A.",
  status: "active",
  theme: {
    primary_color: "#003366",
    logo_url: "https://example.com/logo.png",
  },
});

const altaProveedor = ProcessDefinitionSchema.parse({
  tenant_id: "empresa_acme",
  process_id: "alta_proveedor",
  version: 1,
  name: "Alta de proveedor",
  nodes: [
    { id: "start", type: "start" },
    { id: "form", type: "form" },
    { id: "validacion", type: "decision", condition: { field: "cuit", op: "not_null" } },
    { id: "aprobacion", type: "task", assigned_role: "compras" },
    { id: "end", type: "end" },
  ],
  edges: [
    { from: "start", to: "form" },
    { from: "form", to: "validacion" },
    { from: "validacion", to: "aprobacion", when: "true" },
    { from: "validacion", to: "end", when: "false" },
    { from: "aprobacion", to: "end" },
  ],
});

await connectMongo();
await mongo()
  .collection("tenants")
  .updateOne({ tenant_id: tenant.tenant_id }, { $set: tenant }, { upsert: true });
await mongo()
  .collection("process_definitions")
  .updateOne(
    {
      tenant_id: altaProveedor.tenant_id,
      process_id: altaProveedor.process_id,
      version: altaProveedor.version,
    },
    { $set: altaProveedor },
    { upsert: true },
  );

console.log("Seed listo: tenant empresa_acme y proceso alta_proveedor v1");
process.exit(0);
