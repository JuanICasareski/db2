import { z } from "zod";

export const EventTypeSchema = z.enum([
  "instance_started",
  "step_advanced",
  "instance_finished",
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const EventSchema = z.object({
  tenant_id: z.string(),
  instance_id: z.string(),
  step: z.number().int().nonnegative(),
  ts: z.string(),
  type: EventTypeSchema,
  node: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type Event = z.infer<typeof EventSchema>;
