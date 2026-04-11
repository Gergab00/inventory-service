import { InsufficientStockError } from '../errors/inventory.errors';
import { InventoryLot } from '../entities/inventory-lot.entity';

export class FifoConsumptionService {
  consume(
    lots: InventoryLot[],
    requestedQuantity: number,
    productId: string,
    warehouseId: string,
  ): string[] {
    const totalAvailable = lots.reduce(
      (accumulator, lot) => accumulator + lot.toPrimitives().availableQuantity,
      0,
    );

    if (requestedQuantity > totalAvailable) {
      throw new InsufficientStockError(
        productId,
        warehouseId,
        requestedQuantity,
        totalAvailable,
      );
    }

    let remainingQuantity = requestedQuantity;
    const affectedLotIds: string[] = [];

    for (const lot of lots) {
      if (remainingQuantity === 0) {
        break;
      }

      const primitives = lot.toPrimitives();
      const quantityToConsume = Math.min(primitives.availableQuantity, remainingQuantity);

      if (quantityToConsume === 0) {
        continue;
      }

      lot.consume(quantityToConsume);
      affectedLotIds.push(primitives.lotId);
      remainingQuantity -= quantityToConsume;
    }

    return affectedLotIds;
  }
}
