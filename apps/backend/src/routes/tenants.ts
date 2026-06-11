import { createRoute, z } from "@hono/zod-openapi";
import { TenantSchema } from "@flowops/types";
import { createRouter, jsonContent } from "../lib/api";
import { tenantsRepo } from "../repos/tenants.repo";

// No lleva header de tenant: es la lista para elegir uno.
const listTenants = createRoute({
  method: "get",
  path: "/",
  summary: "Listar tenants disponibles",
  responses: {
    200: jsonContent(z.array(TenantSchema), "Tenants disponibles"),
  },
});

export const tenants = createRouter();

tenants.openapi(listTenants, async (c) => {
  return c.json(await tenantsRepo.list(), 200);
});
