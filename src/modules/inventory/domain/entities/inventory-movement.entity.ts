import { MoneyValue, SourceReference } from './inventory-lot.entity';

export type InventoryMovementType = 'entry' | 'exit' | 'adjustment';

export interface InventoryReference {
  readonly type: string;
  readonly id: string;
}

export interface InventoryMovementPrimitives {
  movementId: string;
  type: InventoryMovementType;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost?: MoneyValue;
  sourceReference?: SourceReference;
  reference?: InventoryReference;
  affectedLotIds: string[];
  occurredAt: string;
}

export interface CreateInventoryMovementParams {
  readonly movementId: string;
  readonly type: InventoryMovementType;
  readonly productId: string;
  readonly warehouseId: string;
  readonly quantity: number;
  readonly unitCost?: MoneyValue;
  readonly sourceReference?: SourceReference;
  readonly reference?: InventoryReference;
  readonly affectedLotIds?: string[];
  readonly occurredAt?: string;
}

export class InventoryMovement {
  private constructor(private props: InventoryMovementPrimitives) {}

  static create(params: CreateInventoryMovementParams): InventoryMovement {
    return new InventoryMovement({
      movementId: params.movementId.trim(),
      type: params.type,
      productId: params.productId.trim(),
      warehouseId: params.warehouseId.trim(),
      quantity: params.quantity,
      unitCost: params.unitCost ? { ...params.unitCost } : undefined,
      sourceReference: params.sourceReference ? { ...params.sourceReference } : undefined,
      reference: params.reference ? { ...params.reference } : undefined,
      affectedLotIds: [...(params.affectedLotIds ?? [])],
      occurredAt: params.occurredAt ?? new Date().toISOString(),
    });
  }

  static reconstitute(primitives: InventoryMovementPrimitives): InventoryMovement {
    return new InventoryMovement({
      ...primitives,
      unitCost: primitives.unitCost ? { ...primitives.unitCost } : undefined,
      sourceReference: primitives.sourceReference
        ? { ...primitives.sourceReference }
        : undefined,
      reference: primitives.reference ? { ...primitives.reference } : undefined,
      affectedLotIds: [...primitives.affectedLotIds],
    });
  }

  toPrimitives(): InventoryMovementPrimitives {
    return {
      ...this.props,
      unitCost: this.props.unitCost ? { ...this.props.unitCost } : undefined,
      sourceReference: this.props.sourceReference
        ? { ...this.props.sourceReference }
        : undefined,
      reference: this.props.reference ? { ...this.props.reference } : undefined,
      affectedLotIds: [...this.props.affectedLotIds],
    };
  }
}
