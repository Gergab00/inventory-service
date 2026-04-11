import { Inject, Injectable } from '@nestjs/common';
import { GetProductByIdUseCase } from '../../../products/application/use-cases/get-product-by-id.use-case';
import { GetWarehouseByIdUseCase } from '../../../warehouses/application/use-cases/get-warehouse-by-id.use-case';
import { InventoryReferenceNotFoundError } from '../../domain/errors/inventory.errors';
import { INVENTORY_LOT_REPOSITORY } from '../../domain/ports/inventory.repository.port';
import type { InventoryLotRepository } from '../../domain/ports/inventory.repository.port';

export interface WarehouseAvailabilityView {
  readonly warehouseId: string;
  readonly availableQuantity: number;
  readonly processingTimeDays: number;
}

export interface ProductAvailabilityView {
  readonly productId: string;
  readonly totalAvailableQuantity: number;
  readonly warehouses: WarehouseAvailabilityView[];
}

@Injectable()
export class GetProductInventoryAvailabilityUseCase {
  constructor(
    @Inject(INVENTORY_LOT_REPOSITORY)
    private readonly inventoryLotRepository: InventoryLotRepository,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly getWarehouseByIdUseCase: GetWarehouseByIdUseCase,
  ) {}

  async execute(productId: string): Promise<ProductAvailabilityView> {
    const product = await this.getProductByIdUseCase.execute(productId);

    if (product === null) {
      throw new InventoryReferenceNotFoundError('product', productId);
    }

    const lots = await this.inventoryLotRepository.findByProductId(productId);
    const availabilityByWarehouse = new Map<string, number>();

    for (const lot of lots) {
      const primitives = lot.toPrimitives();
      if (primitives.availableQuantity === 0) {
        continue;
      }

      const currentQuantity = availabilityByWarehouse.get(primitives.warehouseId) ?? 0;
      availabilityByWarehouse.set(
        primitives.warehouseId,
        currentQuantity + primitives.availableQuantity,
      );
    }

    const warehouses = await Promise.all(
      Array.from(availabilityByWarehouse.entries()).map(async ([warehouseId, availableQuantity]) => {
        const warehouse = await this.getWarehouseByIdUseCase.execute(warehouseId);

        return {
          warehouseId,
          availableQuantity,
          processingTimeDays:
            warehouse?.toPrimitives().processingTimeDays ?? 0,
        };
      }),
    );

    return {
      productId,
      totalAvailableQuantity: warehouses.reduce(
        (accumulator, warehouse) => accumulator + warehouse.availableQuantity,
        0,
      ),
      warehouses,
    };
  }
}
