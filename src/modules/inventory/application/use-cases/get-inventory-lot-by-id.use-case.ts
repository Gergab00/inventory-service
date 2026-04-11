import { Inject, Injectable } from '@nestjs/common';
import { InventoryLot } from '../../domain/entities/inventory-lot.entity';
import { INVENTORY_LOT_REPOSITORY } from '../../domain/ports/inventory.repository.port';
import type { InventoryLotRepository } from '../../domain/ports/inventory.repository.port';

@Injectable()
export class GetInventoryLotByIdUseCase {
  constructor(
    @Inject(INVENTORY_LOT_REPOSITORY)
    private readonly inventoryLotRepository: InventoryLotRepository,
  ) {}

  execute(lotId: string): Promise<InventoryLot | null> {
    return this.inventoryLotRepository.findById(lotId);
  }
}
