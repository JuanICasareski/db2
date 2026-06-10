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

- MongoDB 8 en `localhost:27017` (definiciones e instancias de procesos).
- Redis 7 en `localhost:6379` (estado actual y cache).

Sin autenticacion: es un entorno de desarrollo local.
