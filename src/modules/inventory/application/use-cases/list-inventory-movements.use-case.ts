import { Inject, Injectable } from '@nestjs/common';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../domain/ports/inventory.repository.port';
import type {
  InventoryMovementRepository,
  ListInventoryMovementsFilters,
  PaginatedInventoryMovementsResult,
} from '../../domain/ports/inventory.repository.port';

@Injectable()
export class ListInventoryMovementsUseCase {
  constructor(
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly inventoryMovementRepository: InventoryMovementRepository,
  ) {}

  execute(
    filters: ListInventoryMovementsFilters,
  ): Promise<PaginatedInventoryMovementsResult> {
    return this.inventoryMovementRepository.findAll(filters);
  }
}
