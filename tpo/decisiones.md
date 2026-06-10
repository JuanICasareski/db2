# Decisiones de diseño del TPO

Decisiones tomadas por el grupo antes de implementar. Las actividades son
la base conceptual, no regla: donde una actividad propone algo que no
aporta al prototipo (Neo4j, por ejemplo), se documenta como alternativa y
no se implementa. El backend es demostrativo: alcanza la consigna, sin
funcionalidad de mas.

## Motores y reparto de datos

| Motor | Rol |
|---|---|
| MongoDB 7 | Definiciones de proceso e instancias (documental). |
| Redis 7 | Estado actual de cada instancia (clave por tenant e instancia) y cache de definiciones. |
| Cassandra 5 | Eventos de ejecucion y auditoria (write-intensive, append-only). |
| InfluxDB 2 | Metricas: un punto por avance (tenant, proceso, nodo, duracion del paso) y conteos de instancias y avances. |

Neo4j queda afuera: el grafo del flujo ya vive como nodos y edges dentro
del documento de definicion en Mongo. Usarlo de verdad duplicaria el
modelo sin aportar consultas que el TPO necesite. Se justifica como
alternativa descartada en el plan de sistemas.

MongoDB queda pineado en la version 7: la imagen `mongo:8` segfaultea al
minuto de arrancar en la maquina de desarrollo (exit 139).

## Topologia

Compose con dos profiles:

- Liviano (por defecto): un contenedor por motor. Para el dia a dia.
- Cluster: Cassandra x3 (RF=3) y Mongo replica set x3. Materializa los
  numeros de la Actividad 4: N3 R2 W2 para estado de instancia (write y
  read concern majority en el replica set) y N3 R1 W1 o QUORUM por
  operacion en Cassandra, como en la parte E de la Actividad 6. Se usa
  para la demo y defensa de N/R/W.

InfluxDB queda single-node siempre: la edicion OSS no clusteriza. El N=2
de metricas de la Actividad 4 se defiende como analisis conceptual, que
es el nivel que la consigna exige (no pide un distribuido real).

## Backend

- Hono + `@hono/zod-openapi` + `@hono/swagger-ui`, TypeScript.
- Cada entidad se define una sola vez como schema de zod (regla de
  `.claude/acceso-datos-tipado.md`): el mismo schema da el tipo, la
  validacion de requests y el documento OpenAPI.
- Los schemas viven en un package propio (`packages/types`,
  `@flowops/types`) con zod como unica dependencia. El backend los
  consume para validar y documentar; el front, cuando exista, importa
  los mismos tipos sin duplicarlos.
- Swagger UI es la interfaz de demo. No hay coleccion Postman, archivos
  .http ni tests automatizados.
- Corre local con `pnpm dev` (la consigna pide API ejecutable localmente;
  en Docker van solo los motores).
- El front es una app aparte y queda para despues.

## Multi-tenant

El `tenant_id` viaja en el header `X-Tenant-Id`. Un middleware lo exige
en toda ruta de datos y lo deja disponible para los repositorios.

## Motor de flujo

- Avance siempre manual: un endpoint de avance mueve la instancia al
  siguiente nodo. Cuando hay mas de un edge posible (decision), el
  request indica cual tomar.
- Las condiciones de los nodos decision se guardan como JSON estructurado
  (`{ "field": "cuit", "op": "not_null" }`) pero no se evaluan: son
  documentacion del flujo. La eleccion de rama es del cliente.
- El avance valida contra la definicion: solo se aceptan transiciones que
  existan como edge desde el nodo actual, y una instancia finalizada no
  se puede avanzar.
- La instancia lleva un campo de version/paso que crece con cada avance.

## Idempotencia

Requisito: toda operacion de escritura es idempotente, con el minimo de
codigo posible.

- Avance: el request lleva el numero de paso esperado. Si la instancia ya
  esta en el paso siguiente con esa transicion aplicada, se responde lo
  mismo sin duplicar nada. Si el paso esperado no coincide con el actual
  ni con el anterior, se rechaza.
- Eventos: la clave en Cassandra se deriva de tenant, instancia y numero
  de paso. Reinsertar el mismo evento es un upsert sobre la misma fila.
- Redis: SET del estado actual, naturalmente idempotente.
- InfluxDB: el punto se escribe con timestamp y tags derivados del
  avance; reescribirlo pisa el mismo punto.
- Creacion de definiciones e instancias: el cliente puede proveer el id;
  repetir el request con el mismo id no crea duplicados.

## Datos de prueba

Script de seed que carga el tenant demo y el flujo `alta_proveedor` de la
consigna, listo para la demostracion (crear proceso, iniciar instancia,
avanzar, consultar eventos).

## API minima (de la consigna)

- Crear y consultar definiciones de proceso.
- Iniciar una instancia.
- Avanzar una instancia.
- Consultar el estado de una instancia.
- Consultar los eventos de una instancia.
