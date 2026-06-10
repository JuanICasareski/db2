# @flowops/infra

Infraestructura local del TPO. El `docker-compose.yml` general incluye un
modulo por servicio desde `modules/`. Para agregar un motor nuevo, crear
`modules/<servicio>.yml` y sumarlo a la lista `include`.

Comandos (desde esta carpeta o con `pnpm --filter @flowops/infra <cmd>`):

```bash
pnpm up    # levanta todo y espera los healthchecks
pnpm down  # detiene los contenedores
pnpm nuke  # detiene y borra los volumenes (datos incluidos)
pnpm ps    # estado de los servicios
pnpm logs  # logs en vivo
```

Servicios actuales:

- MongoDB 7 en `localhost:27017` (definiciones e instancias de procesos).
- Redis 7 en `localhost:6379` (estado actual y cache).
- Cassandra 5 en `localhost:9042` (historial de eventos). Tarda un rato
  en levantar: el healthcheck le da hasta unos minutos.
- InfluxDB 2 en `localhost:8086` (metricas y series temporales). La
  imagen se autoconfigura: org `flowops`, bucket `flowops`, token
  `dev-token` (usuario `flowops` / `flowops123` para la UI web).

Sin autenticacion salvo InfluxDB, que la exige: las credenciales de
arriba son fijas y solo para desarrollo local.
