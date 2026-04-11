import { MoneyValue, SourceReference } from '../../domain/entities/inventory-lot.entity';

export interface RegisterInventoryEntryCommand {
  readonly productId: string;
  readonly warehouseId: string;
  readonly quantity: number;
  readonly unitCost: MoneyValue;
  readonly sourceReference: SourceReference;
}
