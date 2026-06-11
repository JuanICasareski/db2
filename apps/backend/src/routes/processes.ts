import { createRoute, z } from "@hono/zod-openapi";
import { ProcessDefinitionSchema } from "@flowops/types";
import { createRouter, ErrorSchema, jsonContent, TenantHeaderSchema } from "../lib/api";
import { processesRepo } from "../repos/processes.repo";

const ProcessInputSchema = ProcessDefinitionSchema.omit({ tenant_id: true });

const createProcess = createRoute({
  method: "post",
  path: "/",
  summary: "Crear una definicion de proceso",
  request: {
    headers: TenantHeaderSchema,
    body: { content: { "application/json": { schema: ProcessInputSchema } }, required: true },
  },
  responses: {
    201: jsonContent(ProcessDefinitionSchema, "Definicion creada"),
    200: jsonContent(ProcessDefinitionSchema, "Ya existia esa version (idempotente)"),
    400: jsonContent(ErrorSchema, "Request invalido"),
  },
});

const listProcesses = createRoute({
  method: "get",
  path: "/",
  summary: "Listar definiciones del tenant",
  request: { headers: TenantHeaderSchema },
  responses: {
    200: jsonContent(z.array(ProcessDefinitionSchema), "Definiciones del tenant"),
    400: jsonContent(ErrorSchema, "Request invalido"),
  },
});

const getProcess = createRoute({
  method: "get",
  path: "/{process_id}",
  summary: "Consultar una definicion (ultima version o una puntual)",
  request: {
    headers: TenantHeaderSchema,
    params: z.object({ process_id: z.string() }),
    query: z.object({ version: z.coerce.number().int().positive().optional() }),
  },
  responses: {
    200: jsonContent(ProcessDefinitionSchema, "Definicion encontrada"),
    400: jsonContent(ErrorSchema, "Request invalido"),
    404: jsonContent(ErrorSchema, "No existe"),
  },
});

export const processes = createRouter();

processes.openapi(createProcess, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  const input = c.req.valid("json");
  const { def, created } = await processesRepo.create({ ...input, tenant_id: tenantId });
  return c.json(def, created ? 201 : 200);
});

processes.openapi(listProcesses, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  return c.json(await processesRepo.list(tenantId), 200);
});

processes.openapi(getProcess, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  const { process_id } = c.req.valid("param");
  const { version } = c.req.valid("query");
  const def = await processesRepo.get(tenantId, process_id, version);
  if (!def) return c.json({ error: "Definicion de proceso no encontrada" }, 404);
  return c.json(def, 200);
});
