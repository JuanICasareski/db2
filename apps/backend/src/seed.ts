// Datos de prueba: tres tenants, cada uno con su propio proceso demo.
// Upserts: correrlo dos veces deja lo mismo.
import {
  ProcessDefinitionSchema,
  TenantSchema,
  type ProcessDefinition,
  type Tenant,
} from "@flowops/types";
import { connectMongo, mongo } from "./db/mongo";

const seeds: { tenant: Tenant; process: ProcessDefinition }[] = [
  {
    tenant: TenantSchema.parse({
      tenant_id: "empresa_acme",
      name: "ACME S.A.",
      status: "active",
      theme: {
        primary_color: "#003366",
        logo_url: "https://example.com/logo.png",
      },
    }),
    // El flujo de ejemplo de la consigna.
    process: ProcessDefinitionSchema.parse({
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
    }),
  },
  {
    tenant: TenantSchema.parse({
      tenant_id: "juan",
      name: "Juan",
      status: "active",
    }),
    process: ProcessDefinitionSchema.parse({
      tenant_id: "juan",
      process_id: "onboarding_cliente",
      version: 1,
      name: "Onboarding de cliente",
      nodes: [
        { id: "start", type: "start" },
        { id: "datos_cliente", type: "form" },
        { id: "revision", type: "decision", condition: { field: "email", op: "not_null" } },
        { id: "verificacion", type: "task", assigned_role: "ventas" },
        { id: "end", type: "end" },
      ],
      edges: [
        { from: "start", to: "datos_cliente" },
        { from: "datos_cliente", to: "revision" },
        { from: "revision", to: "verificacion", when: "true" },
        { from: "revision", to: "end", when: "false" },
        { from: "verificacion", to: "end" },
      ],
    }),
  },
  {
    tenant: TenantSchema.parse({
      tenant_id: "juani",
      name: "Juani",
      status: "active",
    }),
    process: ProcessDefinitionSchema.parse({
      tenant_id: "juani",
      process_id: "reintegro_gastos",
      version: 1,
      name: "Reintegro de gastos",
      nodes: [
        { id: "start", type: "start" },
        { id: "carga_gastos", type: "form" },
        // Montos altos pasan por gerencia, los chicos se aprueban solos.
        { id: "evaluacion_monto", type: "decision", condition: { field: "monto", op: "gt", value: 50000 } },
        { id: "aprobacion_gerente", type: "task", assigned_role: "gerencia" },
        { id: "end", type: "end" },
      ],
      edges: [
        { from: "start", to: "carga_gastos" },
        { from: "carga_gastos", to: "evaluacion_monto" },
        { from: "evaluacion_monto", to: "aprobacion_gerente", when: "true" },
        { from: "evaluacion_monto", to: "end", when: "false" },
        { from: "aprobacion_gerente", to: "end" },
      ],
    }),
  },
];

await connectMongo();
for (const { tenant, process } of seeds) {
  await mongo()
    .collection("tenants")
    .updateOne({ tenant_id: tenant.tenant_id }, { $set: tenant }, { upsert: true });
  await mongo()
    .collection("process_definitions")
    .updateOne(
      { tenant_id: process.tenant_id, process_id: process.process_id, version: process.version },
      { $set: process },
      { upsert: true },
    );
}

console.log(
  "Seed listo: " + seeds.map((s) => `${s.tenant.tenant_id} -> ${s.process.process_id}`).join(", "),
);
process.exit(0);
