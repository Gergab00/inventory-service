# inventory-service

Servicio backend construido con `NestJS + TypeScript` para gestionar productos, almacenes e inventario con trazabilidad FIFO, siguiendo principios de `Clean Architecture`.

## Estado actual

- API pública versionada bajo `/api/v1`
- Seguridad técnica por header `api_key` (el guard también acepta `x-api-key` por compatibilidad)
- Documentación interactiva con Scalar en `/docs`
- Especificación OpenAPI en `/openapi.json`
- Módulos funcionales disponibles: `products`, `warehouses` e `inventory`
- Persistencia seleccionable por `DATABASE_TYPE` (`in-memory` o `mongodb`) resuelta desde `src/infrastructure/persistence/repository.providers.ts`

## Puesta en marcha local

```bash
pnpm install
$env:API_KEY='local-api-key'
$env:DATABASE_TYPE='in-memory'
pnpm start:dev
```

Puntos útiles una vez levantado el servicio:

- `GET http://localhost:3000/api/v1`
- `GET http://localhost:3000/api/v1/health`
- `GET http://localhost:3000/docs`
- `GET http://localhost:3000/openapi.json`

## Variables de entorno principales

| Variable | Requerida | Valor por defecto | Uso |
| --- | --- | --- | --- |
| `API_KEY` | Sí | — | Clave obligatoria para consumir la API pública |
| `PORT` | No | `3000` | Puerto HTTP del servicio |
| `DOCS_ENABLED` | No | `true` | Habilita o deshabilita Scalar/OpenAPI |
| `DOCS_PATH` | No | `/docs` | Ruta donde se publica la referencia interactiva |
| `OPENAPI_JSON_PATH` | No | `/openapi.json` | Ruta del documento OpenAPI |
| `DATABASE_TYPE` | No | `in-memory` | Selecciona el adapter de persistencia |
| `MONGODB_URI` | Condicional | — | Obligatoria cuando `DATABASE_TYPE='mongodb'` |
| `MONGODB_DB_NAME` | Condicional | — | Obligatoria cuando `DATABASE_TYPE='mongodb'` |

> Cuando `DATABASE_TYPE='mongodb'`, el servicio inicializa conexión real, crea índices de soporte y usa repositorios MongoDB en `products`, `warehouses` e `inventory`.

### Arranque local con MongoDB

```bash
pnpm install
$env:API_KEY='local-api-key'
$env:DATABASE_TYPE='mongodb'
$env:MONGODB_URI='mongodb://localhost:27017'
$env:MONGODB_DB_NAME='inventory-service'
pnpm start:dev
```

## Superficie actual de la API

| Módulo | Endpoints |
| --- | --- |
| `system` | `GET /api/v1`, `GET /api/v1/health` |
| `products` | `POST /api/v1/products`, `GET /api/v1/products`, `GET /api/v1/products/{productId}`, `PUT /api/v1/products/{productId}`, `PUT /api/v1/products/{productId}/images`, `GET /api/v1/products/{productId}/image-references`, `DELETE /api/v1/products/{productId}` |
| `warehouses` | `POST /api/v1/warehouses`, `GET /api/v1/warehouses`, `GET /api/v1/warehouses/{warehouseId}`, `PUT /api/v1/warehouses/{warehouseId}`, `DELETE /api/v1/warehouses/{warehouseId}` |
| `inventory` | `POST /api/v1/inventory/entries`, `POST /api/v1/inventory/exits`, `POST /api/v1/inventory/adjustments`, `GET /api/v1/inventory/lots/{lotId}`, `GET /api/v1/inventory/products/{productId}`, `GET /api/v1/inventory/products/{productId}/availability`, `GET /api/v1/inventory/movements` |

## Contratos HTTP relevantes

### Header de autenticación mínimo

```bash
curl -H "api_key: local-api-key" http://localhost:3000/api/v1/health
```

### Respuesta exitosa típica

```json
{
  "data": {},
  "meta": {
    "requestId": "req_a1b2c3d4e5f6"
  }
}
```

### Error uniforme

```json
{
  "error": {
    "code": "MISSING_API_KEY",
    "message": "El header api_key es obligatorio para consumir la API pública.",
    "details": []
  },
  "meta": {
    "requestId": "req_a1b2c3d4e5f6",
    "timestamp": "2026-04-11T12:00:00.000Z"
  }
}
```

Si el header existe pero no coincide con la configuración, el servicio responde `401` con el código `INVALID_API_KEY`.

## Scripts útiles

| Comando | Propósito |
| --- | --- |
| `pnpm start:dev` | Arranque en desarrollo con watch |
| `pnpm build` | Compilación de producción |
| `pnpm lint` | Revisión de estilo con ESLint |
| `pnpm test` | Pruebas unitarias |
| `pnpm test:e2e` | Pruebas end-to-end |
| `pnpm test:cov` | Cobertura |

## Arquitectura y documentación complementaria

- `docs/README.md` — resumen técnico del estado actual
- `docs/architecture/project-architecture-blueprint.md` — blueprint arquitectónico y diagrama
- `docs/guides/como-extender-inventory-service.md` — guía para ampliar el servicio sin romper la arquitectura
- `docs/adr/` — decisiones arquitectónicas registradas

## Limitaciones conocidas

- `DATABASE_TYPE='in-memory'` sigue siendo útil para bootstrap y pruebas rápidas, pero no ofrece durabilidad
- No existe todavía autenticación por usuarios/roles; la protección actual es técnica por `api_key`
- Las integraciones externas reales con orquestadores aún están pendientes
