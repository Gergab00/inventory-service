# Documentación técnica de `inventory-service`

## Propósito de este documento

Este archivo evita duplicar la guía operativa del README principal y se concentra en contexto técnico-evolutivo (entregas, decisiones y prioridades).

La documentación operativa y de uso diario vive en [README.md](../README.md):

- estado actual y capacidades
- variables de entorno y arranque
- generación de API key
- superficie de API y contratos HTTP
- scripts de ejecución

## Evolución ya incorporada

### Entrega 1 — Seguridad y bootstrap HTTP
- `feat(api): proteger rutas versionadas con api_key`
- Se agregó `ApiKeyGuard`, prefijo global `/api/v1` y documentación OpenAPI del esquema `api_key`.

### Entrega 2 — Primera vertical de `products`
- `feat(products): implementar primera vertical REST de productos`
- Se introdujo el módulo vertical completo con controller, DTOs, use cases, puerto de repositorio y adaptador en memoria.

### Entrega 3 — Primera vertical de `warehouses`
- `feat(warehouses): implementar primera vertical REST de almacenes`
- Se modeló el almacén como recurso con `code`, `name`, `processingTimeDays` y `status`.

### Entrega 4 — Primera vertical de `inventory`
- `feat(inventory): implementar primera vertical REST con FIFO`
- Se implementó inventario como **movimientos + lotes FIFO** con trazabilidad y consultas derivadas de disponibilidad.

### Entrega 5 — Contratos uniformes de error HTTP
- Se agregó `ApiExceptionFilter` como filtro global para responder `401`, `404`, `409`, `422` y `500` con un contrato estable y machine-readable.
- El mapeo de errores salió de los controladores y ahora se centraliza en una única capa transversal.

### Entrega 6 — Resolución centralizada de adaptadores de persistencia
- Se desacopló el wiring de los módulos respecto a `InMemory*Repository` mediante providers/factories de infraestructura en `src/infrastructure/persistence/repository.providers.ts`.
- `DATABASE_TYPE=in-memory` activa el adapter bootstrap actual y deja preparada la costura para conectar un adapter real después sin tocar casos de uso ni controladores.
- `inventory` cuenta además con un `UnitOfWork` no-op para facilitar futuras transacciones de persistencia.

### Entrega 7 — Adapter real de MongoDB (driver nativo)
- `feat(persistence): implementar adapter real de MongoDB con transacciones`
- Se implementaron adaptadores concretos de MongoDB para los tres módulos usando el **driver nativo** (`mongodb@7.1.1`), sin ODM.
- Se introdujo `MongoPersistenceModule` (`@Global`) que gestiona el ciclo de vida de `MongoClient`, crea índices de soporte y propaga la sesión transaccional vía `AsyncLocalStorage`.
- `MongoInventoryUnitOfWork` implementa transacciones reales con `withSession + withTransaction`, sin modificar los puertos de dominio/aplicación.
- Los tres módulos cuentan ahora con implementaciones concretas para `DATABASE_TYPE='mongodb'`:
  - `MongoProductRepository`
  - `MongoWarehouseRepository`
  - `MongoInventoryRepository`
  - `MongoInventoryUnitOfWork`
- La validación de entorno fue robustificada: `MONGODB_URI` y `MONGODB_DB_NAME` son obligatorias cuando `DATABASE_TYPE='mongodb'`.

## Documentos disponibles

- [`docs/architecture/project-architecture-blueprint.md`](./architecture/project-architecture-blueprint.md) — visión arquitectónica actual, diagrama y límites entre módulos.
- [`docs/guides/como-extender-inventory-service.md`](./guides/como-extender-inventory-service.md) — guía práctica para seguir expandiendo el servicio.
- [`docs/adr/adr-0001-versionado-y-api-key.md`](./adr/adr-0001-versionado-y-api-key.md) — decisión de versionado y protección por `api_key`.
- [`docs/adr/adr-0002-inventario-como-movimientos-fifo.md`](./adr/adr-0002-inventario-como-movimientos-fifo.md) — decisión de modelar inventario con movimientos y FIFO.
- [`docs/adr/adr-0003-adaptadores-en-memoria-como-bootstrap.md`](./adr/adr-0003-adaptadores-en-memoria-como-bootstrap.md) — decisión temporal de usar repositorios en memoria para arrancar (**supersedida** por ADR-0004).
- [`docs/adr/adr-0004-mongodb-nativo-con-transacciones.md`](./adr/adr-0004-mongodb-nativo-con-transacciones.md) — decisión de usar el driver nativo de MongoDB con transacciones reales y `AsyncLocalStorage`.

## Superficie actual de la API

| Módulo | Endpoints implementados |
| --- | --- |
| `products` | `POST /api/v1/products`, `GET /api/v1/products`, `GET /api/v1/products/{productId}`, `PUT /api/v1/products/{productId}`, `PUT /api/v1/products/{productId}/images`, `GET /api/v1/products/{productId}/image-references`, `DELETE /api/v1/products/{productId}` |
| `warehouses` | `POST /api/v1/warehouses`, `GET /api/v1/warehouses`, `GET /api/v1/warehouses/{warehouseId}`, `PUT /api/v1/warehouses/{warehouseId}`, `DELETE /api/v1/warehouses/{warehouseId}` |
| `inventory` | `POST /api/v1/inventory/entries`, `POST /api/v1/inventory/exits`, `POST /api/v1/inventory/adjustments`, `GET /api/v1/inventory/lots/{lotId}`, `GET /api/v1/inventory/products/{productId}`, `GET /api/v1/inventory/products/{productId}/availability`, `GET /api/v1/inventory/movements` |

## Limitaciones actuales

- El modo `in-memory` es útil para bootstrap y pruebas rápidas, pero no ofrece durabilidad entre ejecuciones.
- La autenticación actual es técnica y mínima (`api_key`), no un esquema completo de usuarios/roles.
- Aún faltan integraciones externas reales con orquestadores o proveedores.
- La API ya normaliza `401`, `404`, `409`, `422` y `500`; futuras iteraciones deberán ampliar ejemplos OpenAPI y códigos adicionales conforme crezcan los módulos.
- Las pruebas E2E contra MongoDB real todavía no están automatizadas en el pipeline.

## Prioridades sugeridas para la siguiente expansión

1. Validar `pnpm test:e2e` con `DATABASE_TYPE='mongodb'` y un MongoDB real levantado.
2. Añadir pruebas de integración para los contratos de repositorio contra Mongo real (mínimo: orden FIFO, transacción con rollback).
3. Expandir el catálogo de códigos y ejemplos OpenAPI conforme crezcan los módulos.
4. Expandir `inventory` con valuación extendida, auditoría y consultas por almacén adicionales.
5. Integrar el flujo real de imágenes/orquestación sobre puertos y anti-corruption layers.
