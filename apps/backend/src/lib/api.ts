import { OpenAPIHono, z } from "@hono/zod-openapi";

// El tenant viaja en este header en toda ruta de datos.
export const TenantHeaderSchema = z.object({
  "x-tenant-id": z.string().min(1).openapi({ example: "empresa_acme" }),
});

export const ErrorSchema = z.object({ error: z.string() });

export const jsonContent = <T>(schema: T, description: string) => ({
  content: { "application/json": { schema } },
  description,
});

// Router con respuesta 400 uniforme cuando falla la validacion zod.
export function createRouter() {
  return new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json({ error: "Request invalido", issues: result.error.issues }, 400);
      }
    },
  });
}
