import { createRoute, z } from "@hono/zod-openapi";
import {
  AdvanceSchema,
  EventSchema,
  InstanceSchema,
  InstanceStateSchema,
  StartInstanceSchema,
  type Event,
  type Instance,
} from "@flowops/types";
import { createRouter, ErrorSchema, jsonContent, TenantHeaderSchema } from "../lib/api";
import { processesRepo } from "../repos/processes.repo";
import { instancesRepo } from "../repos/instances.repo";
import { stateRepo } from "../repos/state.repo";
import { eventsRepo } from "../repos/events.repo";
import { metricsRepo } from "../repos/metrics.repo";

const startInstance = createRoute({
  method: "post",
  path: "/",
  summary: "Iniciar una instancia de proceso",
  request: {
    headers: TenantHeaderSchema,
    body: { content: { "application/json": { schema: StartInstanceSchema } }, required: true },
  },
  responses: {
    201: jsonContent(InstanceSchema, "Instancia iniciada"),
    200: jsonContent(InstanceSchema, "Ya existia ese instance_id (idempotente)"),
    400: jsonContent(ErrorSchema, "Request invalido"),
    404: jsonContent(ErrorSchema, "La definicion de proceso no existe"),
  },
});

const listInstances = createRoute({
  method: "get",
  path: "/",
  summary: "Ultimas instancias del tenant",
  request: { headers: TenantHeaderSchema },
  responses: {
    200: jsonContent(z.array(InstanceSchema), "Instancias por actividad reciente"),
    400: jsonContent(ErrorSchema, "Request invalido"),
  },
});

const getInstance = createRoute({
  method: "get",
  path: "/{instance_id}",
  summary: "Consultar una instancia (documento completo, Mongo)",
  request: { headers: TenantHeaderSchema, params: z.object({ instance_id: z.string() }) },
  responses: {
    200: jsonContent(InstanceSchema, "Instancia"),
    400: jsonContent(ErrorSchema, "Request invalido"),
    404: jsonContent(ErrorSchema, "No existe"),
  },
});

const getInstanceState = createRoute({
  method: "get",
  path: "/{instance_id}/state",
  summary: "Estado actual (Redis, con fallback a Mongo)",
  request: { headers: TenantHeaderSchema, params: z.object({ instance_id: z.string() }) },
  responses: {
    200: jsonContent(InstanceStateSchema, "Estado actual"),
    400: jsonContent(ErrorSchema, "Request invalido"),
    404: jsonContent(ErrorSchema, "No existe"),
  },
});

const advanceInstance = createRoute({
  method: "post",
  path: "/{instance_id}/advance",
  summary: "Avanzar la instancia al siguiente nodo",
  description:
    "El avance es manual: el request indica a que nodo ir (to) y en que step esta " +
    "la instancia (expected_step, lock optimista). Repetir el mismo avance devuelve " +
    "el mismo resultado sin duplicar nada.",
  request: {
    headers: TenantHeaderSchema,
    params: z.object({ instance_id: z.string() }),
    body: { content: { "application/json": { schema: AdvanceSchema } }, required: true },
  },
  responses: {
    200: jsonContent(InstanceSchema, "Instancia avanzada (o replay idempotente)"),
    400: jsonContent(ErrorSchema, "Transicion invalida"),
    404: jsonContent(ErrorSchema, "No existe"),
    409: jsonContent(ErrorSchema, "expected_step no coincide o la instancia ya finalizo"),
  },
});

const listEvents = createRoute({
  method: "get",
  path: "/{instance_id}/events",
  summary: "Eventos de la instancia (Cassandra, lectura QUORUM)",
  request: { headers: TenantHeaderSchema, params: z.object({ instance_id: z.string() }) },
  responses: {
    200: jsonContent(z.array(EventSchema), "Eventos ordenados por step"),
    400: jsonContent(ErrorSchema, "Request invalido"),
    404: jsonContent(ErrorSchema, "No existe"),
  },
});

export const instances = createRouter();

instances.openapi(startInstance, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  const body = c.req.valid("json");

  const def = await processesRepo.get(tenantId, body.process_id, body.version);
  if (!def) return c.json({ error: "Definicion de proceso no encontrada" }, 404);
  const startNode = def.nodes.find((n) => n.type === "start");
  if (!startNode) return c.json({ error: "La definicion no tiene nodo start" }, 400);

  const now = new Date().toISOString();
  const inst: Instance = {
    tenant_id: tenantId,
    instance_id: body.instance_id ?? crypto.randomUUID(),
    process_id: def.process_id,
    version: def.version,
    current_node: startNode.id,
    step: 0,
    status: "running",
    started_at: now,
    updated_at: now,
  };
  const { inst: saved, created } = await instancesRepo.create(inst);
  if (created) {
    await eventsRepo.append({
      tenant_id: tenantId,
      instance_id: saved.instance_id,
      step: 0,
      ts: now,
      type: "instance_started",
      node: startNode.id,
    });
    await stateRepo.set(saved);
    await metricsRepo.instanceStarted(tenantId, def.process_id);
  }
  return c.json(saved, created ? 201 : 200);
});

instances.openapi(listInstances, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  return c.json(await instancesRepo.list(tenantId), 200);
});

instances.openapi(getInstance, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  const { instance_id } = c.req.valid("param");
  const inst = await instancesRepo.get(tenantId, instance_id);
  if (!inst) return c.json({ error: "Instancia no encontrada" }, 404);
  return c.json(inst, 200);
});

instances.openapi(getInstanceState, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  const { instance_id } = c.req.valid("param");
  let state = await stateRepo.get(tenantId, instance_id);
  if (!state) {
    // Cache miss: se reconstruye desde Mongo y se repuebla Redis.
    const inst = await instancesRepo.get(tenantId, instance_id);
    if (!inst) return c.json({ error: "Instancia no encontrada" }, 404);
    await stateRepo.set(inst);
    state = await stateRepo.get(tenantId, instance_id);
  }
  return c.json(state!, 200);
});

instances.openapi(advanceInstance, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  const { instance_id } = c.req.valid("param");
  const body = c.req.valid("json");

  const inst = await instancesRepo.get(tenantId, instance_id);
  if (!inst) return c.json({ error: "Instancia no encontrada" }, 404);

  // Replay idempotente: este avance ya se aplico, se devuelve lo mismo.
  if (inst.step === body.expected_step + 1 && inst.current_node === body.to) {
    return c.json(inst, 200);
  }
  if (inst.status === "finished") {
    return c.json({ error: "La instancia ya finalizo" }, 409);
  }
  if (inst.step !== body.expected_step) {
    return c.json({ error: `expected_step ${body.expected_step} no coincide con el step actual ${inst.step}` }, 409);
  }

  const def = await processesRepo.get(tenantId, inst.process_id, inst.version);
  if (!def) return c.json({ error: "Definicion de proceso no encontrada" }, 404);
  const edgeOk = def.edges.some((e) => e.from === inst.current_node && e.to === body.to);
  const targetNode = def.nodes.find((n) => n.id === body.to);
  if (!edgeOk || !targetNode) {
    return c.json({ error: `No hay edge de ${inst.current_node} a ${body.to}` }, 400);
  }

  const newStatus = targetNode.type === "end" ? "finished" : "running";
  const updated = await instancesRepo.advance(
    tenantId,
    instance_id,
    body.expected_step,
    body.to,
    newStatus,
  );
  // Otro request gano la carrera entre el get y el update.
  if (!updated) return c.json({ error: "Conflicto de avance concurrente" }, 409);

  await eventsRepo.append({
    tenant_id: tenantId,
    instance_id,
    step: updated.step,
    ts: updated.updated_at,
    type: newStatus === "finished" ? "instance_finished" : "step_advanced",
    node: body.to,
    payload: body.payload,
  });
  await stateRepo.set(updated);
  await metricsRepo.stepAdvanced({
    tenantId,
    processId: inst.process_id,
    node: body.to,
    durationMs: Date.parse(updated.updated_at) - Date.parse(inst.updated_at),
  });
  return c.json(updated, 200);
});

instances.openapi(listEvents, async (c) => {
  const tenantId = c.req.valid("header")["x-tenant-id"];
  const { instance_id } = c.req.valid("param");
  const inst = await instancesRepo.get(tenantId, instance_id);
  if (!inst) return c.json({ error: "Instancia no encontrada" }, 404);
  const events: Event[] = await eventsRepo.listByInstance(tenantId, instance_id);
  return c.json(events, 200);
});
