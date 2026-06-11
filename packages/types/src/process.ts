import { z } from "zod";

export const NodeTypeSchema = z.enum(["start", "form", "decision", "task", "end"]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

// Condicion estructurada de los nodos decision. Se guarda como
// documentacion del flujo, el backend no la evalua: la rama se elige
// en el request de avance.
export const ConditionSchema = z.object({
  field: z.string(),
  op: z.enum(["eq", "neq", "gt", "lt", "not_null"]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const ProcessNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  condition: ConditionSchema.optional(),
  assigned_role: z.string().optional(),
});
export type ProcessNode = z.infer<typeof ProcessNodeSchema>;

export const ProcessEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  when: z.string().optional(),
});
export type ProcessEdge = z.infer<typeof ProcessEdgeSchema>;

export const ProcessDefinitionSchema = z.object({
  tenant_id: z.string(),
  process_id: z.string(),
  version: z.number().int().positive(),
  name: z.string(),
  nodes: z.array(ProcessNodeSchema).min(1),
  edges: z.array(ProcessEdgeSchema),
});
export type ProcessDefinition = z.infer<typeof ProcessDefinitionSchema>;
