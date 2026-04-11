import { InventoryLot } from '../entities/inventory-lot.entity';
import { InsufficientStockError } from '../errors/inventory.errors';
import { FifoConsumptionService } from './fifo-consumption.service';

describe('FifoConsumptionService', () => {
  it('consumes the oldest lots first', () => {
    const service = new FifoConsumptionService();
    const oldestLot = InventoryLot.create({
      lotId: 'lot_1',
      productId: 'prd_1',
      warehouseId: 'wh_1',
      quantity: 5,
      unitCost: { amount: 100, currency: 'MXN' },
      sourceReference: { type: 'purchase-order', id: 'PO-1' },
      createdAt: '2026-04-10T10:00:00.000Z',
    });
    const newestLot = InventoryLot.create({
      lotId: 'lot_2',
      productId: 'prd_1',
      warehouseId: 'wh_1',
      quantity: 7,
      unitCost: { amount: 110, currency: 'MXN' },
      sourceReference: { type: 'purchase-order', id: 'PO-2' },
      createdAt: '2026-04-11T10:00:00.000Z',
    });

    const affectedLotIds = service.consume(
      [oldestLot, newestLot],
      6,
      'prd_1',
      'wh_1',
    );

    expect(affectedLotIds).toEqual(['lot_1', 'lot_2']);
    expect(oldestLot.toPrimitives().availableQuantity).toBe(0);
    expect(newestLot.toPrimitives().availableQuantity).toBe(6);
  });

  it('throws when stock is insufficient', () => {
    const service = new FifoConsumptionService();
    const lot = InventoryLot.create({
      lotId: 'lot_1',
      productId: 'prd_1',
      warehouseId: 'wh_1',
      quantity: 2,
      unitCost: { amount: 100, currency: 'MXN' },
      sourceReference: { type: 'purchase-order', id: 'PO-1' },
    });

    expect(() => service.consume([lot], 3, 'prd_1', 'wh_1')).toThrow(
      InsufficientStockError,
    );
  });
});
