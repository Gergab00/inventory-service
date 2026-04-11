export class InventoryReferenceNotFoundError extends Error {
  constructor(
    readonly resource: 'product' | 'warehouse',
    readonly id: string,
  ) {
    super(`Inventory reference ${resource}=${id} was not found.`);
    this.name = 'InventoryReferenceNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(
    readonly productId: string,
    readonly warehouseId: string,
    readonly requestedQuantity: number,
    readonly availableQuantity: number,
  ) {
    super(
      `Insufficient stock for product=${productId} warehouse=${warehouseId}. Requested=${requestedQuantity}, available=${availableQuantity}.`,
    );
    this.name = 'InsufficientStockError';
  }
}

export class UnitCostRequiredError extends Error {
  constructor() {
    super('Unit cost is required for inventory entries and positive adjustments.');
    this.name = 'UnitCostRequiredError';
  }
}
