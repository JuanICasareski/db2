import { z } from "zod";

export const InstanceStatusSchema = z.enum(["running", "finished"]);
export type InstanceStatus = z.infer<typeof InstanceStatusSchema>;

export const InstanceSchema = z.object({
  tenant_id: z.string(),
  instance_id: z.string(),
  process_id: z.string(),
  version: z.number().int().positive(),
  current_node: z.string(),
  step: z.number().int().nonnegative(),
  status: InstanceStatusSchema,
  started_at: z.string(),
  updated_at: z.string(),
});
export type Instance = z.infer<typeof InstanceSchema>;

// Estado caliente que vive en Redis.
export const InstanceStateSchema = z.object({
  instance_id: z.string(),
  process_id: z.string(),
  current_node: z.string(),
  step: z.number().int().nonnegative(),
  status: InstanceStatusSchema,
  updated_at: z.string(),
});
export type InstanceState = z.infer<typeof InstanceStateSchema>;

export const StartInstanceSchema = z.object({
  process_id: z.string(),
  version: z.number().int().positive().optional(),
  // Si el cliente provee el id, repetir el request no crea duplicados.
  instance_id: z.string().optional(),
});
export type StartInstance = z.infer<typeof StartInstanceSchema>;

export const AdvanceSchema = z.object({
  to: z.string(),
  // Lock optimista: debe coincidir con el step actual de la instancia.
  expected_step: z.number().int().nonnegative(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type Advance = z.infer<typeof AdvanceSchema>;
