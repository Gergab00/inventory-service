---
title: "ADR-0004: Usar el driver nativo de MongoDB con transacciones ACID y AsyncLocalStorage"
status: "Accepted"
date: "2026-04-11"
authors: "Equipo de inventory-service"
tags: ["architecture", "persistence", "mongodb", "transactions"]
supersedes: "adr-0003-adaptadores-en-memoria-como-bootstrap"
superseded_by: ""
---

# ADR-0004: Usar el driver nativo de MongoDB con transacciones ACID y `AsyncLocalStorage`

## Status

**Accepted**

## Context

Tras validar los contratos de API con adaptadores en memoria (ADR-0003), el siguiente paso era implementar la persistencia real contra un store durable. El servicio necesitaba:

- Almacenamiento persistente y consultas eficientes para productos, almacenes e inventario.
- Transacciones ACID para garantizar que las operaciones FIFO (salida de lotes + registro de movimiento) sean atómicas.
- Búsqueda de texto parcial sobre campos como `title`, `brand` y `code` de producto, y `code`/`name` de almacén.
- Una forma de propagar la sesión de transacción a los repositorios sin modificar los puertos del dominio/aplicación.
- Compatibilidad con el patrón de Clean Architecture existente: el resolver de persistencia (`resolvePersistenceAdapter`) y los módulos de NestJS debían permanecer estables.

## Decision

Se decidió que:

- **DEC-001**: se usa el **driver nativo** `mongodb` (v7.1.1) sin ningún ODM o abstracción adicional (Mongoose, TypeORM, Prisma).
- **DEC-002**: las transacciones ACID se implementan con `MongoClient.withSession` + `session.withTransaction` en `MongoInventoryUnitOfWork`.
- **DEC-003**: la `ClientSession` activa se propaga a los repositorios mediante `AsyncLocalStorage<ClientSession>` encapsulado en `MongoSessionContext`, sin modificar las firmas de los puertos de dominio.
- **DEC-004**: los repositorios llaman a `MongoSessionContext.getCurrentSession()` en cada operación; si no hay sesión activa, operan sin ella (idóneo para lecturas fuera de un UoW).
- **DEC-005**: las búsquedas de texto usan campos normalizados almacenados en el documento (`titleNormalized`, `brandNormalized`, `codeNormalized`, etc.) generados al guardar, buscados con regex-escape; no se depende de índices de texto completo de MongoDB para mantener la portabilidad.
- **DEC-006**: los guardados se implementan con `updateOne + $set + upsert: true` para garantizar idempotencia.
- **DEC-007**: `MongoPersistenceModule` se declara `@Global()` y proporciona `MONGO_CLIENT`, `MONGO_DATABASE`, `MongoConnectionService` y `MongoSessionContext` a todos los módulos de la aplicación.
- **DEC-008**: la creación de índices es idempotente y ocurre en `onModuleInit` de `MongoIndexesInitializer`; si `DATABASE_TYPE` no es `mongodb`, se omite silenciosamente.
- **DEC-009**: `MONGODB_URI` y `MONGODB_DB_NAME` pasan a ser obligatorias cuando `DATABASE_TYPE='mongodb'`, con validación en tiempo de arranque en `env.validation.ts`.

## Consequences

### Positive

- **POS-001**: sin ODM, el driver nativo ofrece máxima flexibilidad y rendimiento, con una capa de abstracción mínima.
- **POS-002**: los puertos de dominio/aplicación no fueron modificados; la Clean Architecture permanece intacta.
- **POS-003**: `AsyncLocalStorage` elimina la necesidad de propagar la sesión de forma explícita a través de todas las capas.
- **POS-004**: el patrón upsert garantiza idempotencia en los adaptadores de persistencia.
- **POS-005**: los índices de soporte mejoran las consultas FIFO (`productId + warehouseId + createdAt`) y las búsquedas de texto normalizadas.
- **POS-006**: la validación de entorno en arranque falla rápido si faltan variables críticas.

### Negative

- **NEG-001**: sin ODM, el mapeo entre documentos de persistencia y entidades de dominio es manual; requiere discipline para no filtrar documentos crudos.
- **NEG-002**: las transacciones ACID de MongoDB requieren un ReplicaSet o Cluster; no funcionan con una instancia independiente (`standalone`) en versiones anteriores a 6.0. En modo de desarrollo con `standalone`, las operaciones funcionan sin transacciones.
- **NEG-003**: `AsyncLocalStorage` introduce una forma implícita de pasar contexto; depurar flujos anidados puede ser menos obvio que pasar parámetros explícitos.
- **NEG-004**: las pruebas de integración contra MongoDB real aún no están automatizadas en el pipeline; se requiere instancia local o Docker.

## Alternatives Considered

### Usar Mongoose como ODM

- **ALT-001**: **Description**: adoptar Mongoose para manejar esquemas, validaciones y modelos.
- **ALT-002**: **Rejection Reason**: añade una capa de abstracción innecesaria que complica el control sobre la forma del documento, conflicta con el uso explícito de value objects del dominio y dificulta el testing sin acoplarse al ODM.

### Usar TypeORM con soporte MongoDB

- **ALT-003**: **Description**: usar TypeORM para unificar el acceso a datos con decoradores de entidades.
- **ALT-004**: **Rejection Reason**: TypeORM/MongoDB es una integración de segunda clase; el soporte de transacciones es limitado e inconsistente.

### Pasar `ClientSession` como parámetro explícito en los puertos

- **ALT-005**: **Description**: modificar todas las firmas del puerto de repositorio para aceptar una `ClientSession | undefined` opcional.
- **ALT-006**: **Rejection Reason**: contamina el dominio/aplicación con conceptos de infraestructura (MongoDB); viola la regla de que los puertos sean independientes del proveedor de persistencia.

### Usar índices de texto completo de MongoDB (`$text`)

- **ALT-007**: **Description**: crear índices de texto de MongoDB para búsquedas con `$text`.
- **ALT-008**: **Rejection Reason**: los índices de texto de MongoDB tienen limitaciones de portabilidad, requieren configuración de idioma y son menos predecibles en búsquedas parciales. Los campos normalizados con regex ofrecen búsqueda parcial determinista y son independientes del proveedor.

## Implementation Notes

- **IMP-001**: `MongoPersistenceModule` (`@Global()`) vive en `src/infrastructure/persistence/mongodb/` y exporta todas las dependencias compartidas.
- **IMP-002**: `MongoConnectionService` gestiona el ciclo de vida de `MongoClient`; conecta en `onModuleInit` y cierra en `onModuleDestroy`, ambos condicionados a `DATABASE_TYPE='mongodb'`.
- **IMP-003**: `MongoIndexesInitializer` crea índices idempotentes en `onModuleInit` sobre las colecciones `products`, `warehouses`, `inventory_lots` e `inventory_movements`.
- **IMP-004**: `MongoSessionContext` usa `AsyncLocalStorage<ClientSession>`; `runWithSession(session, operation)` ejecuta la operación en el contexto de esa sesión; `getCurrentSession()` la recupera.
- **IMP-005**: `MongoInventoryUnitOfWork` llama a `mongoClient.withSession(session => session.withTransaction(() => mongoSessionContext.runWithSession(session, operation)))`. Si el resultado es `undefined` (transacción abortada), se lanza error.
- **IMP-006**: los repositorios obtienen la sesión con `this.mongoSessionContext.getCurrentSession()` y la pasan como opción de todas las operaciones de lectura/escritura.
- **IMP-007**: los campos normalizados se calculan en el método `save()` de cada repositorio usando `value.trim().toLowerCase()`; se buscan con `RegExp(escapeRegex(term), 'i')`.
- **IMP-008**: `repository.providers.ts` registra tanto las implementaciones in-memory como las Mongo para cada token, y usa el factory `resolvePersistenceAdapter<TPort>()` con tipado explícito de interfaz para evitar errores de inferencia de genéricos.

## References

- **REF-001**: `src/infrastructure/persistence/mongodb/mongodb.module.ts`
- **REF-002**: `src/infrastructure/persistence/mongodb/mongo-connection.service.ts`
- **REF-003**: `src/infrastructure/persistence/mongodb/mongodb-session.context.ts`
- **REF-004**: `src/infrastructure/persistence/mongodb/mongo-indexes.initializer.ts`
- **REF-005**: `src/infrastructure/persistence/mongodb/mongodb.tokens.ts`
- **REF-006**: `src/modules/products/infrastructure/repositories/mongo-product.repository.ts`
- **REF-007**: `src/modules/warehouses/infrastructure/repositories/mongo-warehouse.repository.ts`
- **REF-008**: `src/modules/inventory/infrastructure/repositories/mongo-inventory.repository.ts`
- **REF-009**: `src/modules/inventory/infrastructure/unit-of-work/mongo-inventory-unit-of-work.ts`
- **REF-010**: `src/infrastructure/persistence/repository.providers.ts`
- **REF-011**: `src/infrastructure/persistence/adapter.resolver.ts`
- **REF-012**: `src/infrastructure/config/env.validation.ts`
