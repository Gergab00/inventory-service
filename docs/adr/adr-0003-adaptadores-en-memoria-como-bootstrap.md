---
title: "ADR-0003: Usar adaptadores en memoria como bootstrap temporal"
status: "Accepted"
date: "2026-04-10"
authors: "Equipo de inventory-service"
tags: ["architecture", "bootstrap", "persistence"]
supersedes: ""
superseded_by: ""
---

# ADR-0003: Usar adaptadores en memoria como bootstrap temporal

## Status

**Accepted**

## Context

La API pública debía avanzar antes de cerrar la elección e integración definitiva de la persistencia NoSQL. Sin embargo, detener todo el desarrollo hasta tener Mongo/NoSQL real habría bloqueado la validación temprana de contratos, flujos y pruebas e2e.

## Decision

Se decidió que:

- **DEC-001**: los puertos de repositorio se definen desde ya como contratos estables.
- **DEC-002**: mientras no exista el adaptador NoSQL real, los módulos usan implementaciones `in-memory`.
- **DEC-003**: los adaptadores en memoria se limitan a bootstrap, pruebas funcionales y validación temprana de contratos.
- **DEC-004**: la sustitución futura debe ocurrir solo en `infrastructure`, manteniendo puertos y casos de uso intactos.

## Consequences

### Positive

- **POS-001**: el equipo puede avanzar y validar la API pública sin esperar la capa de persistencia final.
- **POS-002**: los módulos ya quedan desacoplados por puertos, lo que simplifica la migración posterior.
- **POS-003**: las pruebas e2e pueden ejercitar flujos reales de negocio desde ahora.

### Negative

- **NEG-001**: el estado se pierde entre ejecuciones, por lo que no es apto para ambientes reales.
- **NEG-002**: no representa todavía restricciones reales de concurrencia, durabilidad o indexación.
- **NEG-003**: existe riesgo de que alguien lo interprete como solución definitiva si no se documenta explícitamente.

## Alternatives Considered

### Esperar a tener la capa NoSQL completa antes de exponer API

- **ALT-001**: **Description**: no implementar endpoints hasta integrar persistencia real.
- **ALT-002**: **Rejection Reason**: retrasa validación de contratos, TDD y pruebas end-to-end del dominio.

### Acoplar los casos de uso directamente al proveedor NoSQL

- **ALT-003**: **Description**: usar el SDK/ORM concreto desde application para ganar velocidad inicial.
- **ALT-004**: **Rejection Reason**: rompe Clean Architecture y encarece la evolución posterior.

## Implementation Notes

- **IMP-001**: `InMemoryProductRepository`, `InMemoryWarehouseRepository` e `InMemoryInventoryRepository` viven en `infrastructure`.
- **IMP-002**: los módulos registran estos adaptadores mediante tokens (`PRODUCT_REPOSITORY`, `WAREHOUSE_REPOSITORY`, etc.).
- **IMP-003**: la migración futura a Mongo/NoSQL debe reemplazar únicamente los providers y mappers de infraestructura.

## References

- **REF-001**: `src/modules/products/infrastructure/repositories/in-memory-product.repository.ts`
- **REF-002**: `src/modules/warehouses/infrastructure/repositories/in-memory-warehouse.repository.ts`
- **REF-003**: `src/modules/inventory/infrastructure/repositories/in-memory-inventory.repository.ts`
