import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GetProductByIdUseCase } from '../../../products/application/use-cases/get-product-by-id.use-case';
import { GetWarehouseByIdUseCase } from '../../../warehouses/application/use-cases/get-warehouse-by-id.use-case';
import { InventoryLot } from '../../domain/entities/inventory-lot.entity';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import {
  InventoryReferenceNotFoundError,
  UnitCostRequiredError,
} from '../../domain/errors/inventory.errors';
import { FifoConsumptionService } from '../../domain/services/fifo-consumption.service';
import {
  INVENTORY_LOT_REPOSITORY,
  INVENTORY_MOVEMENT_REPOSITORY,
} from '../../domain/ports/inventory.repository.port';
import type {
  InventoryLotRepository,
  InventoryMovementRepository,
} from '../../domain/ports/inventory.repository.port';
import { RegisterInventoryAdjustmentCommand } from '../commands/register-inventory-adjustment.command';
import { INVENTORY_UNIT_OF_WORK } from '../ports/inventory-unit-of-work.port';
import type { InventoryUnitOfWork } from '../ports/inventory-unit-of-work.port';

@Injectable()
export class RegisterInventoryAdjustmentUseCase {
  constructor(
    @Inject(INVENTORY_LOT_REPOSITORY)
    private readonly inventoryLotRepository: InventoryLotRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    @Inject(INVENTORY_UNIT_OF_WORK)
    private readonly inventoryUnitOfWork: InventoryUnitOfWork,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly getWarehouseByIdUseCase: GetWarehouseByIdUseCase,
  ) {}

  async execute(
    command: RegisterInventoryAdjustmentCommand,
  ): Promise<InventoryMovement> {
    return this.inventoryUnitOfWork.run(async () => {
      await this.ensureReferencesExist(command.productId, command.warehouseId);

      if (command.quantity > 0) {
        if (command.unitCost === undefined || command.sourceReference === undefined) {
          throw new UnitCostRequiredError();
        }

        const lot = InventoryLot.create({
          lotId: createLotId(),
          productId: command.productId,
          warehouseId: command.warehouseId,
          quantity: command.quantity,
          unitCost: command.unitCost,
          sourceReference: command.sourceReference,
        });

        await this.inventoryLotRepository.save(lot);

        const movement = InventoryMovement.create({
          movementId: createMovementId(),
          type: 'adjustment',
          productId: command.productId,
          warehouseId: command.warehouseId,
          quantity: command.quantity,
          unitCost: command.unitCost,
          sourceReference: command.sourceReference,
          reference: { type: 'adjustment-reason', id: command.reason },
          affectedLotIds: [lot.toPrimitives().lotId],
        });

        await this.inventoryMovementRepository.save(movement);
        return movement;
      }

      const lots = await this.inventoryLotRepository.findAvailableByProductAndWarehouse(
        command.productId,
        command.warehouseId,
      );

      const affectedLotIds = new FifoConsumptionService().consume(
        lots,
        Math.abs(command.quantity),
        command.productId,
        command.warehouseId,
      );

      await Promise.all(lots.map((lot) => this.inventoryLotRepository.save(lot)));

      const movement = InventoryMovement.create({
        movementId: createMovementId(),
        type: 'adjustment',
        productId: command.productId,
        warehouseId: command.warehouseId,
        quantity: command.quantity,
        reference: { type: 'adjustment-reason', id: command.reason },
        affectedLotIds,
      });

      await this.inventoryMovementRepository.save(movement);
      return movement;
    });
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
