import { MoneyValue, SourceReference } from '../../domain/entities/inventory-lot.entity';

export interface RegisterInventoryAdjustmentCommand {
  readonly productId: string;
  readonly warehouseId: string;
  readonly quantity: number;
  readonly reason: string;
  readonly unitCost?: MoneyValue;
  readonly sourceReference?: SourceReference;
}
