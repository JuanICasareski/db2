# Resolución de la Actividad 2: Clase 01

Grupo 4

Integrantes:

- Avila, Aldana, legajo 1193721, alavila@uade.edu.ar
- Caivano, Alexander Francisco, legajo 1209389, acaivano@uade.edu.ar
- Casareski, Juan Ignacio, legajo 1176109, jcasareski@uade.edu.ar
- Segura, Juan Ignacio, legajo 1242159, jsegura@uade.edu.ar

Kick-off del TPO: propuesta inicial de solución FlowOps. Proceso elegido: alta de proveedores.

## 1. Contexto y proceso elegido (Parte A)

Proceso operativo elegido: alta de proveedores.

Descripción del problema real que resuelve:
Las empresas necesitan incorporar nuevos proveedores de forma controlada, validando datos legales y comerciales, con revisiones por área (Compras, Legales) y trazabilidad completa de la decisión. Hoy muchos de estos procesos se gestionan por email o planillas, lo que genera demoras, errores y falta de auditoría.

Quién inicia el proceso:
Un usuario del área de Compras (rol solicitante) carga los datos básicos del nuevo proveedor.

Usuarios o roles que participan:

- Solicitante (Compras).
- Revisión Compras (rol compras).
- Revisión Legal (rol legales), condicional según el monto estimado.
- Aprobador Final (rol gerencia o administración).
- Notificación automática al solicitante.

Datos que se capturan:

- Razón social.
- CUIT / CUIL.
- Email de contacto.
- Teléfono.
- Dirección.
- Monto estimado de compras mensuales (para decidir si requiere revisión legal).
- Documentación adjunta (opcional en la versión inicial).

Decisiones que se toman:

- ¿Los datos obligatorios están completos y son válidos?
- ¿Requiere revisión legal? (según monto estimado mayor a un umbral configurable).
- ¿Aprobar o rechazar al proveedor?

Cuándo termina el proceso:
Cuando el proveedor queda aprobado o rechazado y se notifica al solicitante.

Información que debe quedar registrada como auditoría:

- Cada cambio de estado.
- Usuario que realizó la acción.
- Fecha y hora.
- Decisión tomada.
- Comentario o justificación (especialmente en rechazos).
- Versión del proceso utilizada.

## 2. Primer diseño del flujo BPM (Parte B)

Representación textual del flujo:

```
START
  ↓
Formulario de alta de proveedor
  ↓
Validación de datos obligatorios (CUIT, razón social, email)
  ↓
Revisión de Compras (tarea humana)
  ↓
¿Requiere revisión legal? (decisión según monto_estimado)
  ├── Sí → Revisión Legal (tarea humana)
  └── No → Aprobación Final
  ↓
Notificación automática al solicitante
  ↓
END (proveedor aprobado o rechazado)
```

Tabla de nodos del proceso:

| Orden | Nodo | Tipo de nodo | Entrada | Salida | Observación |
|---|---|---|---|---|---|
| 1 | Inicio | Start | Solicitud de alta | Instancia creada | Comienza el proceso |
| 2 | Formulario de alta | Form | Datos del proveedor | Datos cargados | Puede variar por tenant |
| 3 | Validación de datos | Decision | CUIT, razón social, email | Válido / Inválido | Regla configurable por tenant |
| 4 | Revisión Compras | Task | Solicitud válida | Aprobado / Rechazado por compras | Tarea humana asignada al rol compras |
| 5 | ¿Requiere revisión legal? | Decision | Monto estimado | Sí / No | Umbral configurable (por ejemplo, mayor a 1.000.000) |
| 6 | Revisión Legal | Task | Solicitud que supera el umbral | Aprobado / Rechazado por legales | Tarea humana, solo cuando corresponde |
| 7 | Aprobación Final | Task | Revisión completada | Aprobado / Rechazado final | Decisión final |
| 8 | Notificación | Notification | Resultado final | Email o notificación enviada | Acción automática |
| 9 | Fin | End | Resultado final | Proceso cerrado | Estado terminal |

Tipos de nodo utilizados: Start, Form, Decision, Task, Notification, End.

## 3. Datos mínimos del TPO (Parte C)

Definición del proceso (JSON):

```json
{
  "tenant_id": "empresa_acme",
  "process_id": "alta_proveedor",
  "name": "Alta de proveedor",
  "version": 1,
  "status": "published",
  "description": "Proceso para registrar y aprobar nuevos proveedores",
  "nodes": [
    { "id": "inicio", "type": "start" },
    {
      "id": "formulario",
      "type": "form",
      "fields": [
        { "name": "razon_social", "type": "string", "required": true },
        { "name": "cuit", "type": "string", "required": true },
        { "name": "email", "type": "string", "required": true },
        { "name": "monto_estimado", "type": "number", "required": false }
      ]
    },
    { "id": "validacion", "type": "decision", "condition": "cuit != null && razon_social != null" },
    { "id": "revision_compras", "type": "task", "assigned_role": "compras" },
    { "id": "decision_legal", "type": "decision", "condition": "monto_estimado > 1000000" },
    { "id": "revision_legal", "type": "task", "assigned_role": "legales" },
    { "id": "aprobacion_final", "type": "task", "assigned_role": "gerencia" },
    { "id": "notificacion", "type": "notification" },
    { "id": "fin", "type": "end" }
  ],
  "edges": [
    { "from": "inicio", "to": "formulario" },
    { "from": "formulario", "to": "validacion" },
    { "from": "validacion", "to": "revision_compras", "when": "true" },
    { "from": "revision_compras", "to": "decision_legal" },
    { "from": "decision_legal", "to": "revision_legal", "when": "true" },
    { "from": "decision_legal", "to": "aprobacion_final", "when": "false" },
    { "from": "revision_legal", "to": "aprobacion_final" },
    { "from": "aprobacion_final", "to": "notificacion" },
    { "from": "notificacion", "to": "fin" }
  ],
  "created_at": "2026-06-01T10:00:00Z",
  "published_at": "2026-06-01T12:00:00Z"
}
```

Instancia de proceso (JSON):

```json
{
  "tenant_id": "empresa_acme",
  "instance_id": "inst_prov_001",
  "process_id": "alta_proveedor",
  "process_version": 1,
  "status": "waiting_task",
  "current_node": "revision_compras",
  "data": {
    "razon_social": "Proveedor Demo S.A.",
    "cuit": "30-12345678-9",
    "email": "contacto@proveedordemo.com.ar",
    "monto_estimado": 2500000
  },
  "current_task": {
    "task_id": "task_001",
    "assigned_role": "compras",
    "status": "pending",
    "assigned_to": null
  },
  "created_by": "usuario_compras_05",
  "created_at": "2026-06-08T09:15:00Z",
  "updated_at": "2026-06-08T09:15:00Z"
}
```

Evento de auditoría (JSON):

```json
{
  "tenant_id": "empresa_acme",
  "instance_id": "inst_prov_001",
  "event_type": "TASK_CREATED",
  "node_id": "revision_compras",
  "timestamp": "2026-06-08T09:15:30Z",
  "user_id": "usuario_compras_05",
  "payload": {
    "assigned_role": "compras",
    "task_id": "task_001"
  }
}
```

## 4. Primera arquitectura conceptual (Parte D)

Diagrama conceptual simple:

```
Cliente / Postman / Frontend simple
               │
               ▼
       API de FlowOps (REST)
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
Base de datos para   Base de datos para
definiciones de      estado de instancias
procesos (MongoDB)   y tareas (MongoDB/Redis)
       │
       ▼
Base de datos para
eventos / auditoría
(Cassandra)
```

Respuestas a las preguntas:

1. ¿Qué componente recibe las solicitudes?  
   La API de FlowOps (capa de aplicación que expone endpoints REST).
2. ¿Dónde guardarían la definición del proceso?  
   En una base documental (MongoDB), porque las definiciones son semi-estructuradas, versionables y varían por tenant.
3. ¿Dónde guardarían el estado actual?  
   En MongoDB (persistencia rica) más Redis (consultas de baja latencia de tareas pendientes por rol).
4. ¿Dónde guardarían el historial?  
   En Cassandra (escritura intensiva de eventos append-only y consultas por tenant, instancia y tiempo).
5. ¿Qué parte debería poder cambiar sin modificar el código?  
   La definición del proceso (nodos, condiciones, roles, formularios). Debe ser configurable por tenant a través de datos.
6. ¿Qué partes podrían crecer más en volumen?  
   El log de eventos y auditoría (crece con cada transición) y la cantidad de instancias activas en tenants grandes.

## 5. Preparación del ambiente del TPO (Parte E)

Se creó la siguiente estructura inicial de proyecto:

```
flowops-tpo/
├── docs/
│   └── arquitectura.md
├── api/
│   └── (aquí irá el código de la API en clases futuras)
├── data/
│   └── seeds/
│       └── alta_proveedor_v1.json
├── docker-compose.yml
├── README.md
└── .gitignore
```

Contenido del README.md (resumido):

```markdown
# FlowOps TPO: alta de proveedores

## Integrantes
- Avila, Aldana
- Caivano, Alexander Francisco
- Casareski, Juan Ignacio
- Segura, Juan Ignacio

## Proceso elegido
Alta de proveedores

## Descripción del problema
Incorporación controlada de nuevos proveedores con validación, revisiones por área y auditoría.

## Primer flujo BPM
Ver diagrama y tabla en este documento.

## Modelos NoSQL candidatos
- MongoDB (documental): definiciones de procesos e instancias.
- Redis (clave-valor): estado actual y colas de tareas.
- Cassandra (columnar): eventos de auditoría masivos.

## Instrucciones iniciales de ejecución
1. Clonar el repositorio.
2. docker compose up -d (cuando se complete el compose).
```
