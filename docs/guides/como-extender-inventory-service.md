# Guía práctica para expandir `inventory-service`

## Objetivo

Esta guía explica cómo seguir creciendo el servicio sin romper la arquitectura actual ni degradar la calidad del contrato REST.

---

## 1. Cómo agregar un módulo nuevo

Usar siempre la misma estructura vertical:

```text
src/modules/<modulo>/
  application/
    commands/
    use-cases/
  domain/
    entities/
    errors/
    ports/
    value-objects/
  infrastructure/
    repositories/
  interfaces/
    http/
      dto/
```

### Secuencia recomendada

1. Definir el contrato HTTP.
2. Crear DTOs de request/response.
3. Crear command/query.
4. Crear caso(s) de uso.
5. Definir puertos del dominio/aplicación.
6. Implementar adaptador de infraestructura.
7. Registrar el módulo en `AppModule`.
8. Añadir pruebas unitarias y e2e.
9. Documentar el cambio y, si aplica, crear un ADR.

---

## 2. Cómo agregar un endpoint nuevo a un módulo existente

### Ejemplo de checklist

- [ ] ¿El endpoint representa un recurso o una acción de negocio?
- [ ] ¿La ruta queda bajo `/api/v1`?
- [ ] ¿El request usa DTO validado?
- [ ] ¿El controller solo delega?
- [ ] ¿La respuesta usa envelope `data + meta`?
- [ ] ¿Se agregó documentación OpenAPI?
- [ ] ¿Se añadieron pruebas?

### Regla práctica

Si el flujo tiene semántica propia, evitar CRUD artificial.

Ejemplo correcto:
- `POST /api/v1/inventory/exits`

Ejemplo incorrecto:
- `PATCH /api/v1/products/{id}/stock`

---

## 3. Cómo usar y extender la persistencia MongoDB

Actualmente el servicio soporta `DATABASE_TYPE='in-memory'` y `DATABASE_TYPE='mongodb'`. El wiring selecciona el adapter concreto de forma centralizada.

### Paso 1 — Mantener los puertos
No cambiar las interfaces públicas de:
- `ProductRepository`
- `WarehouseRepository`
- `InventoryLotRepository`
- `InventoryMovementRepository`

### Paso 2 — Implementaciones concretas ya disponibles

Implementaciones actuales:

```text
src/modules/products/infrastructure/repositories/mongo-product.repository.ts
src/modules/warehouses/infrastructure/repositories/mongo-warehouse.repository.ts
src/modules/inventory/infrastructure/repositories/mongo-inventory.repository.ts
src/modules/inventory/infrastructure/unit-of-work/mongo-inventory-unit-of-work.ts
```

### Paso 3 — Agregar mappers explícitos
Separar:
- documento de persistencia,
- entidad de dominio,
- DTO de respuesta.

### Paso 4 — Extender el resolver central de persistencia
Hoy el wiring no vive dentro de cada controller o caso de uso, sino en:

- `src/infrastructure/persistence/repository.providers.ts`
- `src/infrastructure/persistence/adapter.resolver.ts`

El patrón actual toma `DATABASE_TYPE` y resuelve el adapter concreto por provider/factory. El punto de extensión correcto es ese resolver, no el dominio.

Ejemplo base actual:

```ts
{
  provide: PRODUCT_REPOSITORY,
  inject: [ConfigService, InMemoryProductRepository],
  useFactory: (
    configService: ConfigService<EnvironmentVariables, true>,
    inMemoryProductRepository: InMemoryProductRepository,
  ): ProductRepository =>
    resolvePersistenceAdapter({
      adapterName: 'ProductRepository',
      databaseType: getDatabaseType(configService),
      inMemoryAdapter: inMemoryProductRepository,
    }),
}
```

El resolver ya soporta `mongodb` y selecciona repositorios/UoW concretos sin tocar casos de uso ni controladores.

---

## 4. Cómo expandir `inventory` sin romper FIFO

### Siempre hacer
- registrar entradas como lotes nuevos,
- consumir salidas del lote más antiguo al más nuevo,
- preservar lotes agotados para auditoría,
- registrar movimientos explícitos.

### Nunca hacer
- recalcular stock desde un único campo plano,
- sobrescribir costos históricos,
- borrar lotes ya usados,
- ocultar ajustes detrás de un update genérico.

---

## 5. Cómo integrar sistemas externos

### Reglas
- tratar payloads externos como no confiables,
- normalizar en un anti-corruption layer,
- no acoplar el dominio al proveedor,
- registrar fallos de integración de forma explícita.

### Ejemplos futuros
- `sp-amz-backend` para normalización de productos,
- orquestador para referencias de imágenes,
- proveedor NoSQL real para persistencia.

---

## 6. Cómo documentar nuevas decisiones

Crear un ADR cuando el cambio:
- altere la arquitectura,
- cambie el modelo del dominio,
- modifique el contrato público,
- introduzca una nueva tecnología base,
- imponga una restricción operativa importante.

Guardar siempre en:

```text
docs/adr/
```

---

## 7. Checklist de expansión segura

Antes de considerar terminado un cambio:

- [ ] `pnpm lint`
- [ ] `pnpm test -- --runInBand`
- [ ] `pnpm test:e2e`
- [ ] `pnpm build`
- [ ] actualizar documentación relevante
- [ ] crear ADR si hubo una decisión arquitectónica
- [ ] revisar que no se filtren detalles de persistencia hacia la API pública

---

## 8. Próximas expansiones sugeridas

1. Persistencia NoSQL real detrás de `resolvePersistenceAdapter(...)`.
2. Consultas de auditoría más ricas sobre movimientos y capas FIFO.
3. Observabilidad: métricas, logging estructurado y trazabilidad por request.
4. Integración real con orquestadores de imágenes.
5. Autenticación/autorización más allá de la `api_key` técnica.
