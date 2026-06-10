# FlowOps: acceso a datos tipado

Monorepo TypeScript (Turborepo + pnpm). Regla para todo codigo que toque
Redis, MongoDB, Cassandra o InfluxDB: el resto de la app nunca usa un
driver directo, siempre pasa por un repositorio tipado.

## Entidades

- Cada entidad se define una sola vez, como schema de `zod`, y el tipo se
  deriva con `z.infer`. No duplicar la interfaz a mano.

```typescript
import { z } from "zod";

export const ProcesoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  version: z.number().int(),
});
export type Proceso = z.infer<typeof ProcesoSchema>;
```

## Repositorios

- Un modulo repositorio por base de datos. Sus funciones reciben y
  devuelven los tipos de entidad (`Proceso`, no `any` ni `Row`).
- Los drivers solo se importan dentro del repositorio.

## Tipado por base

- MongoDB: usar genericos del driver, `db.collection<Proceso>("procesos")`.
  El tipado del driver es confiable, no hace falta validar cada lectura.
- Redis: el cliente devuelve `string | null`. El repositorio hace
  `JSON.parse` y valida con `ProcesoSchema.parse(...)` antes de devolver.
- Cassandra: con el Mapper usar `mapper.forModel<Proceso>(...)`. Con
  `execute()` los rows salen sin tipo: validar cada row con el schema.
- InfluxDB: `queryApi.collectRows<Fila>(query)` es solo un cast. Definir
  el schema de la fila y validar las filas leidas.

## Regla general

Donde el tipado es solo una promesa (Redis, Cassandra con `execute`,
Influx), validar con zod en el borde. Donde el driver lo garantiza
(Mongo), alcanza con el generico. Asi un desfase entre el dato guardado y
la entidad rompe en el repositorio, con un error claro, y no mas adentro
de la app.
