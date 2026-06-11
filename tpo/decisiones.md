# Decisiones de diseño del TPO

Decisiones tomadas por el grupo antes de implementar. Las actividades son
la base conceptual, no regla: donde una actividad propone algo que no
aporta al prototipo (Neo4j, por ejemplo), se documenta como alternativa y
no se implementa. El backend es demostrativo: alcanza la consigna, sin
funcionalidad de mas.

## Bases de datos

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

Todos los motores corren en Docker Compose con dos profiles:

- Liviano (por defecto, `pnpm infra up`): un contenedor por motor, para
  el dia a dia.
- Full-size (`pnpm infra up:full-size`): los clusters de abajo. Se usa
  para la demo y defensa de N/R/W, materializando los numeros de la
  Actividad 4. Para volver al liviano: `pnpm infra nuke` (con un solo
  nodo no hay mayoria) y reseed.

### MongoDB: replica set

Pineado en la version 7: la imagen `mongo:8` segfaultea al minuto de
arrancar en la maquina de desarrollo (exit 139).

Corre siempre como replica set `rs0`, incluso en el profile liviano con
un solo miembro: asi la conexion y el comportamiento del driver no
cambian entre profiles. En full-size son 3 miembros (puertos 27017 a
27019); un servicio de init idempotente suma los miembros que falten y
queda dormido con healthcheck (un one-off que termina rompe
`up --wait`). Con 3 miembros se materializa el N3 R2 W2 de la Actividad
4 para definiciones e instancias: write concern majority (2 de 3) y
lectura del primario. El backend se conecta con `directConnection`
porque el replica set anuncia hostnames internos de Docker.

### Redis: cluster de 3 masters + 1 replica

En liviano es un single-node comun. En full-size es un Redis Cluster de
3 masters (puertos 7001 a 7003) mas 1 replica del primero (7004), creado
por un servicio de init que reparte los slots y agrega la replica solo
si faltan. Los nodos van en red de host: en modo cluster cada nodo
anuncia su IP para el gossip y las redirecciones MOVED, y con red bridge
esas IPs no se alcanzan desde el backend, que corre en el host.

Lo que este cluster demuestra no es N/R/W (Redis replica asincronico,
con un solo nodo que escribe por slot) sino las otras dos patas del
distribuido: sharding y failover. Las keys llevan hash tag por tenant
(`instance_state:{tenant}:...`), asi todas las keys de un tenant caen en
el mismo slot y cada tenant vive entero en un shard. Si se mata el
primer master, los otros dos votan y la replica se promueve sola en unos
segundos; el cliente del backend redescubre la topologia y sigue. El
backend elige cliente comun o cluster segun la variable
`REDIS_CLUSTER_NODES`.

### Cassandra: ring de 3 nodos

En liviano un solo nodo con RF=1. En full-size un ring de 3 nodos con
RF=3 sobre el keyspace `flowops` (el backend lo crea o ajusta segun
`CASSANDRA_RF`). Los nodos extra se unen al ring de a uno, con
`depends_on` encadenado: Cassandra no banca bootstraps simultaneos.

La consistencia se elige por operacion, como en la parte E de la
Actividad 6: los eventos se escriben con ONE (append masivo, prioriza
throughput; la PK tenant + instancia + paso hace el insert idempotente)
y el historial de una instancia se lee con QUORUM (alimenta decisiones,
no se quiere una replica atrasada). Es el N3 W1 de eventos de la
Actividad 4, con la lectura subida de R1 a quorum para ese caso puntual.

### InfluxDB: single-node

Single-node siempre: la edicion OSS no clusteriza. El N=2 de metricas de
la Actividad 4 se defiende como analisis conceptual, que es el nivel que
la consigna exige (no pide un distribuido real).

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
- El front es una app aparte (`apps/frontend`, Vite + React) que pega
  directo a la API (CORS abierto en el backend, entorno local). Permite
  crear un flujo (JSON validado con los schemas de `@flowops/types`),
  iniciar instancias, avanzarlas y ver eventos. El manejo de tenants es
  minimo: un input con el tenant activo que se manda en el header.

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
