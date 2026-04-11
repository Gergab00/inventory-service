import { InventoryLot } from '../entities/inventory-lot.entity';
import { InventoryMovement, InventoryMovementType } from '../entities/inventory-movement.entity';

export const INVENTORY_LOT_REPOSITORY = Symbol('INVENTORY_LOT_REPOSITORY');
export const INVENTORY_MOVEMENT_REPOSITORY = Symbol('INVENTORY_MOVEMENT_REPOSITORY');

export interface ListInventoryMovementsFilters {
  readonly page: number;
  readonly pageSize: number;
  readonly productId?: string;
  readonly warehouseId?: string;
  readonly type?: InventoryMovementType;
}

export interface PaginatedInventoryMovementsResult {
  readonly items: InventoryMovement[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface InventoryLotRepository {
  save(lot: InventoryLot): Promise<void>;
  findById(lotId: string): Promise<InventoryLot | null>;
  findByProductId(productId: string): Promise<InventoryLot[]>;
  findAvailableByProductAndWarehouse(
    productId: string,
    warehouseId: string,
  ): Promise<InventoryLot[]>;
}

export interface InventoryMovementRepository {
  save(movement: InventoryMovement): Promise<void>;
  findAll(
    filters: ListInventoryMovementsFilters,
  ): Promise<PaginatedInventoryMovementsResult>;
}
