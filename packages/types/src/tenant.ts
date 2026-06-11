import { z } from "zod";

export const TenantSchema = z.object({
  tenant_id: z.string(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
  theme: z
    .object({
      primary_color: z.string(),
      logo_url: z.string(),
    })
    .optional(),
});
export type Tenant = z.infer<typeof TenantSchema>;
