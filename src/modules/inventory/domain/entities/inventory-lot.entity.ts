import { InsufficientStockError } from '../errors/inventory.errors';

export type InventoryLotStatus = 'active' | 'depleted';

export interface MoneyValue {
  readonly amount: number;
  readonly currency: string;
}

export interface SourceReference {
  readonly type: string;
  readonly id: string;
}

export interface InventoryLotPrimitives {
  lotId: string;
  productId: string;
  warehouseId: string;
  originalQuantity: number;
  availableQuantity: number;
  unitCost: MoneyValue;
  sourceReference: SourceReference;
  createdAt: string;
  status: InventoryLotStatus;
}

export interface CreateInventoryLotParams {
  readonly lotId: string;
  readonly productId: string;
  readonly warehouseId: string;
  readonly quantity: number;
  readonly unitCost: MoneyValue;
  readonly sourceReference: SourceReference;
  readonly createdAt?: string;
}

export class InventoryLot {
  private constructor(private props: InventoryLotPrimitives) {}

  static create(params: CreateInventoryLotParams): InventoryLot {
    const quantity = InventoryLot.requirePositiveInteger(params.quantity, 'quantity');
    const createdAt = params.createdAt ?? new Date().toISOString();

    return new InventoryLot({
      lotId: InventoryLot.requireText('lotId', params.lotId),
      productId: InventoryLot.requireText('productId', params.productId),
      warehouseId: InventoryLot.requireText('warehouseId', params.warehouseId),
      originalQuantity: quantity,
      availableQuantity: quantity,
      unitCost: InventoryLot.requireMoney(params.unitCost),
      sourceReference: InventoryLot.requireSourceReference(params.sourceReference),
      createdAt,
      status: 'active',
    });
  }

  static reconstitute(primitives: InventoryLotPrimitives): InventoryLot {
    return new InventoryLot({
      ...primitives,
      unitCost: { ...primitives.unitCost },
      sourceReference: { ...primitives.sourceReference },
    });
  }

  consume(quantity: number): number {
    const requestedQuantity = InventoryLot.requirePositiveInteger(quantity, 'quantity');

    if (requestedQuantity > this.props.availableQuantity) {
      throw new InsufficientStockError(
        this.props.productId,
        this.props.warehouseId,
        requestedQuantity,
        this.props.availableQuantity,
      );
    }

    this.props.availableQuantity -= requestedQuantity;
    this.props.status = this.props.availableQuantity === 0 ? 'depleted' : 'active';

    return this.props.availableQuantity;
  }

  increase(quantity: number): void {
    const adjustmentQuantity = InventoryLot.requirePositiveInteger(quantity, 'quantity');
    this.props.availableQuantity += adjustmentQuantity;
    this.props.status = 'active';
  }

  toPrimitives(): InventoryLotPrimitives {
    return {
      ...this.props,
      unitCost: { ...this.props.unitCost },
      sourceReference: { ...this.props.sourceReference },
    };
  }

  private static requireText(fieldName: string, value: string): string {
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      throw new Error(`Inventory lot ${fieldName} is required.`);
    }

    return normalizedValue;
  }

  private static requirePositiveInteger(value: number, fieldName: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Inventory lot ${fieldName} must be a positive integer.`);
    }

    return value;
  }

  private static requireMoney(value: MoneyValue): MoneyValue {
    if (!Number.isInteger(value.amount) || value.amount <= 0) {
      throw new Error('Inventory lot unitCost.amount must be a positive integer.');
    }

    if (value.currency.trim().length === 0) {
      throw new Error('Inventory lot unitCost.currency is required.');
    }

    return {
      amount: value.amount,
      currency: value.currency.trim().toUpperCase(),
    };
  }

  private static requireSourceReference(value: SourceReference): SourceReference {
    if (value.type.trim().length === 0 || value.id.trim().length === 0) {
      throw new Error('Inventory lot sourceReference.type and sourceReference.id are required.');
    }

    return {
      type: value.type.trim(),
      id: value.id.trim(),
    };
  }
}
