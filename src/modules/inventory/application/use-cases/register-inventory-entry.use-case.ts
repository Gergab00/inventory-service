import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GetProductByIdUseCase } from '../../../products/application/use-cases/get-product-by-id.use-case';
import { GetWarehouseByIdUseCase } from '../../../warehouses/application/use-cases/get-warehouse-by-id.use-case';
import { InventoryLot } from '../../domain/entities/inventory-lot.entity';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { InventoryReferenceNotFoundError } from '../../domain/errors/inventory.errors';
import {
  INVENTORY_LOT_REPOSITORY,
  INVENTORY_MOVEMENT_REPOSITORY,
} from '../../domain/ports/inventory.repository.port';
import type {
  InventoryLotRepository,
  InventoryMovementRepository,
} from '../../domain/ports/inventory.repository.port';
import { RegisterInventoryEntryCommand } from '../commands/register-inventory-entry.command';

@Injectable()
export class RegisterInventoryEntryUseCase {
  constructor(
    @Inject(INVENTORY_LOT_REPOSITORY)
    private readonly inventoryLotRepository: InventoryLotRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly getWarehouseByIdUseCase: GetWarehouseByIdUseCase,
  ) {}

  async execute(command: RegisterInventoryEntryCommand): Promise<InventoryMovement> {
    await this.ensureReferencesExist(command.productId, command.warehouseId);

    const lot = InventoryLot.create({
      lotId: createLotId(),
      productId: command.productId,
      warehouseId: command.warehouseId,
      quantity: command.quantity,
      unitCost: command.unitCost,
      sourceReference: command.sourceReference,
    });

    const movement = InventoryMovement.create({
      movementId: createMovementId(),
      type: 'entry',
      productId: command.productId,
      warehouseId: command.warehouseId,
      quantity: command.quantity,
      unitCost: command.unitCost,
      sourceReference: command.sourceReference,
      affectedLotIds: [lot.toPrimitives().lotId],
    });

    await this.inventoryLotRepository.save(lot);
    await this.inventoryMovementRepository.save(movement);

    return movement;
  }

  private async ensureReferencesExist(
    productId: string,
    warehouseId: string,
  ): Promise<void> {
    const [product, warehouse] = await Promise.all([
      this.getProductByIdUseCase.execute(productId),
      this.getWarehouseByIdUseCase.execute(warehouseId),
    ]);

    if (product === null) {
      throw new InventoryReferenceNotFoundError('product', productId);
    }

    if (warehouse === null) {
      throw new InventoryReferenceNotFoundError('warehouse', warehouseId);
    }
  }
}

function createLotId(): string {
  return `lot_${randomUUID().replace(/-/g, '')}`;
}

function createMovementId(): string {
  return `mov_${randomUUID().replace(/-/g, '')}`;
}
