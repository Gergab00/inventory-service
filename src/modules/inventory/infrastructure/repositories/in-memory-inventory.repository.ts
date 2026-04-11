import { Injectable } from '@nestjs/common';
import { InventoryLot, InventoryLotPrimitives } from '../../domain/entities/inventory-lot.entity';
import { InventoryMovement, InventoryMovementPrimitives } from '../../domain/entities/inventory-movement.entity';
import type {
  InventoryLotRepository,
  InventoryMovementRepository,
  ListInventoryMovementsFilters,
  PaginatedInventoryMovementsResult,
} from '../../domain/ports/inventory.repository.port';

@Injectable()
export class InMemoryInventoryRepository
  implements InventoryLotRepository, InventoryMovementRepository
{
  private readonly lots = new Map<string, InventoryLotPrimitives>();
  private readonly movements = new Map<string, InventoryMovementPrimitives>();

  async save(lotOrMovement: InventoryLot | InventoryMovement): Promise<void> {
    if (lotOrMovement instanceof InventoryLot) {
      const primitives = lotOrMovement.toPrimitives();
      this.lots.set(primitives.lotId, primitives);
      return;
    }

    const primitives = lotOrMovement.toPrimitives();
    this.movements.set(primitives.movementId, primitives);
  }

  async findById(lotId: string): Promise<InventoryLot | null> {
    const primitives = this.lots.get(lotId);
    return primitives ? InventoryLot.reconstitute(primitives) : null;
  }

  async findByProductId(productId: string): Promise<InventoryLot[]> {
    return Array.from(this.lots.values())
      .filter((lot) => lot.productId === productId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((lot) => InventoryLot.reconstitute(lot));
  }

  async findAvailableByProductAndWarehouse(
    productId: string,
    warehouseId: string,
  ): Promise<InventoryLot[]> {
    return Array.from(this.lots.values())
      .filter(
        (lot) =>
          lot.productId === productId &&
          lot.warehouseId === warehouseId &&
          lot.availableQuantity > 0,
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((lot) => InventoryLot.reconstitute(lot));
  }

  async findAll(
    filters: ListInventoryMovementsFilters,
  ): Promise<PaginatedInventoryMovementsResult> {
    const page = Math.max(filters.page, 1);
    const pageSize = Math.max(filters.pageSize, 1);

    const filteredMovements = Array.from(this.movements.values())
      .filter((movement) => matchesFilters(movement, filters))
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
      .map((movement) => InventoryMovement.reconstitute(movement));

    const total = filteredMovements.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = filteredMovements.slice(startIndex, startIndex + pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}

function matchesFilters(
  movement: InventoryMovementPrimitives,
  filters: ListInventoryMovementsFilters,
): boolean {
  if (filters.productId && movement.productId !== filters.productId) {
    return false;
  }

  if (filters.warehouseId && movement.warehouseId !== filters.warehouseId) {
    return false;
  }

  if (filters.type && movement.type !== filters.type) {
    return false;
  }

  return true;
}
