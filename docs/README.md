# Documentación técnica de `inventory-service`

## Estado actual

Al día **2026-04-10**, el servicio ya cuenta con una primera implementación pública y verificable de la API REST bajo `\`/api/v1\``.

### Capacidades disponibles

- **Seguridad mínima por header**: toda llamada a `\`/api/v1/**\`` exige `\`api_key\`` y se valida contra `\`API_KEY\`` del entorno.
- **Módulo `products`**: creación, consulta, listado, actualización, sincronización de imágenes y soft delete.
- **Módulo `warehouses`**: creación, consulta, listado, actualización y soft delete.
- **Módulo `inventory`**: entradas, salidas FIFO, ajustes, consulta de disponibilidad, lotes y movimientos.
- **Documentación interactiva**: `\`/docs\`` y `\`/openapi.json\``.

## Cambios realizados

### Entrega 1 — Seguridad y bootstrap HTTP
- `feat(api): proteger rutas versionadas con api_key`
- Se agregó `ApiKeyGuard`, prefijo global `\`/api/v1\`` y documentación OpenAPI del esquema `api_key`.

### Entrega 2 — Primera vertical de `products`
- `feat(products): implementar primera vertical REST de productos`
- Se introdujo el módulo vertical completo con controller, DTOs, use cases, puerto de repositorio y adaptador en memoria.

### Entrega 3 — Primera vertical de `warehouses`
- `feat(warehouses): implementar primera vertical REST de almacenes`
- Se modeló el almacén como recurso con `code`, `name`, `processingTimeDays` y `status`.

### Entrega 4 — Primera vertical de `inventory`
- `feat(inventory): implementar primera vertical REST con FIFO`
- Se implementó inventario como **movimientos + lotes FIFO** con trazabilidad y consultas derivadas de disponibilidad.

## Documentos disponibles

- [`docs/architecture/project-architecture-blueprint.md`](./architecture/project-architecture-blueprint.md) — visión arquitectónica actual, diagrama y límites entre módulos.
- [`docs/guides/como-extender-inventory-service.md`](./guides/como-extender-inventory-service.md) — guía práctica para seguir expandiendo el servicio.
- [`docs/adr/adr-0001-versionado-y-api-key.md`](./adr/adr-0001-versionado-y-api-key.md) — decisión de versionado y protección por `api_key`.
- [`docs/adr/adr-0002-inventario-como-movimientos-fifo.md`](./adr/adr-0002-inventario-como-movimientos-fifo.md) — decisión de modelar inventario con movimientos y FIFO.
- [`docs/adr/adr-0003-adaptadores-en-memoria-como-bootstrap.md`](./adr/adr-0003-adaptadores-en-memoria-como-bootstrap.md) — decisión temporal de usar repositorios en memoria para arrancar.

## Superficie actual de la API

| Módulo | Endpoints implementados |
|---|---|
| `products` | `POST /api/v1/products`, `GET /api/v1/products`, `GET /api/v1/products/{productId}`, `PUT /api/v1/products/{productId}`, `PUT /api/v1/products/{productId}/images`, `GET /api/v1/products/{productId}/image-references`, `DELETE /api/v1/products/{productId}` |
| `warehouses` | `POST /api/v1/warehouses`, `GET /api/v1/warehouses`, `GET /api/v1/warehouses/{warehouseId}`, `PUT /api/v1/warehouses/{warehouseId}`, `DELETE /api/v1/warehouses/{warehouseId}` |
| `inventory` | `POST /api/v1/inventory/entries`, `POST /api/v1/inventory/exits`, `POST /api/v1/inventory/adjustments`, `GET /api/v1/inventory/lots/{lotId}`, `GET /api/v1/inventory/products/{productId}`, `GET /api/v1/inventory/products/{productId}/availability`, `GET /api/v1/inventory/movements` |

## Limitaciones actuales

- La persistencia sigue siendo **en memoria**; todavía no existe un adaptador NoSQL real.
- La autenticación actual es técnica y mínima (`api_key`), no un esquema completo de usuarios/roles.
- Aún faltan integraciones externas reales con orquestadores o proveedores.
- La normalización avanzada de errores HTTP todavía puede endurecerse con filtros globales dedicados.

## Prioridades sugeridas para la siguiente expansión

1. Sustituir los repositorios en memoria por adaptadores NoSQL reales.
2. Unificar respuestas de error con filtros y códigos de dominio consistentes.
3. Expandir `inventory` con valuación, auditoría extendida y consultas por almacén.
4. Integrar el flujo real de imágenes/orquestación sobre puertos y anti-corruption layers.
