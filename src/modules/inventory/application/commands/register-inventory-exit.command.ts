import { InventoryReference } from '../../domain/entities/inventory-movement.entity';

export interface RegisterInventoryExitCommand {
  readonly productId: string;
  readonly warehouseId: string;
  readonly quantity: number;
  readonly reference: InventoryReference;
}
