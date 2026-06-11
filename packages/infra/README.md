# @flowops/infra

Infraestructura local del TPO. El `docker-compose.yml` general incluye un
modulo por servicio desde `modules/`. Para agregar un motor nuevo, crear
`modules/<servicio>.yml` y sumarlo a la lista `include`.

Comandos (desde esta carpeta o con `pnpm infra <cmd>` en la raiz):

```bash
pnpm up            # modo liviano: un contenedor por motor
pnpm up:full-size  # cluster: Cassandra x3 + Mongo replica set x3 + Redis Cluster x4
pnpm down          # detiene los contenedores
pnpm nuke          # detiene y borra los volumenes (datos incluidos)
pnpm ps            # estado de los servicios
pnpm logs          # logs en vivo
```

Servicios del modo liviano:

- MongoDB 7 en `localhost:27017` (definiciones e instancias). Corre como
  replica set `rs0` de un solo miembro; el healthcheck lo inicia solo.
- Redis 7 en `localhost:6379` (estado actual y cache).
- Cassandra 5 en `localhost:9042` (historial de eventos). Tarda un rato
  en levantar: el healthcheck le da hasta unos minutos.
- InfluxDB 2 en `localhost:8086` (metricas y series temporales). La
  imagen se autoconfigura: org `flowops`, bucket `flowops`, token
  `dev-token` (usuario `flowops` / `flowops123` para la UI web).

El profile `full-size` agrega `mongodb-2/3` (puertos 27018/27019, un
one-off los suma al replica set), `cassandra-2/3` (sin puerto expuesto,
se unen al ring de a uno; cada nodo tarda 1 a 3 minutos) y
`redis-cluster-1/4`, un Redis Cluster aparte del Redis liviano: 3
masters con los slots repartidos (puertos 7001 a 7003) y un cuarto nodo
replica del primero (7004). Un servicio init arma el cluster solo. Los
nodos van en red de host porque en modo cluster cada uno anuncia su IP
para las redirecciones MOVED, y con bridge esas IPs internas no se
alcanzan desde el backend, que corre en el host.

Para que el keyspace de Cassandra use RF=3, correr el backend con
`CASSANDRA_RF=3` (ajusta el RF en el arranque). Para que el backend use
el Redis Cluster en vez del nodo unico:

```bash
REDIS_CLUSTER_NODES=127.0.0.1:7001,127.0.0.1:7002,127.0.0.1:7003,127.0.0.1:7004 pnpm dev
```

Demo de failover de Redis: `docker stop flowops-redis-cluster-1`. En
unos segundos los otros masters detectan la caida y la replica 7004 se
promueve; el backend sigue sin tocar nada. Con `docker start` el nodo
vuelve como replica del promovido.

Para volver de full-size al modo liviano usar `pnpm nuke` y `pnpm up`
de nuevo: el replica set y el keyspace quedan configurados para 3 nodos
y con uno solo no hay mayoria. Despues, `pnpm db seed`.

Sin autenticacion salvo InfluxDB, que la exige: las credenciales de
arriba son fijas y solo para desarrollo local.
