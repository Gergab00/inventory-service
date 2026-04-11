---
title: "ADR-0002: Modelar inventario como movimientos auditables y capas FIFO"
status: "Accepted"
date: "2026-04-10"
authors: "Equipo de inventory-service"
tags: ["architecture", "inventory", "fifo"]
supersedes: ""
superseded_by: ""
---

# ADR-0002: Modelar inventario como movimientos auditables y capas FIFO

## Status

**Accepted**

## Context

El dominio del servicio exige trazabilidad de inventario, soporte por almacén y valuación FIFO. Esto hace inviable modelar el stock como una simple cantidad mutable por producto.

También era necesario que cada entrada preservara `productId`, `warehouseId`, `quantity`, `availableQuantity`, `unitCost`, referencias de origen y timestamps.

## Decision

Se decidió que:

- **DEC-001**: el inventario se modela como **movimientos** (`entry`, `exit`, `adjustment`) y **lotes FIFO**.
- **DEC-002**: cada entrada crea una nueva capa/lote con trazabilidad propia.
- **DEC-003**: las salidas consumen inventario desde el lote elegible más antiguo al más nuevo.
- **DEC-004**: los lotes agotados no se eliminan; se conservan con `availableQuantity = 0` y/o estado `depleted`.
- **DEC-005**: las consultas de disponibilidad y lotes se exponen como vistas de lectura derivadas del historial.

## Consequences

### Positive

- **POS-001**: la API conserva historial auditable de entradas, salidas y ajustes.
- **POS-002**: la lógica FIFO queda encapsulada en dominio y puede probarse de forma aislada.
- **POS-003**: el modelo queda preparado para valuación, auditoría y conciliación futura.

### Negative

- **NEG-001**: el modelo y los endpoints son más complejos que un CRUD plano de stock.
- **NEG-002**: la persistencia real deberá cuidar ordenamiento y consistencia transaccional.
- **NEG-003**: las consultas derivadas exigen mapeos y agregaciones adicionales.

## Alternatives Considered

### Stock plano por producto/almacén

- **ALT-001**: **Description**: guardar solo `availableQuantity` como número actual.
- **ALT-002**: **Rejection Reason**: rompe la trazabilidad, impide FIFO real y dificulta auditoría/costos históricos.

### Recalcular FIFO fuera del dominio

- **ALT-003**: **Description**: dejar el consumo FIFO en controladores o consultas de infraestructura ad hoc.
- **ALT-004**: **Rejection Reason**: mezcla reglas de negocio con detalles técnicos y debilita el diseño limpio del módulo.

## Implementation Notes

- **IMP-001**: `InventoryLot` encapsula la disponibilidad remanente y el estado del lote.
- **IMP-002**: `FifoConsumptionService` resuelve el consumo FIFO de forma determinista.
- **IMP-003**: la API actual ya expone `entries`, `exits`, `adjustments`, `availability`, `lots` y `movements`.

## References

- **REF-001**: `src/modules/inventory/domain/entities/inventory-lot.entity.ts`
- **REF-002**: `src/modules/inventory/domain/services/fifo-consumption.service.ts`
- **REF-003**: `src/modules/inventory/interfaces/http/inventory.controller.ts`
