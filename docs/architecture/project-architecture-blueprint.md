# Blueprint arquitectónico actual de `inventory-service`

## Resumen ejecutivo

`inventory-service` es un backend en **NestJS + TypeScript** que expone una API REST pública versionada bajo `/api/v1`. La implementación sigue una variante de **Clean Architecture** orientada por módulos verticales (`products`, `warehouses`, `inventory`) y hoy usa **adaptadores en memoria** como bootstrap temporal mientras se prepara la persistencia NoSQL definitiva.

## Stack y capacidades implementadas

- **Framework**: NestJS 11
- **Lenguaje**: TypeScript estricto
- **Documentación API**: Swagger + Scalar
- **Validación**: `class-validator` + `ValidationPipe`
- **Errores HTTP**: `ApiExceptionFilter` global con envelope uniforme
- **Pruebas**: Jest + Supertest
- **Seguridad actual**: `ApiKeyGuard` global para `api_key`

## Diagrama de alto nivel

```mermaid
flowchart LR
  Client[Cliente / Orquestador] --> Guard[ApiKeyGuard\napi_key o x-api-key]
  Guard --> Http[setupHttpApplication\n/api/v1 + ValidationPipe + ApiExceptionFilter]
  Http --> App[AppModule]

  App --> Products[ProductsModule]
  App --> Warehouses[WarehousesModule]
  App --> Inventory[InventoryModule]

  Products --> PR[PRODUCT_REPOSITORY]
  Warehouses --> WR[WAREHOUSE_REPOSITORY]
  Inventory --> IR[INVENTORY_LOT_REPOSITORY\nINVENTORY_MOVEMENT_REPOSITORY\nINVENTORY_UNIT_OF_WORK]

  PR --> Providers[repository.providers.ts\nresolvePersistenceAdapter()]
  WR --> Providers
  IR --> Providers

  Providers --> Mem[(Adaptadores en memoria)]
```

## Estructura por capas

### 1. `domain`
Responsabilidad: reglas de negocio puras, entidades, errores y puertos.

Ejemplos actuales:
- `src/modules/products/domain/entities/product.entity.ts`
- `src/modules/warehouses/domain/entities/warehouse.entity.ts`
- `src/modules/inventory/domain/entities/inventory-lot.entity.ts`
- `src/modules/inventory/domain/services/fifo-consumption.service.ts`

### 2. `application`
Responsabilidad: casos de uso explícitos, commands y coordinación entre dominio y puertos.

Ejemplos actuales:
- `CreateProductUseCase`
- `CreateWarehouseUseCase`
- `RegisterInventoryEntryUseCase`
- `RegisterInventoryExitUseCase`
- `GetProductInventoryAvailabilityUseCase`

### 3. `infrastructure`
Responsabilidad: adaptadores concretos y bootstrap técnico. Actualmente se usan implementaciones **in-memory** y un resolver central de persistencia.

Ejemplos actuales:
- `InMemoryProductRepository`
- `InMemoryWarehouseRepository`
- `InMemoryInventoryRepository`
- `src/infrastructure/persistence/repository.providers.ts`
- `src/infrastructure/persistence/adapter.resolver.ts`

### 4. `interfaces`
Responsabilidad: controladores HTTP, DTOs de transporte, guards, filtros y mapeo request/response.

Ejemplos actuales:
- `ProductsController`
- `WarehousesController`
- `InventoryController`
- `ApiKeyGuard`
- `ApiExceptionFilter`

## Bootstrap HTTP transversal

La aplicación se inicializa con tres piezas principales:

1. `src/main.ts` crea la app Nest y obtiene `AppConfigService`.
2. `setupHttpApplication(...)` aplica el prefijo global `/api/v1`, el `ValidationPipe` y el `ApiExceptionFilter`.
3. `setupApiDocumentation(...)` publica Scalar en `/docs` y OpenAPI en `/openapi.json`.

## Módulos implementados

## `products`

### Propósito
Representa la identidad interna estable del producto, sus identificadores externos normalizados y sus referencias de imagen.

### Casos de uso ya implementados
- `CreateProductUseCase`
- `GetProductByIdUseCase`
- `ListProductsUseCase`
- `UpdateProductUseCase`
- `UpdateProductImagesUseCase`
- `SoftDeleteProductUseCase`

### Endpoints
- `POST /api/v1/products`
- `GET /api/v1/products`
- `GET /api/v1/products/{productId}`
- `PUT /api/v1/products/{productId}`
- `PUT /api/v1/products/{productId}/images`
- `GET /api/v1/products/{productId}/image-references`
- `DELETE /api/v1/products/{productId}`

## `warehouses`

### Propósito
Expone la identidad y configuración operativa del almacén, incluyendo `code`, `name`, `processingTimeDays` y `status`.

### Casos de uso ya implementados
- `CreateWarehouseUseCase`
- `GetWarehouseByIdUseCase`
- `ListWarehousesUseCase`
- `UpdateWarehouseUseCase`
- `SoftDeleteWarehouseUseCase`

### Endpoints
- `POST /api/v1/warehouses`
- `GET /api/v1/warehouses`
- `GET /api/v1/warehouses/{warehouseId}`
- `PUT /api/v1/warehouses/{warehouseId}`
- `DELETE /api/v1/warehouses/{warehouseId}`

## `inventory`

### Propósito
Modela el inventario como **movimientos + lotes FIFO**, no como un número mutable plano.

### Casos de uso ya implementados
- `RegisterInventoryEntryUseCase`
- `RegisterInventoryExitUseCase`
- `RegisterInventoryAdjustmentUseCase`
- `GetInventoryLotByIdUseCase`
- `GetProductInventoryLotsUseCase`
- `GetProductInventoryAvailabilityUseCase`
- `ListInventoryMovementsUseCase`

### Endpoints
- `POST /api/v1/inventory/entries`
- `POST /api/v1/inventory/exits`
- `POST /api/v1/inventory/adjustments`
- `GET /api/v1/inventory/lots/{lotId}`
- `GET /api/v1/inventory/products/{productId}`
- `GET /api/v1/inventory/products/{productId}/availability`
- `GET /api/v1/inventory/movements`

## Flujo HTTP transversal

1. El request entra por `/api/v1/**`.
2. `ApiKeyGuard` valida el header `api_key` (o `x-api-key`).
3. `ValidationPipe` transforma y valida DTOs.
4. El controller permanece delgado y delega a un caso de uso.
5. El caso de uso coordina entidades y puertos.
6. `repository.providers.ts` resuelve el adapter concreto según `DATABASE_TYPE`.
7. Las respuestas exitosas vuelven como `data + meta.requestId` y los errores se normalizan mediante `ApiExceptionFilter`.

## Decisiones relevantes vigentes

- La API pública está **versionada desde el inicio**.
- La seguridad mínima obligatoria es por `api_key` técnica.
- `DELETE` en `products` y `warehouses` se comporta como **soft delete**.
- `inventory` expone operaciones con semántica explícita: `entries`, `exits`, `adjustments`.
- Los repositorios actuales son en memoria para permitir avanzar la API mientras se define la capa NoSQL.

## Cómo se debe seguir expandiendo

### Sustituir persistencia en memoria por NoSQL
Mantener exactamente el mismo contrato de puertos:
- `ProductRepository`
- `WarehouseRepository`
- `InventoryLotRepository`
- `InventoryMovementRepository`

Solo se debe cambiar la implementación en `infrastructure`, sin filtrar documentos crudos al resto de capas.

### Agregar nuevos endpoints
Si el endpoint es de dominio:
1. crear DTO request/response,
2. crear command/query,
3. crear caso de uso,
4. extender controller,
5. agregar pruebas unitarias/e2e,
6. documentar el cambio y actualizar ADRs si la decisión es arquitectónica.

## Riesgos y pendientes

- Falta implementar el adapter real para `DATABASE_TYPE='mongodb'`; hoy `resolvePersistenceAdapter(...)` lanza un error explícito en ese modo.
- No hay autenticación de usuario/rol; solo protección técnica por header.
- La integración con orquestadores todavía no está implementada como adaptador real.
- A medida que crezca la API habrá que ampliar el catálogo de códigos y ejemplos del filtro global de errores.

## Señales de que la arquitectura se mantiene sana

- Los controllers siguen delgados.
- Los casos de uso no dependen de NestJS HTTP.
- Los puertos separan la aplicación de la infraestructura.
- `inventory` resuelve FIFO desde dominio, no desde controladores ni DTOs.
